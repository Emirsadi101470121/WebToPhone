import { ChevronRight, ChevronDown, Type, Layout, Image, Square, List, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

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
  onReorder?: (dragId: string, dropId: string, position: "before" | "after" | "inside") => void;
  onRename?: (id: string, newLabel: string) => void;
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

export default function ComponentTree({ nodes, selectedId, onSelect, onReorder, onRename, depth = 0 }: Props) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          onReorder={onReorder}
          onRename={onRename}
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
  onReorder,
  onRename,
  depth,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  onReorder?: (dragId: string, dropId: string, position: "before" | "after" | "inside") => void;
  onRename?: (id: string, newLabel: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);
  const [dropIndicator, setDropIndicator] = useState<"before" | "after" | "inside" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;
    const third = rect.height / 3;
    if (y < third) setDropIndicator("before");
    else if (y > third * 2) setDropIndicator("after");
    else setDropIndicator("inside");
  };

  const handleDragLeave = () => setDropIndicator(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dragId = e.dataTransfer.getData("text/plain");
    if (dragId && dragId !== node.id && dropIndicator && onReorder) {
      onReorder(dragId, node.id, dropIndicator);
    }
    setDropIndicator(null);
  };

  const startRename = () => {
    setEditValue(node.label);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const commitRename = () => {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== node.label && onRename) {
      onRename(node.id, trimmed);
    }
  };

  return (
    <div>
      <div
        ref={rowRef}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative",
          dropIndicator === "before" && "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-violet-500",
          dropIndicator === "after" && "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-violet-500",
          dropIndicator === "inside" && "ring-1 ring-inset ring-violet-500/50 rounded"
        )}
      >
        <button
          onClick={() => onSelect(node)}
          onDoubleClick={(e) => { e.stopPropagation(); startRename(); }}
          className={cn(
            "group flex w-full items-center gap-1 rounded px-1 py-1 text-xs transition-colors",
            isSelected
              ? "bg-violet-500/20 text-violet-300"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          style={{ paddingLeft: `${depth * 14 + 4}px` }}
        >
          <GripVertical className="h-3 w-3 shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-40" />

          {hasChildren ? (
            <span
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="shrink-0 cursor-pointer"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
          ) : (
            <span className="w-3 shrink-0" />
          )}

          <span className="shrink-0 text-violet-400">{iconForType(node.type)}</span>

          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditing(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 rounded border border-violet-500 bg-background px-1 py-0 text-xs outline-none"
              autoFocus
            />
          ) : (
            <span className="truncate">{node.label}</span>
          )}
        </button>
      </div>
      {hasChildren && expanded && (
        <ComponentTree
          nodes={node.children!}
          selectedId={selectedId}
          onSelect={onSelect}
          onReorder={onReorder}
          onRename={onRename}
          depth={depth + 1}
        />
      )}
    </div>
  );
}
