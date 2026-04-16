import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Layers, Settings, Download, Undo2, Redo2,
  Loader2, PanelLeftClose, PanelLeftOpen, ChevronDown,
  Package, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ComponentTree, { type TreeNode } from "@/components/builder/ComponentTree";
import PropertiesPanel from "@/components/builder/PropertiesPanel";
import MobilePreview, { type DeviceType } from "@/components/builder/MobilePreview";
import ComponentLibrary from "@/components/builder/ComponentLibrary";
import AIChatPanel from "@/components/builder/AIChatPanel";
import { useAuth } from "@/hooks/use-auth";
import { exportProject } from "@/lib/export";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- Tree helpers ---

function buildTreeFromSession(componentTree: any[]): TreeNode[] {
  if (!componentTree?.length) return [];
  return [{
    id: "root",
    type: "ScrollView",
    label: "Screen",
    props: { style: { backgroundColor: "#ffffff", padding: 0 } },
    children: componentTree.map((page: any, i: number) => ({
      id: `page-${i}`,
      type: "View",
      label: page.pageName || `Page ${i + 1}`,
      props: { style: { padding: 16, ...(i === 0 ? { backgroundColor: "#7c3aed" } : {}) } },
      children: [
        {
          id: `page-${i}-title`,
          type: "Text",
          label: `${page.pageName || "Page"} Title`,
          props: { text: page.pageName || `Page ${i + 1}`, style: { fontSize: 20, fontWeight: "bold", color: i === 0 ? "#ffffff" : "#1a1a1a" } },
        },
        {
          id: `page-${i}-design`,
          type: "Text",
          label: "Design Label",
          props: { text: `Design: ${page.designName || "Custom"}`, style: { fontSize: 12, color: i === 0 ? "#e0d4fc" : "#666", marginTop: 4 } },
        },
      ],
    })),
  }];
}

const defaultTree: TreeNode[] = [
  {
    id: "root",
    type: "ScrollView",
    label: "Screen",
    props: { style: { backgroundColor: "#ffffff", padding: 0 } },
    children: [
      {
        id: "header",
        type: "View",
        label: "Header",
        props: { style: { backgroundColor: "#7c3aed", padding: 24, alignItems: "center" } },
        children: [
          { id: "title", type: "Text", label: "App Title", props: { text: "My Mobile App", style: { fontSize: 24, fontWeight: "bold", color: "#ffffff", textAlign: "center" } } },
          { id: "subtitle", type: "Text", label: "Subtitle", props: { text: "Built with Morphic", style: { fontSize: 14, color: "#e0d4fc", textAlign: "center", margin: 4 } } },
        ],
      },
      {
        id: "content",
        type: "View",
        label: "Content",
        props: { style: { padding: 20 } },
        children: [
          {
            id: "card1",
            type: "View",
            label: "Card",
            props: { style: { backgroundColor: "#f5f3ff", padding: 16, borderRadius: 12, margin: 4 } },
            children: [
              { id: "card1-title", type: "Text", label: "Card Title", props: { text: "Welcome", style: { fontSize: 18, fontWeight: "bold", color: "#1a1a1a" } } },
              { id: "card1-desc", type: "Text", label: "Card Description", props: { text: "Tap on any element in the preview or the tree to edit it.", style: { fontSize: 13, color: "#666666", margin: 4 } } },
            ],
          },
          {
            id: "button1",
            type: "View",
            label: "Button",
            props: { style: { backgroundColor: "#7c3aed", padding: 14, borderRadius: 10, margin: 8, alignItems: "center" } },
            children: [
              { id: "button1-text", type: "Text", label: "Button Label", props: { text: "Get Started", style: { fontSize: 16, fontWeight: "600", color: "#ffffff" } } },
            ],
          },
        ],
      },
    ],
  },
];

function updateNodeInTree(nodes: TreeNode[], id: string, newProps: Record<string, any>): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, props: newProps };
    if (node.children) return { ...node, children: updateNodeInTree(node.children, id, newProps) };
    return node;
  });
}

function renameNodeInTree(nodes: TreeNode[], id: string, newLabel: string): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, label: newLabel };
    if (node.children) return { ...node, children: renameNodeInTree(node.children, id, newLabel) };
    return node;
  });
}

