import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger, maskEmail, maskName } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation/api-validator";
import { GHLContactLeadSchema } from "@/lib/validation/schemas";
import { container } from "@/lib/container";

/**
 * POST /api/ghl-contact
 *
 * Captures a new lead from the website form, saves it in Supabase,
 * upserts the contact in GoHighLevel, and creates an opportunity in the coaching pipeline.
 *
 * Body: { name, email, phone, programChoice, trackGoal, source }
 */
export async function POST(request: NextRequest) {
  // ── Rate Limiting (5 requests/minute per IP) ──────────────────────────
  const rateLimit = checkRateLimit(request, "form");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const validation = await validateRequestBody(request, GHLContactLeadSchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const { name, email, phone, programChoice, trackGoal, source } = validation.data;

    // ── Save Lead to Supabase (Internal Backup Pipeline) ──────────────────
    let leadId: string | undefined;
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (url && key) {
        const supabase = createClient(url, key);
        const { data, error } = await supabase
          .from("coaching_leads")
          .insert({
            name: name.trim(),
            email: email.trim(),
            phone: phone ? phone.trim() : null,
            program_choice: programChoice || null,
            track_goal: trackGoal || null,
            source: source || "website",
            status: "new"
          })
          .select("id")
          .single();

        if (error) {
          logger.error("[ghl-contact] Supabase lead insertion error:", error);
        } else if (data) {
          leadId = data.id;
          logger.info(`[ghl-contact] Lead saved to Supabase with ID: ${leadId}`);
        }
      } else {
        logger.warn("[ghl-contact] Supabase credentials missing. Skipping DB save.");
      }
    } catch (dbErr) {
      logger.error("[ghl-contact] Supabase DB exception:", dbErr);
    }

    // ── Send notifications to Coach Esh via Communication Service Port ───
    try {
      const adminEmail = process.env.COACH_NOTIFICATION_EMAIL || "BodiedByEsh@gmail.com";
      const adminPhone = process.env.COACH_NOTIFICATION_PHONE || "+17728774231";
      
      const notificationSubject = `New Website Signup: ${maskName(name)}`;
      const notificationHtml = `
        <div style="font-family: sans-serif; background-color: #080A0E; color: #f8fafc; padding: 40px; border-radius: 16px; border: 1px solid #1e293b; max-width: 600px; margin: auto;">
          <h2 style="color: #c5f82a; font-size: 20px; font-weight: bold; margin-bottom: 16px;">New Lead Alert</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
            A new user has signed up or applied on the site:
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; background-color: #161a22; padding: 16px; border-radius: 12px; border: 1px solid #1e293b;">
            <strong>Name:</strong> ${name}<br/>
            <strong>Email:</strong> ${email.trim().toLowerCase()}<br/>
            <strong>Phone:</strong> ${phone ? phone.trim() : "Not provided"}<br/>
            <strong>Program Track:</strong> ${programChoice || "Not provided"}<br/>
            <strong>Fitness Goal:</strong> ${trackGoal || "Not provided"}<br/>
            <strong>Source Event:</strong> ${source || "website"}
          </p>
          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
            Manage all profiles in the <a href="https://bodiedbyesh.com/admin" style="color: #c5f82a; text-decoration: none;">Coach Admin Panel</a>.
          </p>
        </div>
      `;

      await container.communicationService.sendEmail({
        to: adminEmail,
        subject: notificationSubject,
        html: notificationHtml,
      });

      const programName =
        programChoice === "track_a"
          ? "Park-to-Peak"
          : programChoice === "track_b"
          ? "Executive Concierge"
          : programChoice === "Portal Access Request"
          ? "Client Portal Access"
          : programChoice || "Coaching Program";

      await container.communicationService.sendSMS({
        to: adminPhone,
        body: `Bodied by Esh Lead: ${name} is inquiring about ${programName}.`,
      });
    } catch (notifyErr) {
      logger.error("[ghl-contact] Failed to trigger email/SMS notifications:", notifyErr);
    }

    // ── Build tags for GHL ────────────────────────────────────────────────
    const tags: string[] = ["bodied-lead"];
    if (programChoice) tags.push(programChoice);
    if (trackGoal) tags.push(trackGoal);
    if (source) tags.push(`source:${source}`);

    // ── Upsert contact in GHL via CRM Service Port ────────────────────────
    let contactId: string | undefined;
    let opportunityId: string | undefined;

    try {
      // Check if GHL is using placeholders
      const apiKey = process.env.GHL_API_KEY;
      if (!apiKey || apiKey.includes("placeholder")) {
        logger.warn("[GHL] GHL_API_KEY is a placeholder — skipping GHL integration (relying on Supabase).");
      } else {
        const contact = await container.crmService.createOrUpdateContact({
          email,
          name,
          phone: phone || undefined,
          tags,
        });

        contactId = contact.id;
        logger.info(`[GHL] Contact upserted: ${contact.id} (${maskEmail(email)})`);

        // ── Create opportunity in coaching pipeline ───────────────────────────
        const pipelineId = process.env.GHL_PIPELINE_ID;
        const stageId = process.env.GHL_STAGE_NEW_LEAD;

        if (pipelineId && stageId && !pipelineId.includes("placeholder") && !stageId.includes("placeholder")) {
          const opportunity = await container.crmService.createOpportunity({
            contactId: contact.id,
            pipelineId,
            stageId,
            name: `${name} — ${programChoice || "General Inquiry"}`,
          });
          opportunityId = opportunity.id;
          logger.info(`[GHL] Opportunity created: ${opportunity.id}`);
        } else {
          logger.warn(
            "[GHL] GHL_PIPELINE_ID or GHL_STAGE_NEW_LEAD not fully configured — skipping opportunity creation."
          );
        }
      }
    } catch (ghlErr) {
      logger.error("[ghl-contact] GHL integration failed, continuing with fallback:", ghlErr);
    }

    return Response.json({
      success: true,
      contactId: contactId || "fallback_contact_id",
      opportunityId: opportunityId || "fallback_opportunity_id",
      leadId: leadId || null,
    });
  } catch (err) {
    logger.error("[ghl-contact] Major exception:", err);
    return Response.json(
      { error: "Failed to process lead fully, but checkout flow is active", success: true },
      { status: 200 }
    );
  }
}
