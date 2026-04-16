import type { TreeNode } from "./ComponentTree";
import { cn } from "@/lib/utils";
import { Smartphone, Tablet } from "lucide-react";

export type DeviceType = "iphone" | "android" | "tablet";

const DEVICES: Record<DeviceType, { width: number; height: number; label: string }> = {
  iphone: { width: 320, height: 640, label: "iPhone" },
  android: { width: 360, height: 720, label: "Android" },
  tablet: { width: 500, height: 700, label: "Tablet" },
};

interface Props {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  device: DeviceType;
  onDeviceChange: (d: DeviceType) => void;
}

export default function MobilePreview({ nodes, selectedId, onSelect, device, onDeviceChange }: Props) {
  const d = DEVICES[device];

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Device switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-card p-1">
        {(Object.keys(DEVICES) as DeviceType[]).map((key) => (
          <button
            key={key}
            onClick={() => onDeviceChange(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors",
              device === key
                ? "bg-violet-500/20 text-violet-300"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {key === "tablet" ? (
              <Tablet className="h-3 w-3" />
            ) : (
              <Smartphone className="h-3 w-3" />
            )}
            {DEVICES[key].label}
          </button>
        ))}
      </div>

      {/* Device frame */}
      <div className="relative">
        <div className="absolute -inset-3 rounded-[3rem] bg-gradient-to-b from-zinc-700 to-zinc-800 shadow-2xl" />
        <div className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-800" />

        <div
          className="relative overflow-hidden rounded-[2rem] bg-white transition-all duration-300"
          style={{ width: d.width, height: d.height }}
        >
          {/* Status bar */}
          <div className="flex h-10 items-center justify-center bg-zinc-100">
            <span className="text-[10px] font-medium text-zinc-500">9:41</span>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ height: d.height - 40 }}>
            {nodes.map((node) => (
              <PreviewNode
                key={node.id}
                node={node}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewNode({
  node,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}) {
  const isSelected = node.id === selectedId;
  const style = node.props?.style ?? {};

  const baseStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor,
    color: style.color ?? "#1a1a1a",
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
    fontWeight: style.fontWeight,
    padding: style.padding ? `${style.padding}px` : undefined,
    margin: style.margin ? `${style.margin}px` : undefined,
    borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined,
    textAlign: style.textAlign,
    flexDirection: style.flexDirection,
    justifyContent: style.justifyContent,
    alignItems: style.alignItems,
    display: node.type === "View" || node.type === "ScrollView" ? "flex" : undefined,
    position: "relative",
  };

  const selectionOverlay = isSelected ? (
    <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border-2 border-violet-500 bg-violet-500/5">
      <span className="absolute -top-5 left-1 rounded bg-violet-600 px-1.5 py-0.5 text-[9px] font-medium text-white shadow">
        {node.label}
      </span>
    </div>
  ) : null;

  if (node.type === "Text") {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
        className="cursor-pointer transition-all hover:outline hover:outline-1 hover:outline-violet-400/30"
        style={baseStyle}
      >
        {selectionOverlay}
        {node.props?.text ?? node.label}
      </div>
    );
  }

  if (node.type === "Image") {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
        className="cursor-pointer bg-zinc-200 transition-all hover:outline hover:outline-1 hover:outline-violet-400/30"
        style={{ ...baseStyle, height: style.height ?? 120, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {selectionOverlay}
        <span className="text-xs text-zinc-400">Image</span>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      className="cursor-pointer transition-all hover:outline hover:outline-1 hover:outline-violet-400/30"
      style={baseStyle}
    >
      {selectionOverlay}
      {node.children?.map((child) => (
        <PreviewNode
          key={child.id}
          node={child}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
