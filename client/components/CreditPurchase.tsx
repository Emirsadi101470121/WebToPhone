import { useState } from "react";
import { Coins, Loader2, Zap, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const packs = [
  { id: "pack_50", credits: 50, price: "$5", icon: Coins, popular: false },
  { id: "pack_200", credits: 200, price: "$15", icon: Star, popular: true },
  { id: "pack_600", credits: 600, price: "$40", icon: Crown, popular: false },
];

interface Props {
  userId: string;
  onPurchase: () => void;
}

export default function CreditPurchase({ userId, onPurchase }: Props) {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId);
    try {
      const res = await fetch("/api/billing/purchase-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, packId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        onPurchase();
      } else {
        toast.error(data.error || "Purchase failed");
      }
    } catch {
      toast.error("Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {packs.map((pack) => {
        const Icon = pack.icon;
        return (
          <div
            key={pack.id}
            className={cn(
              "relative flex flex-col items-center rounded-xl border p-4 text-center",
              pack.popular ? "border-violet-500/40 bg-violet-500/5" : "border-white/5"
            )}
          >
            {pack.popular && (
              <span className="absolute -top-2.5 rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white">
                POPULAR
              </span>
            )}
            <Icon className="h-5 w-5 text-violet-400" />
            <p className="mt-2 text-lg font-bold">{pack.credits}</p>
            <p className="text-xs text-muted-foreground">credits</p>
            <Button
              size="sm"
              onClick={() => handlePurchase(pack.id)}
              disabled={purchasing !== null}
              className="mt-3 w-full gap-1 bg-primary text-xs hover:bg-primary/90"
            >
              {purchasing === pack.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Zap className="h-3 w-3" />
              )}
              {pack.price}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
