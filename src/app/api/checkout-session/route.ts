import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";

/**
 * GET /api/checkout-session?id=cs_xxx
 *
 * Retrieves a Stripe Checkout Session so the success page can
 * display order confirmation details.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = new URL(request.url).searchParams.get("id");

    if (!sessionId) {
      return Response.json(
        { error: "Missing session id query parameter" },
        { status: 400 }
      );
    }

    // ── Mock response when Stripe is not configured ─────────────────────
    const stripe = await getStripe();
    if (!stripe) {
      return Response.json({
        customerEmail: "preview@bodiedbyesh.com",
        amountTotal: 0,
        programName: "Preview Mode",
        status: "complete",
      });
    }

    // ── Retrieve real session from Stripe ───────────────────────────────
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return Response.json({
      customerEmail: session.customer_email ?? session.customer_details?.email ?? null,
      amountTotal: session.amount_total,
      programName: session.metadata?.programChoice ?? null,
      status: session.status,
    });
  } catch (err) {
    console.error("[checkout-session] Error:", err);
    return Response.json(
      { error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
