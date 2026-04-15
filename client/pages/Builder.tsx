import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Layers, Settings, Download, Undo2, Redo2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ComponentTree, { type TreeNode } from "@/components/builder/ComponentTree";
import PropertiesPanel from "@/components/builder/PropertiesPanel";
import MobilePreview from "@/components/builder/MobilePreview";
import { useAuth } from "@/hooks/use-auth";
import { exportProject } from "@/lib/export";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

function buildTreeFromSession(componentTree: any[]): TreeNode[] {
  if (!componentTree?.length) return [];
  const root: TreeNode = {
    id: "root",
    type: "ScrollView",
    label: "Screen",
    props: { style: { backgroundColor: "#ffffff", padding: 0 } },
    children: componentTree.map((page: any, i: number) => ({
      id: `page-${i}`,
      type: "View",
      label: page.pageName || `Page ${i + 1}`,
      props: {
        style: {
          padding: 16,
          ...(i === 0 ? { backgroundColor: "#7c3aed" } : {}),
        },
      },
      children: [
        {
          id: `page-${i}-title`,
          type: "Text",
          label: `${page.pageName || "Page"} Title`,
          props: {
            text: page.pageName || `Page ${i + 1}`,
            style: {
              fontSize: 20,
              fontWeight: "bold",
              color: i === 0 ? "#ffffff" : "#1a1a1a",
            },
          },
        },
        {
          id: `page-${i}-design`,
          type: "Text",
          label: "Design Label",
          props: {
            text: `Design: ${page.designName || "Custom"}`,
            style: { fontSize: 12, color: i === 0 ? "#e0d4fc" : "#666", marginTop: 4 },
          },
        },
      ],
    })),
  };
  return [root];
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
        props: {
          style: {
            backgroundColor: "#7c3aed",
            padding: 24,
            alignItems: "center",
          },
        },
        children: [
          {
            id: "title",
            type: "Text",
            label: "App Title",
            props: {
              text: "My Mobile App",
              style: { fontSize: 24, fontWeight: "bold", color: "#ffffff", textAlign: "center" },
            },
          },
          {
            id: "subtitle",
            type: "Text",
            label: "Subtitle",
            props: {
              text: "Built with Morphic",
              style: { fontSize: 14, color: "#e0d4fc", textAlign: "center", margin: 4 },
            },
          },
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
            props: {
              style: {
                backgroundColor: "#f5f3ff",
                padding: 16,
                borderRadius: 12,
                margin: 4,
              },
            },
            children: [
              {
                id: "card1-title",
                type: "Text",
                label: "Card Title",
                props: {
                  text: "Welcome",
                  style: { fontSize: 18, fontWeight: "bold", color: "#1a1a1a" },
                },
              },
              {
                id: "card1-desc",
                type: "Text",
                label: "Card Description",
                props: {
                  text: "Tap on any element in the preview or the tree to edit it. Changes appear in real time.",
                  style: { fontSize: 13, color: "#666666", margin: 4 },
                },
              },
            ],
          },
          {
            id: "button1",
            type: "View",
            label: "Button",
            props: {
              style: {
                backgroundColor: "#7c3aed",
                padding: 14,
                borderRadius: 10,
                margin: 8,
                alignItems: "center",
              },
            },
            children: [
              {
                id: "button1-text",
                type: "Text",
                label: "Button Label",
                props: {
                  text: "Get Started",
                  style: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

function updateNodeInTree(nodes: TreeNode[], id: string, newProps: Record<string, any>): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, props: newProps };
    }
    if (node.children) {
      return { ...node, children: updateNodeInTree(node.children, id, newProps) };
    }
    return node;
  });
}

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tree, setTree] = useState<TreeNode[]>(defaultTree);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [activePanel, setActivePanel] = useState<"tree" | "props">("tree");
  const [exporting, setExporting] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

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
      } catch {} finally {
        setLoadingSession(false);
      }
    };
    loadSession();
  }, [id, user]);

  const handleSelect = useCallback((node: TreeNode) => {
    setSelectedNode(node);
    setActivePanel("props");
  }, []);

  const handleUpdate = useCallback((nodeId: string, newProps: Record<string, any>) => {
    setTree((prev) => updateNodeInTree(prev, nodeId, newProps));
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, props: newProps } : prev));
  }, []);

  const handleExport = async () => {
    if (!id || !user) return;
    setExporting(true);
    try {
      const success = await exportProject(id, user.id, "morphic-app");
      if (success) {
        toast.success("Project exported as ZIP");
      } else {
        toast.error("Export failed");
      }
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="flex h-screen items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col pt-16">
      <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(id ? `/project/${id}` : "/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="h-5 w-px bg-white/10" />
          <span className="text-sm font-medium">Visual Builder</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Undo">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Redo">
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <div className="h-5 w-px bg-white/10" />
          <Button
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="gap-1.5 bg-primary text-xs hover:bg-primary/90"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-64 flex-col border-r border-white/10">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActivePanel("tree")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
                activePanel === "tree" ? "border-b-2 border-violet-500 text-violet-400" : "text-muted-foreground"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Layers
            </button>
            <button
              onClick={() => setActivePanel("props")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
                activePanel === "props" ? "border-b-2 border-violet-500 text-violet-400" : "text-muted-foreground"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Properties
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {activePanel === "tree" ? (
              <ComponentTree
                nodes={tree}
                selectedId={selectedNode?.id ?? null}
                onSelect={handleSelect}
              />
            ) : (
              <PropertiesPanel
                node={selectedNode}
                onUpdate={handleUpdate}
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-zinc-900/50">
          <MobilePreview
            nodes={tree}
            selectedId={selectedNode?.id ?? null}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}
