/**
 * Structured Logger & PII Redaction Utility
 * Bodied by Esh Platform
 *
 * Ensures customer emails, phone numbers, and full names are masked in production logs.
 * Suppresses unredacted payload dumping to standard output.
 */

export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== "string" || !email.trim()) return "anonymous";
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.indexOf("@");
  if (atIndex === -1) return "***";

  const user = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!domain) return "***";

  const maskedUser =
    user.length <= 2
      ? `${user[0] || "*"}***`
      : `${user[0]}***${user[user.length - 1]}`;

  return `${maskedUser}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone || typeof phone !== "string" || !phone.trim()) return "not-provided";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const last4 = digits.slice(-4);
  return `+1***${last4}`;
}

export function maskName(name?: string | null): string {
  if (!name || typeof name !== "string" || !name.trim()) return "Client";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length > 1 ? `${p[0]}***` : p))
    .join(" ");
}

const SENSITIVE_KEYS = new Set([
  "email",
  "customeremail",
  "phone",
  "customerphone",
  "name",
  "customername",
  "fullname",
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "html",
  "rawbody",
]);

export function sanitizeMeta(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMeta(item, depth + 1));
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();

      if (lowerKey.includes("email") && typeof value === "string") {
        sanitized[key] = maskEmail(value);
      } else if (lowerKey.includes("phone") && typeof value === "string") {
        sanitized[key] = maskPhone(value);
      } else if ((lowerKey.includes("name") || lowerKey === "fullname") && typeof value === "string") {
        sanitized[key] = maskName(value);
      } else if (
        (lowerKey.includes("password") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("token") ||
          lowerKey.includes("auth")) &&
        typeof value === "string"
      ) {
        sanitized[key] = "[REDACTED]";
      } else if (lowerKey === "html" && typeof value === "string") {
        sanitized[key] = `[HTML Content - length: ${value.length}]`;
      } else {
        sanitized[key] = sanitizeMeta(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "production" && meta?.suppressInProd) {
      console.log(`[INFO] ${message}`);
      return;
    }
    if (meta && Object.keys(meta).length > 0) {
      console.log(`[INFO] ${message}`, JSON.stringify(sanitizeMeta(meta)));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    if (meta && Object.keys(meta).length > 0) {
      console.warn(`[WARN] ${message}`, JSON.stringify(sanitizeMeta(meta)));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    const errorDetails =
      error instanceof Error
        ? error.message
        : typeof error === "object"
        ? JSON.stringify(sanitizeMeta(error))
        : String(error || "");

    if (meta && Object.keys(meta).length > 0) {
      console.error(`[ERROR] ${message} ${errorDetails}`.trim(), JSON.stringify(sanitizeMeta(meta)));
    } else {
      console.error(`[ERROR] ${message} ${errorDetails}`.trim());
    }
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "production") return;
    if (meta && Object.keys(meta).length > 0) {
      console.log(`[DEBUG] ${message}`, JSON.stringify(sanitizeMeta(meta)));
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  },
};
