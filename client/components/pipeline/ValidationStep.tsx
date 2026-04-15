import { useState } from "react";
import { Check, Plus, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Page {
  name: string;
  type: string;
  description: string;
}

interface Props {
  pages: Page[];
  features: string[];
  userFlows: { name: string; steps: string[] }[];
  onConfirm: (data: {
    pages: Page[];
    features: string[];
    appDescription: string;
  }) => void;
}

export default function ValidationStep({ pages, features, userFlows, onConfirm }: Props) {
  const [editedPages, setEditedPages] = useState<Page[]>(pages);
  const [editedFeatures, setEditedFeatures] = useState<string[]>(features);
  const [appDescription, setAppDescription] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newPageName, setNewPageName] = useState("");

  const removePage = (index: number) => {
    setEditedPages((prev) => prev.filter((_, i) => i !== index));
  };

  const addPage = () => {
    if (!newPageName.trim()) return;
    setEditedPages((prev) => [...prev, { name: newPageName.trim(), type: "other", description: "" }]);
    setNewPageName("");
  };

  const removeFeature = (index: number) => {
    setEditedFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setEditedFeatures((prev) => [...prev, newFeature.trim()]);
    setNewFeature("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-500/20 bg-card p-6">
        <h3 className="text-lg font-semibold">Describe Your App</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Help our AI understand your vision in one sentence
        </p>
        <input
          type="text"
          value={appDescription}
          onChange={(e) => setAppDescription(e.target.value)}
          placeholder="e.g. A project management tool for remote teams with real-time collaboration"
          className="mt-3 w-full rounded-lg border border-white/10 bg-muted/50 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Detected Pages</h3>
          <span className="text-xs text-muted-foreground">{editedPages.length} pages</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm, remove, or add missing pages
        </p>

        <div className="mt-4 space-y-2">
          {editedPages.map((page, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-muted/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Check className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{page.name}</p>
                  {page.description && (
                    <p className="text-xs text-muted-foreground">{page.description}</p>
                  )}
                </div>
              </div>
              <button onClick={() => removePage(i)} className="text-muted-foreground hover:text-red-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPage()}
            placeholder="Add missing page..."
            className="flex-1 rounded-lg border border-white/10 bg-muted/50 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <Button size="sm" onClick={addPage} variant="outline" className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Detected Features</h3>
          <span className="text-xs text-muted-foreground">{editedFeatures.length} features</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {editedFeatures.map((feature, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-muted/50 px-3 py-1 text-xs"
            >
              {feature}
              <button onClick={() => removeFeature(i)} className="text-muted-foreground hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFeature()}
            placeholder="Add missing feature..."
            className="flex-1 rounded-lg border border-white/10 bg-muted/50 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <Button size="sm" onClick={addFeature} variant="outline" className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      {userFlows.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-card p-6">
          <h3 className="font-semibold">Detected User Flows</h3>
          <div className="mt-4 space-y-3">
            {userFlows.map((flow, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-muted/30 p-4">
                <p className="text-sm font-medium">{flow.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {flow.steps.map((step, j) => (
                    <span key={j} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {j > 0 && <span className="text-violet-500">→</span>}
                      <span className="rounded bg-violet-500/10 px-2 py-0.5 text-violet-300">{step}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={() => onConfirm({ pages: editedPages, features: editedFeatures, appDescription })}
        disabled={!appDescription.trim()}
        className="w-full gap-2 bg-primary hover:bg-primary/90"
      >
        Confirm & Continue to Design Interview
      </Button>
    </div>
  );
}
