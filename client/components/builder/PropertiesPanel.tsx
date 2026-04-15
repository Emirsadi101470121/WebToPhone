import type { TreeNode } from "./ComponentTree";

interface Props {
  node: TreeNode | null;
  onUpdate: (id: string, props: Record<string, any>) => void;
}

const styleFields = [
  { key: "backgroundColor", label: "Background", type: "color" },
  { key: "color", label: "Text Color", type: "color" },
  { key: "fontSize", label: "Font Size", type: "number" },
  { key: "fontWeight", label: "Font Weight", type: "select", options: ["normal", "bold", "600", "700", "800"] },
  { key: "padding", label: "Padding", type: "number" },
  { key: "margin", label: "Margin", type: "number" },
  { key: "borderRadius", label: "Border Radius", type: "number" },
  { key: "textAlign", label: "Text Align", type: "select", options: ["left", "center", "right"] },
  { key: "flexDirection", label: "Flex Direction", type: "select", options: ["column", "row"] },
  { key: "justifyContent", label: "Justify Content", type: "select", options: ["flex-start", "center", "flex-end", "space-between", "space-around"] },
  { key: "alignItems", label: "Align Items", type: "select", options: ["flex-start", "center", "flex-end", "stretch"] },
];

export default function PropertiesPanel({ node, onUpdate }: Props) {
  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">Select a component to edit its properties</p>
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

  return (
    <div className="space-y-4 p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {node.type}
        </p>
        <p className="mt-0.5 text-sm font-medium">{node.label}</p>
      </div>

      {node.type === "Text" && (
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Content</label>
          <textarea
            value={currentProps.text ?? node.label}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={2}
            className="w-full resize-none rounded border border-white/10 bg-muted/50 px-2 py-1.5 text-xs outline-none focus:border-violet-500"
          />
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Style
        </p>
        <div className="space-y-2">
          {styleFields.map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <label className="w-24 shrink-0 text-xs text-muted-foreground">
                {field.label}
              </label>
              {field.type === "color" ? (
                <div className="flex flex-1 items-center gap-1.5">
                  <input
                    type="color"
                    value={styles[field.key] ?? "#ffffff"}
                    onChange={(e) => handleStyleChange(field.key, e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    value={styles[field.key] ?? ""}
                    onChange={(e) => handleStyleChange(field.key, e.target.value)}
                    className="flex-1 rounded border border-white/10 bg-muted/50 px-2 py-1 text-xs outline-none focus:border-violet-500"
                    placeholder="#000000"
                  />
                </div>
              ) : field.type === "number" ? (
                <input
                  type="number"
                  value={styles[field.key] ?? ""}
                  onChange={(e) => handleStyleChange(field.key, parseInt(e.target.value) || 0)}
                  className="flex-1 rounded border border-white/10 bg-muted/50 px-2 py-1 text-xs outline-none focus:border-violet-500"
                />
              ) : field.type === "select" ? (
                <select
                  value={styles[field.key] ?? ""}
                  onChange={(e) => handleStyleChange(field.key, e.target.value)}
                  className="flex-1 rounded border border-white/10 bg-muted/50 px-2 py-1 text-xs outline-none focus:border-violet-500"
                >
                  <option value="">-</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
