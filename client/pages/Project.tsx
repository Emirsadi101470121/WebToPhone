import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Paintbrush,
  RefreshCw,
  CheckCircle2,
  Circle,
  Loader2,
  Play,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  source_type: string;
  source_url: string | null;
  status: string;
  created_at: string;
}

interface AiQuestion {
  id: string;
  question: string;
  question_type: string;
  options: string[];
  answer: string | null;
}

const stages = [
  { key: "analyzing", label: "Analyze", icon: Search, desc: "AI scans your codebase architecture" },
  { key: "designing", label: "Design", icon: Paintbrush, desc: "AI suggests UI/UX improvements" },
  { key: "converting", label: "Convert", icon: RefreshCw, desc: "Web components mapped to React Native" },
  { key: "validating", label: "Validate", icon: CheckCircle2, desc: "Output tested and verified" },
];

export default function Project() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AiQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setProject(data);
          if (data.status !== "pending") {
            setAnalysisComplete(true);
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const startAnalysis = async () => {
    if (!project || !user) return;
    setAnalysisRunning(true);
    setCurrentStage("analyzing");

    try {
      await supabase
        .from("projects")
        .update({ status: "analyzing" })
        .eq("id", project.id);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          sourceType: project.source_type,
          sourceUrl: project.source_url,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.questions) {
          setQuestions(data.questions);
        }
        setCurrentStage("designing");
        setAnalysisComplete(true);
        await supabase
          .from("projects")
          .update({ status: "analyzed" })
          .eq("id", project.id);
      } else {
        setCurrentStage(null);
      }
    } catch {
      setCurrentStage(null);
    } finally {
      setAnalysisRunning(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submitPreferences = async () => {
    if (!project || !user) return;
    setCurrentStage("converting");

    try {
      for (const q of questions) {
        if (answers[q.id]) {
          await supabase
            .from("ai_questions")
            .update({ answer: answers[q.id], answered_at: new Date().toISOString() })
            .eq("id", q.id);
        }
      }

      await supabase
        .from("projects")
        .update({ status: "converting" })
        .eq("id", project.id);

      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          preferences: answers,
        }),
      });

      if (response.ok) {
        setCurrentStage("validating");
        setTimeout(() => {
          setCurrentStage("done");
          supabase
            .from("projects")
            .update({ status: "completed" })
            .eq("id", project.id);
        }, 2000);
      }
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pt-16">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const stageIndex = stages.findIndex((s) => s.key === currentStage);

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-4 gap-2">
          {stages.map((stage, i) => {
            const isActive = stage.key === currentStage;
            const isDone = stageIndex > i || currentStage === "done";
            return (
              <div
                key={stage.key}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  isActive ? "border-violet-500 bg-violet-500/10" :
                  isDone ? "border-emerald-500/30 bg-emerald-500/5" :
                  "border-white/5 bg-card"
                )}
              >
                <div className="flex items-center gap-2">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    isActive ? "text-violet-400" : isDone ? "text-emerald-400" : "text-muted-foreground"
                  )}>
                    {stage.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{stage.desc}</p>
              </div>
            );
          })}
        </div>

        {!currentStage && project.status === "pending" && (
          <div className="mt-8 rounded-2xl border border-white/5 bg-card p-8 text-center">
            <Search className="mx-auto h-10 w-10 text-violet-400" />
            <h2 className="mt-4 text-lg font-semibold">Ready to Analyze</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start the AI pipeline to analyze your codebase, suggest improvements, and convert to React Native.
            </p>
            <Button
              onClick={startAnalysis}
              disabled={analysisRunning}
              className="mt-6 gap-2 bg-primary hover:bg-primary/90"
            >
              {analysisRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start AI Analysis
                </>
              )}
            </Button>
          </div>
        )}

        {currentStage === "designing" && questions.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-violet-500/20 bg-card p-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold">AI Design Questions</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Help our AI tailor the mobile experience to your needs
              </p>

              <div className="mt-6 space-y-6">
                {questions.map((q) => (
                  <div key={q.id}>
                    <label className="mb-2 block text-sm font-medium">{q.question}</label>
                    {q.options.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleAnswerChange(q.id, opt)}
                            className={cn(
                              "rounded-lg border px-4 py-2 text-sm transition-all",
                              answers[q.id] === opt
                                ? "border-violet-500 bg-violet-500/10 text-violet-300"
                                : "border-white/10 hover:border-violet-500/20"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={answers[q.id] ?? ""}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-muted/50 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={submitPreferences} className="mt-6 gap-2 bg-primary hover:bg-primary/90">
                Apply Preferences & Convert
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {currentStage === "designing" && questions.length === 0 && (
          <div className="mt-8 rounded-2xl border border-white/5 bg-card p-8 text-center">
            <Paintbrush className="mx-auto h-10 w-10 text-violet-400" />
            <h2 className="mt-4 text-lg font-semibold">Analysis Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No additional preferences needed. Ready to convert.
            </p>
            <Button onClick={submitPreferences} className="mt-6 gap-2 bg-primary hover:bg-primary/90">
              Start Conversion
            </Button>
          </div>
        )}

        {(currentStage === "converting" || currentStage === "validating") && (
          <div className="mt-8 rounded-2xl border border-white/5 bg-card p-8 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-400" />
            <h2 className="mt-4 text-lg font-semibold">
              {currentStage === "converting" ? "Converting to React Native..." : "Validating Output..."}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This may take a few minutes depending on project size.
            </p>
          </div>
        )}

        {currentStage === "done" && (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <h2 className="mt-4 text-lg font-semibold">Conversion Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your React Native app is ready. Open the visual builder or export.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                Open Visual Builder
              </Button>
              <Button variant="outline">
                Export Project
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
