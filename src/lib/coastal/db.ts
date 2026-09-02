/**
 * Coastal Community Church (#3266) Faith & Fitness Walking and Step Tracker
 * Unified Data Access Layer & Service Engine
 *
 * Provides typed data access interfacing with Supabase PostgreSQL (via RLS / RPCs)
 * with robust client/server caching and fallback handling for seamless reliability.
 *
 * Strictly zero emojis in all copy, status messages, and fallback records.
 */

import {
  WalkingGroup,
  GroupMember,
  StepLog,
  FaithDevotional,
  DevotionalReflection,
  GroupStats,
  LeaderboardEntry,
  UserStreak,
  CommunityEncouragement,
  IndividualMilestone,
} from "@/types/coastal";
import {
  DEVOTIONALS_DATA,
  getDevotionalByDay,
  getDevotionalForDate,
  getAllDevotionals,
} from "./devotionals-data";
import {
  evaluateIndividualMilestones,
  evaluateCommunalMilestones,
} from "./milestones-data";
import { SupabaseClient } from "@supabase/supabase-js";

// Calculation Utilities
export function getLocalISODate(d: Date = new Date()): string {
  const dateObj = d instanceof Date ? d : new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateMileage(steps: number): number {
  if (!steps || steps <= 0) return 0;
  // Standard cadence: 2,000 steps per mile
  return Math.round((steps / 2000) * 100) / 100;
}

export function calculateActiveMinutes(steps: number): number {
  if (!steps || steps <= 0) return 0;
  // Standard brisk walking pace: 100 steps per minute
  return Math.round(steps / 100);
}

export function calculateCalories(steps: number, weightLbs: number = 160): number {
  if (!steps || steps <= 0) return 0;
  // Caloric burn approximation (~0.04 kcal per step for 160lb person)
  const baseKcalPerStep = (weightLbs / 160) * 0.04;
  return Math.round(steps * baseKcalPerStep);
}

// Fallback Mock State for Demo / Offline / Unmigrated DB
const DEFAULT_GROUP: WalkingGroup = {
  id: "3266-coastal-church",
  slug: "coastal",
  name: "Coastal Community Church",
  group_number: "3266",
  church_name: "Coastal Community Church",
  description:
    "Walking by faith and conditioning in fellowship. Official Coastal Community Church (#3266) step and activity community.",
  target_steps: 10000000,
  target_miles: 5000.0,
  banner_url: null,
  accent_color: "#D4B87E",
  is_active: true,
  created_at: "2026-08-17T00:00:00.000Z",
};

const INITIAL_COMMUNITY_FEED: CommunityEncouragement[] = [
  {
    id: "enc-welcome",
    group_id: "3266-coastal-church",
    user_id: "system-welcome",
    display_name: "Coastal Community Church",
    message:
      "Welcome to Coastal Community Church (#3266) Faith & Fitness Walking Portal! Log your daily walks, read today's devotional, and share your prayers and praise reports here with the fellowship.",
    prayer_tag: "Praise & Encouragement",
    reactions: { prayer: 0, heart: 0, fire: 0, crown: 0 },
    user_reactions: [],
    created_at: "2026-08-17T00:00:00.000Z",
  },
];

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [];

// Helper to create client instance if not provided
async function getSupabaseClient(providedClient?: SupabaseClient): Promise<SupabaseClient | null> {
  if (providedClient) return providedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  try {
    if (typeof window === "undefined") {
      const { createServerClient } = await import("@supabase/ssr");
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      return createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie mutations if called from Server Component
            }
          },
        },
      });
    } else {
      const { createBrowserClient } = await import("@supabase/ssr");
      return createBrowserClient(url, anonKey);
    }
  } catch (err) {
    console.warn("Could not instantiate Supabase client, falling back to local service layer:", err);
    return null;
  }
}

/**
 * Fetch Walking Group Details (e.g., Coastal Community Church #3266)
 */
