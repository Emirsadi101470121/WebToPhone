import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Zap, Clock, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SharedData {
  name: string;
  source_type: string;
  status: string;
  created_at: string;
  pipeline_state: any;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    completed: "Completed",
    converting: "Converting",
    analyzing: "Analyzing",
    analyzed: "Analyzed",
    pending: "Pending",
    failed: "Failed",
  };
  return map[status] ?? status;
}

export default function SharedProject() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) { setError("Invalid share link"); setLoading(false); return; }
      const { data, error: err } = await supabase
        .from("projects")
        .select("name, source_type, status, created_at, pipeline_state")
        .eq("share_token", token)
        .eq("share_enabled", true)
        .single();

      if (err || !data) {
        setError("Project not found or sharing is disabled");
      } else {
        setProject(data);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-2xl border border-white/10 bg-card p-8 text-center">
          <h1 className="text-xl font-bold">Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-violet-400 hover:underline">
            Go to Morphic
          </Link>
        </div>
      </div>
    );
  }

  const stage = project.pipeline_state?.stage;
  const analysis = project.pipeline_state?.analysis;

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          Shared project (read-only)
        </div>

        <h1 className="mt-4 text-2xl font-bold">{project.name}</h1>

        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {new Date(project.created_at).toLocaleDateString()}
          </span>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400">
            {statusLabel(project.status)}
          </span>
          {stage && (
            <span className="text-xs">Stage: {stage}</span>
          )}
        </div>

        {analysis && (
          <section className="mt-8 rounded-2xl border border-white/5 bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              AI Analysis
            </h2>
            {analysis.summary && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {analysis.summary}
              </p>
            )}
            {analysis.pages && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {analysis.pages.length} page(s) detected
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {analysis.pages.map((p: any, i: number) => (
                    <span key={i} className="rounded-lg bg-muted px-3 py-1 text-xs">
                      {p.name || p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="mt-8 rounded-2xl border border-dashed border-violet-500/20 bg-violet-500/5 p-6 text-center">
          <Zap className="mx-auto h-6 w-6 text-violet-400" />
          <p className="mt-2 text-sm font-medium">Want to build your own mobile app?</p>
          <Link
            to="/login"
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Get Started with Morphic
          </Link>
        </div>
      </div>
    </div>
  );
}
