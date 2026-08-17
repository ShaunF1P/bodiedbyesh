import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/mail";
import { sendSMS } from "@/lib/sms";

/**
 * POST /api/book-appointment
 *
 * Processes client Strategy Kickoff call booking.
 * Sends email confirmation to client, and email/SMS alerts to Coach Esh.
 *
 * Body: { email, name, programName, slot }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, programName, slot } = body;

    if (!slot) {
      return Response.json(
        { error: "Missing selected appointment slot" },
        { status: 400 }
      );
    }

    const resolvedEmail = (email || "client@bodiedbyesh.com").trim().toLowerCase();
    const resolvedName = (name || "Athlete").trim();
    const resolvedProgram = (programName || "Coaching Program").trim();

    // ── 1. Send confirmation email to client ───────────────────────────────
    const clientSubject = `Strategy Kickoff Scheduled: ${slot}`;
    const clientHtml = `
      <div style="font-family: sans-serif; background-color: #080A0E; color: #f8fafc; padding: 40px; border-radius: 16px; border: 1px solid #1e293b; max-width: 600px; margin: auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: bold; color: #c5f82a; letter-spacing: 1px;">BODIED BY ESH</span>
        </div>
        <h1 style="color: #f8fafc; font-size: 22px; font-weight: bold; margin-bottom: 16px; text-align: center;">Kickoff Call Scheduled!</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
          Hello ${resolvedName},
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
          Your 15-minute Strategy Kickoff Call with Coach Esh has been successfully confirmed.
        </p>
        <div style="background-color: #161a22; border: 1px solid #c5f82a; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <div style="font-size: 10px; text-transform: uppercase; tracking-wider; color: #94a3b8; margin-bottom: 4px;">Selected Time Slot</div>
          <span style="color: #c5f82a; font-size: 16px; font-weight: bold; font-family: sans-serif;">${slot}</span>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
          Coach Esh will call you directly at your provided phone number or send a video meeting link. Please make sure you are in a quiet environment and ready to align on your custom macro splits and weight targets.
        </p>
        <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 20px;">
          If you need to reschedule, please reply directly to this email or send an SMS to 772-877-4231.
        </p>
      </div>
    `;

    await sendEmail({
      to: resolvedEmail,
      subject: clientSubject,
      html: clientHtml,
    });

    // ── 2. Send email & SMS notifications to Coach Esh ─────────────────────
    const adminEmail = process.env.COACH_NOTIFICATION_EMAIL || "BodiedByEsh@gmail.com";
    const adminPhone = process.env.COACH_NOTIFICATION_PHONE || "+17728774231";

    const adminSubject = `New Kickoff Call Scheduled: ${resolvedName}`;
    const adminHtml = `
      <div style="font-family: sans-serif; background-color: #080A0E; color: #f8fafc; padding: 40px; border-radius: 16px; border: 1px solid #1e293b; max-width: 600px; margin: auto;">
        <h2 style="color: #c5f82a; font-size: 20px; font-weight: bold; margin-bottom: 16px;">New Kickoff Call Booked</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
          A client has scheduled their Strategy Kickoff Call:
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; background-color: #161a22; padding: 16px; border-radius: 12px; border: 1px solid #1e293b;">
          <strong>Client Name:</strong> ${resolvedName}<br/>
          <strong>Client Email:</strong> ${resolvedEmail}<br/>
          <strong>Selected Program:</strong> ${resolvedProgram}<br/>
          <strong>Scheduled Time:</strong> ${slot}
        </p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
    });

    await sendSMS({
      to: adminPhone,
      body: `Bodied by Esh Lead: ${resolvedName} is inquiring about ${resolvedProgram}. Kickoff scheduled: ${slot}.`,
    });

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("[book-appointment] Error:", err);
    return Response.json(
      { error: err.message || "Failed to process appointment booking" },
      { status: 500 }
    );
  }
}
