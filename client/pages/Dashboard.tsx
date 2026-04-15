import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Folder,
  Clock,
  CreditCard,
  BarChart3,
  Zap,
  Upload,
  Github,
  Globe,
  FileArchive,
  ArrowRight,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mockProjects = [
  {
    id: "1",
    name: "E-Commerce Dashboard",
    source: "github",
    status: "completed",
    updatedAt: "2 hours ago",
  },
  {
    id: "2",
    name: "Portfolio Site",
    source: "url",
    status: "converting",
    updatedAt: "5 hours ago",
  },
  {
    id: "3",
    name: "Task Manager App",
    source: "zip",
    status: "analyzing",
    updatedAt: "1 day ago",
  },
];

const stats = [
  { label: "Projects", value: "3", icon: Folder },
  { label: "Conversions", value: "12", icon: Smartphone },
  { label: "Credits Left", value: "84", icon: CreditCard },
  { label: "AI Queries", value: "47", icon: BarChart3 },
];

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    completed: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      label: "Completed",
    },
    converting: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      label: "Converting",
    },
    analyzing: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      label: "Analyzing",
    },
  };
  const s = map[status] ?? map.analyzing;
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

export default function Dashboard() {
  const [showNewProject, setShowNewProject] = useState(false);

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your web-to-mobile conversions
            </p>
          </div>
          <Button
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={() => setShowNewProject(!showNewProject)}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/5 bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                  <stat.icon className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showNewProject && (
          <div className="mt-8 rounded-2xl border border-violet-500/20 bg-card p-6">
            <h2 className="text-lg font-semibold">Start a New Conversion</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how you want to import your web application
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Github,
                  title: "GitHub Repository",
                  desc: "Connect and import directly",
                },
                {
                  icon: FileArchive,
                  title: "Upload ZIP",
                  desc: "Drag and drop your project",
                },
                {
                  icon: Globe,
                  title: "Website URL",
                  desc: "Paste a live website link",
                },
              ].map((method) => (
                <button
                  key={method.title}
                  className="flex flex-col items-center rounded-xl border border-white/5 bg-muted/50 p-6 text-center transition-all hover:border-violet-500/20 hover:bg-muted"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                    <method.icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <h3 className="font-medium">{method.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{method.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <div className="mt-4 space-y-3">
            {mockProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-card p-5 transition-all hover:border-violet-500/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {sourceIcon(project.source)}
                  </div>
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {project.updatedAt}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {statusBadge(project.status)}
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Open
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
