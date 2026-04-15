import { Upload, Search, Paintbrush, Smartphone, ArrowDown } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Web App",
    description:
      "Connect your GitHub repo, upload a ZIP file, or paste a live URL. Morphic ingests your entire codebase instantly.",
  },
  {
    icon: Search,
    title: "AI Analyzes Everything",
    description:
      "Claude AI maps your architecture, components, routing, state management, APIs, and styling system.",
  },
  {
    icon: Paintbrush,
    title: "Review & Improve UI",
    description:
      "AI suggests mobile-optimized layouts, asks about your design preferences, and offers multiple UI directions to choose from.",
  },
  {
    icon: Smartphone,
    title: "Export Mobile App",
    description:
      "Get a production-ready React Native app with proper navigation, native components, and clean architecture. Edit visually before exporting.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/4 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet-600/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
            Process
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From Web to Mobile in 4 Steps
          </h2>
          <p className="mt-4 text-muted-foreground">
            No mobile development expertise needed. Our AI handles the heavy lifting.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={step.title}>
                <div className="flex gap-6 rounded-2xl border border-white/5 bg-card p-6 transition-all hover:border-violet-500/20">
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                      <step.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-violet-400">
                      Step {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex justify-start pl-9">
                    <ArrowDown className="h-5 w-5 text-violet-500/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
