import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getStepLogs, logSteps, deleteStepLog, getUserStreak } from "@/lib/coastal/db";

async function getAuthUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op in route handler
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    return user ? { user, supabase } : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/coastal/steps
 * Fetch step logs and streak for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const groupId = searchParams.get("groupId") || undefined;

    const auth = await getAuthUser(request);
    const userId = auth?.user?.id || searchParams.get("userId") || "guest-user";

    const logs = await getStepLogs(userId, groupId, startDate, endDate, auth?.supabase);
    const streak = await getUserStreak(userId, groupId, auth?.supabase);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        streak,
        isAuthenticated: !!auth?.user,
      },
    });
  } catch (error: any) {
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
  try {
    const body = await request.json();
    const { steps, logDate, distanceMiles, activeMinutes, notes, groupId } = body;

    if (steps === undefined || steps === null || typeof steps !== "number") {
      return NextResponse.json(
        { success: false, error: "Numeric steps count is required" },
        { status: 400 }
      );
    }

    if (steps < 0 || steps > 150000) {
      return NextResponse.json(
        { success: false, error: "Step count must be between 0 and 150,000" },
        { status: 400 }
      );
    }

    const auth = await getAuthUser(request);
    const userId = auth?.user?.id || body.userId || "guest-user";
    const resolvedDate = logDate || new Date().toISOString().split("T")[0];

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
      auth?.supabase
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to log steps" },
        { status: 400 }
      );
    }

    const streak = await getUserStreak(userId, groupId, auth?.supabase);

    return NextResponse.json({
      success: true,
      data: {
        log: result.log,
        streak,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coastal/steps
 * Delete a step log entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Step log ID is required" },
        { status: 400 }
      );
    }

    const auth = await getAuthUser(request);
    const userId = auth?.user?.id || searchParams.get("userId") || "guest-user";

    const result = await deleteStepLog(id, userId, auth?.supabase);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to delete log" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Log deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete step log" },
      { status: 500 }
    );
  }
}
