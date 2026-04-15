/**
 * Input sanitization utilities for server-side request handling.
 */

// Strip HTML tags and dangerous characters
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")        // strip HTML tags
    .replace(/javascript:/gi, "")    // strip JS protocol
    .replace(/on\w+\s*=/gi, "")      // strip event handlers
    .trim()
    .slice(0, 10000);                // max length cap
}

// Validate and sanitize URLs
export function sanitizeUrl(input: unknown): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim();

  // Only allow http/https protocols
  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

// Validate UUID format
export function isValidUUID(input: unknown): boolean {
  if (typeof input !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
}

// Validate webhook URL - prevents SSRF
export function isAllowedWebhookUrl(input: unknown): boolean {
  if (typeof input !== "string") return false;
  try {
    const url = new URL(input.trim());

    // Must be HTTPS
    if (url.protocol !== "https:") return false;

    // Block private/internal IPs
    const hostname = url.hostname.toLowerCase();
    const blocked = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "169.254.",       // link-local
      "10.",            // private class A
      "192.168.",       // private class C
      "172.16.", "172.17.", "172.18.", "172.19.",
      "172.20.", "172.21.", "172.22.", "172.23.",
      "172.24.", "172.25.", "172.26.", "172.27.",
      "172.28.", "172.29.", "172.30.", "172.31.",
      "[::1]",
      "metadata.google",
      "169.254.169.254",
    ];

    for (const prefix of blocked) {
      if (hostname === prefix || hostname.startsWith(prefix)) return false;
    }

    return true;
  } catch {
    return false;
  }
}
