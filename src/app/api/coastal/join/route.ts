import { NextRequest, NextResponse } from "next/server";
import { joinGroup, getGroup } from "@/lib/coastal/db";
import { requireUserSession } from "@/lib/auth/user";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation/api-validator";
import { CoastalJoinGroupSchema } from "@/lib/validation/schemas";

/**
 * POST /api/coastal/join
 * Join Coastal Community Church (#3266) Walking Group (Strict session authentication required)
 */
export async function POST(request: NextRequest) {
  // ── Rate Limiting (5 requests/minute per IP) ──────────────────────────
  const rateLimit = checkRateLimit(request, "form");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  // ── Strict Session Authentication (Anti-Spoofing) ─────────────────────
  const { user, error: authError, supabase } = await requireUserSession(request);
  if (authError || !user) {
    return authError || NextResponse.json(
      { success: false, error: "Unauthorized: Active user session required" },
      { status: 401 }
    );
  }

  const validation = await validateRequestBody(request, CoastalJoinGroupSchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const { groupSlug, displayName, isAnonymous } = validation.data;

    // Derive userId strictly from authenticated session
    const userId = user.id;

    const resolvedSlug = groupSlug || "coastal";
    const resolvedName =
      displayName || user.user_metadata?.full_name || "Faithful Walker";

    const result = await joinGroup(
      userId,
      resolvedSlug,
      resolvedName,
      Boolean(isAnonymous),
      supabase ?? undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to join group" },
        { status: 400 }
      );
    }

    const group = await getGroup(resolvedSlug, supabase ?? undefined);

    logger.info(`[coastal-join] User ${userId.slice(0, 8)}*** joined group ${resolvedSlug}`);

    return NextResponse.json({
      success: true,
      data: {
        member: result.member,
        group,
        isNew: result.isNew,
      },
    });
  } catch (error: any) {
    logger.error("Internal group join error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
