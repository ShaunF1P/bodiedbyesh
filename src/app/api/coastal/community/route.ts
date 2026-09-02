import { NextRequest, NextResponse } from "next/server";
import {
  getGroupStats,
  getGroupLeaderboard,
  getCommunityFeed,
  postEncouragement,
  toggleReaction,
  getGroup,
} from "@/lib/coastal/db";
import { requireUserSession, getAuthUser } from "@/lib/auth/user";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateRequestBody, validateQueryParams } from "@/lib/validation/api-validator";
import {
  CoastalCommunityQuerySchema,
  CoastalCommunityBodySchema,
} from "@/lib/validation/schemas";

/**
 * GET /api/coastal/community
 * Fetch group stats, leaderboard, communal milestones, and community feed
 */
export async function GET(request: NextRequest) {
  try {
    const queryValidation = validateQueryParams(
      request.nextUrl.searchParams,
      CoastalCommunityQuerySchema
    );
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { type, timeframe = "all_time", limit = 50, groupId } = queryValidation.data;

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
    logger.error("Failed to fetch community data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch community data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coastal/community
 * Post encouragement or toggle reaction (Strict session authentication required)
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

  const validation = await validateRequestBody(request, CoastalCommunityBodySchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const { action, encouragementId, reactionType, message, displayName, prayerTag, groupId } = validation.data;
    const userId = user.id;

    if (action === "react") {
      if (!encouragementId || !reactionType) {
        return NextResponse.json(
          { success: false, error: "encouragementId and reactionType are required" },
          { status: 400 }
        );
      }

      const validReactions = ["prayer", "heart", "fire", "crown"];
      if (!validReactions.includes(reactionType)) {
        return NextResponse.json(
          { success: false, error: "Invalid reactionType. Must be prayer, heart, fire, or crown." },
          { status: 400 }
        );
      }

      const result = await toggleReaction(
        encouragementId,
        userId,
        reactionType as "prayer" | "heart" | "fire" | "crown",
        supabase ?? undefined
      );

      return NextResponse.json(result);
    }

    // Default: create encouragement post
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

    const resolvedName = displayName || user.user_metadata?.full_name || "Faithful Walker";

    const result = await postEncouragement(
      {
        userId,
        groupId,
        displayName: resolvedName,
        message,
        prayerTag,
      },
      supabase ?? undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to post encouragement" },
        { status: 400 }
      );
    }

    logger.info(`[coastal-community] Posted encouragement by user ${userId.slice(0, 8)}***`);

    return NextResponse.json({ success: true, data: result.post });
  } catch (error: any) {
    logger.error("Internal community post error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