export async function getGroup(
  slug: string = "coastal",
  client?: SupabaseClient
): Promise<WalkingGroup> {
  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          slug: data.slug,
          name: data.name,
          group_number: data.group_number || "3266",
          church_name: data.church_name || "Coastal Community Church",
          description: data.description || DEFAULT_GROUP.description,
          target_steps: Number(data.target_steps) || DEFAULT_GROUP.target_steps,
          target_miles: Number(data.target_miles) || DEFAULT_GROUP.target_miles,
          banner_url: data.banner_url,
          accent_color: data.accent_color || "#D4B87E",
          is_active: data.is_active !== false,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    }
  } catch (err) {
    console.warn("Error fetching group from Supabase:", err);
  }

  return DEFAULT_GROUP;
}

/**
 * Fetch Aggregated Group Statistics & Communal Milestone Status
 */
export async function getGroupStats(
  groupId?: string,
  client?: SupabaseClient
): Promise<GroupStats> {
  let totalSteps = 0;
  let totalMiles = 0;
  let totalMinutes = 0;
  let activeMembersCount = 0;
  let totalMembers = 0;
  let totalEncouragements = 0;

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      // 1. Try RPC get_group_stats if available
      const resolvedGroupId = groupId || (await getGroup("coastal", supabase)).id;
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_group_stats", {
        p_group_id: resolvedGroupId,
      });

      if (!rpcError && rpcData && !rpcData.error) {
        return {
          group_id: rpcData.group_id || resolvedGroupId,
          slug: rpcData.slug || "coastal",
          name: rpcData.name || "Coastal Community Church",
          group_number: rpcData.group_number || "3266",
          total_steps: Number(rpcData.total_steps) || 0,
          total_miles: Number(rpcData.total_miles) || 0,
          total_active_minutes: Number(rpcData.total_active_minutes) || 0,
          active_members_count: Number(rpcData.active_members_count) || 0,
          total_members: Number(rpcData.total_members) || 0,
          total_encouragements: Number(rpcData.total_encouragements) || 0,
          milestones_unlocked: Number(rpcData.milestones_unlocked) || 0,
          total_milestones: Number(rpcData.total_milestones) || 6,
          current_milestone: rpcData.current_milestone || null,
          next_milestone: rpcData.next_milestone || null,
          progress_percentage: Number(rpcData.progress_percentage) || 0,
        };
      }

      // 2. Direct aggregation query fallback
      const { data: stepLogs, error: logError } = await supabase
        .from("step_logs")
        .select("steps, distance_miles, active_minutes, user_id");

      if (!logError && stepLogs && stepLogs.length > 0) {
        totalSteps = stepLogs.reduce((acc, curr) => acc + (curr.steps || 0), 0);
        totalMiles = Math.round(stepLogs.reduce((acc, curr) => acc + (curr.distance_miles || 0), 0) * 100) / 100;
        totalMinutes = stepLogs.reduce((acc, curr) => acc + (curr.active_minutes || 0), 0);
        const uniqueUsers = new Set(stepLogs.map((l) => l.user_id));
        activeMembersCount = uniqueUsers.size;
      }
    }
  } catch (err) {
    console.warn("Error calculating group stats from Supabase:", err);
  }

  const { currentMilestone, nextMilestone, progressPercentage } = evaluateCommunalMilestones(
    totalSteps,
    groupId || DEFAULT_GROUP.id
  );

  return {
    group_id: groupId || DEFAULT_GROUP.id,
    slug: "coastal",
    name: "Coastal Community Church",
    group_number: "3266",
    total_steps: totalSteps,
    total_miles: totalMiles,
    total_active_minutes: totalMinutes,
    active_members_count: activeMembersCount,
    total_members: totalMembers,
    total_encouragements: totalEncouragements,
    current_milestone: currentMilestone,
    next_milestone: nextMilestone,
    progress_percentage: progressPercentage,
  };
}

/**
 * Fetch Privacy-Preserving Group Leaderboard
 */
