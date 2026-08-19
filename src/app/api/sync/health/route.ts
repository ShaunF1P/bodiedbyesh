import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { logSteps, getUserStreak, calculateMileage, calculateActiveMinutes, calculateCalories } from "@/lib/coastal/db";

export type HealthProvider =
  | "apple_health"
  | "google_health"
  | "google_fit"
  | "fitbit"
  | "garmin"
  | "strava"
  | "whoop"
  | "device_motion";

interface SyncPayload {
  provider: HealthProvider;
  userId?: string;
  groupId?: string;
  date?: string; // YYYY-MM-DD
  steps: number;
  distanceMiles?: number;
  activeMinutes?: number;
  caloriesBurned?: number;
  deviceModel?: string;
  sourceApp?: string;
  rawPayload?: any;
}

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
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { user, supabase } : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/sync/health
 * Auto-sync endpoint for Apple Health, Google Health/Fit, Fitbit, Garmin, and Device Motion Pedometer
 */
export async function POST(request: NextRequest) {
  try {
    const body: SyncPayload = await request.json();
    const {
      provider,
      steps,
      date,
      distanceMiles,
      activeMinutes,
      groupId = "3266-coastal-church",
      deviceModel,
      sourceApp,
    } = body;

    if (steps === undefined || steps === null || typeof steps !== "number") {
      return NextResponse.json(
        { success: false, error: "Valid numeric step count is required." },
        { status: 400 }
      );
    }

    if (steps < 0 || steps > 200000) {
      return NextResponse.json(
        { success: false, error: "Step count must be between 0 and 200,000 steps." },
        { status: 400 }
      );
    }

    const auth = await getAuthUser(request);
    const userId = auth?.user?.id || body.userId || "guest-user";
    const logDate = date || new Date().toISOString().split("T")[0];

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

    const notes = `Auto-synced via ${providerLabels[provider] || provider}${
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
        notes,
      },
      auth?.supabase
    );

    const streak = await getUserStreak(userId, groupId, auth?.supabase);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${steps.toLocaleString()} steps from ${
        providerLabels[provider] || provider
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
    console.error("Health sync endpoint error:", error);
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
export async function GET(request: NextRequest) {
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
