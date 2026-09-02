import { NextRequest, NextResponse } from "next/server";
import { logSteps, getUserStreak, calculateMileage, calculateActiveMinutes, calculateCalories, getLocalISODate } from "@/lib/coastal/db";
import { requireUserSession } from "@/lib/auth/user";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation/api-validator";
import { SyncHealthPostSchema } from "@/lib/validation/schemas";

export type HealthProvider =
  | "apple_health"
  | "google_health"
  | "google_fit"
  | "fitbit"
  | "garmin"
  | "strava"
  | "whoop"
  | "device_motion";

/**
 * POST /api/sync/health
 * Auto-sync endpoint for Apple Health, Google Health/Fit, Fitbit, Garmin, and Device Motion Pedometer
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

  const validation = await validateRequestBody(request, SyncHealthPostSchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const {
      provider,
      steps,
      date,
      distanceMiles,
      activeMinutes,
      groupId = "3266-coastal-church",
      deviceModel,
      sourceApp,
    } = validation.data;

    // Derive userId exclusively from authenticated user session
    const userId = user.id;
    const logDate = date || getLocalISODate();

    const computedMiles = distanceMiles ?? calculateMileage(steps);
    const computedMinutes = activeMinutes ?? calculateActiveMinutes(steps);
    const computedCalories = calculateCalories(steps);

    const providerLabels: Record<HealthProvider, string> = {
      apple_health: "Apple Health (HealthKit)",
      google_health: "Google Health Connect",
      google_fit: "Google Fit API",
      fitbit: "Fitbit Web API",
      garmin: "Garmin Connect",
      strava: "Strava Activity Sync",
      whoop: "Whoop Strap 4.0",
      device_motion: "Live Device Pedometer Sensor",
    };

    const notes = `Auto-synced via ${providerLabels[provider as HealthProvider] || provider}${
      deviceModel ? ` (${deviceModel})` : ""
    }${sourceApp ? ` via ${sourceApp}` : ""}`;

    const logResult = await logSteps(
      {
        userId,
        groupId,
        logDate,
        steps,
        distanceMiles: computedMiles,
        activeMinutes: computedMinutes,
        source: provider || "manual",
        notes,
      },
      supabase ?? undefined
    );

    const streak = await getUserStreak(userId, groupId, supabase ?? undefined);

    logger.info(`[health-sync] Synced ${steps} steps for user ${userId.slice(0, 8)}*** via ${provider}`);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${steps.toLocaleString()} steps from ${
        providerLabels[provider as HealthProvider] || provider
      }.`,
      data: {
        provider,
        log: logResult.log,
        streak,
        metrics: {
          steps,
          distanceMiles: computedMiles,
          activeMinutes: computedMinutes,
          caloriesBurned: computedCalories,
          date: logDate,
        },
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error("Health sync endpoint error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process health sync." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/health
 * Returns connection statuses for supported health platforms
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    supportedProviders: [
      {
        id: "apple_health",
        name: "Apple Health",
        platform: "iOS / watchOS",
        status: "available",
        features: ["Background Steps Sync", "Distance (mi)", "Active Minutes", "Heart Rate"],
      },
      {
        id: "google_health",
        name: "Google Health Connect",
        platform: "Android / Pixel / Samsung",
        status: "available",
        features: ["Daily Step Rollup", "Distance", "Calories Burned", "Session Sync"],
      },
      {
        id: "google_fit",
        name: "Google Fit",
        platform: "Web / Android / WearOS",
        status: "available",
        features: ["OAuth2 Cloud Sync", "Daily Aggregations", "Activity Minutes"],
      },
      {
        id: "fitbit",
        name: "Fitbit",
        platform: "Fitbit Trackers / Versa / Sense",
        status: "available",
        features: ["Intraday Step Cadence", "Daily Totals", "Sleep & Readiness"],
      },
      {
        id: "garmin",
        name: "Garmin Connect",
        platform: "Forerunner / Fenix / Venu",
        status: "available",
        features: ["GPS Outdoor Walking Routes", "Daily Steps", "Intensity Minutes"],
      },
      {
        id: "device_motion",
        name: "Built-in Browser Pedometer",
        platform: "iOS Safari / Android Chrome",
        status: "active",
        features: ["Real-time Accelerometer Step Detection", "Zero App Download Needed"],
      },
    ],
  });
}