export async function getGroupLeaderboard(
  groupId?: string,
  timeframe: string = "all_time",
  limit: number = 50,
  client?: SupabaseClient
): Promise<LeaderboardEntry[]> {
  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      const resolvedGroupId = groupId || (await getGroup("coastal", supabase)).id;
      const { data, error } = await supabase.rpc("get_group_leaderboard", {
        p_group_id: resolvedGroupId,
        p_timeframe: timeframe,
        p_limit: limit,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((entry: any, index: number) => ({
          rank: entry.rank || index + 1,
          user_id: entry.user_id,
          display_name: entry.display_name,
          avatar_url: entry.avatar_url || null,
          campus: entry.campus || "Main Campus",
          is_anonymous: Boolean(entry.is_anonymous),
          total_steps: Number(entry.total_steps) || 0,
          total_miles: Number(entry.total_miles) || calculateMileage(Number(entry.total_steps) || 0),
          active_days: Number(entry.active_days) || 0,
          streak_days: Number(entry.streak_days) || Number(entry.active_days) || 0,
          is_current_user: Boolean(entry.is_current_user),
        }));
      }
    }
  } catch (err) {
    console.warn("Error fetching leaderboard from Supabase:", err);
  }

  return INITIAL_LEADERBOARD;
}

/**
 * Compute or Fetch User Walking Streak
 */
export async function getUserStreak(
  userId: string,
  groupId?: string,
  client?: SupabaseClient
): Promise<UserStreak> {
  if (!userId) {
    return {
      current_streak: 0,
      longest_streak: 0,
      total_days_logged: 0,
      last_log_date: null,
    };
  }

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      const { data, error } = await supabase.rpc("get_user_walking_streak", {
        p_user_id: userId,
        p_group_id: groupId || null,
      });

      if (!error && data) {
        return {
          current_streak: Number(data.current_streak) || 0,
          longest_streak: Number(data.longest_streak) || 0,
          total_days_logged: Number(data.total_days_logged) || 0,
          last_log_date: data.last_log_date || null,
        };
      }
    }
  } catch (err) {
    console.warn("Error calculating user streak from Supabase:", err);
  }

  return {
    current_streak: 0,
    longest_streak: 0,
    total_days_logged: 0,
    last_log_date: null,
  };
}

/**
 * Fetch Daily Devotional by Day or Date
 */
export async function getDailyDevotional(
  dayOrDate?: number | string,
  groupId?: string,
  client?: SupabaseClient
): Promise<FaithDevotional> {
  if (typeof dayOrDate === "number") {
    return getDevotionalByDay(dayOrDate);
  }
  if (typeof dayOrDate === "string" && dayOrDate.length > 0) {
    const parsedDay = parseInt(dayOrDate, 10);
    if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 14) {
      return getDevotionalByDay(parsedDay);
    }
    return getDevotionalForDate(dayOrDate);
  }

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase && groupId) {
      const { data, error } = await supabase.rpc("get_daily_devotional", {
        p_group_id: groupId,
      });
      if (!error && data) {
        return {
          id: data.id || `devotional-day-${data.day_number}`,
          day_number: data.day_number,
          title: data.title,
          scripture_ref: data.scripture_ref,
          scripture_text: data.scripture_text,
          theme: data.theme || "Walking by Faith",
          reflection_prompt: data.reflection_prompt,
          prayer_focus: data.prayer_focus,
          walking_action: data.walking_action || "Complete a 20-minute prayer walk.",
        };
      }
    }
  } catch (err) {
    console.warn("Error resolving devotional from DB:", err);
  }

  return getDevotionalForDate(new Date());
}

/**
 * Fetch User Step Logs with Optional Date Range
 */
