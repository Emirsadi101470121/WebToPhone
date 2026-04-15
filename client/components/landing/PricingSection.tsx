import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try Morphic with basic conversions",
    features: [
      "2 conversions per month",
      "Basic AI analysis",
      "Community support",
      "Standard processing",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For developers and small teams",
    features: [
      "25 conversions per month",
      "Advanced AI suggestions",
      "Visual builder access",
      "Priority processing",
      "Export to Expo & RN CLI",
      "Email support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "$149",
    period: "per month",
    description: "For agencies and enterprises",
    features: [
      "Unlimited conversions",
      "Priority AI processing",
      "White-label export",
      "Custom design system import",
      "API access",
      "Dedicated support",
      "Team collaboration",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Plans That Scale With You
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free, upgrade when you need more power. All plans include AI credits.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8 transition-all",
                plan.highlighted
                  ? "border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-transparent shadow-lg shadow-violet-500/10"
                  : "border-white/5 bg-card hover:border-violet-500/20"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/dashboard" className="mt-8">
                <Button
                  className={cn(
                    "w-full",
                    plan.highlighted
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Need more? Purchase additional AI credits anytime. Enterprise custom plans available.
        </p>
      </div>
    </section>
  );
}
