import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { joinGroup, getGroup } from "@/lib/coastal/db";

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
 * POST /api/coastal/join
 * Join Coastal Community Church (#3266) Walking Group
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { groupSlug, displayName, isAnonymous } = body;

    const auth = await getAuthUser(request);
    const userId = auth?.user?.id || body.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication or user ID is required to join" },
        { status: 401 }
      );
    }

    const resolvedSlug = groupSlug || "coastal";
    const resolvedName =
      displayName || auth?.user?.user_metadata?.full_name || "Faithful Walker";

    const result = await joinGroup(
      userId,
      resolvedSlug,
      resolvedName,
      Boolean(isAnonymous),
      auth?.supabase
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to join group" },
        { status: 400 }
      );
    }

    const group = await getGroup(resolvedSlug, auth?.supabase);

    return NextResponse.json({
      success: true,
      data: {
        member: result.member,
        group,
        isNew: result.isNew,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