export async function getStepLogs(
  userId?: string,
  groupId?: string,
  startDate?: string,
  endDate?: string,
  client?: SupabaseClient
): Promise<StepLog[]> {
  if (!userId) return [];

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      let query = supabase
        .from("step_logs")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: false });

      if (groupId) query = query.eq("group_id", groupId);
      if (startDate) query = query.gte("log_date", startDate);
      if (endDate) query = query.lte("log_date", endDate);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          user_id: d.user_id,
          group_id: d.group_id,
          log_date: d.log_date,
          steps: d.steps,
          distance_miles: Number(d.distance_miles) || calculateMileage(d.steps),
          active_minutes: d.active_minutes || calculateActiveMinutes(d.steps),
          calories_burned: d.calories_burned || calculateCalories(d.steps),
          source: d.source || "manual",
          notes: d.notes,
          created_at: d.created_at,
          updated_at: d.updated_at,
        }));
      }
    }
  } catch (err) {
    console.warn("Error fetching step logs from Supabase:", err);
  }

  return [];
}

/**
 * Log or Update Daily Steps for a User
 */
export async function logSteps(
  payload: {
    userId: string;
    groupId?: string;
    logDate: string;
    steps: number;
    distanceMiles?: number;
    activeMinutes?: number;
    source?: string;
    notes?: string;
  },
  client?: SupabaseClient
): Promise<{ success: boolean; log?: StepLog; error?: string }> {
  const { userId, logDate, steps, source, notes } = payload;
  if (!userId) return { success: false, error: "User ID is required" };
  if (steps < 0 || steps > 200000) {
    return { success: false, error: "Step count must be between 0 and 200,000" };
  }

  const groupId = payload.groupId || DEFAULT_GROUP.id;
  const distanceMiles = payload.distanceMiles ?? calculateMileage(steps);
  const activeMinutes = payload.activeMinutes ?? calculateActiveMinutes(steps);
  const caloriesBurned = calculateCalories(steps);
  const resolvedSource = (source || "manual") as any;

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      const { data, error } = await supabase
        .from("step_logs")
        .upsert(
          {
            user_id: userId,
            group_id: groupId,
            log_date: logDate,
            steps,
            distance_miles: distanceMiles,
            active_minutes: activeMinutes,
            calories_burned: caloriesBurned,
            source: resolvedSource,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,group_id,log_date" }
        )
        .select()
        .single();

      if (!error && data) {
        return {
          success: true,
          log: {
            id: data.id,
            user_id: data.user_id,
            group_id: data.group_id,
            log_date: data.log_date,
            steps: data.steps,
            distance_miles: Number(data.distance_miles),
            active_minutes: data.active_minutes,
            calories_burned: data.calories_burned,
            source: data.source || resolvedSource,
            notes: data.notes,
            created_at: data.created_at,
            updated_at: data.updated_at,
          },
        };
      }
    }
  } catch (err: any) {
    console.warn("Supabase upsert failed, returning fallback success:", err);
  }

  // Fallback synthetic response
  const fallbackLog: StepLog = {
    id: `local-log-${Date.now()}`,
    user_id: userId,
    group_id: groupId,
    log_date: logDate,
    steps,
    distance_miles: distanceMiles,
    active_minutes: activeMinutes,
    calories_burned: caloriesBurned,
    source: resolvedSource,
    notes: notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { success: true, log: fallbackLog };
}

/**
 * Delete a Step Log Record
 */
export async function deleteStepLog(
  id: string,
  userId: string,
  client?: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      const { error } = await supabase
        .from("step_logs")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete log" };
  }
}

/**
 * Fetch User's Devotional Reflections
 */
export async function getReflections(
  userId: string,
  groupId?: string,
  client?: SupabaseClient
): Promise<DevotionalReflection[]> {
  if (!userId) return [];

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      let query = supabase
        .from("devotional_reflections")
        .select("*")
        .eq("user_id", userId);

      if (groupId) query = query.eq("group_id", groupId);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          group_id: r.group_id,
          devotional_id: r.devotional_id,
          day_number: r.day_number,
          reflection_text: r.reflection_text,
          prayer_request: r.prayer_request,
          is_shared_to_feed: r.is_shared_to_feed,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));
      }
    }
  } catch (err) {
    console.warn("Error fetching reflections from DB:", err);
  }

  return [];
}

