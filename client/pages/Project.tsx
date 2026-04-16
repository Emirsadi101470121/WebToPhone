import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ClipboardCheck,
  MessageSquare,
  Sparkles,
  Eye,
  MousePointer,
  Wrench,
  RefreshCw,
  ShieldCheck,
  Play,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import ValidationStep from "@/components/pipeline/ValidationStep";
import DesignInterviewStep from "@/components/pipeline/DesignInterviewStep";
import DesignSelectionStep from "@/components/pipeline/DesignSelectionStep";
import { fetchWithRetry } from "@/lib/retry";
import ModelSelector, { type ModelTier } from "@/components/ModelSelector";
import CollaboratorInvite from "@/components/CollaboratorInvite";
import { requestNotificationPermission, sendPipelineNotification } from "@/lib/notifications";

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  source_type: string;
  source_url: string | null;
  status: string;
}

const stages = [
  { key: "analyze", label: "Analyze", icon: Search },
  { key: "validate", label: "Validate", icon: ClipboardCheck },
  { key: "interview", label: "Interview", icon: MessageSquare },
  { key: "reimagine", label: "Reimagine", icon: Sparkles },
  { key: "suggest", label: "Suggest", icon: Eye },
  { key: "select", label: "Select", icon: MousePointer },
  { key: "builder", label: "Builder", icon: Wrench },
  { key: "convert", label: "Convert", icon: RefreshCw },
  { key: "qa", label: "QA", icon: ShieldCheck },
];

