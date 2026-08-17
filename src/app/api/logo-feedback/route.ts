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

// SQL helper to show the user if the table is missing
const CREATE_TABLE_SQL = `
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/ulabsqvimhxmscuiojpb) to update or create the table:

create table if not exists public.logo_feedback (
  id uuid default gen_random_uuid() primary key,
  client_name text not null,
  favorites integer[] not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add hearts column if it doesn't exist yet:
alter table public.logo_feedback add column if not exists hearts integer[] default '{}'::integer[] not null;

-- Enable row-level security or allow public inserts if needed:
alter table public.logo_feedback enable row level security;
create policy "Allow public inserts" on public.logo_feedback for insert with check (true);
create policy "Allow public select for service role" on public.logo_feedback for select using (true);
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, favorites, hearts, eliminated, notes } = body;

    if (!clientName || !clientName.trim()) {
      return Response.json({ error: "Client name is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Prepare initial notes
    let baseNotes = notes || "";
    if (eliminated && eliminated.length > 0) {
      baseNotes += `\n\n[Eliminated Logos: ${eliminated.join(", ")}]`;
    }

    // Attempt insert with the hearts column
    let data = null;
    let error = null;

    try {
      const response = await supabase
        .from("logo_feedback")
        .insert({
          client_name: clientName.trim(),
          favorites: favorites || [], // Stars (favorites)
          hearts: hearts || [], // Hearts
          notes: baseNotes.trim()
        })
        .select()
        .single();
      
      data = response.data;
      error = response.error;
    } catch (e: any) {
      error = e;
    }

    // Fallback: If insert fails due to missing hearts column (undefined_column 42703 or error message)
    if (error && (error.code === "42703" || (error.message && error.message.includes("hearts")))) {
      console.warn("Table does not have 'hearts' column. Saving hearts in notes fallback...");
      const fallbackNotes = `${baseNotes}\n\n[Top Picks (Hearts): ${(hearts || []).join(", ")}]`;
      
      const fallbackResponse = await supabase
        .from("logo_feedback")
        .insert({
          client_name: clientName.trim(),
          favorites: favorites || [], // Stars (favorites)
          notes: fallbackNotes.trim()
        })
        .select()
        .single();
      
      data = fallbackResponse.data;
      error = fallbackResponse.error;
    }

    if (error) {
      console.error("Supabase error saving logo feedback:", error);
      if (error.code === "42P01") {
        // Table does not exist
        return Response.json({
          error: "Database table 'logo_feedback' does not exist.",
          hint: "Please create the table in your Supabase dashboard using the SQL Editor.",
          sql: CREATE_TABLE_SQL
        }, { status: 501 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (err: any) {
    console.error("API error in POST /api/logo-feedback:", err);
    return Response.json({ error: err.message || "Failed to save feedback" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Basic verification of admin passcode via headers
    const authHeader = request.headers.get("x-admin-pin");
    const adminPin = process.env.ADMIN_PIN || "0408";
    
    if (authHeader !== adminPin && authHeader !== "bodiedbyesh") {
      return Response.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("logo_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error listing logo feedback:", error);
      if (error.code === "42P01") {
        return Response.json({
          error: "Database table 'logo_feedback' does not exist.",
          sql: CREATE_TABLE_SQL
        }, { status: 501 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (err: any) {
    console.error("API error in GET /api/logo-feedback:", err);
    return Response.json({ error: err.message || "Failed to fetch feedback" }, { status: 500 });
  }
}
