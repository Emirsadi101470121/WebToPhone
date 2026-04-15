import { Link } from "react-router-dom";
import { ArrowRight, Upload, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-400">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Web to Mobile Conversion
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Transform Your Web App Into a{" "}
            <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              Mobile Experience
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Upload your web application, let AI analyze and improve your UI/UX, then export a production-ready React Native mobile app. No mobile development experience required.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 bg-primary px-8 hover:bg-primary/90">
                Start Converting
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/#how-it-works">
              <Button variant="outline" size="lg" className="gap-2 px-8">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-20 max-w-4xl">
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-violet-600/20 via-violet-500/10 to-violet-600/20 blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-card p-2 shadow-2xl">
            <div className="flex items-center gap-1.5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-muted-foreground">morphic.app/convert</span>
            </div>
            <div className="rounded-xl bg-muted/50 p-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <StepCard
                  icon={<Upload className="h-6 w-6 text-violet-400" />}
                  title="Upload"
                  description="GitHub, ZIP, or URL"
                  step={1}
                />
                <StepCard
                  icon={<Sparkles className="h-6 w-6 text-violet-400" />}
                  title="AI Enhances"
                  description="Analyze & improve UI"
                  step={2}
                />
                <StepCard
                  icon={<Smartphone className="h-6 w-6 text-violet-400" />}
                  title="Export Mobile"
                  description="React Native ready"
                  step={3}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  icon,
  title,
  description,
  step,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  step: number;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/5 bg-background p-6 text-center transition-all hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5">
      <div className="mb-1 text-xs font-medium text-violet-400">Step {step}</div>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
