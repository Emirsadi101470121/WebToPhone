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
          <div
            className="morphic-preview-root overflow-y-auto"
            style={{ height: d.height - 40, width: d.width }}
            key={nodes.map((n) => n.id).join("|")}
          >
            {nodes.map((node) => (
              <div key={node.id} style={{ width: "100%" }}>
                <PreviewNode
                  node={node}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              </div>
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

  // Helper: numeric style → "Npx", string passes through
  const px = (v: any) => (typeof v === "number" ? `${v}px` : v);
  const isContainer = node.type === "View" || node.type === "ScrollView";

  const baseStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor,
    backgroundImage: style.backgroundImage,
    color: style.color ?? (isContainer ? undefined : "#1a1a1a"),
    fontSize: px(style.fontSize),
    fontWeight: style.fontWeight,
    lineHeight: typeof style.lineHeight === "number" ? `${style.lineHeight}px` : style.lineHeight,
    letterSpacing: px(style.letterSpacing),
    textTransform: style.textTransform,
    // padding / shorthand + RN-style
    padding: px(style.padding),
    paddingTop: px(style.paddingTop ?? style.paddingVertical),
    paddingBottom: px(style.paddingBottom ?? style.paddingVertical),
    paddingLeft: px(style.paddingLeft ?? style.paddingHorizontal),
    paddingRight: px(style.paddingRight ?? style.paddingHorizontal),
    margin: px(style.margin),
    marginTop: px(style.marginTop ?? style.marginVertical),
    marginBottom: px(style.marginBottom ?? style.marginVertical),
    marginLeft: px(style.marginLeft ?? style.marginHorizontal),
    marginRight: px(style.marginRight ?? style.marginHorizontal),
    width: px(style.width),
    height: px(style.height),
    minHeight: px(style.minHeight),
    maxHeight: px(style.maxHeight),
    minWidth: px(style.minWidth),
    maxWidth: px(style.maxWidth ?? "100%"),
    borderRadius: px(style.borderRadius),
    borderTopLeftRadius: px(style.borderTopLeftRadius),
    borderTopRightRadius: px(style.borderTopRightRadius),
    borderBottomLeftRadius: px(style.borderBottomLeftRadius),
    borderBottomRightRadius: px(style.borderBottomRightRadius),
    borderWidth: px(style.borderWidth),
    borderColor: style.borderColor,
    borderStyle: style.borderWidth ? "solid" : undefined,
    textAlign: style.textAlign,
    opacity: style.opacity,
    boxShadow: style.boxShadow,
    gap: px(style.gap),
    rowGap: px(style.rowGap),
    columnGap: px(style.columnGap),
    flexDirection: style.flexDirection ?? (isContainer ? "column" : undefined),
    justifyContent: style.justifyContent,
    alignItems: style.alignItems,
    alignSelf: style.alignSelf,
    flex: style.flex,
    flexShrink: style.flexShrink,
    flexGrow: style.flexGrow,
    flexWrap: style.flexWrap,
    display: isContainer ? "flex" : undefined,
    position: style.position ?? "relative",
    top: px(style.top),
    bottom: px(style.bottom),
    left: px(style.left),
    right: px(style.right),
    zIndex: style.zIndex,
    overflow: isContainer ? "hidden" : undefined,
    boxSizing: "border-box",
    wordBreak: "break-word",
    transition: "transform 200ms ease, opacity 200ms ease",
    backgroundClip: style.backgroundImage ? "padding-box" : undefined,
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
        className="cursor-pointer transition-all hover:outline hover:outline-1 hover:outline-violet-400/30"
        style={{
          ...baseStyle,
          backgroundColor: style.backgroundColor ?? "#e4e4e7",
          height: px(style.height) ?? 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selectionOverlay}
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
