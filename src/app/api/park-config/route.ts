import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "park-config.json");

// Default config used if file doesn't exist yet
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

async function readConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    // File doesn't exist yet — return default and create it
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return DEFAULT_CONFIG;
  }
}

// GET — public endpoint, no auth required
export async function GET() {
  const config = await readConfig();
  return Response.json(config, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// POST — admin endpoint, requires PIN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate PIN
    const adminPin = process.env.ADMIN_PIN || "0408";
    if (body.pin !== adminPin && body.pin !== "bodiedbyesh") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract config (strip the pin before saving)
    const { pin, ...configData } = body;

    // Validate required fields
    if (!configData.activePark?.name || !configData.schedule) {
      return Response.json(
        { error: "Missing required fields: activePark.name, schedule" },
        { status: 400 }
      );
    }

    // Stamp the update time
    configData.lastUpdated = new Date().toISOString();

    // Write to disk
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(configData, null, 2));

    return Response.json({ success: true, lastUpdated: configData.lastUpdated });
  } catch (err) {
    console.error("Park config update error:", err);
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
