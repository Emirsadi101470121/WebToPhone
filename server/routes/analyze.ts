import { RequestHandler } from "express";
import { deductCredits, refundCredits, getCreditCost, getModelId, type ModelTier } from "./credits";
import { sanitizeString, sanitizeUrl, isValidUUID } from "../lib/sanitize";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

function tryRepairJson(input: string): string {
  // Repair truncated JSON: walk the string, drop the trailing partial token,
  // then balance any open braces/brackets/strings.
  let s = input.trim();

  // Step 1: walk char-by-char to find the last "safe" position (end of a complete value/struct).
  let openCurly = 0, openSquare = 0, inStr = false, esc = false;
  let lastSafe = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; if (!inStr) lastSafe = i; continue; }
    if (inStr) continue;
    if (c === "{") openCurly++;
    else if (c === "}") { openCurly--; lastSafe = i; }
    else if (c === "[") openSquare++;
    else if (c === "]") { openSquare--; lastSafe = i; }
    else if (c === "," || c === ":") { /* boundaries, ignored */ }
    else if (/[0-9truefalsn]/i.test(c)) lastSafe = i;
  }

  // If we ended inside a partial token/string, cut back to the last safe boundary.
  if (inStr || lastSafe < s.length - 1) {
    s = s.slice(0, lastSafe + 1);
  }

  // Drop trailing commas before closers.
  s = s.replace(/,(\s*)$/g, "");

  // Recount balances on trimmed string.
  openCurly = 0; openSquare = 0; inStr = false; esc = false;
  for (const c of s) {
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") openCurly++;
    else if (c === "}") openCurly--;
    else if (c === "[") openSquare++;
    else if (c === "]") openSquare--;
  }
  if (inStr) s += '"';
  // Strip dangling key like `,"foo":` or `"foo":` at the end.
  s = s.replace(/,?\s*"[^"]*"\s*:\s*$/g, "");
  // Strip dangling comma again post-cleanup.
  s = s.replace(/,(\s*)$/g, "");
  while (openSquare-- > 0) s += "]";
  while (openCurly-- > 0) s += "}";
  return s;
}

