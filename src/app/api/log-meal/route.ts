import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/log-meal
 *
 * Persists a scanned meal to Supabase.
 * Body: { clientEmail?, mealType, items[], imageUrl? }
 *
 * GET /api/log-meal?email=...&date=YYYY-MM-DD
 *
 * Retrieves meals for a client on a given date.
 */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase not configured");
  }
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientEmail, mealType = "snack", items, imageUrl } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "No items provided" }, { status: 400 });
    }

    // Calculate totals
    const totals = items.reduce(
      (acc: { calories: number; protein: number; carbs: number; fat: number }, item: { calories: number; protein: number; carbs: number; fat: number }) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const supabase = getSupabase();

    const { data, error } = await supabase.from("meal_log").insert({
      client_email: clientEmail || "guest",
      meal_type: mealType,
      items: items,
      total_calories: Math.round(totals.calories),
      total_protein: Math.round(totals.protein * 10) / 10,
      total_carbs: Math.round(totals.carbs * 10) / 10,
      total_fat: Math.round(totals.fat * 10) / 10,
      image_url: imageUrl || null,
    }).select().single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, meal: data });
  } catch (err) {
    console.error("Log meal error:", err);
    return Response.json({ error: "Failed to log meal" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "guest";
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("meal_log")
      .select("*")
      .eq("client_email", email)
      .eq("meal_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Calculate daily totals
    const dailyTotals = (data || []).reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein || 0),
        carbs: acc.carbs + (meal.total_carbs || 0),
        fat: acc.fat + (meal.total_fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return Response.json({
      meals: data || [],
      dailyTotals,
      date,
    });
  } catch (err) {
    console.error("Get meals error:", err);
    return Response.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}
