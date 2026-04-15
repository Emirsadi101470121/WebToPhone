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

function MiniPreview({ layout }: { layout: LayoutNode }) {
  const style: React.CSSProperties = {
    backgroundColor: layout.style?.backgroundColor,
    padding: layout.style?.padding ? `${Math.min(layout.style.padding / 2, 8)}px` : undefined,
    borderRadius: layout.style?.borderRadius ? `${Math.min(layout.style.borderRadius / 2, 8)}px` : undefined,
    display: layout.type === "View" || layout.type === "ScrollView" ? "flex" : undefined,
    flexDirection: (layout.style?.flexDirection as any) ?? "column",
    alignItems: layout.style?.alignItems,
    gap: "2px",
  };

  if (layout.type === "Text") {
    const fontSize = Math.min((layout.style?.fontSize ?? 12) / 3, 8);
    return (
      <div style={{
        fontSize: `${fontSize}px`,
        fontWeight: layout.style?.fontWeight,
        color: layout.style?.color ?? "#333",
        padding: "1px 2px",
        lineHeight: 1.2,
      }}>
        {layout.label ?? ""}
      </div>
    );
  }

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

                  <div className="mx-auto w-40">
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-sm">
                      <div className="h-4 bg-zinc-100" />
                      <div className="h-48 overflow-hidden">
                        <MiniPreview layout={option.layout} />
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
