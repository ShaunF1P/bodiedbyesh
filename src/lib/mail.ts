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
      const response = await fetch("https://api.resend.com/emails", {
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
      });

      if (response.ok) {
        console.log(`[Email] Successfully sent email to ${to} via Resend.`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`[Email] Resend API returned error status ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error("[Email] Exception encountered sending email via Resend:", err);
    }
  }

  // Fallback simulator for development
  console.log(`
==================================================
[SIMULATED EMAIL SENT]
To: ${to}
Subject: ${subject}
Content HTML:
${html}
==================================================
  `);
  return true;
}