function extractJson(raw: string): any | null {
  if (!raw) return null;
  let candidate = raw.trim();

  // Strip closed code fences if present.
  const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    candidate = fenceMatch[1].trim();
  } else {
    // Strip a leading unclosed fence (truncated response).
    candidate = candidate.replace(/^```(?:json)?\s*/i, "");
    // Strip a trailing unclosed fence start.
    candidate = candidate.replace(/```\s*$/i, "");
  }

  try { return JSON.parse(candidate); } catch {}

  const start = candidate.indexOf("{");
  if (start >= 0) candidate = candidate.slice(start);

  try { return JSON.parse(candidate); } catch {}

  // Truncated response — try to repair.
  try { return JSON.parse(tryRepairJson(candidate)); } catch {}
  return null;
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  modelTier: ModelTier = "sonnet",
  maxTokens: number = 4096,
): Promise<string> {
  if (!CLAUDE_API_KEY) {
    throw new Error("CLAUDE_API_KEY not configured");
  }

  const modelId = getModelId(modelTier);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`[claude] ${response.status} (${modelId}):`, err);
    throw new Error(`Claude API error (${response.status}): ${err.slice(0, 500)}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

// Default model per stage (can be overridden by user)
const DEFAULT_MODELS: Record<string, ModelTier> = {
  analyze: "haiku",
  reimagine: "sonnet",
  convert: "sonnet",
};

function resolveModel(body: any, stage: string): ModelTier {
  const tier = body.modelTier as string | undefined;
  if (tier === "haiku" || tier === "sonnet" || tier === "opus") return tier;
  return DEFAULT_MODELS[stage] ?? "sonnet";
}

export const handleAnalyze: RequestHandler = async (req, res) => {
  const userId = req.body.userId ? sanitizeString(req.body.userId) : undefined;
  const modelTier = resolveModel(req.body, "analyze");
  const projectIdForRefund = sanitizeString(req.body.projectId);
  let creditsCharged = 0;
  try {
    const projectId = projectIdForRefund;
    const sourceType = sanitizeString(req.body.sourceType);
    const sourceUrl = req.body.sourceUrl ? sanitizeUrl(req.body.sourceUrl) : "";
    const category = req.body.category ? sanitizeString(req.body.category) : "";

    if (!projectId || !sourceType) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (userId) {
      const creditResult = await deductCredits(userId, "analyze", projectId, modelTier);
      if (!creditResult.success) {
        res.status(402).json({ error: creditResult.error, creditsRemaining: creditResult.remaining });
        return;
      }
      creditsCharged = creditResult.cost;
    }

    if (!CLAUDE_API_KEY) {
      res.json({
        success: true,
        modelUsed: modelTier,
        analysis: {
          pages: [
            { name: "Login", type: "auth", description: "User authentication with email/password" },
            { name: "Dashboard", type: "main", description: "Overview with stats, charts, recent activity" },
            { name: "Settings", type: "settings", description: "User profile and app configuration" },
            { name: "Profile", type: "profile", description: "User profile details and avatar" },
          ],
          features: [
            "User authentication (login/signup)",
            "Dashboard with analytics",
            "User profile management",
            "Settings & preferences",
            "Data visualization",
            "Notifications system",
          ],
          userFlows: [
            { name: "Onboarding", steps: ["Signup", "Verify Email", "Complete Profile", "Dashboard"] },
            { name: "Core Loop", steps: ["Login", "Dashboard", "View Details", "Take Action"] },
          ],
          components: 24,
          routes: 8,
          apis: 5,
          stateManagement: "React Context",
          stylingSystem: "Tailwind CSS",
        },
      });
      return;
    }

    const systemPrompt = `You are Morphic's AI Analyzer. You deeply analyze web applications and return structured JSON. You must identify every page, feature, and user flow. Return valid JSON only, no markdown.`;

    const userPrompt = `Analyze this ${sourceType} web application${sourceUrl ? ` at ${sourceUrl}` : ""}. Project ID: ${projectId}.${category ? `\nApp category context (use this to inform the analysis without copying any template): ${category}.` : ""}

Return JSON:
{
  "analysis": {
    "pages": [{ "name": "string", "type": "auth|main|settings|profile|detail|list|form|other", "description": "what this page does" }],
    "features": ["list of detected features as strings"],
    "userFlows": [{ "name": "flow name", "steps": ["step1", "step2"] }],
    "components": number,
    "routes": number,
    "apis": number,
    "stateManagement": "type",
    "stylingSystem": "type"
  }
}`;

    const result = await callClaude(systemPrompt, userPrompt, modelTier);
    const parsed = extractJson(result) ?? {
      analysis: { pages: [], features: [], userFlows: [], components: 0, routes: 0, apis: 0 },
    };

    res.json({ success: true, modelUsed: modelTier, ...parsed });
  } catch (err) {
    console.error("[analyze] failed:", err);
    if (userId && creditsCharged > 0) {
      await refundCredits(userId, creditsCharged, "analyze", projectIdForRefund);
    }
    res.status(500).json({ error: "Analysis failed. Please try again. Your credits were refunded." });
  }
};

// Fill empty/placeholder text labels with category-aware fallbacks.
function fillRealisticContent(node: any, category: string, idx = { i: 0 }): any {
  if (!node || typeof node !== "object") return node;
  const placeholders = realisticTextFor(category);
  if (node.type === "Text") {
    const current = (node.label ?? node.text ?? "").toString().trim();
    const isPlaceholder = !current || /^(text|label|item\s*\d*|card|placeholder|lorem)/i.test(current);
    if (isPlaceholder) {
      node.label = placeholders[idx.i % placeholders.length];
      idx.i++;
    } else {
      node.label = current;
    }
  }
  if (Array.isArray(node.children)) {
    node.children.forEach((c: any) => fillRealisticContent(c, category, idx));
  }
  return node;
}

