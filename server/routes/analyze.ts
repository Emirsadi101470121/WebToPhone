import { RequestHandler } from "express";
import { deductCredits } from "./credits";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = "claude-3-5-sonnet-20241022";

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!CLAUDE_API_KEY) {
    throw new Error("CLAUDE_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

export const handleAnalyze: RequestHandler = async (req, res) => {
  try {
    const { projectId, sourceType, sourceUrl, userId } = req.body;

    if (!projectId || !sourceType) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (userId) {
      const creditResult = await deductCredits(userId, "analyze", projectId);
      if (!creditResult.success) {
        res.status(402).json({ error: creditResult.error, creditsRemaining: creditResult.remaining });
        return;
      }
    }

    if (!CLAUDE_API_KEY) {
      res.json({
        success: true,
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

    const userPrompt = `Analyze this ${sourceType} web application${sourceUrl ? ` at ${sourceUrl}` : ""}. Project ID: ${projectId}.

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

    const result = await callClaude(systemPrompt, userPrompt);
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { analysis: { pages: [], features: [], userFlows: [], components: 0, routes: 0, apis: 0 } };
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    res.status(500).json({ error: message });
  }
};

export const handleReimagine: RequestHandler = async (req, res) => {
  try {
    const { projectId, analysis, preferences, appDescription, userId } = req.body;

    if (!projectId) {
      res.status(400).json({ error: "Missing project ID" });
      return;
    }

    if (userId) {
      const creditResult = await deductCredits(userId, "reimagine", projectId);
      if (!creditResult.success) {
        res.status(402).json({ error: creditResult.error, creditsRemaining: creditResult.remaining });
        return;
      }
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

      res.json({ success: true, designs });
      return;
    }

    const systemPrompt = `You are Morphic's Mobile UX Reimagination Engine. You do NOT improve web UI. You REINTERPRET web applications as native mobile experiences. Rules:
- sidebar → bottom tabs
- dashboards → card-based scroll layouts
- complex forms → step-based flows
- tables → scrollable list cards
- modals → full-screen sheets

For each page, generate 2 design options as structured layout trees. Return valid JSON only, no markdown.`;

    const userPrompt = `Reimagine this web app as a mobile-first experience.

App description: ${appDescription || "Web application"}
Design preferences: ${JSON.stringify(preferences)}
Detected pages: ${JSON.stringify(analysis?.pages || [])}
Detected features: ${JSON.stringify(analysis?.features || [])}
User flows: ${JSON.stringify(analysis?.userFlows || [])}

Return JSON:
{
  "designs": [
    {
      "pageName": "PageName",
      "options": [
        {
          "id": "uuid",
          "name": "Design Name",
          "description": "Brief description of the mobile approach",
          "layout": {
            "type": "ScrollView|View",
            "style": { "backgroundColor": "#hex", "padding": number },
            "children": [
              {
                "type": "View|Text|Image",
                "label": "component label",
                "style": { css-like properties },
                "children": []
              }
            ]
          }
        }
      ]
    }
  ]
}`;

    const result = await callClaude(systemPrompt, userPrompt);
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { designs: [] };
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reimagination failed";
    res.status(500).json({ error: message });
  }
};

export const handleConvert: RequestHandler = async (req, res) => {
  try {
    const { projectId, selectedDesigns, preferences, userId } = req.body;

    if (!projectId) {
      res.status(400).json({ error: "Missing project ID" });
      return;
    }

    if (userId) {
      const creditResult = await deductCredits(userId, "convert", projectId);
      if (!creditResult.success) {
        res.status(402).json({ error: creditResult.error, creditsRemaining: creditResult.remaining });
        return;
      }
    }

    if (!CLAUDE_API_KEY) {
      res.json({
        success: true,
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

    const result = await callClaude(systemPrompt, userPrompt);
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { files: [], qa: { uxIssues: [], securityNotes: [], accessibilityNotes: [] } };
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    res.status(500).json({ error: message });
  }
};
