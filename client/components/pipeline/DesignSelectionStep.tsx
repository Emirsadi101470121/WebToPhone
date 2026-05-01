import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutNode {
  type: string;
  label?: string;
  style?: Record<string, any>;
  children?: LayoutNode[];
}

interface DesignOption {
  id: string;
  name: string;
  description: string;
  layout: LayoutNode;
}

interface PageDesign {
  pageName: string;
  options: DesignOption[];
}

interface Props {
  designs: PageDesign[];
  onConfirm: (selections: Record<string, DesignOption>) => void;
}

function scalePx(v: any, factor = 0.4, max = 14): string | undefined {
  if (typeof v !== "number") return undefined;
  return `${Math.max(1, Math.min(v * factor, max))}px`;
}

function MiniPreview({ layout }: { layout: LayoutNode }) {
  if (layout.type === "Text") {
    const fontSize = Math.max(5, Math.min((layout.style?.fontSize ?? 12) * 0.42, 9));
    return (
      <div style={{
        fontSize: `${fontSize}px`,
        fontWeight: layout.style?.fontWeight,
        color: layout.style?.color ?? "#333",
        padding: "1px 2px",
        lineHeight: 1.15,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {layout.label ?? ""}
      </div>
    );
  }

  if (layout.type === "Image") {
    return (
      <div style={{
        backgroundColor: layout.style?.backgroundColor ?? "#d4d4d8",
        width: scalePx(layout.style?.width) ?? "100%",
        height: scalePx(layout.style?.height) ?? "16px",
        borderRadius: scalePx(layout.style?.borderRadius, 0.5, 6),
        flexShrink: 0,
      }} />
    );
  }

  const minH = layout.style?.minHeight ?? layout.style?.height;
  const style: React.CSSProperties = {
    backgroundColor: layout.style?.backgroundColor,
    backgroundImage: layout.style?.backgroundImage,
    padding: scalePx(layout.style?.padding ?? layout.style?.paddingHorizontal, 0.4, 8),
    paddingTop: scalePx(layout.style?.paddingTop ?? layout.style?.paddingVertical, 0.4, 8),
    paddingBottom: scalePx(layout.style?.paddingBottom ?? layout.style?.paddingVertical, 0.4, 8),
    borderRadius: scalePx(layout.style?.borderRadius, 0.5, 8),
    boxShadow: layout.style?.boxShadow ? "0 1px 3px rgba(0,0,0,0.1)" : undefined,
    display: "flex",
    flexDirection: (layout.style?.flexDirection as any) ?? "column",
    flexWrap: (layout.style?.flexWrap as any),
    alignItems: layout.style?.alignItems,
    justifyContent: layout.style?.justifyContent,
    gap: scalePx(layout.style?.gap, 0.4, 4) ?? "2px",
    minHeight: scalePx(minH, 0.4, 60),
    flexShrink: 0,
  };

  return (
    <div style={style}>
      {layout.children?.map((child, i) => (
        <MiniPreview key={i} layout={child} />
      ))}
    </div>
  );
}

export default function DesignSelectionStep({ designs, onConfirm }: Props) {
  const [selections, setSelections] = useState<Record<string, DesignOption>>({});

  const handleSelect = (pageName: string, option: DesignOption) => {
    setSelections((prev) => ({ ...prev, [pageName]: option }));
  };

  const allSelected = designs.every((d) => selections[d.pageName]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-500/20 bg-card p-6">
        <h3 className="text-lg font-semibold">Mobile UX Designs</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          AI has reimagined each page for mobile. Choose your preferred design for each screen.
        </p>
      </div>

      {designs.map((pageDesign) => (
        <div key={pageDesign.pageName} className="rounded-2xl border border-white/5 bg-card p-6">
          <h3 className="font-semibold">{pageDesign.pageName} Screen</h3>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pageDesign.options.map((option) => {
              const isSelected = selections[pageDesign.pageName]?.id === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(pageDesign.pageName, option)}
                  className={cn(
                    "relative rounded-xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/10"
                      : "border-white/5 hover:border-violet-500/20"
                  )}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  <div className="mx-auto w-36">
                    <div className="overflow-hidden rounded-2xl border-2 border-zinc-700 bg-white shadow-lg">
                      {/* Phone notch */}
                      <div className="flex h-5 items-center justify-center bg-zinc-800">
                        <div className="h-1.5 w-10 rounded-full bg-zinc-600" />
                      </div>
                      <div className="h-52 overflow-hidden">
                        <MiniPreview layout={option.layout} />
                      </div>
                      {/* Phone home bar */}
                      <div className="flex h-4 items-center justify-center bg-zinc-50">
                        <div className="h-1 w-8 rounded-full bg-zinc-300" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium">{option.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Button
        onClick={() => onConfirm(selections)}
        disabled={!allSelected}
        className="w-full gap-2 bg-primary hover:bg-primary/90"
      >
        {allSelected
          ? "Confirm Designs & Open Builder"
          : `Select design for ${designs.length - Object.keys(selections).length} more screen(s)`}
      </Button>
    </div>
  );
}
