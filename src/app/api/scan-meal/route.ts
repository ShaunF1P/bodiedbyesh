import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation/api-validator";
import { ScanMealSchema } from "@/lib/validation/schemas";
import { container } from "@/lib/container";

/**
 * POST /api/scan-meal
 *
 * Receives a base64 meal photo, sends it to Gemini Vision for food
 * identification and macro estimation, then returns structured JSON.
 */

export async function POST(request: NextRequest) {
  // ── Rate Limiting (10 requests/minute per IP) ──────────────────────────
  const rateLimit = checkRateLimit(request, "ai");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const validation = await validateRequestBody(request, ScanMealSchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const { imageBase64, mimeType = "image/jpeg" } = validation.data;
    const result = await container.aiService.scanMeal(imageBase64, mimeType);
    return Response.json(result);
  } catch (err: any) {
    logger.error("Meal scan error:", err);
    return Response.json(
      { success: false, error: err.message || "Failed to analyze meal image. Please try again." },
      { status: 500 }
    );
  }
}