export default function Project() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stageLoading, setStageLoading] = useState(false);

  const [analysis, setAnalysis] = useState<any>(null);
  const [validatedData, setValidatedData] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [selectedDesigns, setSelectedDesigns] = useState<any>(null);
  const [qaReport, setQaReport] = useState<any>(null);
  const [modelTier, setModelTier] = useState<ModelTier>("sonnet");

  const savePipelineState = async (stage: string, stateData: any) => {
    if (!id) return;
    try {
      await supabase.from("projects").update({
        pipeline_state: { stage, ...stateData },
      }).eq("id", id);
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data } = await supabase.from("projects").select("*").eq("id", id).single();
        if (data) {
          setProject(data);
          if (data.status === "completed") {
            setCurrentStage("qa-done");
          } else if (data.pipeline_state?.stage) {
            const ps = data.pipeline_state;
            setCurrentStage(ps.stage);
            if (ps.analysis) setAnalysis(ps.analysis);
            if (ps.validatedData) setValidatedData(ps.validatedData);
            if (ps.preferences) setPreferences(ps.preferences);
            if (ps.designs) setDesigns(ps.designs);
            if (ps.selectedDesigns) setSelectedDesigns(ps.selectedDesigns);
            if (ps.qaReport) setQaReport(ps.qaReport);
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();

    // Real-time updates
    const channel = supabase
      .channel(`project-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${id}` },
        (payload) => {
          const updated = payload.new as any;
          setProject((prev) => prev ? { ...prev, ...updated } : prev);
          if (updated.status === "completed" && currentStage !== "qa-done") {
            setCurrentStage("qa-done");
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const stageIndex = stages.findIndex((s) => s.key === currentStage);

  const startAnalysis = async () => {
    if (!project || !user) return;
    requestNotificationPermission();
    setStageLoading(true);
    setCurrentStage("analyze");

    try {
      await supabase.from("projects").update({ status: "analyzing" }).eq("id", project.id);

      const response = await fetchWithRetry("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          sourceType: project.source_type,
          sourceUrl: project.source_url,
          userId: user.id,
          modelTier,
        }),
      });

      if (response.status === 402) {
        const err = await response.json();
        toast.error(err.error || "Not enough credits");
        setCurrentStage(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        const cost = modelTier === "haiku" ? 3 : modelTier === "opus" ? 15 : 5;
        toast.success(`Analysis complete - ${cost} credits used (${modelTier})`);
        sendPipelineNotification("Analysis Complete", `"${project.name}" analysis is done. Ready for validation.`, id);
        await supabase.from("projects").update({ status: "analyzed" }).eq("id", project.id);
        setCurrentStage("validate");
        await savePipelineState("validate", { analysis: data.analysis });
      }
    } catch {} finally {
      setStageLoading(false);
    }
  };

  const handleValidationConfirm = async (data: any) => {
    setValidatedData(data);
    setCurrentStage("interview");
    await savePipelineState("interview", { analysis, validatedData: data });

    try {
      await supabase.from("user_preferences").upsert({
        project_id: project!.id,
        user_id: user!.id,
        custom_notes: data.appDescription,
      }, { onConflict: "project_id" });
    } catch {}
  };

  const handleDesignInterviewSubmit = async (prefs: any) => {
    setPreferences(prefs);
    setCurrentStage("reimagine");
    setStageLoading(true);

    try {
      await supabase.from("user_preferences").upsert({
        project_id: project!.id,
        user_id: user!.id,
        design_style: prefs.style,
        target_audience: prefs.targetAudience,
        theme: prefs.theme === "dark" ? "dark" : "light",
        ux_complexity: prefs.uxPriority === "power" ? "advanced" : prefs.uxPriority === "simplicity" ? "simple" : "moderate",
      }, { onConflict: "project_id" });

      const response = await fetchWithRetry("/api/reimagine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project!.id,
          analysis,
          preferences: prefs,
          appDescription: validatedData?.appDescription,
          userId: user!.id,
          modelTier,
        }),
      });

      if (response.status === 402) {
        const err = await response.json();
        toast.error(err.error || "Not enough credits");
        setCurrentStage("interview");
        setStageLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setDesigns(data.designs ?? []);
        const cost = modelTier === "haiku" ? 5 : modelTier === "opus" ? 30 : 10;
        toast.success(`Mobile UX reimagined - ${cost} credits used (${modelTier})`);
        sendPipelineNotification("Designs Ready", `"${project.name}" mobile designs are ready for selection.`, id);
        setCurrentStage("select");
        await savePipelineState("select", { analysis, validatedData, preferences: prefs, designs: data.designs ?? [] });
      }
    } catch {} finally {
      setStageLoading(false);
    }
  };

  const handleDesignSelection = async (selections: any) => {
    setSelectedDesigns(selections);
    setCurrentStage("builder");
    await savePipelineState("builder", { analysis, validatedData, preferences, designs, selectedDesigns: selections });

    try {
      const componentTree = Object.entries(selections).map(([pageName, design]: any) => ({
        pageName,
        designName: design.name,
        layout: design.layout,
      }));

      await supabase.from("builder_sessions").insert({
        project_id: project!.id,
        user_id: user!.id,
        component_tree: componentTree,
        session_data: { preferences, validatedData },
      });

      await supabase.from("projects").update({ status: "converting" }).eq("id", project!.id);
    } catch {}
  };

  const startConversion = async () => {
    setCurrentStage("convert");
    setStageLoading(true);

    try {
      const response = await fetchWithRetry("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project!.id,
          selectedDesigns,
          preferences,
          userId: user!.id,
          modelTier,
        }),
      });

      if (response.status === 402) {
        const err = await response.json();
        toast.error(err.error || "Not enough credits");
        setCurrentStage("builder");
        setStageLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setQaReport(data.qa ?? null);
        setCurrentStage("qa");
        setStageLoading(false);

        await supabase.from("projects").update({ status: "completed" }).eq("id", project!.id);
        sendPipelineNotification("Conversion Complete", `"${project!.name}" is ready! Open the builder to refine and export.`, id);

        setTimeout(() => setCurrentStage("qa-done"), 2000);
      }
    } catch {} finally {
      setStageLoading(false);
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
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

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

        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}

        <div className="mt-4">
          <CollaboratorInvite projectId={project.id} />
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {currentStage === "qa-done"
                ? "Complete"
                : stageIndex >= 0
                  ? `${stageIndex + 1} of ${stages.length}`
                  : "Not started"}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
              style={{
                width: currentStage === "qa-done"
                  ? "100%"
                  : stageIndex >= 0
                    ? `${((stageIndex + (stageLoading ? 0.5 : 0)) / stages.length) * 100}%`
                    : "0%",
              }}
            />
          </div>
        </div>

        {/* Stage Pills */}
        <div className="mt-4 flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
          {stages.map((stage, i) => {
            const isActive = stage.key === currentStage;
            const isDone = stageIndex > i || currentStage === "qa-done";
            const Icon = stage.icon;
            return (
              <div
                key={stage.key}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-all",
                  isActive ? "border-violet-500 bg-violet-500/10 text-violet-300 shadow-sm shadow-violet-500/10" :
                  isDone ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" :
                  "border-white/5 text-muted-foreground/50"
                )}
              >
                {isDone ? <CheckCircle2 className="h-3 w-3" /> :
                 isActive && stageLoading ? <Loader2 className="h-3 w-3 animate-spin" /> :
                 isActive ? <Icon className="h-3 w-3" /> :
                 <Circle className="h-3 w-3" />}
                <span className="hidden sm:inline">{stage.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          {!currentStage && project.status !== "completed" && (
            <div className="rounded-2xl border border-white/5 bg-card p-8 text-center">
              <Search className="mx-auto h-10 w-10 text-violet-400" />
              <h2 className="mt-4 text-lg font-semibold">Ready to Analyze</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                AI will analyze your codebase, then guide you through designing a mobile-first experience before building it.
              </p>

              <div className="mx-auto mt-6 max-w-xs">
                <p className="mb-2 text-xs font-medium text-muted-foreground">AI Model</p>
                <ModelSelector selected={modelTier} onChange={setModelTier} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Credits per stage: Analyze {modelTier === "haiku" ? 3 : modelTier === "opus" ? 15 : 5} / Reimagine {modelTier === "haiku" ? 5 : modelTier === "opus" ? 30 : 10} / Convert {modelTier === "haiku" ? 8 : modelTier === "opus" ? 45 : 15}
                </p>
              </div>

              <Button onClick={startAnalysis} disabled={stageLoading} className="mt-6 gap-2 bg-primary hover:bg-primary/90">
                {stageLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing...</> : <><Play className="h-4 w-4" />Start AI Analysis</>}
              </Button>
            </div>
          )}

          {currentStage === "analyze" && stageLoading && (
            <div className="rounded-2xl border border-white/5 bg-card p-8 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-400" />
              <h2 className="mt-4 text-lg font-semibold">Analyzing Your App</h2>
              <p className="mt-2 text-sm text-muted-foreground">AI is scanning pages, features, and user flows...</p>
            </div>
          )}

          {currentStage === "validate" && analysis && (
            <ValidationStep
              pages={analysis.pages ?? []}
              features={analysis.features ?? []}
              userFlows={analysis.userFlows ?? []}
              onConfirm={handleValidationConfirm}
            />
          )}

          {currentStage === "interview" && (
            <DesignInterviewStep onSubmit={handleDesignInterviewSubmit} />
          )}

          {currentStage === "reimagine" && stageLoading && (
            <div className="rounded-2xl border border-white/5 bg-card p-8 text-center">
              <Sparkles className="mx-auto h-10 w-10 animate-pulse text-violet-400" />
              <h2 className="mt-4 text-lg font-semibold">Reimagining for Mobile</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                AI is redesigning your app with mobile-first UX patterns...
              </p>
            </div>
          )}

          {currentStage === "select" && designs.length > 0 && (
            <DesignSelectionStep designs={designs} onConfirm={handleDesignSelection} />
          )}

          {currentStage === "builder" && (
            <div className="rounded-2xl border border-violet-500/20 bg-card p-8 text-center">
              <Wrench className="mx-auto h-10 w-10 text-violet-400" />
              <h2 className="mt-4 text-lg font-semibold">Designs Saved to Builder</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your selected designs have been loaded into the visual builder. You can edit them before converting to code.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to={`/builder/${project.id}`}>
                  <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Wrench className="h-4 w-4" />
                    Open Visual Builder
                  </Button>
                </Link>
                <Button variant="outline" onClick={startConversion}>
                  Skip to Conversion
                </Button>
              </div>
            </div>
          )}

          {currentStage === "convert" && stageLoading && (
            <div className="rounded-2xl border border-white/5 bg-card p-8 text-center">
              <RefreshCw className="mx-auto h-10 w-10 animate-spin text-violet-400" />
              <h2 className="mt-4 text-lg font-semibold">Converting to React Native</h2>
              <p className="mt-2 text-sm text-muted-foreground">Generating production code from your approved designs...</p>
            </div>
          )}

          {currentStage === "qa" && (
            <div className="rounded-2xl border border-white/5 bg-card p-8 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 animate-pulse text-violet-400" />
              <h2 className="mt-4 text-lg font-semibold">Running QA Checks</h2>
              <p className="mt-2 text-sm text-muted-foreground">Reviewing UX, security, and accessibility...</p>
            </div>
          )}

          {currentStage === "qa-done" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <h2 className="mt-4 text-lg font-semibold">Your Mobile App is Ready</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  AI designed, validated, and built your mobile experience.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link to={`/builder/${project.id}`}>
                    <Button className="gap-2 bg-primary hover:bg-primary/90">Open Visual Builder</Button>
                  </Link>
                  <Link to={`/builder/${project.id}`}>
                    <Button variant="outline">Export Project</Button>
                  </Link>
                </div>
              </div>

              {qaReport && (
                <div className="rounded-2xl border border-white/5 bg-card p-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-violet-400" />
                    QA Report
                  </h3>
                  {qaReport.uxIssues?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase text-muted-foreground">UX Notes</p>
                      <ul className="mt-2 space-y-1">
                        {qaReport.uxIssues.map((issue: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">- {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {qaReport.securityNotes?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Security</p>
                      <ul className="mt-2 space-y-1">
                        {qaReport.securityNotes.map((note: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">- {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {qaReport.accessibilityNotes?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Accessibility</p>
                      <ul className="mt-2 space-y-1">
                        {qaReport.accessibilityNotes.map((note: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">- {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
