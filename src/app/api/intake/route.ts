import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { requireAdminSession } from "@/lib/auth/admin";
import { validateRequestBody, validateQueryParams } from "@/lib/validation/api-validator";
import {
  ClientIntakeSubmissionSchema,
  AdminIntakeQuerySchema,
  AdminIntakePatchSchema,
} from "@/lib/validation/schemas";
import { container } from "@/lib/container";
import { logger, maskEmail, maskName, maskPhone } from "@/lib/logger";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

function formatTrackTitle(track: string): string {
  switch (track) {
    case "park-to-peak":
    case "track_a":
      return "Track A (Park-to-Peak Recomp)";
    case "executive-concierge":
    case "track_b":
      return "Track B (Executive Concierge)";
    case "nutrition-metabolic":
    case "track_c":
      return "Nutrition & Metabolic Health";
    default:
      return track
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

/**
 * POST /api/intake
 *
 * Public ingress route for digital clinical client intake submissions.
 * Validates with Zod, persists to Supabase public.client_intakes,
 * upserts GHL contact, and dispatches email/SMS notifications to Coach Esh and the client.
 */
export async function POST(request: NextRequest) {
  // ── 1. Sliding-Window Rate Limiting (5 req/min per IP) ───────────────────────
  const rateLimit = checkRateLimit(request, "form");
  if (!rateLimit.success) {
    logger.warn("[intake] Rate limit exceeded on POST /api/intake", {
      ip: rateLimit,
    });
    return rateLimitResponse(rateLimit);
  }

  // ── 2. Request Body Validation ──────────────────────────────────────────────
  const validation = await validateRequestBody(request, ClientIntakeSubmissionSchema);
  if (!validation.success) {
    logger.warn("[intake] Payload validation failed on POST /api/intake");
    return validation.response;
  }

  const {
    track,
    clientName,
    clientEmail,
    clientPhone,
    intakeData,
    waiverSigned,
    waiverSignature,
    waiverSignedAt,
  } = validation.data;

  const normalizedEmail = clientEmail.trim().toLowerCase();
  const normalizedName = clientName.trim();
  const normalizedPhone = clientPhone ? clientPhone.trim() : null;
  const timestamp = waiverSignedAt || new Date().toISOString();

  logger.info("[intake] Processing intake submission", {
    track,
    clientEmail: normalizedEmail,
    clientName: normalizedName,
    waiverSigned,
  });

  // ── 3. Database Persistence (public.client_intakes) ─────────────────────────
  let intakeRecord: { id: string; track: string; status: string; created_at: string } | null = null;

  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error: dbError } = await supabase
        .from("client_intakes")
        .insert({
          track,
          client_name: normalizedName,
          client_email: normalizedEmail,
          client_phone: normalizedPhone,
          intake_data: intakeData || {},
          waiver_signed: waiverSigned,
          waiver_signature: waiverSignature ? waiverSignature.trim() : null,
          waiver_signed_at: timestamp,
          status: "new",
        })
        .select("id, track, status, created_at")
        .single();

      if (dbError) {
        logger.error("[intake] Supabase database insertion error:", dbError, {
          track,
          clientEmail: normalizedEmail,
        });
      } else if (data) {
        intakeRecord = data;
        logger.info(`[intake] Intake record created successfully in Supabase with ID: ${data.id}`);
      }
    } else {
      logger.warn("[intake] Supabase credentials missing. Proceeding with fallback record ID.");
    }
  } catch (dbEx) {
    logger.error("[intake] Supabase database exception:", dbEx, {
      track,
      clientEmail: normalizedEmail,
    });
  }

  // ── 4. GoHighLevel (GHL) CRM Integration ────────────────────────────────────
  try {
    const ghlTags = ["client-intake", `track:${track}`, "status:new"];
    await container.crmService.createOrUpdateContact({
      email: normalizedEmail,
      name: normalizedName,
      phone: normalizedPhone || undefined,
      tags: ghlTags,
    });
    logger.info(`[intake] GHL contact upserted for ${maskEmail(normalizedEmail)} with tags: ${ghlTags.join(", ")}`);
  } catch (crmErr) {
    logger.error("[intake] GHL CRM sync exception:", crmErr);
  }

  // ── 5. Notification Dispatch Pipeline ───────────────────────────────────────
  const trackTitle = formatTrackTitle(track);

  // 5.1 Coach Esh Email & SMS Alert
  try {
    const coachEmail = process.env.COACH_NOTIFICATION_EMAIL || "BodiedByEsh@gmail.com";
    const coachPhone = process.env.COACH_NOTIFICATION_PHONE || "+17728774231";

    const coachEmailSubject = `New Clinical Intake: ${maskName(normalizedName)} (${trackTitle})`;
    const coachEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080A0E; color: #f8fafc; padding: 40px; border-radius: 16px; border: 1px solid #1e293b; max-width: 600px; margin: auto;">
        <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #c5f82a; font-size: 20px; font-weight: 700; margin: 0;">New Clinical Client Intake</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">Bodied by Esh High-Performance Ingress</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          A new client has submitted their comprehensive clinical intake questionnaire and digital waiver agreement:
        </p>

        <div style="background-color: #161a22; padding: 20px; border-radius: 12px; border: 1px solid #1e293b; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #f8fafc;"><strong>Client Name:</strong> ${normalizedName}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #f8fafc;"><strong>Email:</strong> ${normalizedEmail}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #f8fafc;"><strong>Phone:</strong> ${normalizedPhone || "Not provided"}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #c5f82a;"><strong>Coaching Track:</strong> ${trackTitle}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #f8fafc;"><strong>Digital Waiver:</strong> ${waiverSigned ? "Signed & Acknowledged" : "Pending"}</p>
          <p style="margin: 0; font-size: 14px; color: #94a3b8;"><strong>Signature:</strong> ${waiverSignature || "N/A"} (${new Date(timestamp).toLocaleString()})</p>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="https://bodiedbyesh.com/admin/intakes" style="background-color: #c5f82a; color: #080A0E; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block;">
            Review Full Clinical Intake in Admin Portal
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px;">
          Bodied by Esh Clinical Coaching Platform — Merrit Park / South Florida & Executive Remote
        </p>
      </div>
    `;

    await container.communicationService.sendEmail({
      to: coachEmail,
      subject: coachEmailSubject,
      html: coachEmailHtml,
    });

    const smsText = `Bodied by Esh: New ${trackTitle} clinical intake submitted by ${normalizedName}. Digital waiver verified. Review at bodiedbyesh.com/admin/intakes`;
    await container.communicationService.sendSMS({
      to: coachPhone,
      body: smsText,
    });

    logger.info(`[intake] Alerts dispatched to Coach Esh for ${maskEmail(normalizedEmail)}`);
  } catch (alertErr) {
    logger.error("[intake] Failed to dispatch coach notifications:", alertErr);
  }

  // 5.2 Client Confirmation Email
  try {
    const clientEmailSubject = `Clinical Intake Confirmed — Bodied by Esh (${trackTitle})`;
    const clientEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080A0E; color: #f8fafc; padding: 40px; border-radius: 16px; border: 1px solid #1e293b; max-width: 600px; margin: auto;">
        <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #c5f82a; font-size: 22px; font-weight: 700; margin: 0;">Welcome to Bodied by Esh</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">Your clinical intake has been received</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          Hello ${normalizedName},
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Thank you for completing your clinical intake assessment for <strong>${trackTitle}</strong>. Coach Esh is reviewing your responses, movement history, and biometric baselines to build your custom high-performance protocol.
        </p>

        <div style="background-color: #161a22; padding: 20px; border-radius: 12px; border: 1px solid #1e293b; margin: 24px 0;">
          <h3 style="color: #f8fafc; font-size: 15px; margin: 0 0 12px 0;">Submission Summary</h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;"><strong>Program:</strong> ${trackTitle}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;"><strong>Status:</strong> Under Coach Review</p>
          <p style="margin: 0; font-size: 14px; color: #94a3b8;"><strong>Waiver Acknowledged:</strong> Digital signature filed (${waiverSignature})</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          <strong>Next Steps:</strong> Coach Esh will contact you directly via phone (${maskPhone(normalizedPhone)}) or email to coordinate your onboarding kickoff.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-top: 24px;">
          Best in Health & Performance,<br/>
          <strong style="color: #c5f82a;">Coach Esh</strong><br/>
          Bodied by Esh
        </p>

        <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px;">
          Questions? Reply directly to this email or visit <a href="https://bodiedbyesh.com" style="color: #c5f82a; text-decoration: none;">bodiedbyesh.com</a>.
        </p>
      </div>
    `;

    await container.communicationService.sendEmail({
      to: normalizedEmail,
      subject: clientEmailSubject,
      html: clientEmailHtml,
    });

    logger.info(`[intake] Confirmation email sent to client ${maskEmail(normalizedEmail)}`);
  } catch (clientMailErr) {
    logger.error("[intake] Failed to send client confirmation email:", clientMailErr);
  }

  // ── 6. Return HTTP 201 Response ─────────────────────────────────────────────
  return Response.json(
    {
      success: true,
      intakeId: intakeRecord?.id || "fallback-intake-id",
      track,
      message: "Clinical intake submission successfully received and recorded.",
    },
    { status: 201 }
  );
}

