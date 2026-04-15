import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Folder,
  Clock,
  CreditCard,
  BarChart3,
  Smartphone,
  Github,
  Globe,
  FileArchive,
  ArrowRight,
  LogOut,
  Trash2,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  source_type: string;
  status: string;
  updated_at: string;
}

interface Stats {
  projects: number;
  conversions: number;
  credits: number;
  aiQueries: number;
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Completed" },
    converting: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Converting" },
    analyzing: { bg: "bg-violet-500/10", text: "text-violet-400", label: "Analyzing" },
    analyzed: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Analyzed" },
    improving: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Improving" },
    pending: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Pending" },
    failed: { bg: "bg-red-500/10", text: "text-red-400", label: "Failed" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", s.bg, s.text)}>
      {s.label}
    </span>
  );
}

function sourceIcon(source: string) {
  switch (source) {
    case "github":
      return <Github className="h-4 w-4 text-muted-foreground" />;
    case "url":
      return <Globe className="h-4 w-4 text-muted-foreground" />;
    default:
      return <FileArchive className="h-4 w-4 text-muted-foreground" />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats>({ projects: 0, conversions: 0, credits: 0, aiQueries: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [projectsRes, creditsRes, jobsRes, logsRes] = await Promise.all([
        supabase.from("projects").select("*").order("updated_at", { ascending: false }),
        supabase.from("credits").select("balance").single(),
        supabase.from("conversion_jobs").select("id"),
        supabase.from("logs").select("id").eq("action", "ai_query"),
      ]);

      const projectList = projectsRes.data ?? [];
      setProjects(projectList);
      setStats({
        projects: projectList.length,
        conversions: jobsRes.data?.length ?? 0,
        credits: creditsRes.data?.balance ?? 0,
        aiQueries: logsRes.data?.length ?? 0,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;

    setDeletingId(projectId);
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) {
        toast.error("Failed to delete project");
      } else {
        toast.success(`"${projectName}" deleted`);
        await loadData();
      }
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  const statCards = [
    { label: "Projects", value: stats.projects, icon: Folder },
    { label: "Conversions", value: stats.conversions, icon: Smartphone },
    { label: "Credits", value: stats.credits, icon: CreditCard },
    { label: "AI Queries", value: stats.aiQueries, icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
            <Link to="/settings">
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/new-project">
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Project</span>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/5 bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                  <stat.icon className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", loading && "h-7 w-10 animate-pulse rounded bg-muted")}>
                    {loading ? "" : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Your Projects</h2>

          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-white/5 bg-card" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
                <Folder className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="mt-4 font-semibold">No projects yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first project to start designing a mobile app.
              </p>
              <Link to="/new-project" className="mt-6 inline-block">
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-card p-5 transition-all hover:border-violet-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {sourceIcon(project.source_type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(project.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(project.status)}
                    <button
                      onClick={(e) => handleDelete(e, project.id, project.name)}
                      disabled={deletingId === project.id}
                      className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-red-400"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
