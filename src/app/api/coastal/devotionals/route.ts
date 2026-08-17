import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getDailyDevotional,
  getAllDevotionals,
  getReflections,
  saveReflection,
} from "@/lib/coastal/db";
import { DevotionalReflection } from "@/types/coastal";

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
 * GET /api/coastal/devotionals
 * Fetch active daily devotional or full 14-day curriculum
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get("day");
    const date = searchParams.get("date");
    const all = searchParams.get("all") === "true";
    const groupId = searchParams.get("groupId") || undefined;

    const auth = await getAuthUser(request);
    const client = auth?.supabase;

    if (all) {
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
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch devotional data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coastal/devotionals
 * Save reflection journal entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { devotionalId, dayNumber, reflectionText, isShared, groupId } = body;

    if (!devotionalId) {
      return NextResponse.json(
        { success: false, error: "devotionalId is required" },
        { status: 400 }
      );
    }

    if (!reflectionText || typeof reflectionText !== "string" || reflectionText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Reflection text cannot be empty" },
        { status: 400 }
      );
    }

    if (reflectionText.length > 4000) {
      return NextResponse.json(
        { success: false, error: "Reflection cannot exceed 4,000 characters" },
        { status: 400 }
      );
    }

    const auth = await getAuthUser(request);
    const userId = auth?.user?.id || body.userId || "guest-user";

    const result = await saveReflection(
      {
        userId,
        devotionalId,
        dayNumber: dayNumber ? parseInt(dayNumber.toString(), 10) : undefined,
        reflectionText,
        isShared: Boolean(isShared),
        groupId,
      },
      auth?.supabase
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to save reflection" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.reflection });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