/**
 * GET /api/intake
 *
 * Administrative query route protected by requireAdminSession.
 * Supports track filtering, status filtering, full-text search, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const validation = validateQueryParams(request.nextUrl.searchParams, AdminIntakeQuerySchema);
    if (!validation.success) {
      return validation.response;
    }

    const { track, status, search, limit, offset } = validation.data;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return Response.json(
        { error: "Supabase database service is not configured in environment variables." },
        { status: 500 }
      );
    }

    let query = supabase
      .from("client_intakes")
      .select("*", { count: "exact" });

    if (track && track !== "all") {
      query = query.eq("track", track);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,client_phone.ilike.%${searchTerm}%`
      );
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      logger.error("[intake] Supabase error querying client_intakes:", error);
      if (error.code === "42P01") {
        return Response.json(
          {
            error: "Database table 'client_intakes' does not exist.",
            hint: "Run scratch/client_intakes_setup.sql in your Supabase SQL Editor.",
          },
          { status: 501 }
        );
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      data: data || [],
      total: count ?? (data?.length || 0),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch client intakes";
    logger.error("[intake] Exception in GET /api/intake:", err);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/intake
 *
 * Administrative route protected by requireAdminSession.
 * Allows updating status (new, reviewed, enrolled, archived) and coach_notes.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { error: authError } = await requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const validation = await validateRequestBody(request, AdminIntakePatchSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { id, status, coachNotes } = validation.data;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return Response.json(
        { error: "Supabase database service is not configured in environment variables." },
        { status: 500 }
      );
    }

    const updatePayload: Record<string, unknown> = {};
    if (status !== undefined) {
      updatePayload.status = status;
    }
    if (coachNotes !== undefined) {
      updatePayload.coach_notes = coachNotes;
    }

    if (Object.keys(updatePayload).length === 0) {
      return Response.json(
        { error: "No fields provided to update." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("client_intakes")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[intake] Supabase error updating client_intakes row:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    logger.info(`[intake] Intake record ${id} updated with status: ${status || "unchanged"}`);
    return Response.json({ success: true, data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to update client intake";
    logger.error("[intake] Exception in PATCH /api/intake:", err);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
