import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminSession } from "@/lib/auth/admin";
import { validateRequestBody, validateQueryParams } from "@/lib/validation/api-validator";
import {
  AdminClientProfileQuerySchema,
  AdminClientProfileCreateSchema,
  AdminClientProfileUpdateSchema,
} from "@/lib/validation/schemas";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase not configured");
  }
  return createClient(url, key);
}

// GET: Fetch client roster or individual client profile data for admin view & assist
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const queryValidation = validateQueryParams(
      request.nextUrl.searchParams,
      AdminClientProfileQuerySchema
    );
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { clientId, userId, email, roster, all } = queryValidation.data;
    const isRoster = roster === "true" || all === "true";
    const supabase = getSupabase();

    // ── 1. Fetch Consolidated Client Roster ──
    if (isRoster || (!clientId && !userId && !email)) {
      const [leadsRes, profilesRes] = await Promise.all([
        supabase.from("coaching_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("client_profiles").select("*").order("created_at", { ascending: false }),
      ]);

      const leads = leadsRes.data || [];
      const profiles = profilesRes.data || [];

      // Map combined roster with deduplication by email
      const emailMap = new Map<string, any>();

      profiles.forEach((p) => {
        const em = (p.email || "").toLowerCase().trim();
        if (!em) return;
        emailMap.set(em, {
          id: p.id,
          profileId: p.id,
          userId: p.user_id,
          name: p.name || "Client",
          email: p.email,
          phone: null,
          program: "Custom Client",
          goal: "Fitness & Nutrition",
          status: p.user_id ? "active" : "registered",
          weight_lbs: p.weight_lbs,
          target_weight_lbs: p.target_weight_lbs,
          target_calories: p.target_calories || 1850,
          target_protein: p.target_protein || 160,
          target_carbs: p.target_carbs || 185,
          target_fat: p.target_fat || 52,
          is_registered: Boolean(p.user_id),
          created_at: p.created_at,
        });
      });

      leads.forEach((l) => {
        const em = (l.email || "").toLowerCase().trim();
        if (!em) return;
        const existing = emailMap.get(em);
        if (existing) {
          existing.leadId = l.id;
          existing.phone = l.phone || existing.phone;
          existing.program = l.program_choice || existing.program;
          existing.goal = l.track_goal || existing.goal;
          existing.status = l.status || existing.status;
        } else {
          emailMap.set(em, {
            id: l.id,
            leadId: l.id,
            userId: null,
            name: l.name || "Lead",
            email: l.email,
            phone: l.phone,
            program: l.program_choice || "General",
            goal: l.track_goal || "Wellness",
            status: l.status || "new",
            weight_lbs: null,
            target_weight_lbs: null,
            target_calories: 1850,
            target_protein: 160,
            target_carbs: 185,
            target_fat: 52,
            is_registered: false,
            created_at: l.created_at,
          });
        }
      });

      const fullRoster = Array.from(emailMap.values());
      return Response.json({ success: true, roster: fullRoster, total: fullRoster.length });
    }

    // ── 2. Fetch Single Client Details for Admin Impersonation ──
    let profileQuery = supabase.from("client_profiles").select("*");
    if (clientId) profileQuery = profileQuery.eq("id", clientId);
    else if (userId) profileQuery = profileQuery.eq("user_id", userId);
    else if (email) profileQuery = profileQuery.eq("email", email.toLowerCase().trim());

    const { data: profile } = await profileQuery.maybeSingle();

    // Also look up corresponding lead
    let lead = null;
    const lookupEmail = email || profile?.email;
    if (lookupEmail) {
      const { data: leadData } = await supabase
        .from("coaching_leads")
        .select("*")
        .eq("email", lookupEmail.toLowerCase().trim())
        .maybeSingle();
      lead = leadData;
    }

    // Fetch related food logs, body scans, workouts, and step logs
    let foodLogs: any[] = [];
    let bodyScans: any[] = [];
    let assignedWorkouts: any[] = [];
    let loggedSets: any[] = [];
    let stepLogs: any[] = [];

    const effectiveUserId = profile?.user_id || userId;
    const effectiveClientId = profile?.id || clientId;

    if (effectiveUserId || effectiveClientId) {
      const idToUse = effectiveUserId || effectiveClientId;

      const [mealsRes, scansRes, workoutsRes, stepsRes] = await Promise.all([
        supabase.from("logged_meals").select("*").eq("user_id", idToUse).order("logged_at", { ascending: false }).limit(30),
        supabase.from("body_scans").select("*").eq("user_id", idToUse).order("created_at", { ascending: false }).limit(20),
        supabase.from("workouts").select("*, workout_exercises(*, logged_sets(*))").eq("client_id", effectiveClientId || idToUse).order("date", { ascending: false }),
        supabase.from("step_logs").select("*").eq("user_id", idToUse).order("log_date", { ascending: false }).limit(30),
      ]);

      foodLogs = mealsRes.data || [];
      bodyScans = scansRes.data || [];
      assignedWorkouts = workoutsRes.data || [];
      stepLogs = stepsRes.data || [];

      // Safely aggregate logged sets from relational workout exercises
      loggedSets = assignedWorkouts.flatMap((w: any) =>
        (w.workout_exercises || []).flatMap((ex: any) =>
          (ex.logged_sets || []).map((s: any) => ({
            ...s,
            exercise_id: ex.id,
            exercise_name: ex.exercise_name,
            workout_id: w.id,
            workout_name: w.name,
            workout_date: w.date,
          }))
        )
      ).sort((a: any, b: any) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()).slice(0, 50);
    }

    return Response.json({
      success: true,
      client: {
        profile: profile || null,
        lead: lead || null,
        foodLogs,
        bodyScans,
        assignedWorkouts,
        loggedSets,
        stepLogs,
      },
    });
  } catch (err: any) {
    console.error("[admin-client-profile] GET Exception:", err);
    return Response.json({ error: err.message || "Failed to fetch client profile" }, { status: 500 });
  }
}

