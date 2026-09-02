import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateRequestBody, validateQueryParams } from "@/lib/validation/api-validator";
import { LogMealQuerySchema, LogMealCreateSchema } from "@/lib/validation/schemas";

/**
 * POST /api/log-meal
 *
 * Persists a scanned meal to Supabase for the authenticated user.
 * Body: { mealType, items[], imageUrl? }
 *
 * GET /api/log-meal?email=...&date=YYYY-MM-DD
 *
 * Retrieves meals for the authenticated user (or requested client if admin) on a given date.
 */

export async function POST(request: NextRequest) {
  // ── Rate Limiting (30 requests/minute per IP) ──────────────────────────
  const rateLimit = checkRateLimit(request, "auth");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized: Active user session required" },
        { status: 401 }
      );
    }

    const validation = await validateRequestBody(request, LogMealCreateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { mealType = "snack", items, imageUrl } = validation.data;

    // Calculate totals
    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const { data, error } = await supabase
      .from("meal_log")
      .insert({
        user_id: user.id,
        client_email: user.email?.toLowerCase() || "",
        meal_type: mealType,
        items: items,
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Supabase insert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, meal: data });
  } catch (err: any) {
    logger.error("Log meal error:", err);
    return Response.json({ error: err.message || "Failed to log meal" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized: Active user session required" },
        { status: 401 }
      );
    }

    const queryValidation = validateQueryParams(
      request.nextUrl.searchParams,
      LogMealQuerySchema
    );
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { email: requestedEmail, date: queryDate } = queryValidation.data;
    const date = queryDate || new Date().toISOString().split("T")[0];

    const isAdmin = user.app_metadata?.role === "admin";
    // Regular users can only query their own records. Admins can view requested client email.
    const targetEmail = (isAdmin && requestedEmail) ? requestedEmail.trim().toLowerCase() : (user.email?.toLowerCase() || "");

    const { data, error } = await supabase
      .from("meal_log")
      .select("*")
      .eq("client_email", targetEmail)
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
  } catch (err: any) {
    logger.error("Get meals error:", err);
    return Response.json({ error: err.message || "Failed to fetch meals" }, { status: 500 });
  }
}
