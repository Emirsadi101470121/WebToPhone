import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { isAllowedWebhookUrl, sanitizeString } from "../lib/sanitize";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function sendWebhookNotification(
  userId: string,
  event: string,
  data: Record<string, any>
) {
  try {
    const { data: settings } = await supabase
      .from("notification_settings")
      .select("webhook_url, email_notifications")
      .eq("user_id", userId)
      .single();

    if (!settings?.webhook_url || !isAllowedWebhookUrl(settings.webhook_url)) return;

    await fetch(settings.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
    }).catch(() => {});
  } catch {}
}

export const handleGetNotificationSettings: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) { res.status(400).json({ error: "Missing userId" }); return; }

  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  res.json({ settings: data ?? { webhook_url: null, email_notifications: true } });
};

export const handleUpdateNotificationSettings: RequestHandler = async (req, res) => {
  const userId = sanitizeString(req.body.userId);
  const webhookUrl = req.body.webhookUrl ? String(req.body.webhookUrl).trim() : null;
  const emailNotifications = req.body.emailNotifications;
  if (!userId) { res.status(400).json({ error: "Missing userId" }); return; }

  if (webhookUrl && !isAllowedWebhookUrl(webhookUrl)) {
    res.status(400).json({ error: "Invalid webhook URL. Must be HTTPS and not a private/internal address." });
    return;
  }

  const { error } = await supabase
    .from("notification_settings")
    .upsert({
      user_id: userId,
      webhook_url: webhookUrl || null,
      email_notifications: emailNotifications ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    res.json({ success: true });
  }
};
