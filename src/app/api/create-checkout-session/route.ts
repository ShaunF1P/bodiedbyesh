import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation/api-validator";
import { CreateCheckoutSessionSchema } from "@/lib/validation/schemas";
import { container } from "@/lib/container";

export const ALLOWED_PROGRAM_CONFIGS = {
  track_a: {
    envVar: "STRIPE_PRICE_TRACK_A",
    mode: "subscription" as const,
    displayName: "Park-to-Peak Coaching",
  },
  track_a_hybrid: {
    envVar: "STRIPE_PRICE_TRACK_A",
    mode: "subscription" as const,
    displayName: "Park-to-Peak Hybrid Coaching",
  },
  track_a_park: {
    envVar: "STRIPE_PRICE_TRACK_A",
    mode: "subscription" as const,
    displayName: "Park Group Coaching",
  },
  track_b: {
    envVar: "STRIPE_PRICE_TRACK_B",
    mode: "subscription" as const,
    displayName: "Executive Concierge Coaching",
  },
  track_b_hybrid: {
    envVar: "STRIPE_PRICE_TRACK_B",
    mode: "subscription" as const,
    displayName: "Executive Concierge Hybrid",
  },
  intro_assessment: {
    envVar: "STRIPE_PRICE_INTRO",
    mode: "payment" as const,
    displayName: "Introductory Strategy Assessment",
  },
} as const;

export type AllowedProgramKey = keyof typeof ALLOWED_PROGRAM_CONFIGS;

export async function POST(request: NextRequest) {
  // ── Rate Limiting (10 requests/minute per IP) ──────────────────────────
  const rateLimit = checkRateLimit(request, "checkout");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const validation = await validateRequestBody(request, CreateCheckoutSessionSchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const { programChoice, customerEmail, customerName, customerPhone } = validation.data;

    // 1. Strict Validation of Program Choice (Guarding against prototype pollution / property lookups)
    if (
      !programChoice ||
      !(programChoice in ALLOWED_PROGRAM_CONFIGS) ||
      !Object.prototype.hasOwnProperty.call(ALLOWED_PROGRAM_CONFIGS, programChoice)
    ) {
      return Response.json(
        {
          error: "Invalid program choice. Must be one of: " + Object.keys(ALLOWED_PROGRAM_CONFIGS).join(", "),
        },
        { status: 400 }
      );
    }

    const programKey = programChoice as AllowedProgramKey;
    const config = ALLOWED_PROGRAM_CONFIGS[programKey];

    // 2. Strict Server-Side Price ID Resolution (Client-supplied priceId is completely ignored)
    const priceId = process.env[config.envVar];

    // 3. Resolve Origin
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://bodiedbyesh.com";

    // 4. Handle Mock Mode when Stripe is not configured
    if (!process.env.STRIPE_SECRET_KEY || !priceId) {
      logger.warn(`[checkout] Stripe or ${config.envVar} not configured — returning mock URL`);
      return Response.json({
        url: `${origin}/success?session_id=mock_session_dev&program=${programKey}`,
      });
    }

    // 5. Create Stripe Checkout Session via paymentService port adapter
    const session = await container.paymentService.createCheckoutSession({
      mode: config.mode,
      priceId,
      customerEmail: customerEmail || undefined,
      successUrl: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/apply?canceled=true`,
      metadata: {
        programChoice: programKey,
        programName: config.displayName,
        customerName: (customerName || "").trim(),
        customerPhone: (customerPhone || "").trim(),
      },
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    logger.error("[create-checkout-session] Error:", err);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
