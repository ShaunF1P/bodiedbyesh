import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { ghl } from "@/lib/ghl";
import { logger, maskEmail, maskName } from "@/lib/logger";
import { StripeWebhookHeaderSchema } from "@/lib/validation/schemas";
import { container } from "@/lib/container";

/**
 * POST /api/webhook/stripe
 *
 * Stripe sends webhook events here. We verify the signature, then
 * handle relevant events:
 *   - checkout.session.completed  → update GHL opportunity to Active
 *   - customer.subscription.deleted → log cancellation
 */
export async function POST(request: NextRequest) {
  const stripe = await getStripe();

  // ── If Stripe isn't configured, acknowledge but skip ──────────────────
  if (!stripe) {
    return Response.json(
      { received: true, message: "Stripe not configured — event ignored" },
      { status: 200 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return Response.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // ── Verify signature header with Zod schema ────────────────────────────
  const sigHeader = request.headers.get("stripe-signature");
  const headerValidation = StripeWebhookHeaderSchema.safeParse({
    stripeSignature: sigHeader || "",
  });

  if (!headerValidation.success) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();
  const sig = headerValidation.data.stripeSignature;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    logger.error("[stripe-webhook] Signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Handle events ─────────────────────────────────────────────────────
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      logger.info(
        `[stripe-webhook] [SUCCESS] Checkout completed — session ${session.id}, email: ${maskEmail(session.customer_email)}`
      );

      // ── Update lead status in Supabase ────────────────────────────────────
      const customerEmail = session.customer_email || session.customer_details?.email;
      if (customerEmail) {
        const cleanedEmail = customerEmail.trim().toLowerCase();
        
        // Update status in Supabase
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (url && key) {
            const supabase = createClient(url, key);
            const { error } = await supabase
              .from("coaching_leads")
              .update({ status: "active" })
              .eq("email", cleanedEmail);

            if (error) {
              logger.error("[stripe-webhook] Supabase lead update error:", error);
            } else {
              logger.info(`[stripe-webhook] Updated lead status in Supabase to active for ${maskEmail(cleanedEmail)}`);
            }
          }
        } catch (dbErr) {
          logger.error("[stripe-webhook] Supabase update exception:", dbErr);
        }

        // Send payment confirmation email to client via container
        try {
          const customerName = session.metadata?.customerName || "Athlete";
          const programChoice = session.metadata?.programChoice || "coaching program";
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bodiedbyesh.com";
          
          const clientSubject = "Welcome to Bodied by Esh - Action Required!";
          const clientHtml = `
            <div style="font-family: sans-serif; background-color: #080A0E; color: #f8fafc; padding: 40px; border-radius: 16px; border: 1px solid #1e293b; max-width: 600px; margin: auto;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 24px; font-weight: bold; color: #c5f82a; letter-spacing: 1px;">BODIED BY ESH</span>
              </div>
              <h1 style="color: #f8fafc; font-size: 22px; font-weight: bold; margin-bottom: 16px;">Welcome to the Roster, ${customerName}!</h1>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Your payment for the <strong>${programChoice === 'track_a' ? 'Park-to-Peak' : 'Executive Concierge'} Coaching Program</strong> has been successfully received. We are thrilled to partner with you to transform your physical architecture.
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-top: 20px;">
                <strong>CRITICAL NEXT STEP:</strong> To finalize your onboarding and unlock your client portal macros, please schedule your 15-minute Strategy Kickoff Call with Coach Esh:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${siteUrl}/success?session_id=${session.id}" style="background-color: #c5f82a; color: #080A0E; font-size: 12px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                  Schedule Kickoff Call
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 20px;">
                If you have any questions, you can reply directly to this email or send an SMS to 772-877-4231.
              </p>
            </div>
          `;

          await container.communicationService.sendEmail({
            to: cleanedEmail,
            subject: clientSubject,
            html: clientHtml,
          });

          // Send alerts to Coach Esh
          const adminEmail = process.env.COACH_NOTIFICATION_EMAIL || "BodiedByEsh@gmail.com";
          const adminPhone = process.env.COACH_NOTIFICATION_PHONE || "+17728774231";
          
          await container.communicationService.sendEmail({
            to: adminEmail,
            subject: `Payment Received: ${maskName(customerName)}`,
            html: `
              <div style="font-family: sans-serif; background-color: #080A0E; color: #f8fafc; padding: 40px; border-radius: 16px; border: 1px solid #1e293b; max-width: 600px; margin: auto;">
                <h2 style="color: #c5f82a; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Coaching Payment Completed</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
                  A new client has completed their Stripe checkout payment:
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; background-color: #161a22; padding: 16px; border-radius: 12px; border: 1px solid #1e293b;">
                  <strong>Name:</strong> ${customerName}<br/>
                  <strong>Email:</strong> ${cleanedEmail}<br/>
                  <strong>Program Track:</strong> ${programChoice}<br/>
                  <strong>Stripe Session:</strong> ${session.id}
                </p>
              </div>
            `,
          });

          const programName =
            programChoice === "track_a"
              ? "Park-to-Peak"
              : programChoice === "track_b"
              ? "Executive Concierge"
              : programChoice || "Coaching Program";

          await container.communicationService.sendSMS({
            to: adminPhone,
            body: `Bodied by Esh Lead: ${customerName} is inquiring about ${programName}.`,
          });

        } catch (mailErr) {
          logger.error("[stripe-webhook] Notification execution failed:", mailErr);
        }
      }

      // Move GHL opportunity to "Active Client" stage
      const stageActive = process.env.GHL_STAGE_ACTIVE;
      const opportunityId = session.metadata?.opportunityId;

      if (stageActive && opportunityId) {
        try {
          await ghl.updateOpportunityStage({
            opportunityId,
            stageId: stageActive,
          });
          logger.info(
            `[stripe-webhook] GHL opportunity ${opportunityId} moved to Active`
          );
        } catch (ghlErr) {
          logger.error("[stripe-webhook] Failed to update GHL:", ghlErr);
        }
      } else {
        logger.warn(
          "[stripe-webhook] Skipping GHL update — missing GHL_STAGE_ACTIVE or opportunityId in metadata"
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      logger.info(
        `[stripe-webhook] [CANCELLED] Subscription cancelled — sub ${subscription.id}, customer: ${subscription.customer}`
      );
      break;
    }

    default:
      logger.info(`[stripe-webhook] Unhandled event type: ${event.type}`);
  }

  return Response.json({ received: true });
}
