import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { validateRequestBody } from "@/lib/validation/api-validator";
import { ClientLoggedSetSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: "Supabase not configured in environment" }, { status: 500 });
    }

    // Authenticate the user session via cookies
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(_cookiesToSet) {
          // No-op for API route
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const validation = await validateRequestBody(request, ClientLoggedSetSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { exerciseId, setIndex, repsCompleted, weightLiftedLbs, isCompleted } = validation.data;

    // Double check that the exercise belongs to a workout assigned to this user
    // (Enforces the RLS policy constraint at the API layer as well)
    const { data: exercise, error: verifyErr } = await supabase
      .from("workout_exercises")
      .select(`
        id,
        workout: workouts(client_id)
      `)
      .eq("id", exerciseId)
      .single();

    if (verifyErr || !exercise) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }

    const profileId = (exercise.workout as any)?.client_id;
    
    // Fetch user's profile to compare
    const { data: profile } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!profile || profile.id !== profileId) {
      return Response.json({ error: "Access denied: Workout exercise not assigned to your account" }, { status: 403 });
    }

    // Check if set is already logged
    const { data: existingSet } = await supabase
      .from("logged_sets")
      .select("id")
      .eq("workout_exercise_id", exerciseId)
      .eq("set_index", setIndex)
      .maybeSingle();

    let result;
    if (existingSet) {
      result = await supabase
        .from("logged_sets")
        .update({
          reps_completed: repsCompleted !== null && repsCompleted !== undefined ? parseInt(repsCompleted.toString()) : null,
          weight_lifted_lbs: weightLiftedLbs !== null && weightLiftedLbs !== undefined ? parseInt(weightLiftedLbs.toString()) : null,
          is_completed: Boolean(isCompleted),
          logged_at: new Date().toISOString()
        })
        .eq("id", existingSet.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("logged_sets")
        .insert({
          workout_exercise_id: exerciseId,
          set_index: setIndex,
          reps_completed: repsCompleted !== null && repsCompleted !== undefined ? parseInt(repsCompleted.toString()) : null,
          weight_lifted_lbs: weightLiftedLbs !== null && weightLiftedLbs !== undefined ? parseInt(weightLiftedLbs.toString()) : null,
          is_completed: Boolean(isCompleted)
        })
        .select()
        .single();
    }

    if (result.error) {
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    return Response.json({ success: true, data: result.data });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to log set" }, { status: 500 });
  }
}