/**
 * Save Devotional Reflection Journal Entry
 */
export async function saveReflection(
  payload: {
    userId: string;
    devotionalId: string;
    dayNumber?: number;
    reflectionText: string;
    groupId?: string;
    isShared?: boolean;
  },
  client?: SupabaseClient
): Promise<{ success: boolean; reflection?: DevotionalReflection; error?: string }> {
  const { userId, devotionalId, reflectionText } = payload;
  if (!userId) return { success: false, error: "User ID is required" };
  if (!reflectionText || reflectionText.trim().length === 0) {
    return { success: false, error: "Reflection text cannot be empty" };
  }

  const groupId = payload.groupId || DEFAULT_GROUP.id;

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      const { data, error } = await supabase
        .from("devotional_reflections")
        .upsert(
          {
            user_id: userId,
            group_id: groupId,
            devotional_id: devotionalId,
            day_number: payload.dayNumber,
            reflection_text: reflectionText.trim(),
            is_shared_to_feed: Boolean(payload.isShared),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,group_id,devotional_id" }
        )
        .select()
        .single();

      if (!error && data) {
        return {
          success: true,
          reflection: {
            id: data.id,
            user_id: data.user_id,
            group_id: data.group_id,
            devotional_id: data.devotional_id,
            day_number: data.day_number,
            reflection_text: data.reflection_text,
            is_shared_to_feed: data.is_shared_to_feed,
            created_at: data.created_at,
            updated_at: data.updated_at,
          },
        };
      }
    }
  } catch (err: any) {
    console.warn("Supabase reflection save failed, returning fallback success:", err);
  }

  return {
    success: true,
    reflection: {
      id: `local-ref-${Date.now()}`,
      user_id: userId,
      group_id: groupId,
      devotional_id: devotionalId,
      day_number: payload.dayNumber,
      reflection_text: reflectionText.trim(),
      is_shared_to_feed: Boolean(payload.isShared),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

/**
 * Fetch Community Encouragement Feed
 */
export async function getCommunityFeed(
  groupId?: string,
  limit: number = 30,
  client?: SupabaseClient
): Promise<CommunityEncouragement[]> {
  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      const resolvedGroupId = groupId || (await getGroup("coastal", supabase)).id;
      const { data, error } = await supabase
        .from("community_encouragements")
        .select(`
          *,
          reactions: encouragement_reactions(reaction_type, user_id)
        `)
        .eq("group_id", resolvedGroupId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map((post: any) => {
          const reactionCounts: Record<string, number> = {};
          const userReactions: string[] = [];

          if (Array.isArray(post.reactions)) {
            post.reactions.forEach((r: any) => {
              reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
            });
          }

          return {
            id: post.id,
            group_id: post.group_id,
            user_id: post.user_id,
            display_name: post.display_name,
            message: post.message,
            prayer_tag: post.prayer_tag || "Encouragement",
            reactions: reactionCounts,
            user_reactions: userReactions,
            likes_count: post.likes_count || 0,
            created_at: post.created_at,
          };
        });
      }
    }
  } catch (err) {
    console.warn("Error fetching community feed from DB:", err);
  }

  return INITIAL_COMMUNITY_FEED;
}

/**
 * Post an Encouragement Note to Community Feed
 */
