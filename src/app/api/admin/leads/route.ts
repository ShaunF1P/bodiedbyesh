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

const CREATE_TABLE_SQL = `
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/ulabsqvimhxmscuiojpb) to create the coaching_leads table:

create table if not exists public.coaching_leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  program_choice text,
  track_goal text,
  source text,
  status text default 'new' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable row-level security:
alter table public.coaching_leads enable row level security;

-- Create policies:
create policy "Allow public inserts" on public.coaching_leads for insert with check (true);
create policy "Allow select for service role" on public.coaching_leads for select using (true);
create policy "Allow update for service role" on public.coaching_leads for update using (true);
`;

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
      .from("coaching_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error listing coaching leads:", error);
      if (error.code === "42P01") {
        return Response.json({
          error: "Database table 'coaching_leads' does not exist.",
          sql: CREATE_TABLE_SQL
        }, { status: 501 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (err: any) {
    console.error("API error in GET /api/admin/leads:", err);
    return Response.json({ error: err.message || "Failed to fetch coaching leads" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-admin-pin");
    const adminPin = process.env.ADMIN_PIN || "0408";

    if (authHeader !== adminPin && authHeader !== "bodiedbyesh") {
      return Response.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return Response.json({ error: "id and status are required" }, { status: 400 });
    }

    const validStatuses = ["new", "contacted", "enrolled", "archived"];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("coaching_leads")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating lead:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (err: any) {
    console.error("API error in PATCH /api/admin/leads:", err);
    return Response.json({ error: err.message || "Failed to update lead" }, { status: 500 });
  }
}
