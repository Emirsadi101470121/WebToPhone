import { useState, useEffect } from "react";
import { X, ArrowRight, Sparkles, FolderPlus, Wand2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to Morphic",
    description: "We help you convert web applications into beautiful, native mobile experiences using AI.",
  },
  {
    icon: FolderPlus,
    title: "Create a Project",
    description: "Import from GitHub, upload a ZIP, or paste a URL. Our AI will analyze your web app automatically.",
  },
  {
    icon: Wand2,
    title: "AI-Powered Design",
    description: "Answer a few design questions and our AI reimagines your web UI for mobile-first interactions.",
  },
  {
    icon: Download,
    title: "Export & Build",
    description: "Review in the visual builder, then export production-ready React Native code as a ZIP.",
  },
];

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("morphic_onboarding_done");
    if (!seen) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("morphic_onboarding_done", "true");
  };

  if (!visible) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-card p-8 shadow-2xl">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
            <Icon className="h-8 w-8 text-violet-400" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-xl font-bold">{current.title}</h2>
        <p className="mt-3 text-center text-sm text-muted-foreground leading-relaxed">
          {current.description}
        </p>

        <div className="mt-6 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-violet-500" : "w-1.5 bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {step < steps.length - 1 ? (
            <>
              <Button variant="ghost" className="flex-1" onClick={dismiss}>
                Skip
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-primary hover:bg-primary/90"
                onClick={() => setStep(step + 1)}
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={dismiss}
            >
              Get Started
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