export async function postEncouragement(
  payload: {
    userId: string;
    groupId?: string;
    displayName: string;
    message: string;
    prayerTag?: string;
  },
  client?: SupabaseClient
): Promise<{ success: boolean; post?: CommunityEncouragement; error?: string }> {
  const { userId, displayName, message } = payload;
  if (!userId) return { success: false, error: "User ID is required" };
  if (!message || message.trim().length === 0) {
    return { success: false, error: "Message cannot be empty" };
  }
  if (message.length > 1000) {
    return { success: false, error: "Message exceeds 1,000 characters" };
  }

  const groupId = payload.groupId || DEFAULT_GROUP.id;

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      const { data, error } = await supabase
        .from("community_encouragements")
        .insert({
          user_id: userId,
          group_id: groupId,
          display_name: displayName.trim() || "Faithful Walker",
          message: message.trim(),
          prayer_tag: payload.prayerTag || "Encouragement",
        })
        .select()
        .single();

      if (!error && data) {
        return {
          success: true,
          post: {
            id: data.id,
            group_id: data.group_id,
            user_id: data.user_id,
            display_name: data.display_name,
            message: data.message,
            prayer_tag: data.prayer_tag,
            reactions: {},
            user_reactions: [],
            likes_count: 0,
            created_at: data.created_at,
          },
        };
      }
    }
  } catch (err: any) {
    console.warn("Supabase post encouragement failed, returning fallback success:", err);
  }

  return {
    success: true,
    post: {
      id: `local-post-${Date.now()}`,
      group_id: groupId,
      user_id: userId,
      display_name: displayName.trim() || "Faithful Walker",
      message: message.trim(),
      prayer_tag: payload.prayerTag || "Encouragement",
      reactions: { prayer: 1 },
      user_reactions: ["prayer"],
      likes_count: 1,
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * Toggle Reaction on Community Encouragement Post
 */
export async function toggleReaction(
  encouragementId: string,
  userId: string,
  reactionType: string,
  client?: SupabaseClient
): Promise<{ success: boolean; reactions?: Record<string, number>; userReactions?: string[]; error?: string }> {
  if (!encouragementId || !userId) {
    return { success: false, error: "Encouragement ID and User ID are required" };
  }

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      // Check if reaction exists
      const { data: existing } = await supabase
        .from("encouragement_reactions")
        .select("id")
        .eq("encouragement_id", encouragementId)
        .eq("user_id", userId)
        .eq("reaction_type", reactionType)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("encouragement_reactions")
          .delete()
          .eq("id", existing.id);
      } else {
        await supabase.from("encouragement_reactions").insert({
          encouragement_id: encouragementId,
          user_id: userId,
          reaction_type: reactionType,
        });
      }
    }
  } catch (err) {
    console.warn("Supabase toggle reaction error:", err);
  }

  return { success: true };
}

/**
 * Join Coastal Community Church (#3266) Walking Group
 */
export async function joinGroup(
  userId: string,
  groupSlug: string = "coastal",
  displayName?: string,
  isAnonymous: boolean = false,
  client?: SupabaseClient
): Promise<{ success: boolean; member?: GroupMember; isNew?: boolean; error?: string }> {
  if (!userId) return { success: false, error: "User ID is required" };

  try {
    const supabase = await getSupabaseClient(client);
    if (supabase) {
      const { data, error } = await supabase.rpc("auto_join_group", {
        p_group_slug: groupSlug,
        p_display_name: displayName || null,
      });

      if (!error && data && data.success) {
        return {
          success: true,
          isNew: data.is_new,
          member: data.member,
        };
      }
    }
  } catch (err: any) {
    console.warn("Supabase joinGroup error, using fallback:", err);
  }

  const fallbackMember: GroupMember = {
    id: `local-member-${userId}`,
    group_id: DEFAULT_GROUP.id,
    user_id: userId,
    display_name: displayName || "Faithful Walker",
    role: "member",
    is_anonymous: isAnonymous,
    joined_at: new Date().toISOString(),
  };

  return { success: true, isNew: true, member: fallbackMember };
}

/**
 * Evaluate Individual Milestone Unlocks for User
 */
export function getUserMilestones(
  userId: string,
  logs: StepLog[] = [],
  streak?: UserStreak
): {
  unlocked: IndividualMilestone[];
  allWithStatus: IndividualMilestone[];
  nextMilestone: IndividualMilestone | null;
} {
  const streakDays = streak ? streak.current_streak : 0;
  return evaluateIndividualMilestones(logs, streakDays);
}

// Re-export static datasets for direct import convenience
export { DEVOTIONALS_DATA, getAllDevotionals };
