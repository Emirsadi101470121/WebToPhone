import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase config missing");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

const CREDIT_COSTS: Record<string, number> = {
  analyze: 5,
  reimagine: 10,
  convert: 15,
};

export async function deductCredits(
  userId: string,
  operation: string,
  projectId?: string
): Promise<{ success: boolean; remaining: number; error?: string }> {
  const cost = CREDIT_COSTS[operation] ?? 5;
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
      description: `${operation} operation`,
      metadata: { operation, project_id: projectId },
    });

    await supabase.from("logs").insert({
      user_id: userId,
      project_id: projectId,
      action: "ai_query",
      level: "info",
      message: `${operation}: ${cost} credits deducted`,
    });

    return { success: true, remaining: newBalance };
  } catch {
    return { success: false, remaining: 0, error: "Credit deduction failed" };
  }
}

export function getCreditCost(operation: string): number {
  return CREDIT_COSTS[operation] ?? 5;
}
