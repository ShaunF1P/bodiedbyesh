import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateQueryParams } from "@/lib/validation/api-validator";
import { CheckoutSessionGetQuerySchema } from "@/lib/validation/schemas";
import { container } from "@/lib/container";

/**
 * GET /api/checkout-session?id=cs_xxx
 *
 * Retrieves a Stripe Checkout Session so the success page can
 * display order confirmation details.
 */
export async function GET(request: NextRequest) {
  // ── Rate Limiting (10 requests/minute per IP) ──────────────────────────
  const rateLimit = checkRateLimit(request, "checkout");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const queryValidation = validateQueryParams(
    request.nextUrl.searchParams,
    CheckoutSessionGetQuerySchema
  );
  if (!queryValidation.success) {
    return queryValidation.response;
  }

  try {
    const { id: sessionId } = queryValidation.data;
    const sessionData = await container.paymentService.retrieveSession(sessionId);

    return Response.json(sessionData);
  } catch (err) {
    logger.error("[checkout-session] Error:", err);
    return Response.json(
      { error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
