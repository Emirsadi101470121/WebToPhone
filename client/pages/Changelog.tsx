import { ArrowLeft, Sparkles, Shield, Zap, Users, CreditCard, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const releases = [
  {
    version: "1.3.0",
    date: "2025-01-15",
    icon: Shield,
    title: "Security & AI Models",
    changes: [
      "Tiered AI models: Choose between Haiku (fast), Sonnet (balanced), or Opus (premium)",
      "Dynamic credit costs based on model selection",
      "Input sanitization on all API endpoints",
      "CORS restriction and Content Security Policy headers",
      "SSRF protection on webhook URLs",
      "Per-user rate limiting on AI endpoints",
      "RLS policy audit and optimization across all tables",
    ],
  },
  {
    version: "1.2.0",
    date: "2025-01-10",
    icon: CreditCard,
    title: "Monetization & Collaboration",
    changes: [
      "Credit purchase system with 3 pack tiers",
      "Plan upgrades: Free, Pro, and Premium tiers",
      "Project collaboration: invite team members by email",
      "Referral program with shareable codes",
      "Usage analytics dashboard in Settings",
    ],
  },
  {
    version: "1.1.0",
    date: "2025-01-05",
    icon: Sparkles,
    title: "UX Improvements",
    changes: [
      "Onboarding tour for new users",
      "Project templates: E-Commerce, Dashboard, Social",
      "Search and filter on Dashboard",
      "Keyboard shortcuts in Builder (Cmd+Z, Cmd+E, Esc)",
      "Real ZIP export with JSZip",
      "Dark/light theme toggle",
      "Pipeline state persistence across sessions",
    ],
  },
  {
    version: "1.0.0",
    date: "2025-01-01",
    icon: Zap,
    title: "Initial Release",
    changes: [
      "AI-powered web app analysis",
      "Mobile UX reimagination pipeline",
      "Visual builder with component tree",
      "GitHub OAuth integration",
      "Per-user GitHub repo authorization",
      "Supabase authentication and data storage",
      "React Native code generation",
    ],
  },
];

export default function Changelog() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="text-2xl font-bold">Changelog</h1>
        <p className="mt-2 text-sm text-muted-foreground">What's new in Morphic</p>

        <div className="relative mt-8">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />

          <div className="space-y-8">
            {releases.map((release) => {
              const Icon = release.icon;
              return (
                <div key={release.version} className="relative pl-14">
                  <div className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-4 ring-background">
                    <Icon className="h-5 w-5 text-violet-400" />
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-card p-6">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-bold text-violet-400">
                        v{release.version}
                      </span>
                      <span className="text-xs text-muted-foreground">{release.date}</span>
                    </div>
                    <h3 className="mt-2 font-semibold">{release.title}</h3>
                    <ul className="mt-3 space-y-1.5">
                      {release.changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500/50" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
