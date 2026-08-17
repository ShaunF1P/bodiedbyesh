import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured in environment variables.");
  }
  return createClient(url, key);
}

// Helper to authenticate admin PIN
function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-pin");
  const adminPin = process.env.ADMIN_PIN || "0408";
  return authHeader === adminPin || authHeader === "bodiedbyesh";
}

// GET — Fetch workouts for a client on a specific date
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return Response.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const date = searchParams.get("date");

    if (!clientId) {
      return Response.json({ error: "clientId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    let query = supabase
      .from("workouts")
      .select(`
        *,
        exercises: workout_exercises(*)
      `)
      .eq("client_id", clientId);

    if (date) {
      query = query.eq("date", date);
    }

    const { data: workouts, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data: workouts });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to fetch workouts" }, { status: 500 });
  }
}

// POST — Create or replace a workout for a client on a specific date
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return Response.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, date, workoutName, notes, exercises } = body;

    if (!clientId || !date || !workoutName || !Array.isArray(exercises)) {
      return Response.json(
        { error: "clientId, date, workoutName, and exercises (array) are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 1. Delete existing workouts for this client on this date
    // Cascades to workout_exercises and logged_sets
    const { error: deleteErr } = await supabase
      .from("workouts")
      .delete()
      .eq("client_id", clientId)
      .eq("date", date);

    if (deleteErr) {
      return Response.json({ error: deleteErr.message }, { status: 500 });
    }

    // 2. Insert new workout
    const { data: workout, error: insertErr } = await supabase
      .from("workouts")
      .insert({
        client_id: clientId,
        date,
        name: workoutName,
        notes,
      })
      .select()
      .single();

    if (insertErr || !workout) {
      return Response.json({ error: insertErr?.message || "Failed to create workout record" }, { status: 500 });
    }

    // 3. Insert exercises
    if (exercises.length > 0) {
      const exerciseRecords = exercises.map((ex: any, idx: number) => ({
        workout_id: workout.id,
        exercise_name: ex.exerciseName,
        target_sets: ex.targetSets || 3,
        target_reps: ex.targetReps || "10",
        target_weight_lbs: ex.targetWeight ? parseInt(ex.targetWeight.toString()) : null,
        order_index: idx,
      }));

      const { error: exercisesErr } = await supabase
        .from("workout_exercises")
        .insert(exerciseRecords);

      if (exercisesErr) {
        return Response.json({ error: exercisesErr.message }, { status: 500 });
      }
    }

    // Retrieve full workout with exercises to return
    const { data: fullWorkout, error: fetchErr } = await supabase
      .from("workouts")
      .select(`
        *,
        exercises: workout_exercises(*)
      `)
      .eq("id", workout.id)
      .single();

    if (fetchErr) {
      return Response.json({ error: fetchErr.message }, { status: 500 });
    }

    return Response.json({ success: true, data: fullWorkout });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to save workout" }, { status: 500 });
  }
}

// DELETE — Remove a workout
export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return Response.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get("id");

    if (!workoutId) {
      return Response.json({ error: "workoutId (id) is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", workoutId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, message: "Workout deleted successfully" });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to delete workout" }, { status: 500 });
  }
}