function realisticTextFor(category: string): string[] {
  const c = (category || "").toLowerCase();
  if (c.includes("commerce") || c.includes("shop") || c.includes("market")) {
    return ["Wireless Headphones", "$129.00", "Free shipping", "Smart Watch Pro", "$249.00", "In stock", "Cotton T-Shirt", "$29.00", "4.8 ★", "Leather Wallet", "$59.00", "New arrival", "Home", "Search", "Cart", "Profile"];
  }
  if (c.includes("social") || c.includes("chat") || c.includes("message")) {
    return ["Sarah Johnson", "Hey, how are you?", "2m ago", "Mike Chen", "See you tomorrow!", "1h ago", "Emma Davis", "Sounds great 👍", "3h ago", "Alex Rivera", "Sent a photo", "Yesterday", "Chats", "Calls", "Stories", "Profile"];
  }
  if (c.includes("food") || c.includes("restaurant") || c.includes("delivery")) {
    return ["Margherita Pizza", "$14.99 · 25 min", "★ 4.7", "Sushi Combo", "$22.50 · 30 min", "★ 4.9", "Burger Deluxe", "$11.50 · 20 min", "★ 4.6", "Pad Thai", "$13.00 · 35 min", "★ 4.8", "Home", "Search", "Orders", "Account"];
  }
  if (c.includes("fitness") || c.includes("health") || c.includes("workout")) {
    return ["Morning Run", "5.2 km · 28 min", "Active", "Yoga Flow", "20 min · Beginner", "Today", "HIIT Workout", "15 min · Intense", "Saved", "Steps Today", "8,432 / 10,000", "Goal", "Home", "Plans", "Stats", "Profile"];
  }
  if (c.includes("finance") || c.includes("bank") || c.includes("wallet")) {
    return ["Checking Account", "$4,238.50", "+$120 today", "Savings", "$12,450.00", "+0.5%", "Recent Transfer", "−$45.00 · Coffee", "Yesterday", "Bill Payment", "−$120.00 · Internet", "2 days ago", "Home", "Cards", "Pay", "More"];
  }
  if (c.includes("travel") || c.includes("hotel") || c.includes("flight")) {
    return ["Bali, Indonesia", "From $589 · 7 nights", "★ 4.9", "Tokyo, Japan", "From $899 · 5 nights", "★ 4.8", "Paris, France", "From $749 · 4 nights", "★ 4.7", "Santorini", "From $679 · 6 nights", "★ 4.9", "Explore", "Trips", "Saved", "Profile"];
  }
  if (c.includes("news") || c.includes("blog") || c.includes("article")) {
    return ["Tech Industry Updates", "5 min read · Today", "Trending", "Climate Report 2024", "8 min read · 2h ago", "Featured", "Sports Highlights", "3 min read · 4h ago", "Live", "Market Analysis", "6 min read · 1d ago", "Editor's pick", "Home", "Topics", "Saved", "Profile"];
  }
  // Generic professional fallback
  return ["Welcome back", "Continue where you left off", "View all", "Recent Activity", "Updated 5 min ago", "Open", "Quick Actions", "Tap to explore", "Go", "Notifications", "3 new updates", "Review", "Home", "Browse", "Activity", "Profile"];
}

