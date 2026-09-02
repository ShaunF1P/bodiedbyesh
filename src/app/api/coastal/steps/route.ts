import { NextRequest, NextResponse } from "next/server";
import { getStepLogs, logSteps, deleteStepLog, getUserStreak, getLocalISODate } from "@/lib/coastal/db";
import { requireUserSession } from "@/lib/auth/user";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateRequestBody, validateQueryParams } from "@/lib/validation/api-validator";
import {
  CoastalStepsQuerySchema,
  CoastalStepsLogSchema,
  CoastalStepsDeleteQuerySchema,
} from "@/lib/validation/schemas";

/**
 * GET /api/coastal/steps
 * Fetch step logs and streak for authenticated user
 */
export async function GET(request: NextRequest) {
  // ── Strict Session Authentication (Anti-Spoofing) ─────────────────────
  const { user, error: authError, supabase } = await requireUserSession(request);
  if (authError || !user) {
    return authError || NextResponse.json(
      { success: false, error: "Unauthorized: Active user session required" },
      { status: 401 }
    );
  }

  const queryValidation = validateQueryParams(
    request.nextUrl.searchParams,
    CoastalStepsQuerySchema
  );
  if (!queryValidation.success) {
    return queryValidation.response;
  }

  try {
    const { startDate, endDate, groupId } = queryValidation.data;

    // Derive userId strictly from authenticated session
    const userId = user.id;

    const logs = await getStepLogs(userId, groupId, startDate, endDate, supabase ?? undefined);
    const streak = await getUserStreak(userId, groupId, supabase ?? undefined);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        streak,
        isAuthenticated: true,
      },
    });
  } catch (error: any) {
    logger.error("Failed to fetch step logs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch step logs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coastal/steps
 * Log or update daily steps
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

  const validation = await validateRequestBody(request, CoastalStepsLogSchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const { steps, logDate, distanceMiles, activeMinutes, notes, groupId } = validation.data;

    // Maximum allowed daily step count boundary (150000 to 200000 steps)
    // Derive userId exclusively from authenticated user
    const userId = user.id;
    const resolvedDate = logDate || getLocalISODate();

    const result = await logSteps(
      {
        userId,
        groupId,
        logDate: resolvedDate,
        steps,
        distanceMiles,
        activeMinutes,
        notes,
      },
      supabase ?? undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to log steps" },
        { status: 400 }
      );
    }

    const streak = await getUserStreak(userId, groupId, supabase ?? undefined);

    logger.info(`[coastal-steps] Logged ${steps} steps for user ${userId.slice(0, 8)}*** on ${resolvedDate}`);

    return NextResponse.json({
      success: true,
      data: {
        log: result.log,
        streak,
      },
    });
  } catch (error: any) {
    logger.error("Internal step logging error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coastal/steps
 * Delete a step log entry (with ownership verification)
 */
export async function DELETE(request: NextRequest) {
  // ── Strict Session Authentication (Anti-Spoofing) ─────────────────────
  const { user, error: authError, supabase } = await requireUserSession(request);
  if (authError || !user) {
    return authError || NextResponse.json(
      { success: false, error: "Unauthorized: Active user session required" },
      { status: 401 }
    );
  }

  const queryValidation = validateQueryParams(
    request.nextUrl.searchParams,
    CoastalStepsDeleteQuerySchema
  );
  if (!queryValidation.success) {
    return queryValidation.response;
  }

  try {
    const { id } = queryValidation.data;
    const userId = user.id;

    // Verify ownership before deletion if Supabase client is connected
    if (supabase) {
      const { data: existingLog, error: queryError } = await supabase
        .from("step_logs")
        .select("user_id")
        .eq("id", id)
        .maybeSingle();

      if (queryError) {
        logger.error("Error querying step log ownership:", queryError);
      } else if (existingLog && existingLog.user_id !== userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Not your step log" },
          { status: 403 }
        );
      }
    }

    const result = await deleteStepLog(id, userId, supabase ?? undefined);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to delete log" },
        { status: 400 }
      );
    }

    logger.info(`[coastal-steps] Deleted step log ${id} for user ${userId.slice(0, 8)}***`);

    return NextResponse.json({ success: true, message: "Log deleted successfully" });
  } catch (error: any) {
    logger.error("Failed to delete step log:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete step log" },
      { status: 500 }
    );
  }
}
