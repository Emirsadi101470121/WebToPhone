import type { TreeNode } from "./ComponentTree";
import { cn } from "@/lib/utils";

interface Props {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}

export default function MobilePreview({ nodes, selectedId, onSelect }: Props) {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="relative">
        <div className="absolute -inset-3 rounded-[3rem] bg-gradient-to-b from-zinc-700 to-zinc-800 shadow-2xl" />
        <div className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-800" />

        <div className="relative h-[640px] w-[320px] overflow-hidden rounded-[2rem] bg-white">
          <div className="flex h-10 items-center justify-center bg-zinc-100">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium text-zinc-500">9:41</span>
            </div>
          </div>

          <div className="h-[600px] overflow-y-auto">
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
  };

  if (node.type === "Text") {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
        className={cn(
          "cursor-pointer transition-all",
          isSelected && "ring-2 ring-violet-500 ring-offset-1"
        )}
        style={baseStyle}
      >
        {node.props?.text ?? node.label}
      </div>
    );
  }

  if (node.type === "Image") {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
        className={cn(
          "cursor-pointer bg-zinc-200",
          isSelected && "ring-2 ring-violet-500 ring-offset-1"
        )}
        style={{ ...baseStyle, height: style.height ?? 120, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <span className="text-xs text-zinc-400">Image</span>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      className={cn(
        "cursor-pointer transition-all",
        isSelected && "ring-2 ring-violet-500 ring-offset-1"
      )}
      style={baseStyle}
    >
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
