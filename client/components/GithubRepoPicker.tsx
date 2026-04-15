import { useEffect, useState, useCallback } from "react";
import { Github, Search, Lock, Globe, Loader2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string;
  private: boolean;
}

interface Props {
  onSelect: (repoUrl: string) => void;
  selected: string;
}

export default function GithubRepoPicker({ onSelect, selected }: Props) {
  const { user } = useAuth();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const checkStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/github/status?userId=${user.id}`);
      const data = await res.json();
      setConnected(data.connected);
      if (data.connected) {
        await fetchRepos("");
      }
    } catch {
      setConnected(false);
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "github-connected") {
        setConnected(true);
        fetchRepos("");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [user]);

  const fetchRepos = async (query: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: user.id });
      if (query) params.set("search", query);
      const res = await fetch(`/api/github/repos?${params.toString()}`);
      const data = await res.json();
      setRepos(data.repos ?? []);
    } catch {
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!user) return;
    const w = 600;
    const h = 700;
    const left = window.screenX + (window.innerWidth - w) / 2;
    const top = window.screenY + (window.innerHeight - h) / 2;
    window.open(
      `/api/github/auth?userId=${user.id}`,
      "github-auth",
      `width=${w},height=${h},left=${left},top=${top}`
    );
  };

  const handleDisconnect = async () => {
    if (!user) return;
    try {
      await fetch("/api/github/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      setConnected(false);
      setRepos([]);
      onSelect("");
    } catch {
      // silent
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => fetchRepos(value), 400));
  };

  if (connected === null) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="rounded-xl border border-white/5 bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
          <Github className="h-7 w-7 text-violet-400" />
        </div>
        <h3 className="mt-4 font-semibold">Connect Your GitHub</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Authorize Morphic to access your repositories. We only read repo contents for conversion - we never push or modify your code.
        </p>
        <Button onClick={handleConnect} className="mt-6 gap-2 bg-primary hover:bg-primary/90">
          <Github className="h-4 w-4" />
          Connect GitHub Account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search your repositories..."
            className="w-full rounded-lg border border-white/10 bg-muted/50 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="ml-3 gap-1 text-xs text-muted-foreground"
        >
          <Unplug className="h-3 w-3" />
          Disconnect
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        </div>
      ) : repos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? "No repositories match your search" : "No repositories found"}
          </p>
        </div>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {repos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => onSelect(repo.html_url)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
                selected === repo.html_url
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/5 hover:border-violet-500/20"
              )}
            >
              <Github className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{repo.full_name}</span>
                  {repo.private ? (
                    <Lock className="h-3 w-3 shrink-0 text-amber-400" />
                  ) : (
                    <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                </div>
                {repo.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {repo.description}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {repo.language && <span>{repo.language}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
