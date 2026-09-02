export interface CreateCheckoutSessionParams {
  mode: "subscription" | "payment";
  priceId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  url: string | null;
  sessionId?: string;
}

export interface RetrievedSessionData {
  customerEmail: string | null;
  amountTotal: number | null;
  programName: string | null;
  status: string | null;
}

export interface IPaymentService {
  createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult>;
  retrieveSession(sessionId: string): Promise<RetrievedSessionData>;
  constructWebhookEvent(
    payload: string,
    signature: string,
    secret: string
  ): any;
}
