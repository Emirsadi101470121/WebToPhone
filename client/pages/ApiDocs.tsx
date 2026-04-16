import { ArrowLeft, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const endpoints = [
  {
    method: "POST",
    path: "/api/analyze",
    description: "Analyze a web application's structure, pages, features, and user flows.",
    body: { projectId: "uuid", sourceType: "github|zip|url", sourceUrl: "https://...", userId: "uuid", modelTier: "haiku|sonnet|opus" },
    response: { success: true, analysis: { pages: [], features: [], userFlows: [] } },
  },
  {
    method: "POST",
    path: "/api/reimagine",
    description: "Reimagine the web app as a mobile-first experience with multiple design options.",
    body: { projectId: "uuid", analysis: {}, preferences: {}, userId: "uuid", modelTier: "haiku|sonnet|opus" },
    response: { success: true, designs: [{ pageName: "string", options: [] }] },
  },
  {
    method: "POST",
    path: "/api/convert",
    description: "Generate production React Native code from approved mobile designs.",
    body: { projectId: "uuid", selectedDesigns: {}, preferences: {}, userId: "uuid", modelTier: "haiku|sonnet|opus" },
    response: { success: true, files: [{ path: "string", type: "string", content: "string" }] },
  },
  {
    method: "POST",
    path: "/api/export",
    description: "Export a project's generated files as downloadable content.",
    body: { projectId: "uuid", userId: "uuid" },
    response: { success: true, files: {}, projectName: "string" },
  },
  {
    method: "GET",
    path: "/api/billing/plans",
    description: "Get available subscription plans and credit packs.",
    body: null,
    response: { plans: [], creditPacks: [] },
  },
  {
    method: "POST",
    path: "/api/billing/purchase-credits",
    description: "Purchase a credit pack. Credits are added immediately.",
    body: { userId: "uuid", packId: "pack_50|pack_200|pack_600" },
    response: { success: true, creditsAdded: 50, newBalance: 150 },
  },
];

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied"); }}
        className="absolute right-2 top-2 rounded bg-white/5 p-1 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function ApiDocs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="text-2xl font-bold">API Documentation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use these endpoints programmatically to integrate Morphic into your workflow.
          All endpoints require a valid userId for authentication and credit tracking.
        </p>

        <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="text-xs font-medium text-violet-400">Base URL</p>
          <CodeBlock code={window.location.origin} />
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Credit Costs (per model tier)</p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
            <div className="font-medium">Operation</div>
            <div className="text-emerald-400">Haiku</div>
            <div className="text-violet-400">Sonnet</div>
            <div className="text-amber-400">Opus</div>
            <div>Analyze</div><div>3</div><div>5</div><div>15</div>
            <div>Reimagine</div><div>5</div><div>10</div><div>30</div>
            <div>Convert</div><div>8</div><div>15</div><div>45</div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {endpoints.map((ep) => (
            <div key={ep.path} className="rounded-2xl border border-white/5 bg-card p-6">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${ep.method === "GET" ? "bg-emerald-500/10 text-emerald-400" : "bg-violet-500/10 text-violet-400"}`}>
                  {ep.method}
                </span>
                <code className="text-sm font-medium">{ep.path}</code>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{ep.description}</p>

              {ep.body && (
                <div className="mt-4">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Request Body</p>
                  <CodeBlock code={JSON.stringify(ep.body, null, 2)} />
                </div>
              )}

              <div className="mt-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Response</p>
                <CodeBlock code={JSON.stringify(ep.response, null, 2)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
