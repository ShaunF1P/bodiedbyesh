import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation/api-validator";
import { ScanMenuSchema } from "@/lib/validation/schemas";
import { container } from "@/lib/container";

/**
 * POST /api/scan-menu
 *
 * Receives a base64 restaurant menu photo + the client's remaining
 * macro budget, sends it to Gemini Vision for menu analysis, and
 * returns scored/ranked menu items.
 */

export async function POST(request: NextRequest) {
  // ── Rate Limiting (10 requests/minute per IP) ──────────────────────────
  const rateLimit = checkRateLimit(request, "ai");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const validation = await validateRequestBody(request, ScanMenuSchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const { imageBase64, mimeType = "image/jpeg", remainingBudget } = validation.data;
    const result = await container.aiService.scanMenu(imageBase64, mimeType, remainingBudget);
    return Response.json(result);
  } catch (err: any) {
    logger.error("Menu scan error:", err);
    return Response.json(
      { success: false, error: err.message || "Failed to analyze menu image. Please try again." },
      { status: 500 }
    );
  }
}
