import {
  Brain,
  Code2,
  Eye,
  GripVertical,
  Layers,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Code Analysis",
    description:
      "Claude AI deeply understands your codebase architecture, components, routing, state management, and APIs.",
  },
  {
    icon: Eye,
    title: "UI/UX Intelligence",
    description:
      "Detects UX issues, layout problems, and mobile responsiveness gaps before conversion even begins.",
  },
  {
    icon: Smartphone,
    title: "React Native Export",
    description:
      "Generates production-ready React Native code with proper navigation, components, and native styling.",
  },
  {
    icon: GripVertical,
    title: "Visual Builder",
    description:
      "Drag-and-drop editor with real-time mobile preview. Edit real React Native code visually.",
  },
  {
    icon: Layers,
    title: "Smart Conversion",
    description:
      "Automatically maps web patterns to mobile: div to View, CSS to StyleSheet, onClick to onPress.",
  },
  {
    icon: Code2,
    title: "Multiple Import Methods",
    description:
      "Upload via GitHub repository, ZIP file, or live website URL. We handle the rest.",
  },
  {
    icon: Zap,
    title: "AI Design Suggestions",
    description:
      "Get multiple UI improvement options tailored to your target audience and design preferences.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Row-level security, encrypted transactions, rate limiting, and zero API key exposure.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
            Capabilities
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Go Mobile
          </h2>
          <p className="mt-4 text-muted-foreground">
            A complete platform that handles analysis, improvement, conversion, and editing in one seamless workflow.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/5 bg-card p-6 transition-all hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 transition-colors group-hover:bg-violet-500/20">
                <feature.icon className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
