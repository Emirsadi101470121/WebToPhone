import { useState } from "react";
import type { TreeNode } from "./ComponentTree";
import { cn } from "@/lib/utils";

interface Props {
  node: TreeNode | null;
  onUpdate: (id: string, props: Record<string, any>) => void;
}

const PRESET_COLORS = [
  "#7c3aed", "#8b5cf6", "#a78bfa", "#6d28d9",
  "#1a1a1a", "#333333", "#666666", "#999999",
  "#ffffff", "#f5f3ff", "#ede9fe", "#ddd6fe",
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#06b6d4", "#ec4899", "#14b8a6",
];

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 64,
  unit = "px",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-medium tabular-nums">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-500 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [showPalette, setShowPalette] = useState(false);
  return (
    <div>
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="h-7 w-7 shrink-0 rounded-md border border-white/10 shadow-inner"
          style={{ backgroundColor: value || "#ffffff" }}
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-white/10 bg-muted/50 px-2 py-1 text-xs outline-none focus:border-violet-500"
          placeholder="#000000"
        />
      </div>
      {showPalette && (
        <div className="mt-2 grid grid-cols-5 gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { onChange(c); setShowPalette(false); }}
              className={cn(
                "h-6 w-full rounded border border-white/10 transition-transform hover:scale-110",
                value === c && "ring-2 ring-violet-500 ring-offset-1 ring-offset-background"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const STYLE_PRESETS = [
  {
    label: "Primary Button",
    style: { backgroundColor: "#7c3aed", padding: 14, borderRadius: 10, alignItems: "center" as const },
  },
  {
    label: "Card",
    style: { backgroundColor: "#f5f3ff", padding: 16, borderRadius: 12, margin: 4 },
  },
  {
    label: "Muted Text",
    style: { fontSize: 13, color: "#666666", fontWeight: "normal" as const },
  },
  {
    label: "Hero Header",
    style: { backgroundColor: "#7c3aed", padding: 32, alignItems: "center" as const },
  },
  {
    label: "Subtle Card",
    style: { backgroundColor: "#ffffff", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  },
];

export default function PropertiesPanel({ node, onUpdate }: Props) {
  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-xs text-muted-foreground">
          Select a component in the tree or preview to edit its properties
        </p>
      </div>
    );
  }

  const currentProps = node.props ?? {};
  const styles = currentProps.style ?? {};

  const handleStyleChange = (key: string, value: string | number) => {
    const newStyle = { ...styles, [key]: value };
    onUpdate(node.id, { ...currentProps, style: newStyle });
  };

  const handleTextChange = (value: string) => {
    onUpdate(node.id, { ...currentProps, text: value });
  };

  const applyPreset = (presetStyle: Record<string, any>) => {
    const newStyle = { ...styles, ...presetStyle };
    onUpdate(node.id, { ...currentProps, style: newStyle });
  };

  return (
    <div className="space-y-5 p-3">
      {/* Header */}
      <div className="rounded-lg bg-violet-500/10 p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
          {node.type}
        </p>
        <p className="mt-0.5 text-sm font-medium">{node.label}</p>
      </div>

      {/* Text Content */}
      {node.type === "Text" && (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Content</label>
          <textarea
            value={currentProps.text ?? node.label}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-muted/50 px-3 py-2 text-xs outline-none focus:border-violet-500"
          />
        </div>
      )}

      {/* Quick Presets */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Presets
        </p>
        <div className="flex flex-wrap gap-1">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.style)}
              className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Colors
        </p>
        <div className="space-y-3">
          <ColorField
            label="Background"
            value={styles.backgroundColor ?? ""}
            onChange={(v) => handleStyleChange("backgroundColor", v)}
          />
          <ColorField
            label="Text Color"
            value={styles.color ?? ""}
            onChange={(v) => handleStyleChange("color", v)}
          />
        </div>
      </div>

      {/* Spacing */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Spacing
        </p>
        <div className="space-y-3">
          <SliderField
            label="Padding"
            value={styles.padding ?? 0}
            onChange={(v) => handleStyleChange("padding", v)}
          />
          <SliderField
            label="Margin"
            value={styles.margin ?? 0}
            onChange={(v) => handleStyleChange("margin", v)}
          />
          <SliderField
            label="Border Radius"
            value={styles.borderRadius ?? 0}
            max={40}
            onChange={(v) => handleStyleChange("borderRadius", v)}
          />
        </div>
      </div>

      {/* Typography */}
      {(node.type === "Text" || styles.fontSize) && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Typography
          </p>
          <div className="space-y-3">
            <SliderField
              label="Font Size"
              value={styles.fontSize ?? 14}
              min={8}
              max={48}
              onChange={(v) => handleStyleChange("fontSize", v)}
            />
            <div>
              <span className="mb-1 block text-[11px] text-muted-foreground">Font Weight</span>
              <div className="grid grid-cols-3 gap-1">
                {(["normal", "600", "bold"] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => handleStyleChange("fontWeight", w)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-[10px] transition-colors",
                      (styles.fontWeight ?? "normal") === w
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-white/10 text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {w === "normal" ? "Regular" : w === "600" ? "Medium" : "Bold"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1 block text-[11px] text-muted-foreground">Text Align</span>
              <div className="grid grid-cols-3 gap-1">
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => handleStyleChange("textAlign", a)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-[10px] capitalize transition-colors",
                      (styles.textAlign ?? "left") === a
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-white/10 text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layout */}
      {(node.type === "View" || node.type === "ScrollView") && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Layout
          </p>
          <div className="space-y-3">
            <div>
              <span className="mb-1 block text-[11px] text-muted-foreground">Direction</span>
              <div className="grid grid-cols-2 gap-1">
                {(["column", "row"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleStyleChange("flexDirection", d)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-[10px] capitalize transition-colors",
                      (styles.flexDirection ?? "column") === d
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-white/10 text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {d === "column" ? "Vertical" : "Horizontal"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1 block text-[11px] text-muted-foreground">Align Items</span>
              <div className="grid grid-cols-2 gap-1">
                {(["flex-start", "center", "flex-end", "stretch"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => handleStyleChange("alignItems", a)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-[10px] transition-colors",
                      (styles.alignItems ?? "stretch") === a
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-white/10 text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {a === "flex-start" ? "Start" : a === "flex-end" ? "End" : a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
