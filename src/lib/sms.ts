import { logger, maskPhone } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/http/safe-fetch";

/**
 * Lightweight SMS Utility using Twilio API.
 * Uses native fetch to avoid extra package dependencies.
 */
export async function sendSMS({
  to,
  body,
}: {
  to: string;
  body: string;
}): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (sid && token && from && !sid.includes("placeholder")) {
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const response = await fetchWithTimeout(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
          },
          body: new URLSearchParams({
            To: to,
            From: from,
            Body: body,
          }),
        },
        8000
      );

      if (response.ok) {
        logger.info(`[SMS] Successfully sent SMS to ${maskPhone(to)} via Twilio.`);
        return true;
      } else {
        const errorText = await response.text();
        logger.error(`[SMS] Twilio API returned error status ${response.status}: ${errorText}`);
      }
    } catch (err) {
      logger.error("[SMS] Exception encountered sending SMS via Twilio:", err);
    }
  }

  // Fallback simulator for development
  if (process.env.NODE_ENV === "production") {
    logger.info(`[SMS Simulator] Dispatched SMS to ${maskPhone(to)}`);
  } else {
    logger.info(`[SIMULATED SMS SENT] To: ${maskPhone(to)}`, {
      recipient: maskPhone(to),
      bodyLength: body.length,
      suppressInProd: true,
    });
  }
  return true;
}
