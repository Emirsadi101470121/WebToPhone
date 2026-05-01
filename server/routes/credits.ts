import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- Admin allow-list (unlimited credits for these accounts) ---
const ADMIN_EMAILS = (process.env.ADMIN_USER_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

// Cache email lookups so we don't hit auth.admin on every request.
const emailCache = new Map<string, string>();

async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  if (ADMIN_USER_IDS.includes(userId)) return true;
  if (ADMIN_EMAILS.length === 0) return false;
  let email = emailCache.get(userId);
  if (!email) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase.auth.admin.getUserById(userId);
      email = (data?.user?.email || "").toLowerCase();
      if (email) emailCache.set(userId, email);
    } catch {
      return false;
    }
  }
  return !!email && ADMIN_EMAILS.includes(email);
}

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase config missing");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Model tiers
export const AI_MODELS = {
  haiku: {
    id: "claude-haiku-4-5",
    label: "Haiku (Fast)",
    description: "Fastest responses, good for simple tasks",
    multiplier: 0.5,
  },
  sonnet: {
    id: "claude-sonnet-4-5",
    label: "Sonnet (Balanced)",
    description: "Best balance of quality and speed",
    multiplier: 1,
  },
  opus: {
    id: "claude-opus-4-5",
    label: "Opus (Premium)",
    description: "Highest quality, slower and more expensive",
    multiplier: 3,
  },
} as const;

export type ModelTier = keyof typeof AI_MODELS;

// Base costs per operation (multiplied by model tier)
const BASE_COSTS: Record<string, number> = {
  analyze: 5,
  reimagine: 10,
  convert: 15,
};

export function getCreditCost(operation: string, modelTier: ModelTier = "sonnet"): number {
  const base = BASE_COSTS[operation] ?? 5;
  const multiplier = AI_MODELS[modelTier]?.multiplier ?? 1;
  return Math.ceil(base * multiplier);
}

export function getModelId(tier: ModelTier): string {
  return AI_MODELS[tier]?.id ?? AI_MODELS.sonnet.id;
}

export async function deductCredits(
  userId: string,
  operation: string,
  projectId?: string,
  modelTier: ModelTier = "sonnet"
): Promise<{ success: boolean; remaining: number; cost: number; error?: string }> {
  const cost = getCreditCost(operation, modelTier);

  // Admin allow-list bypass — unlimited usage for listed accounts.
  if (await isAdminUser(userId)) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("logs").insert({
        user_id: userId,
        project_id: projectId,
        action: "ai_query",
        level: "info",
        message: `${operation} [${modelTier}]: admin (no charge)`,
      });
    } catch { /* logging best effort */ }
    return { success: true, remaining: 999999, cost: 0 };
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data: credits } = await supabase
      .from("credits")
      .select("balance, lifetime_used")
      .eq("user_id", userId)
      .single();

    if (!credits || credits.balance < cost) {
      return {
        success: false,
        remaining: credits?.balance ?? 0,
        cost,
        error: `Not enough credits. Need ${cost}, have ${credits?.balance ?? 0}.`,
      };
    }

    const newBalance = credits.balance - cost;

    await supabase
      .from("credits")
      .update({
        balance: newBalance,
        lifetime_used: (credits.lifetime_used ?? 0) + cost,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    await supabase.from("transactions").insert({
      user_id: userId,
      type: "usage",
      amount: 0,
      credits_amount: -cost,
      description: `${operation} (${modelTier})`,
      metadata: { operation, project_id: projectId, model_tier: modelTier },
    });

    await supabase.from("logs").insert({
      user_id: userId,
      project_id: projectId,
      action: "ai_query",
      level: "info",
      message: `${operation} [${modelTier}]: ${cost} credits deducted`,
    });

    return { success: true, remaining: newBalance, cost };
  } catch {
    return { success: false, remaining: 0, cost, error: "Credit deduction failed" };
  }
}

export async function refundCredits(
  userId: string,
  cost: number,
  operation: string,
  projectId?: string,
): Promise<void> {
  if (!userId || cost <= 0) return;
  // Admins were never charged.
  if (await isAdminUser(userId)) return;
  try {
    const supabase = getSupabaseAdmin();
    const { data: credits } = await supabase
      .from("credits")
      .select("balance, lifetime_used")
      .eq("user_id", userId)
      .single();
    if (!credits) return;

    await supabase
      .from("credits")
      .update({
        balance: credits.balance + cost,
        lifetime_used: Math.max(0, (credits.lifetime_used ?? 0) - cost),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    await supabase.from("transactions").insert({
      user_id: userId,
      type: "refund",
      amount: 0,
      credits_amount: cost,
      description: `${operation} refund (failed)`,
      metadata: { operation, project_id: projectId },
    });
  } catch {
    // Refund best-effort
  }
}
