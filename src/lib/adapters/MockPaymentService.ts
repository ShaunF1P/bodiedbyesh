import type {
  IPaymentService,
  CreateCheckoutSessionParams,
  CheckoutSessionResult,
  RetrievedSessionData,
} from "@/lib/ports/IPaymentService";

export class MockPaymentService implements IPaymentService {
  async createCheckoutSession(
    _params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    return {
      url: "https://checkout.stripe.com/pay/mock_cs_test_123456",
      sessionId: "cs_test_mock123456",
    };
  }

  async retrieveSession(_sessionId: string): Promise<RetrievedSessionData> {
    return {
      customerEmail: "athlete@bodiedbyesh.com",
      amountTotal: 29900,
      programName: "Park-to-Peak Coaching",
      status: "complete",
    };
  }

  constructWebhookEvent(
    _payload: string,
    _signature: string,
    _secret: string
  ): any {
    return {
      id: "evt_test_mock123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_mock123",
          customer_email: "athlete@bodiedbyesh.com",
          metadata: {
            customerName: "Mock Athlete",
            programChoice: "track_a",
          },
        },
      },
    };
  }
}
