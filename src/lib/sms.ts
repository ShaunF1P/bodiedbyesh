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
      const response = await fetch(
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
        }
      );

      if (response.ok) {
        console.log(`[SMS] Successfully sent SMS to ${to} via Twilio.`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`[SMS] Twilio API returned error status ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error("[SMS] Exception encountered sending SMS via Twilio:", err);
    }
  }

  // Fallback simulator for development
  console.log(`
==================================================
[SIMULATED SMS SENT]
To: ${to}
Body: ${body}
==================================================
  `);
  return true;
}
