import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getGroupStats,
  getGroupLeaderboard,
  getCommunityFeed,
  postEncouragement,
  toggleReaction,
  getGroup,
} from "@/lib/coastal/db";

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
 * GET /api/coastal/community
 * Fetch group stats, leaderboard, communal milestones, and community feed
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // 'stats' | 'leaderboard' | 'feed' | 'all'
    const timeframe = searchParams.get("timeframe") || "all_time";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const groupId = searchParams.get("groupId") || undefined;

    const auth = await getAuthUser(request);
    const client = auth?.supabase;

    if (type === "stats") {
      const stats = await getGroupStats(groupId, client);
      return NextResponse.json({ success: true, data: stats });
    }

    if (type === "leaderboard") {
      const leaderboard = await getGroupLeaderboard(groupId, timeframe, limit, client);
      return NextResponse.json({ success: true, data: leaderboard });
    }

    if (type === "feed") {
      const feed = await getCommunityFeed(groupId, limit, client);
      return NextResponse.json({ success: true, data: feed });
    }

    // Default: fetch all community components
    const [group, stats, leaderboard, feed] = await Promise.all([
      getGroup("coastal", client),
      getGroupStats(groupId, client),
      getGroupLeaderboard(groupId, timeframe, limit, client),
      getCommunityFeed(groupId, limit, client),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        group,
        stats,
        leaderboard,
        feed,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch community data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coastal/community
 * Post encouragement or toggle reaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body; // 'post' | 'react'
    const auth = await getAuthUser(request);
    const userId = auth?.user?.id || body.userId || "guest-user";

    if (action === "react") {
      const { encouragementId, reactionType } = body;
      if (!encouragementId || !reactionType) {
        return NextResponse.json(
          { success: false, error: "encouragementId and reactionType are required" },
          { status: 400 }
        );
      }

      const result = await toggleReaction(
        encouragementId,
        userId,
        reactionType,
        auth?.supabase
      );

      return NextResponse.json(result);
    }

    // Default: create encouragement post
    const { message, displayName, prayerTag, groupId } = body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Encouragement message cannot be empty" },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Message cannot exceed 1,000 characters" },
        { status: 400 }
      );
    }

    const resolvedName = displayName || auth?.user?.user_metadata?.full_name || "Faithful Walker";

    const result = await postEncouragement(
      {
        userId,
        groupId,
        displayName: resolvedName,
        message,
        prayerTag,
      },
      auth?.supabase
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to post encouragement" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.post });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
