import type { NextRequest } from "next/server";

export interface RateLimitConfig {
  windowMs: number; // e.g. 60_000 (1 minute)
  maxRequests: number; // e.g. 5
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfterSeconds?: number;
}

export type RateLimitPolicyKey = "form" | "ai" | "checkout" | "auth";

export const RATE_LIMIT_POLICIES: Record<RateLimitPolicyKey, RateLimitConfig> = {
  form: {
    windowMs: 60_000,
    maxRequests: 5,
    keyPrefix: "rl:form",
  },
  ai: {
    windowMs: 60_000,
    maxRequests: 10,
    keyPrefix: "rl:ai",
  },
  checkout: {
    windowMs: 60_000,
    maxRequests: 10,
    keyPrefix: "rl:checkout",
  },
  auth: {
    windowMs: 60_000,
    maxRequests: 30,
    keyPrefix: "rl:auth",
  },
};

// In-memory sliding-window bucket store
const rateLimitStore = new Map<string, number[]>();
const MAX_STORE_SIZE = 10_000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(now: number, maxWindowMs: number = 300_000) {
  if (now - lastCleanup < 60_000 && rateLimitStore.size < MAX_STORE_SIZE) {
    return;
  }
  lastCleanup = now;

  for (const [key, timestamps] of rateLimitStore.entries()) {
    const valid = timestamps.filter((t) => now - t < maxWindowMs);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, valid);
    }
  }
}

export type RequestLike = Request | NextRequest | { headers: Headers | { get(name: string): string | null } };

/**
 * Extracts client IP from standard reverse proxy headers.
 */
export function getClientIp(request: RequestLike): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Evaluates rate limit for a given key against a sliding-window policy.
 */
export function evaluateRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now, config.windowMs * 2);

  const existing = rateLimitStore.get(key) || [];
  // Keep only requests within current sliding window
  const timestamps = existing.filter((timestamp) => now - timestamp < config.windowMs);

  if (timestamps.length >= config.maxRequests) {
    const oldestTimestamp = timestamps[0];
    const resetTimeMs = oldestTimestamp + config.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
    const reset = Math.ceil(resetTimeMs / 1000);

    rateLimitStore.set(key, timestamps);

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset,
      retryAfterSeconds,
    };
  }

  // Request allowed — record timestamp
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);

  const reset = Math.ceil((now + config.windowMs) / 1000);
  const remaining = Math.max(0, config.maxRequests - timestamps.length);

  return {
    success: true,
    limit: config.maxRequests,
    remaining,
    reset,
  };
}

/**
 * Helper to check rate limit directly from a NextRequest or Request.
 */
export function checkRateLimit(
  request: RequestLike,
  policyOrConfig: RateLimitPolicyKey | RateLimitConfig,
  customIdentifier?: string
): RateLimitResult {
  const config =
    typeof policyOrConfig === "string"
      ? RATE_LIMIT_POLICIES[policyOrConfig]
      : policyOrConfig;

  const ip = getClientIp(request);
  const identifier = customIdentifier || ip;
  const prefix = config.keyPrefix || "rl";
  const key = `${prefix}:${identifier}`;

  return evaluateRateLimit(key, config);
}

/**
 * Generates standard 429 Too Many Requests response with RFC headers.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    {
      error: "Too many requests. Please slow down.",
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds ?? 60),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.reset),
      },
    }
  );
}

/**
 * Resets the in-memory store (for testing purposes).
 */
export function _resetRateLimitStore(): void {
  rateLimitStore.clear();
}
