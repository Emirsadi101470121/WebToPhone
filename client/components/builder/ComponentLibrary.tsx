import { type TreeNode } from "./ComponentTree";

interface SnippetDef {
  label: string;
  icon: string;
  node: TreeNode;
}

const snippets: SnippetDef[] = [
  {
    label: "Tab Bar",
    icon: "📱",
    node: {
      id: "",
      type: "View",
      label: "Tab Bar",
      props: {
        style: {
          flexDirection: "row",
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingVertical: 8,
          paddingHorizontal: 16,
          justifyContent: "space-around",
        },
      },
      children: ["Home", "Search", "Profile"].map((t) => ({
        id: "",
        type: "Text",
        label: `${t} Tab`,
        props: { text: t, style: { fontSize: 12, color: "#666", textAlign: "center" } },
      })),
    },
  },
  {
    label: "Card",
    icon: "🃏",
    node: {
      id: "",
      type: "View",
      label: "Card",
      props: {
        style: {
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
          margin: 8,
        },
      },
      children: [
        { id: "", type: "Text", label: "Card Title", props: { text: "Card Title", style: { fontSize: 18, fontWeight: "bold", color: "#1a1a1a" } } },
        { id: "", type: "Text", label: "Card Body", props: { text: "Card description goes here.", style: { fontSize: 14, color: "#666", marginTop: 6 } } },
      ],
    },
  },
  {
    label: "Hero Section",
    icon: "🌟",
    node: {
      id: "",
      type: "View",
      label: "Hero",
      props: {
        style: {
          backgroundColor: "#7c3aed",
          padding: 32,
          alignItems: "center",
        },
      },
      children: [
        { id: "", type: "Text", label: "Hero Title", props: { text: "Welcome", style: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center" } } },
        { id: "", type: "Text", label: "Hero Subtitle", props: { text: "Build something amazing", style: { fontSize: 16, color: "#e0d4fc", textAlign: "center", marginTop: 8 } } },
      ],
    },
  },
  {
    label: "Button",
    icon: "🔘",
    node: {
      id: "",
      type: "View",
      label: "Button",
      props: {
        style: {
          backgroundColor: "#7c3aed",
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 10,
          alignItems: "center",
          margin: 8,
        },
      },
      children: [
        { id: "", type: "Text", label: "Button Label", props: { text: "Tap Me", style: { fontSize: 16, fontWeight: "600", color: "#fff" } } },
      ],
    },
  },
  {
    label: "List Item",
    icon: "📋",
    node: {
      id: "",
      type: "View",
      label: "List Item",
      props: {
        style: {
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#f0f0f0",
        },
      },
      children: [
        { id: "", type: "View", label: "Avatar", props: { style: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e0d4fc", marginRight: 12 } } },
        { id: "", type: "Text", label: "Item Text", props: { text: "List item", style: { fontSize: 16, color: "#1a1a1a" } } },
      ],
    },
  },
  {
    label: "Input Field",
    icon: "✏️",
    node: {
      id: "",
      type: "View",
      label: "Input Field",
      props: {
        style: {
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          margin: 8,
          backgroundColor: "#fff",
        },
      },
      children: [
        { id: "", type: "Text", label: "Placeholder", props: { text: "Enter text...", style: { fontSize: 14, color: "#9ca3af" } } },
      ],
    },
  },
  {
    label: "Modal",
    icon: "📦",
    node: {
      id: "",
      type: "View",
      label: "Modal Overlay",
      props: {
        style: {
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 24,
          justifyContent: "center",
          alignItems: "center",
        },
      },
      children: [
        {
          id: "",
          type: "View",
          label: "Modal Content",
          props: { style: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "90%" } },
          children: [
            { id: "", type: "Text", label: "Modal Title", props: { text: "Modal Title", style: { fontSize: 20, fontWeight: "bold", color: "#1a1a1a" } } },
            { id: "", type: "Text", label: "Modal Body", props: { text: "Modal content goes here.", style: { fontSize: 14, color: "#666", marginTop: 8 } } },
          ],
        },
      ],
    },
  },
];

let counter = 0;
function assignIds(node: TreeNode): TreeNode {
  const id = `lib-${Date.now()}-${counter++}`;
  return {
    ...node,
    id,
    children: node.children?.map(assignIds),
  };
}

interface ComponentLibraryProps {
  onInsert: (node: TreeNode) => void;
}

export default function ComponentLibrary({ onInsert }: ComponentLibraryProps) {
  return (
    <div className="space-y-1">
      <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Components
      </p>
      {snippets.map((s) => (
        <button
          key={s.label}
          onClick={() => onInsert(assignIds(s.node))}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-violet-300"
        >
          <span className="text-sm">{s.icon}</span>
          {s.label}
        </button>
      ))}
    </div>
  );
}
