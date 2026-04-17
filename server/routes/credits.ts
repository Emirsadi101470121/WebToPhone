import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase config missing");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Model tiers
export const AI_MODELS = {
  haiku: {
    id: "claude-3-5-haiku-20241022",
    label: "Haiku (Fast)",
    description: "Fastest responses, good for simple tasks",
    multiplier: 0.5,
  },
  sonnet: {
    id: "claude-3-5-sonnet-20241022",
    label: "Sonnet (Balanced)",
    description: "Best balance of quality and speed",
    multiplier: 1,
  },
  opus: {
    id: "claude-opus-4-20250514",
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
  const supabase = getSupabaseAdmin();

  try {
    const { data: credits } = await supabase
      .from("credits")
      .select("balance")
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
        lifetime_used: credits.balance - newBalance,
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
