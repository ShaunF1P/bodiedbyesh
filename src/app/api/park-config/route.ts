import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { logger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation/api-validator";
import { ParkConfigUpdateSchema } from "@/lib/validation/schemas";

const CONFIG_PATH = path.join(process.cwd(), "data", "park-config.json");

// Default config used if database and file are unreachable
const DEFAULT_CONFIG = {
  activePark: {
    name: "Merrit Park",
    city: "Delray Beach, FL",
    address: "601 N Congress Ave, Delray Beach, FL 33445",
    meetingSpot: "Grassy area near the east pavilion by the playground",
    googleMapsUrl: "https://maps.google.com/?q=Merrit+Park+Delray+Beach+FL",
  },
  schedule: [
    { day: "Monday", time: "5:30 PM", duration: "60 min" },
    { day: "Wednesday", time: "5:30 PM", duration: "60 min" },
    { day: "Saturday", time: "9:00 AM", duration: "75 min" },
  ],
  whatToBring: [
    "Water bottle (hydration is non-negotiable)",
    "Towel",
    "Sneakers with grass traction",
    "Sunscreen if before sunset",
  ],
  coachNotes:
    "Sessions start exactly 10 minutes after kids' drop-off. Arrive 5 minutes early to warm up. Rain policy: if it's lightning, we reschedule via SMS within 1 hour.",
  isAcceptingNewClients: true,
  lastUpdated: new Date().toISOString(),
};

async function readFallbackConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONFIG;
  }
}

// GET — public endpoint, queries Supabase public.park_config with resilient fallback
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("park_config")
      .select("*")
      .eq("id", "primary")
      .maybeSingle();

    if (!error && data) {
      const formattedConfig = {
        activePark: data.active_park,
        schedule: data.schedule,
        whatToBring: data.what_to_bring,
        coachNotes: data.coach_notes,
        isAcceptingNewClients: Boolean(data.is_accepting_new_clients),
        lastUpdated: data.updated_at || data.created_at || new Date().toISOString(),
      };
      return Response.json(formattedConfig, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }
  } catch (err) {
    logger.warn("Supabase park_config query failed, falling back to local storage:", { error: String(err) });
  }

  // Resilient fallback to local JSON / static defaults
  const fallback = await readFallbackConfig();
  return Response.json(fallback, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// POST — admin endpoint, requires authenticated admin session and persists to Supabase
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const validation = await validateRequestBody(request, ParkConfigUpdateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const configData = validation.data;
    const updatedAt = new Date().toISOString();
    configData.lastUpdated = updatedAt;

    // 1. Primary persistence: Upsert to Supabase PostgreSQL table
    try {
      const supabase = await createClient();
      const { error: dbError } = await supabase.from("park_config").upsert(
        {
          id: "primary",
          active_park: configData.activePark,
          schedule: configData.schedule,
          what_to_bring: configData.whatToBring || DEFAULT_CONFIG.whatToBring,
          coach_notes: configData.coachNotes ?? DEFAULT_CONFIG.coachNotes,
          is_accepting_new_clients: configData.isAcceptingNewClients !== false,
          updated_at: updatedAt,
        },
        { onConflict: "id" }
      );

      if (dbError) {
        logger.error("Supabase park_config upsert error:", dbError);
      } else {
        logger.info("[park-config] Successfully persisted park configuration to Supabase PostgreSQL");
      }
    } catch (dbErr) {
      logger.error("Supabase park_config save exception:", dbErr);
    }

    // 2. Secondary local backup (in local development or where filesystem allows)
    try {
      await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
      await fs.writeFile(CONFIG_PATH, JSON.stringify(configData, null, 2));
    } catch {
      // Read-only filesystem in serverless environments is safely handled
    }

    return Response.json({ success: true, lastUpdated: updatedAt });
  } catch (err) {
    logger.error("Park config update error:", err);
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