// POST: Create a profile beforehand (e.g. when Coach Esh sets up a plan for a lead)
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const validation = await validateRequestBody(request, AdminClientProfileCreateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { name, email, weight_lbs, target_weight_lbs, target_calories, target_protein, target_carbs, target_fat } = validation.data;
    const supabase = getSupabase();

    // Check if exists
    const { data: existing } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      const { data: updated } = await supabase
        .from("client_profiles")
        .update({
          name: name.trim(),
          weight_lbs: weight_lbs !== undefined && weight_lbs !== null ? parseFloat(weight_lbs.toString()) : existing.weight_lbs,
          target_weight_lbs: target_weight_lbs !== undefined && target_weight_lbs !== null ? parseFloat(target_weight_lbs.toString()) : existing.target_weight_lbs,
          target_calories: target_calories !== undefined && target_calories !== null ? parseInt(target_calories.toString()) : existing.target_calories,
          target_protein: target_protein !== undefined && target_protein !== null ? parseInt(target_protein.toString()) : existing.target_protein,
          target_carbs: target_carbs !== undefined && target_carbs !== null ? parseInt(target_carbs.toString()) : existing.target_carbs,
          target_fat: target_fat !== undefined && target_fat !== null ? parseInt(target_fat.toString()) : existing.target_fat,
        })
        .eq("id", existing.id)
        .select()
        .single();

      return Response.json({ success: true, profile: updated || existing });
    }

    const { data, error } = await supabase
      .from("client_profiles")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        weight_lbs: weight_lbs !== undefined && weight_lbs !== null ? parseFloat(weight_lbs.toString()) : null,
        target_weight_lbs: target_weight_lbs !== undefined && target_weight_lbs !== null ? parseFloat(target_weight_lbs.toString()) : null,
        target_calories: target_calories !== undefined && target_calories !== null ? parseInt(target_calories.toString()) : 1850,
        target_protein: target_protein !== undefined && target_protein !== null ? parseInt(target_protein.toString()) : 160,
        target_carbs: target_carbs !== undefined && target_carbs !== null ? parseInt(target_carbs.toString()) : 185,
        target_fat: target_fat !== undefined && target_fat !== null ? parseInt(target_fat.toString()) : 52,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, profile: data });
  } catch (err: any) {
    console.error("Create profile error:", err);
    return Response.json({ error: err.message || "Failed to create profile" }, { status: 500 });
  }
}

// PATCH: Update a profile (used by Coach Esh to edit client plans)
export async function PATCH(request: NextRequest) {
  try {
    const { error: authError } = await requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const validation = await validateRequestBody(request, AdminClientProfileUpdateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const {
      clientId,
      email,
      weight_lbs,
      target_weight_lbs,
      target_calories,
      target_protein,
      target_carbs,
      target_fat,
    } = validation.data;

    const supabase = getSupabase();

    let query = supabase.from("client_profiles").update({
      weight_lbs: weight_lbs !== undefined ? (weight_lbs !== null ? parseFloat(weight_lbs.toString()) : null) : undefined,
      target_weight_lbs: target_weight_lbs !== undefined ? (target_weight_lbs !== null ? parseFloat(target_weight_lbs.toString()) : null) : undefined,
      target_calories: target_calories !== undefined ? (target_calories !== null ? parseInt(target_calories.toString()) : null) : undefined,
      target_protein: target_protein !== undefined ? (target_protein !== null ? parseInt(target_protein.toString()) : null) : undefined,
      target_carbs: target_carbs !== undefined ? (target_carbs !== null ? parseInt(target_carbs.toString()) : null) : undefined,
      target_fat: target_fat !== undefined ? (target_fat !== null ? parseInt(target_fat.toString()) : null) : undefined,
    });

    if (clientId) query = query.eq("id", clientId);
    else if (email) query = query.eq("email", email.toLowerCase().trim());

    const { data, error } = await query.select().single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, profile: data });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return Response.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
