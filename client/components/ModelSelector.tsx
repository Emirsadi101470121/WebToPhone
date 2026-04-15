import { Zap, Scale, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModelTier = "haiku" | "sonnet" | "opus";

interface ModelOption {
  tier: ModelTier;
  label: string;
  description: string;
  icon: typeof Zap;
  creditMultiplier: string;
  color: string;
}

const models: ModelOption[] = [
  {
    tier: "haiku",
    label: "Haiku",
    description: "Fast & affordable",
    icon: Zap,
    creditMultiplier: "0.5x credits",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    tier: "sonnet",
    label: "Sonnet",
    description: "Balanced quality",
    icon: Scale,
    creditMultiplier: "1x credits",
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    tier: "opus",
    label: "Opus",
    description: "Premium quality",
    icon: Crown,
    creditMultiplier: "3x credits",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
];

interface Props {
  selected: ModelTier;
  onChange: (tier: ModelTier) => void;
  compact?: boolean;
}

export default function ModelSelector({ selected, onChange, compact }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-card p-0.5">
        {models.map((m) => {
          const Icon = m.icon;
          const isActive = selected === m.tier;
          return (
            <button
              key={m.tier}
              onClick={() => onChange(m.tier)}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                isActive ? m.color : "text-muted-foreground hover:text-foreground"
              )}
              title={`${m.label}: ${m.description} (${m.creditMultiplier})`}
            >
              <Icon className="h-3 w-3" />
              {m.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {models.map((m) => {
        const Icon = m.icon;
        const isActive = selected === m.tier;
        return (
          <button
            key={m.tier}
            onClick={() => onChange(m.tier)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
              isActive ? m.color : "border-white/5 text-muted-foreground hover:border-white/10"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-semibold">{m.label}</span>
            <span className="text-[10px] opacity-70">{m.creditMultiplier}</span>
          </button>
        );
      })}
    </div>
  );
}
