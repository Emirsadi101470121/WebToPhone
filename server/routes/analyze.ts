import { RequestHandler } from "express";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

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
      model: "claude-sonnet-4-20250514",
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
    const { projectId, sourceType, sourceUrl } = req.body;

    if (!projectId || !sourceType) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (!CLAUDE_API_KEY) {
      const fallbackQuestions = [
        {
          id: crypto.randomUUID(),
          question: "What design style do you prefer for the mobile app?",
          question_type: "design_style",
          options: ["Modern", "Minimal", "Luxury", "Playful", "Corporate"],
          answer: null,
        },
        {
          id: crypto.randomUUID(),
          question: "Who is your target audience?",
          question_type: "target_audience",
          options: ["Consumers", "Business Users", "Developers", "General"],
          answer: null,
        },
        {
          id: crypto.randomUUID(),
          question: "What theme should the mobile app use?",
          question_type: "theme",
          options: ["Dark", "Light", "System Default"],
          answer: null,
        },
        {
          id: crypto.randomUUID(),
          question: "What level of UX complexity do you prefer?",
          question_type: "ux_complexity",
          options: ["Simple", "Moderate", "Advanced"],
          answer: null,
        },
      ];

      res.json({
        success: true,
        analysis: {
          pages: ["Login", "Dashboard", "Settings", "Profile"],
          components: 24,
          routes: 8,
          apis: 5,
        },
        questions: fallbackQuestions,
      });
      return;
    }

    const systemPrompt = `You are Morphic's AI Analyzer. You analyze web application codebases and return structured JSON. You must identify: pages, components, routing structure, state management patterns, API calls, and styling system. Then generate smart design questions for the user. Return valid JSON only.`;

    const userPrompt = `Analyze this ${sourceType} web application${sourceUrl ? ` at ${sourceUrl}` : ""}. Project ID: ${projectId}.

Return JSON with this structure:
{
  "analysis": {
    "pages": ["list of detected pages"],
    "components": number,
    "routes": number,
    "apis": number,
    "stateManagement": "type",
    "stylingSystem": "type",
    "uxIssues": ["list of UX issues"],
    "mobileReadiness": "low|medium|high"
  },
  "questions": [
    {
      "id": "uuid",
      "question": "question text",
      "question_type": "design_style|target_audience|theme|ux_complexity|general",
      "options": ["option1", "option2"],
      "answer": null
    }
  ]
}`;

    const result = await callClaude(systemPrompt, userPrompt);

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = {
        analysis: { pages: [], components: 0, routes: 0, apis: 0 },
        questions: [],
      };
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    res.status(500).json({ error: message });
  }
};

export const handleConvert: RequestHandler = async (req, res) => {
  try {
    const { projectId, preferences } = req.body;

    if (!projectId) {
      res.status(400).json({ error: "Missing project ID" });
      return;
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
        message: "Conversion complete. Connect Claude API for real code generation.",
      });
      return;
    }

    const systemPrompt = `You are Morphic's AI Converter. You convert web application code to React Native. Map: div→View, span→Text, CSS→StyleSheet, onClick→onPress. Generate proper React Navigation setup. Return valid JSON with generated file list.`;

    const userPrompt = `Convert project ${projectId} to React Native using these user preferences: ${JSON.stringify(preferences)}. Return JSON with: { "files": [{ "path": "string", "type": "string", "content": "string" }] }`;

    const result = await callClaude(systemPrompt, userPrompt);

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { files: [] };
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    res.status(500).json({ error: message });
  }
};
