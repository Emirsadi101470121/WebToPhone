import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Preferences {
  theme: string;
  colorPalette: string[];
  style: string;
  targetAudience: string;
  uxPriority: string;
}

interface Props {
  onSubmit: (preferences: Preferences) => void;
}

const palettes = [
  { name: "Violet", colors: ["#7c3aed", "#a78bfa", "#ede9fe", "#f5f3ff"] },
  { name: "Blue", colors: ["#2563eb", "#60a5fa", "#dbeafe", "#eff6ff"] },
  { name: "Emerald", colors: ["#059669", "#34d399", "#d1fae5", "#ecfdf5"] },
  { name: "Rose", colors: ["#e11d48", "#fb7185", "#ffe4e6", "#fff1f2"] },
  { name: "Orange", colors: ["#ea580c", "#fb923c", "#fed7aa", "#fff7ed"] },
  { name: "Slate", colors: ["#334155", "#64748b", "#e2e8f0", "#f8fafc"] },
];

const styles = [
  { value: "minimal", label: "Minimal", desc: "Clean, lots of white space, simple typography" },
  { value: "premium", label: "Premium", desc: "Rich visuals, gradients, polished feel" },
  { value: "playful", label: "Playful", desc: "Rounded shapes, bright colors, fun interactions" },
  { value: "corporate", label: "Corporate", desc: "Professional, structured, trust-building" },
  { value: "modern", label: "Modern", desc: "Bold typography, asymmetric layouts, cutting-edge" },
];

const audiences = [
  { value: "consumers", label: "Consumers", desc: "General public, B2C" },
  { value: "business", label: "Business Users", desc: "B2B, enterprise, professionals" },
  { value: "developers", label: "Developers", desc: "Technical audience" },
  { value: "young", label: "Young Adults", desc: "18-30, social-first" },
  { value: "enterprise", label: "Enterprise", desc: "Large organizations, formal" },
];

const uxPriorities = [
  { value: "speed", label: "Speed", desc: "Fast task completion, minimal steps" },
  { value: "discovery", label: "Discovery", desc: "Exploration, browsing, engagement" },
  { value: "simplicity", label: "Simplicity", desc: "Minimal cognitive load" },
  { value: "power", label: "Power", desc: "Feature-rich, advanced controls" },
];

export default function DesignInterviewStep({ onSubmit }: Props) {
  const [theme, setTheme] = useState("");
  const [selectedPalette, setSelectedPalette] = useState<string[]>([]);
  const [style, setStyle] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [uxPriority, setUxPriority] = useState("");

  const isComplete = theme && selectedPalette.length > 0 && style && targetAudience && uxPriority;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-500/20 bg-card p-6">
        <h3 className="text-lg font-semibold">Design Interview</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Help our AI design the perfect mobile experience for you
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <h3 className="font-semibold">Theme</h3>
        <div className="mt-3 flex gap-3">
          {["light", "dark"].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "flex-1 rounded-xl border p-4 text-center transition-all",
                theme === t ? "border-violet-500 bg-violet-500/10" : "border-white/5 hover:border-violet-500/20"
              )}
            >
              <div className={cn(
                "mx-auto mb-2 h-12 w-20 rounded-lg",
                t === "dark" ? "bg-zinc-900 border border-zinc-700" : "bg-white border border-zinc-200"
              )} />
              <p className="text-sm font-medium capitalize">{t}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <h3 className="font-semibold">Color Palette</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {palettes.map((palette) => (
            <button
              key={palette.name}
              onClick={() => setSelectedPalette(palette.colors)}
              className={cn(
                "rounded-xl border p-3 transition-all",
                JSON.stringify(selectedPalette) === JSON.stringify(palette.colors)
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/5 hover:border-violet-500/20"
              )}
            >
              <div className="flex gap-1">
                {palette.colors.map((color, i) => (
                  <div key={i} className="h-6 flex-1 rounded" style={{ backgroundColor: color }} />
                ))}
              </div>
              <p className="mt-2 text-xs font-medium">{palette.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <h3 className="font-semibold">Design Style</h3>
        <div className="mt-3 space-y-2">
          {styles.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                style === s.value ? "border-violet-500 bg-violet-500/10" : "border-white/5 hover:border-violet-500/20"
              )}
            >
              <div className={cn(
                "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2",
                style === s.value ? "border-violet-500 bg-violet-500" : "border-white/20"
              )} />
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <h3 className="font-semibold">Target Audience</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {audiences.map((a) => (
            <button
              key={a.value}
              onClick={() => setTargetAudience(a.value)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm transition-all",
                targetAudience === a.value
                  ? "border-violet-500 bg-violet-500/10 text-violet-300"
                  : "border-white/10 hover:border-violet-500/20"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <h3 className="font-semibold">UX Priority</h3>
        <p className="mt-1 text-sm text-muted-foreground">What matters most in your mobile app?</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {uxPriorities.map((p) => (
            <button
              key={p.value}
              onClick={() => setUxPriority(p.value)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                uxPriority === p.value ? "border-violet-500 bg-violet-500/10" : "border-white/5 hover:border-violet-500/20"
              )}
            >
              <p className="text-sm font-medium">{p.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onSubmit({ theme, colorPalette: selectedPalette, style, targetAudience, uxPriority })}
        disabled={!isComplete}
        className="w-full gap-2 bg-primary hover:bg-primary/90"
      >
        Start Mobile UX Reimagination
      </Button>
    </div>
  );
}
