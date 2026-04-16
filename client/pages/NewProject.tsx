import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Github, Globe, FileArchive, ArrowLeft, ArrowRight, Loader2, ShoppingCart, LayoutDashboard, Users, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import GithubRepoPicker from "@/components/GithubRepoPicker";
import ZipUploader from "@/components/ZipUploader";

type SourceType = "github" | "zip" | "url";

const templates = [
  {
    id: "ecommerce",
    icon: ShoppingCart,
    name: "E-Commerce App",
    description: "Product catalog, cart, checkout, and order tracking",
    demoUrl: "https://demo-ecommerce.example.com",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    name: "Admin Dashboard",
    description: "Analytics, charts, user management, and settings",
    demoUrl: "https://demo-dashboard.example.com",
  },
  {
    id: "social",
    icon: Users,
    name: "Social Platform",
    description: "Feed, profiles, messaging, and notifications",
    demoUrl: "https://demo-social.example.com",
  },
  {
    id: "blank",
    icon: Smartphone,
    name: "Blank Project",
    description: "Start from scratch with your own source",
    demoUrl: "",
  },
];

const sources = [
  {
    type: "github" as SourceType,
    icon: Github,
    title: "GitHub Repository",
    desc: "Import from your own repos via OAuth",
  },
  {
    type: "zip" as SourceType,
    icon: FileArchive,
    title: "Upload ZIP",
    desc: "Upload your project as a ZIP archive",
  },
  {
    type: "url" as SourceType,
    icon: Globe,
    title: "Website URL",
    desc: "Analyze and convert a live website",
  },
];

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploadedStorageKey, setUploadedStorageKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl && templateId !== "blank") {
      setName(tpl.name);
      setDescription(tpl.description);
      setSourceType("url");
      setSourceUrl(tpl.demoUrl);
    }
    setStep(1);
  };

  const canProceedStep2 =
    (sourceType === "zip" && uploadedStorageKey) || (sourceType !== "zip" && sourceUrl.trim());

  const handleCreate = async () => {
    if (!name.trim() || !sourceType || !user) return;
    setError("");
    setSubmitting(true);

    try {
      const { data, error: dbError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          source_type: sourceType,
          source_url: sourceUrl.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (dbError) {
        setError("Failed to create project. Please try again.");
        return;
      }

      navigate(`/project/${data.id}`);
    } catch {
      setError("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold">New Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your web-to-mobile conversion
        </p>

        <div className="mt-4 flex gap-2">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                s <= step ? "bg-violet-500" : "bg-muted"
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="mt-8 space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium">Choose a Template</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                      selectedTemplate === tpl.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-white/5 bg-card hover:border-violet-500/20"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <tpl.icon className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{tpl.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{tpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-8 space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-muted/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="My Web App"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/10 bg-muted/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="Brief description of your web app"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium">Import Method</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {sources.map((src) => (
                  <button
                    key={src.type}
                    onClick={() => {
                      setSourceType(src.type);
                      setSourceUrl("");
                    }}
                    className={cn(
                      "flex flex-col items-center rounded-xl border p-5 text-center transition-all",
                      sourceType === src.type
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-white/5 bg-card hover:border-violet-500/20"
                    )}
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                      <src.icon className="h-5 w-5 text-violet-400" />
                    </div>
                    <h3 className="text-sm font-medium">{src.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{src.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim() || !sourceType}
                className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 space-y-6">
            {sourceType === "github" && (
              <div>
                <label className="mb-3 block text-sm font-medium">Select Repository</label>
                <GithubRepoPicker
                  selected={sourceUrl}
                  onSelect={(url) => setSourceUrl(url)}
                />
                {sourceUrl && (
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    Selected: {sourceUrl}
                  </p>
                )}
              </div>
            )}

            {sourceType === "zip" && (
              <div>
                <label className="mb-3 block text-sm font-medium">Upload ZIP File</label>
                <ZipUploader
                  projectName={name}
                  onUploadComplete={(key) => setUploadedStorageKey(key)}
                />
              </div>
            )}

            {sourceType === "url" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Website URL</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-muted/50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="https://example.com"
                />
              </div>
            )}

            <div className="rounded-xl border border-white/5 bg-card p-4">
              <h3 className="text-sm font-medium">Project Summary</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="font-medium capitalize">{sourceType}</dd>
                </div>
                {sourceUrl && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Repository</dt>
                    <dd className="max-w-[200px] truncate font-medium text-violet-400">
                      {sourceUrl.replace("https://github.com/", "")}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Credits Cost</dt>
                  <dd className="font-medium text-violet-400">~10 credits</dd>
                </div>
              </dl>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(selectedTemplate === "blank" ? 1 : 0)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={submitting || !canProceedStep2}
                className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create & Start Analysis"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
