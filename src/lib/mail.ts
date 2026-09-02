import { logger, maskEmail } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/http/safe-fetch";

/**
 * Lightweight Email Utility using Resend API.
 * Uses native fetch to avoid extra package dependencies.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey && !apiKey.includes("placeholder")) {
    try {
      const response = await fetchWithTimeout("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "Bodied by Esh <noreply@bodiedbyesh.com>",
          to,
          subject,
          html,
        }),
      }, 8000);

      if (response.ok) {
        logger.info(`[Email] Successfully sent email to ${maskEmail(to)} via Resend.`);
        return true;
      } else {
        const errorText = await response.text();
        logger.error(`[Email] Resend API returned error status ${response.status}: ${errorText}`);
      }
    } catch (err) {
      logger.error("[Email] Exception encountered sending email via Resend:", err);
    }
  }

  // Fallback simulator for development
  if (process.env.NODE_ENV === "production") {
    logger.info(`[Email Simulator] Dispatched email to ${maskEmail(to)} with subject: ${subject}`);
  } else {
    logger.info(`[SIMULATED EMAIL SENT] To: ${maskEmail(to)} | Subject: ${subject}`, {
      recipient: maskEmail(to),
      subject,
      htmlLength: html.length,
      suppressInProd: true,
    });
  }
  return true;
}