function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeNodeById(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => n.children ? { ...n, children: removeNodeById(n.children, id) } : n);
}

function insertNode(nodes: TreeNode[], targetId: string, nodeToInsert: TreeNode, position: "before" | "after" | "inside"): TreeNode[] {
  if (position === "inside") {
    return nodes.map((n) => {
      if (n.id === targetId) return { ...n, children: [...(n.children || []), nodeToInsert] };
      if (n.children) return { ...n, children: insertNode(n.children, targetId, nodeToInsert, position) };
      return n;
    });
  }

  const result: TreeNode[] = [];
  for (const n of nodes) {
    if (n.id === targetId) {
      if (position === "before") { result.push(nodeToInsert); result.push(n); }
      else { result.push(n); result.push(nodeToInsert); }
    } else {
      result.push(n.children ? { ...n, children: insertNode(n.children, targetId, nodeToInsert, position) } : n);
    }
  }
  return result;
}

// --- Component ---

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tree, setTree] = useState<TreeNode[]>(defaultTree);
  const [history, setHistory] = useState<TreeNode[][]>([]);
  const [future, setFuture] = useState<TreeNode[][]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [activePanel, setActivePanel] = useState<"tree" | "props" | "library" | "ai">("tree");
  const [exporting, setExporting] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [exportFormat, setExportFormat] = useState<"react-native" | "flutter" | "swiftui">("react-native");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [device, setDevice] = useState<DeviceType>("iphone");

  const pushHistory = useCallback((prev: TreeNode[]) => {
    setHistory((h) => [...h.slice(-50), prev]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [...f, tree]);
      setTree(prev);
      return h.slice(0, -1);
    });
  }, [tree]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[f.length - 1];
      setHistory((h) => [...h, tree]);
      setTree(next);
      return f.slice(0, -1);
    });
  }, [tree]);

  useEffect(() => {
    const loadSession = async () => {
      if (!id || !user) { setLoadingSession(false); return; }
      try {
        const { data } = await supabase
          .from("builder_sessions")
          .select("component_tree")
          .eq("project_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.component_tree?.length) {
          const sessionTree = buildTreeFromSession(data.component_tree);
          if (sessionTree.length) {
            setTree(sessionTree);
            toast.success("Builder loaded from your design selections");
          }
        }
      } catch {} finally { setLoadingSession(false); }
    };
    loadSession();
  }, [id, user]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      // Don't capture shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (isMod && e.key === "e") { e.preventDefault(); handleExport(); }
      if (isMod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (isMod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === "Escape") { setSelectedNode(null); setActivePanel("tree"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const handleSelect = useCallback((node: TreeNode) => {
    setSelectedNode(node);
    if (activePanel !== "ai") setActivePanel("props");
  }, [activePanel]);

  const handleUpdate = useCallback((nodeId: string, newProps: Record<string, any>) => {
    setTree((prev) => {
      pushHistory(prev);
      return updateNodeInTree(prev, nodeId, newProps);
    });
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, props: newProps } : prev));
  }, [pushHistory]);

  const handleRename = useCallback((nodeId: string, newLabel: string) => {
    setTree((prev) => {
      pushHistory(prev);
      return renameNodeInTree(prev, nodeId, newLabel);
    });
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, label: newLabel } : prev));
  }, [pushHistory]);

  const handleReorder = useCallback((dragId: string, dropId: string, position: "before" | "after" | "inside") => {
    setTree((prev) => {
      const dragNode = findNodeById(prev, dragId);
      if (!dragNode) return prev;
      pushHistory(prev);
      const cleaned = removeNodeById(prev, dragId);
      return insertNode(cleaned, dropId, dragNode, position);
    });
  }, [pushHistory]);

  const handleInsertComponent = useCallback((node: TreeNode) => {
    setTree((prev) => {
      pushHistory(prev);
      const root = prev[0];
      if (!root) return prev;
      const contentNode = root.children?.find((c) => c.label === "Content") || root;
      const target = contentNode === root ? root : contentNode;
      const updatedTarget = { ...target, children: [...(target.children || []), node] };
      if (target === root) return [updatedTarget];
      return [{ ...root, children: root.children?.map((c) => (c.id === target.id ? updatedTarget : c)) }];
    });
    toast.success(`Added ${node.label}`);
    setActivePanel("tree");
  }, [pushHistory]);

  const handleAIApply = useCallback((newTree: TreeNode[]) => {
    pushHistory(tree);
    setTree(newTree);
    toast.success("AI applied design changes");
  }, [tree, pushHistory]);

  const handleExport = async () => {
    if (!id || !user) return;
    setExporting(true);
    try {
      const success = await exportProject(id, user.id, "morphic-app", exportFormat);
      toast[success ? "success" : "error"](success ? `Exported as ${formatLabels[exportFormat]}` : "Export failed");
    } catch { toast.error("Export failed"); }
    finally { setExporting(false); }
  };

  const formatLabels: Record<string, string> = { "react-native": "React Native", flutter: "Flutter", swiftui: "SwiftUI" };

  if (loadingSession) {
    return (
      <div className="flex h-screen items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const panels = [
    { key: "tree" as const, icon: Layers, label: "Layers" },
    { key: "props" as const, icon: Settings, label: "Props" },
    { key: "library" as const, icon: Package, label: "Add" },
    { key: "ai" as const, icon: MessageSquare, label: "AI" },
  ];

  return (
    <div className="flex h-screen flex-col pt-16">
      {/* Toolbar */}
      <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(id ? `/project/${id}` : "/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-5 w-px bg-white/10" />
          <span className="text-sm font-medium">Visual Builder</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Undo (Cmd+Z)" onClick={undo} disabled={history.length === 0}>
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Redo (Cmd+Shift+Z)" onClick={redo} disabled={future.length === 0}>
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <div className="h-5 w-px bg-white/10" />
          <div className="relative">
            <div className="flex">
              <Button
                size="sm"
                onClick={handleExport}
                disabled={exporting}
                className="gap-1.5 rounded-r-none bg-primary text-xs hover:bg-primary/90"
              >
                <Download className="h-3.5 w-3.5" />
                {exporting ? "Exporting..." : formatLabels[exportFormat]}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="rounded-l-none border-l border-white/20 bg-primary px-1.5 hover:bg-primary/90"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            {showExportMenu && (
              <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-white/10 bg-card p-1 shadow-xl">
                {(["react-native", "flutter", "swiftui"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => { setExportFormat(fmt); setShowExportMenu(false); }}
                    className={cn(
                      "flex w-full items-center rounded-md px-3 py-2 text-xs font-medium transition-colors",
                      exportFormat === fmt ? "bg-violet-500/20 text-violet-300" : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {formatLabels[fmt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute bottom-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg md:hidden"
          aria-label={sidebarOpen ? "Close panel" : "Open panel"}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>

        {/* Left sidebar */}
        <div className={cn(
          "flex flex-col border-r border-white/10 transition-all",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden",
          "max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-20 max-md:bg-background max-md:pt-28"
        )}>
          {/* Panel tabs */}
          <div className="flex border-b border-white/10">
            {panels.map((p) => (
              <button
                key={p.key}
                onClick={() => setActivePanel(p.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  activePanel === p.key ? "border-b-2 border-violet-500 text-violet-400" : "text-muted-foreground"
                )}
              >
                <p.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {activePanel === "tree" ? (
              <div className="p-2">
                <ComponentTree
                  nodes={tree}
                  selectedId={selectedNode?.id ?? null}
                  onSelect={handleSelect}
                  onReorder={handleReorder}
                  onRename={handleRename}
                />
              </div>
            ) : activePanel === "props" ? (
              <PropertiesPanel node={selectedNode} onUpdate={handleUpdate} />
            ) : activePanel === "library" ? (
              <div className="p-2">
                <ComponentLibrary onInsert={handleInsertComponent} />
              </div>
            ) : (
              <AIChatPanel
                tree={tree}
                selectedNode={selectedNode}
                onApplyChanges={handleAIApply}
                projectId={id}
                userId={user?.id}
              />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto bg-zinc-900/50">
          <MobilePreview
            nodes={tree}
            selectedId={selectedNode?.id ?? null}
            onSelect={handleSelect}
            device={device}
            onDeviceChange={setDevice}
          />
        </div>
      </div>
    </div>
  );
}