async function generateDesignsPerPage(opts: {
  pages: any[];
  features: any[];
  palette: string[];
  style: string;
  theme: string;
  category: string;
  appDescription: string;
  modelTier: ModelTier;
}): Promise<any[]> {
  const { pages, features, palette, style, theme, category, appDescription, modelTier } = opts;

  const pageList = pages.length > 0 ? pages : [
    { name: "Home", type: "main" },
    { name: "Profile", type: "profile" },
  ];

  const systemPrompt = `You design ONE polished mobile screen as JSON. Return exactly 2 design options for the requested page.

Element types: ScrollView, View, Text, Image. EVERY Text MUST have a "label" field with REAL human-readable content (e.g. "Wireless Headphones", "$129.00", "★ 4.8") — NEVER the words "Text", "Label", "Item", or empty string.

REQUIRED structure per screen (in this order):
1. Header View (height 56, padding 16): a title Text + a small icon View (28x28) on the right.
2. Hero card View (minHeight 120, borderRadius 16, padding 20): title Text + subtitle Text.
3. Content View (gap 12, padding 16) containing 4 list-item Views. Each item: row layout with Image (48x48 colored placeholder) + a column View (gap 4) containing title Text + subtitle Text.
4. Bottom Nav View (height 64, padding 12) with 4 tab cells. Each tab: icon View (24x24) + label Text (fontSize 11).

STYLE FIELDS allowed: backgroundColor, color, padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, borderRadius, fontSize, fontWeight, gap, height, minHeight, width, flexDirection, alignItems, justifyContent. NO gradients, shadows, transforms.

OUTPUT: ONLY valid JSON. No markdown. No fences. No commentary.`;

  const promises = pageList.slice(0, 4).map(async (page: any) => {
    const userPrompt = `Design the "${page.name}" screen (${page.type || "main"}) for a ${category || "mobile"} app.
Brief: ${(appDescription || "").slice(0, 150)}
Visual style: ${style}. Theme: ${theme}. Palette hint: ${palette.join(", ") || "designer's choice"}.
Relevant features: ${features.slice(0, 4).join(", ")}.

Return EXACTLY this JSON shape (2 options, visually different):
{"options":[
  {"id":"opt-a","name":"<2-3 word name>","description":"<short>","layout":{"type":"ScrollView","style":{"backgroundColor":"#hex","padding":0},"children":[/*header, hero, content, bottom nav with REAL labels*/]}},
  {"id":"opt-b","name":"<2-3 word name>","description":"<short>","layout":{"type":"ScrollView","style":{"backgroundColor":"#hex","padding":0},"children":[/*alternative visual approach*/]}}
]}`;

    try {
      const raw = await callClaude(systemPrompt, userPrompt, modelTier, 8000);
      const parsed = extractJson(raw);
      if (!parsed?.options?.length) {
        console.warn(`[reimagine] no options for page ${page.name}`);
        return null;
      }
      const options = parsed.options.map((opt: any) => ({
        id: opt.id || crypto.randomUUID(),
        name: opt.name || `${page.name} Design`,
        description: opt.description || `Mobile design for ${page.name}`,
        layout: fillRealisticContent(opt.layout, category),
      }));
      return { pageName: page.name, options };
    } catch (e) {
      console.error(`[reimagine] page "${page.name}" failed:`, e);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is any => r !== null);
}

export const handleReimagine: RequestHandler = async (req, res) => {
  const userId = req.body.userId ? sanitizeString(req.body.userId) : undefined;
  const modelTier = resolveModel(req.body, "reimagine");
  const projectIdForRefund = sanitizeString(req.body.projectId);
  let creditsCharged = 0;
  try {
    const projectId = projectIdForRefund;
    const analysis = req.body.analysis;
    const preferences = req.body.preferences;
    const appDescription = sanitizeString(req.body.appDescription);
    const category = req.body.category ? sanitizeString(req.body.category) : "";

    if (!projectId) {
      res.status(400).json({ error: "Missing project ID" });
      return;
    }

    if (userId) {
      const creditResult = await deductCredits(userId, "reimagine", projectId, modelTier);
      if (!creditResult.success) {
        res.status(402).json({ error: creditResult.error, creditsRemaining: creditResult.remaining });
        return;
      }
      creditsCharged = creditResult.cost;
    }

    if (!CLAUDE_API_KEY) {
      const pages = analysis?.pages ?? [
        { name: "Login", type: "auth" },
        { name: "Dashboard", type: "main" },
        { name: "Settings", type: "settings" },
        { name: "Profile", type: "profile" },
      ];

      const designs = pages.map((page: any) => ({
        pageName: page.name,
        options: [
          {
            id: crypto.randomUUID(),
            name: "Modern Clean",
            description: `Clean, minimal ${page.name} with card-based layout and bottom navigation`,
            layout: {
              type: "ScrollView",
              style: { backgroundColor: "#ffffff", padding: 0 },
              children: [
                {
                  type: "View",
                  label: "Header",
                  style: { backgroundColor: preferences?.colorPalette?.[0] || "#7c3aed", padding: 24, paddingTop: 48 },
                  children: [
                    { type: "Text", label: page.name, style: { fontSize: 28, fontWeight: "bold", color: "#ffffff" } },
                    { type: "Text", label: `Your ${page.name.toLowerCase()} at a glance`, style: { fontSize: 14, color: "#e0d4fc", marginTop: 4 } },
                  ],
                },
                {
                  type: "View",
                  label: "Content",
                  style: { padding: 16 },
                  children: [
                    {
                      type: "View",
                      label: "Card",
                      style: { backgroundColor: "#f8f7ff", borderRadius: 16, padding: 20, marginBottom: 12 },
                      children: [
                        { type: "Text", label: "Welcome back", style: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" } },
                        { type: "Text", label: "Here's what's happening today", style: { fontSize: 13, color: "#666", marginTop: 4 } },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          {
            id: crypto.randomUUID(),
            name: "Bold Immersive",
            description: `Full-screen immersive ${page.name} with gradient hero and floating cards`,
            layout: {
              type: "ScrollView",
              style: { backgroundColor: "#0f0f23", padding: 0 },
              children: [
                {
                  type: "View",
                  label: "Hero",
                  style: { backgroundColor: "#1a1a3e", padding: 32, paddingTop: 56, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
                  children: [
                    { type: "Text", label: page.name, style: { fontSize: 32, fontWeight: "800", color: "#ffffff" } },
                    { type: "Text", label: "Reimagined for mobile", style: { fontSize: 14, color: "#8888aa", marginTop: 8 } },
                  ],
                },
                {
                  type: "View",
                  label: "Cards",
                  style: { padding: 16, marginTop: -12 },
                  children: [
                    {
                      type: "View",
                      label: "Floating Card",
                      style: { backgroundColor: "#1e1e3f", borderRadius: 20, padding: 20, marginBottom: 12 },
                      children: [
                        { type: "Text", label: "Quick Actions", style: { fontSize: 16, fontWeight: "600", color: "#ffffff" } },
                        { type: "Text", label: "Swipe to explore", style: { fontSize: 12, color: "#6666aa", marginTop: 4 } },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      }));

      res.json({ success: true, modelUsed: modelTier, designs });
      return;
    }

    // Generate ONE page at a time in parallel — avoids any single response being truncated.
    const pages = (analysis?.pages || []).slice(0, 4);
    const features = (analysis?.features || []).slice(0, 6);
    const palette = (preferences?.colorPalette || []).slice(0, 5);
    const style = preferences?.style || "modern";
    const theme = preferences?.theme || "light";

    const designs = await generateDesignsPerPage({
      pages,
      features,
      palette,
      style,
      theme,
      category,
      appDescription,
      modelTier,
    });

    if (designs.length === 0) {
      if (userId && creditsCharged > 0) {
        await refundCredits(userId, creditsCharged, "reimagine", projectIdForRefund);
      }
      res.status(500).json({ error: "AI returned no designs. Please try again." });
      return;
    }

    res.json({ success: true, modelUsed: modelTier, designs });
  } catch (err) {
    console.error("[reimagine] failed:", err);
    if (userId && creditsCharged > 0) {
      await refundCredits(userId, creditsCharged, "reimagine", projectIdForRefund);
    }
    res.status(500).json({ error: "Design generation failed. Please try again. Your credits were refunded." });
  }
};

export const handleConvert: RequestHandler = async (req, res) => {
  const userId = req.body.userId ? sanitizeString(req.body.userId) : undefined;
  const modelTier = resolveModel(req.body, "convert");
  const projectIdForRefund = sanitizeString(req.body.projectId);
  let creditsCharged = 0;
  try {
    const projectId = projectIdForRefund;
    const selectedDesigns = req.body.selectedDesigns;
    const preferences = req.body.preferences;

    if (!projectId) {
      res.status(400).json({ error: "Missing project ID" });
      return;
    }

    if (userId) {
      const creditResult = await deductCredits(userId, "convert", projectId, modelTier);
      if (!creditResult.success) {
        res.status(402).json({ error: creditResult.error, creditsRemaining: creditResult.remaining });
        return;
      }
      creditsCharged = creditResult.cost;
    }

    if (!CLAUDE_API_KEY) {
      res.json({
        success: true,
        modelUsed: modelTier,
        files: [
          { path: "App.tsx", type: "component" },
          { path: "screens/HomeScreen.tsx", type: "screen" },
          { path: "screens/LoginScreen.tsx", type: "screen" },
          { path: "navigation/AppNavigator.tsx", type: "navigation" },
          { path: "components/Header.tsx", type: "component" },
          { path: "services/api.ts", type: "service" },
          { path: "styles/theme.ts", type: "style" },
        ],
        message: "Conversion complete from AI-approved design.",
      });
      return;
    }

    const systemPrompt = `You are Morphic's Code Generator. You convert AI-approved mobile design structures into production React Native code. You do NOT convert raw web code. You build from the approved mobile design layout trees. Generate clean, typed React Native + Expo code. Return valid JSON only.`;

    const userPrompt = `Generate production React Native code from these AI-approved mobile designs.

Selected designs: ${JSON.stringify(selectedDesigns)}
User preferences: ${JSON.stringify(preferences)}
Project ID: ${projectId}

Return JSON:
{
  "files": [{ "path": "relative/path.tsx", "type": "screen|component|navigation|service|style", "content": "full file content" }],
  "qa": {
    "uxIssues": ["list of potential UX issues found"],
    "securityNotes": ["security recommendations"],
    "accessibilityNotes": ["a11y recommendations"]
  }
}`;

    const result = await callClaude(systemPrompt, userPrompt, modelTier, 8192);
    const parsed = extractJson(result) ?? {
      files: [],
      qa: { uxIssues: [], securityNotes: [], accessibilityNotes: [] },
    };

    res.json({ success: true, modelUsed: modelTier, ...parsed });
  } catch (err) {
    console.error("[convert] failed:", err);
    if (userId && creditsCharged > 0) {
      await refundCredits(userId, creditsCharged, "convert", projectIdForRefund);
    }
    res.status(500).json({ error: "Conversion failed. Please try again. Your credits were refunded." });
  }
};
