import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { sanitizeString } from "../lib/sanitize";

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const CREDIT_PACKS = [
  { id: "pack_50", credits: 50, price: 500, label: "$5 - 50 Credits" },
  { id: "pack_200", credits: 200, price: 1500, label: "$15 - 200 Credits" },
  { id: "pack_600", credits: 600, price: 4000, label: "$40 - 600 Credits" },
];

const PLANS = [
  { id: "free", name: "Free", price: 0, features: ["5 projects", "Haiku & Sonnet models", "100 starter credits", "Community support"] },
  { id: "pro", name: "Pro", price: 1900, features: ["Unlimited projects", "All AI models (incl. Opus)", "500 credits/month", "Priority support", "Team collaboration"] },
  { id: "premium", name: "Premium", price: 4900, features: ["Everything in Pro", "1500 credits/month", "Custom integrations", "Dedicated support", "White-label exports"] },
];

export const handleGetPlans: RequestHandler = (_req, res) => {
  res.json({ plans: PLANS, creditPacks: CREDIT_PACKS });
};

export const handlePurchaseCredits: RequestHandler = async (req, res) => {
  const userId = sanitizeString(req.body.userId);
  const packId = sanitizeString(req.body.packId);

  if (!userId || !packId) {
    res.status(400).json({ error: "Missing userId or packId" });
    return;
  }

  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    res.status(400).json({ error: "Invalid credit pack" });
    return;
  }

  // In production, this would create a Stripe Checkout session
  // For now, simulate the purchase by directly adding credits
  const supabase = getSupabase();

  try {
    const { data: credits } = await supabase
      .from("credits")
      .select("balance, lifetime_purchased")
      .eq("user_id", userId)
      .single();

    if (!credits) {
      res.status(404).json({ error: "User credits not found" });
      return;
    }

    await supabase
      .from("credits")
      .update({
        balance: credits.balance + pack.credits,
        lifetime_purchased: credits.lifetime_purchased + pack.credits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    await supabase.from("transactions").insert({
      user_id: userId,
      type: "purchase",
      amount: pack.price,
      credits_amount: pack.credits,
      description: `Purchased ${pack.credits} credits`,
      metadata: { pack_id: packId },
    });

    res.json({
      success: true,
      creditsAdded: pack.credits,
      newBalance: credits.balance + pack.credits,
      message: `${pack.credits} credits added to your account`,
    });
  } catch {
    res.status(500).json({ error: "Purchase failed" });
  }
};

export const handleUpgradePlan: RequestHandler = async (req, res) => {
  const userId = sanitizeString(req.body.userId);
  const planId = sanitizeString(req.body.planId);

  if (!userId || !planId) {
    res.status(400).json({ error: "Missing userId or planId" });
    return;
  }

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const supabase = getSupabase();

  try {
    await supabase
      .from("subscriptions")
      .update({ plan: planId, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    await supabase
      .from("profiles")
      .update({ plan: planId, updated_at: new Date().toISOString() })
      .eq("id", userId);

    // Grant monthly credits for paid plans
    const monthlyCredits = planId === "pro" ? 500 : planId === "premium" ? 1500 : 0;
    if (monthlyCredits > 0) {
      const { data: credits } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      await supabase
        .from("credits")
        .update({
          balance: (credits?.balance ?? 0) + monthlyCredits,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    res.json({ success: true, plan: planId, message: `Upgraded to ${plan.name}` });
  } catch {
    res.status(500).json({ error: "Upgrade failed" });
  }
};
