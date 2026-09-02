/**
 * Stripe Client
 *
 * Uses dynamic import so the project compiles even when the `stripe`
 * npm package is not yet installed.
 *
 * To install:  npm install stripe
 *
 * Set STRIPE_SECRET_KEY in .env.local before using.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stripeInstance: any = null;

/**
 * Returns a configured Stripe instance, or `null` when
 * STRIPE_SECRET_KEY is not set (dev/preview mode).
 */
export async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("[Stripe] STRIPE_SECRET_KEY not set — running in mock mode.");
    return null;
  }

  if (!stripeInstance) {
    try {
      // Dynamic import so the build doesn't crash if `stripe` isn't installed
      const { default: Stripe } = await import("stripe");
      stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-06-20" as any,
        typescript: true,
        timeout: 8000,
        maxNetworkRetries: 2,
      });
    } catch {
      console.error(
        "[Stripe] Failed to import stripe — run `npm install stripe`"
      );
      return null;
    }
  }

  return stripeInstance;
}
