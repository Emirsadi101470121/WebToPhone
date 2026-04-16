import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export const handleBuilderAI: RequestHandler = async (req, res) => {
  try {
    const { prompt, tree, selectedNodeId, userId } = req.body;

    if (!prompt || !tree) {
      res.status(400).json({ error: "Missing prompt or tree" });
      return;
    }

    if (!CLAUDE_API_KEY) {
      res.status(500).json({ error: "AI not configured" });
      return;
    }

    // Deduct 1 credit
    if (userId) {
      const supabase = getSupabase();
      const { data: credits } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (!credits || credits.balance < 1) {
        res.status(402).json({ error: "Not enough credits. Each AI edit costs 1 credit." });
        return;
      }

      await supabase
        .from("credits")
        .update({ balance: credits.balance - 1 })
        .eq("user_id", userId);
    }

    const systemPrompt = `You are a mobile app design assistant inside a visual builder. The user has a component tree (JSON) representing a mobile app layout. Each node has: id, type (View/Text/ScrollView/Image), label, props (including style), and optional children.

Your job is to modify the tree based on the user's natural language request. Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{"tree": <the modified tree array>, "message": "<brief description of what you changed>"}

Rules:
- Preserve all existing node IDs when modifying existing nodes
- When adding new nodes, generate unique IDs like "ai-${Date.now()}-0", "ai-${Date.now()}-1", etc.
- Only modify what the user asked for, keep everything else unchanged
- Style values use React Native conventions (numbers for px, strings for colors)
- Common types: View (container), Text (text), ScrollView (scrollable), Image
- If the user references "the selected element" or "this", focus on node id "${selectedNodeId || "none"}"
- Return the COMPLETE tree array, not just changed nodes
- Return ONLY the JSON object, nothing else`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Current tree:\n${JSON.stringify(tree, null, 2)}\n\nRequest: "${prompt}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", err);
      res.status(500).json({ error: "AI service error. Please try again." });
      return;
    }

    const data = await response.json();
    const text = data.content
      ?.filter((b: any) => b.type === "text")
      ?.map((b: any) => b.text)
      ?.join("") || "";

    let parsed: any;
    try {
      // Handle cases where AI wraps in markdown code blocks
      const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      res.json({ message: "I understood your request but had trouble applying the changes. Could you try rephrasing?" });
      return;
    }

    if (parsed.tree) {
      if (userId) {
        const supabase = getSupabase();
        await supabase.from("logs").insert({
          user_id: userId,
          action: "builder_ai_edit",
          level: "info",
          message: `AI edit: "${prompt}"`,
        });
      }

      res.json({ tree: parsed.tree, message: parsed.message || "Design updated!" });
    } else {
      res.json({ message: parsed.message || "No changes were needed." });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    res.status(500).json({ error: message });
  }
};
