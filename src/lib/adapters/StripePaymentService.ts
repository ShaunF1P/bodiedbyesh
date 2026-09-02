import {
  IPaymentService,
  CreateCheckoutSessionParams,
  CheckoutSessionResult,
  RetrievedSessionData,
} from "@/lib/ports/IPaymentService";
import { getStripe } from "@/lib/stripe";

export class StripePaymentService implements IPaymentService {
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const stripe = await getStripe();
    if (!stripe) {
      return {
        url: `/success?session_id=mock_session_dev`,
        sessionId: "mock_session_dev",
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: params.mode,
      line_items: [{ price: params.priceId, quantity: 1 }],
      customer_email: params.customerEmail || undefined,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  async retrieveSession(sessionId: string): Promise<RetrievedSessionData> {
    const stripe = await getStripe();
    if (!stripe) {
      return {
        customerEmail: "preview@bodiedbyesh.com",
        amountTotal: 0,
        programName: "Preview Mode",
        status: "complete",
      };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      customerEmail:
        session.customer_email ?? session.customer_details?.email ?? null,
      amountTotal: session.amount_total,
      programName: session.metadata?.programChoice ?? null,
      status: session.status,
    };
  }

  constructWebhookEvent(payload: string, signature: string, secret: string): any {
    // Dynamic access to stripe webhooks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy", {
      apiVersion: "2024-06-20",
      timeout: 8000,
    });
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
