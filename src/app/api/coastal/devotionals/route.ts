import { NextRequest, NextResponse } from "next/server";
import {
  getDailyDevotional,
  getAllDevotionals,
  getReflections,
  saveReflection,
} from "@/lib/coastal/db";
import { DevotionalReflection } from "@/types/coastal";
import { requireUserSession, getAuthUser } from "@/lib/auth/user";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateRequestBody, validateQueryParams } from "@/lib/validation/api-validator";
import {
  CoastalDevotionalQuerySchema,
  CoastalDevotionalReflectionSchema,
} from "@/lib/validation/schemas";

/**
 * GET /api/coastal/devotionals
 * Fetch active daily devotional or full 14-day curriculum
 */
export async function GET(request: NextRequest) {
  try {
    const queryValidation = validateQueryParams(
      request.nextUrl.searchParams,
      CoastalDevotionalQuerySchema
    );
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { day, date, all, groupId } = queryValidation.data;

    const auth = await getAuthUser(request);
    const client = auth?.supabase;

    if (all === "true") {
      const devotionals = getAllDevotionals();
      return NextResponse.json({
        success: true,
        data: {
          devotionals,
          total: devotionals.length,
        },
      });
    }

    const dayOrDate = day ? parseInt(day, 10) : date || undefined;
    const devotional = await getDailyDevotional(dayOrDate, groupId, client);

    let reflections: DevotionalReflection[] = [];
    if (auth?.user) {
      reflections = await getReflections(auth.user.id, groupId, client);
    }

    return NextResponse.json({
      success: true,
      data: {
        devotional,
        reflections,
      },
    });
  } catch (error: any) {
    logger.error("Failed to fetch devotional data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch devotional data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coastal/devotionals
 * Save reflection journal entry (Strict session authentication required)
 */
export async function POST(request: NextRequest) {
  // ── Rate Limiting (30 requests/minute per IP) ──────────────────────────
  const rateLimit = checkRateLimit(request, "auth");
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

  const validation = await validateRequestBody(request, CoastalDevotionalReflectionSchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const { devotionalId, dayNumber, reflectionText, isShared, groupId } = validation.data;
    const userId = user.id;

    const result = await saveReflection(
      {
        userId,
        devotionalId,
        dayNumber: dayNumber ? parseInt(dayNumber.toString(), 10) : undefined,
        reflectionText,
        isShared: Boolean(isShared),
        groupId,
      },
      supabase ?? undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to save reflection" },
        { status: 400 }
      );
    }

    logger.info(`[coastal-devotionals] Saved reflection for day ${dayNumber || 1} by user ${userId.slice(0, 8)}***`);

    return NextResponse.json({ success: true, data: result.reflection });
  } catch (error: any) {
    logger.error("Internal devotional save error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
