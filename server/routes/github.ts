import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase config missing");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

function getBaseUrl(req: any): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

export const handleGithubAuth: RequestHandler = (req, res) => {
  try {
    if (!GITHUB_CLIENT_ID) {
      res.status(500).json({ error: "GitHub OAuth not configured" });
      return;
    }

    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/github/callback`;

    const state = Buffer.from(JSON.stringify({ userId, baseUrl })).toString("base64url");

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: "repo read:user",
      state,
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  } catch {
    res.status(500).json({ error: "Failed to initiate GitHub auth" });
  }
};

export const handleGithubCallback: RequestHandler = async (req, res) => {
  try {
    const code = req.query.code as string;
    const stateParam = req.query.state as string;

    if (!code || !stateParam) {
      res.status(400).send("Missing code or state");
      return;
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      res.status(500).send("GitHub OAuth not configured");
      return;
    }

    let state: { userId: string; baseUrl: string };
    try {
      state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    } catch {
      res.status(400).send("Invalid state");
      return;
    }

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      res.status(400).send(`GitHub error: ${tokenData.error_description}`);
      return;
    }

    const accessToken = tokenData.access_token;

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("api_integrations")
      .select("id")
      .eq("user_id", state.userId)
      .eq("provider", "github")
      .single();

    if (existing) {
      await supabase
        .from("api_integrations")
        .update({
          access_token_encrypted: accessToken,
          scopes: tokenData.scope?.split(",") ?? ["repo", "read:user"],
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("api_integrations").insert({
        user_id: state.userId,
        provider: "github",
        access_token_encrypted: accessToken,
        scopes: tokenData.scope?.split(",") ?? ["repo", "read:user"],
      });
    }

    res.send(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({ type: "github-connected" }, "*");
            window.close();
          </script>
          <p>GitHub connected! You can close this window.</p>
        </body>
      </html>
    `);
  } catch {
    res.status(500).send("Failed to complete GitHub auth");
  }
};

export const handleGithubStatus: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }

    const supabase = getSupabaseAdmin();

    const { data } = await supabase
      .from("api_integrations")
      .select("id, scopes, updated_at")
      .eq("user_id", userId)
      .eq("provider", "github")
      .single();

    if (!data) {
      res.json({ connected: false });
      return;
    }

    res.json({ connected: true, scopes: data.scopes, connectedAt: data.updated_at });
  } catch {
    res.json({ connected: false });
  }
};

export const handleGithubRepos: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }

    const supabase = getSupabaseAdmin();

    const { data: integration } = await supabase
      .from("api_integrations")
      .select("access_token_encrypted")
      .eq("user_id", userId)
      .eq("provider", "github")
      .single();

    if (!integration?.access_token_encrypted) {
      res.status(401).json({ error: "GitHub not connected" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const search = (req.query.search as string) || "";

    let url = `https://api.github.com/user/repos?per_page=30&page=${page}&sort=updated&direction=desc`;

    if (search) {
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${integration.access_token_encrypted}` },
      });
      const userData = await userRes.json();

      const searchRes = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(search)}+user:${userData.login}&per_page=30`,
        { headers: { Authorization: `Bearer ${integration.access_token_encrypted}` } }
      );
      const searchData = await searchRes.json();

      res.json({
        repos: (searchData.items ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          html_url: r.html_url,
          description: r.description,
          language: r.language,
          updated_at: r.updated_at,
          private: r.private,
        })),
      });
      return;
    }

    const repoRes = await fetch(url, {
      headers: { Authorization: `Bearer ${integration.access_token_encrypted}` },
    });
    const repoData = await repoRes.json();

    res.json({
      repos: (repoData ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        description: r.description,
        language: r.language,
        updated_at: r.updated_at,
        private: r.private,
      })),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch repos" });
  }
};

export const handleGithubDisconnect: RequestHandler = async (req, res) => {
  try {
    const userId = req.body.userId as string;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }

    const supabase = getSupabaseAdmin();

    await supabase
      .from("api_integrations")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "github");

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to disconnect" });
  }
};
