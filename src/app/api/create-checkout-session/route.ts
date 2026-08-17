import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/create-checkout-session
 *
 * Creates a Stripe Checkout Session and returns the redirect URL.
 *
 * Body: { priceId, programChoice, customerEmail, customerName, customerPhone }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, programChoice, customerEmail, customerName, customerPhone } = body;

    let resolvedPriceId = priceId;
    if (!resolvedPriceId || typeof resolvedPriceId !== "string") {
      if (programChoice === "track_a" || programChoice === "track_a_hybrid") {
        resolvedPriceId = process.env.STRIPE_PRICE_TRACK_A;
      } else if (programChoice === "track_b" || programChoice === "track_b_hybrid") {
        resolvedPriceId = process.env.STRIPE_PRICE_TRACK_B;
      } else {
        resolvedPriceId = process.env.STRIPE_PRICE_INTRO;
      }
    }

    if (!resolvedPriceId) {
      resolvedPriceId = "price_placeholder_intro";
    }

    // ── Determine checkout mode from program choice ─────────────────────
    const isSubscription =
      programChoice === "track_a" || programChoice === "track_b";
    const mode = isSubscription ? "subscription" : "payment";

    // ── Resolve origin for redirect URLs ────────────────────────────────
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
      "http://localhost:3000";

    // ── If Stripe isn't configured, return a mock URL for dev ───────────
    const stripe = await getStripe();
    if (!stripe) {
      console.warn("[checkout] Stripe not configured — returning mock URL");
      return Response.json({
        url: `${origin}/success?session_id=mock_session_dev`,
      });
    }

    // ── Create Stripe Checkout Session ──────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      customer_email: customerEmail || undefined,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/apply?canceled=true`,
      metadata: {
        programChoice: programChoice || "",
        customerName: customerName || "",
        customerPhone: customerPhone || "",
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout-session] Error:", err);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
