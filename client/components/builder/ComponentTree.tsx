import { ChevronRight, ChevronDown, Type, Layout, Image, Square, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface TreeNode {
  id: string;
  type: string;
  label: string;
  children?: TreeNode[];
  props?: Record<string, any>;
}

interface Props {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  depth?: number;
}

function iconForType(type: string) {
  switch (type) {
    case "Text":
      return <Type className="h-3.5 w-3.5" />;
    case "View":
      return <Layout className="h-3.5 w-3.5" />;
    case "Image":
      return <Image className="h-3.5 w-3.5" />;
    case "ScrollView":
      return <List className="h-3.5 w-3.5" />;
    default:
      return <Square className="h-3.5 w-3.5" />;
  }
}

export default function ComponentTree({ nodes, selectedId, onSelect, depth = 0 }: Props) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth}
        />
      ))}
    </div>
  );
}

function TreeItem({
  node,
  selectedId,
  onSelect,
  depth,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <button
        onClick={() => onSelect(node)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
          isSelected
            ? "bg-violet-500/20 text-violet-300"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="shrink-0"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-3" />
        )}
        <span className="text-violet-400">{iconForType(node.type)}</span>
        <span className="truncate">{node.label}</span>
      </button>
      {hasChildren && expanded && (
        <ComponentTree
          nodes={node.children!}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      )}
    </div>
  );
}
