import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const plans = [
  { id: "free", name: "Free", price: "$0", period: "forever", features: ["5 projects", "Haiku & Sonnet", "100 starter credits"] },
  { id: "pro", name: "Pro", price: "$19", period: "/month", features: ["Unlimited projects", "All models (Opus)", "500 credits/mo", "Priority support"] },
  { id: "premium", name: "Premium", price: "$49", period: "/month", features: ["Everything in Pro", "1500 credits/mo", "White-label exports", "Dedicated support"] },
];

interface Props {
  userId: string;
  currentPlan: string;
  onUpgrade: () => void;
}

export default function PlanUpgrade({ userId, currentPlan, onUpgrade }: Props) {
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    setUpgrading(planId);
    try {
      const res = await fetch("/api/billing/upgrade-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        onUpgrade();
      } else {
        toast.error(data.error || "Upgrade failed");
      }
    } catch {
      toast.error("Upgrade failed");
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlan;
        return (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col rounded-xl border p-4",
              isCurrent ? "border-violet-500/40 bg-violet-500/5" : "border-white/5"
            )}
          >
            <p className="text-sm font-bold">{plan.name}</p>
            <p className="mt-1">
              <span className="text-xl font-bold">{plan.price}</span>
              <span className="text-xs text-muted-foreground">{plan.period}</span>
            </p>
            <ul className="mt-3 flex-1 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-violet-400" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              variant={isCurrent ? "outline" : "default"}
              onClick={() => handleUpgrade(plan.id)}
              disabled={isCurrent || upgrading !== null}
              className={cn("mt-3 w-full text-xs", !isCurrent && "bg-primary hover:bg-primary/90")}
            >
              {upgrading === plan.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isCurrent ? (
                "Current"
              ) : (
                "Upgrade"
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
