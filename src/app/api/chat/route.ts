import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function getServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role keys not configured.");
  }
  return createClient(url, key);
}

// Helper to authenticate admin PIN
function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-pin");
  const adminPin = process.env.ADMIN_PIN || "0408";
  return authHeader === adminPin || authHeader === "bodiedbyesh";
}

// GET — Retrieve chat message history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get("clientId");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Attempt client session auth first
    const clientSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // No-op
        },
      },
    });

    const { data: { user } } = await clientSupabase.auth.getUser();

    let targetClientId: string | null = null;
    let isAdminCall = false;

    // Check if this is an admin request
    if (verifyAdmin(request)) {
      isAdminCall = true;
      targetClientId = clientIdParam;
    } else if (user) {
      // Get the profile ID associated with the user's email
      const { data: profile } = await clientSupabase
        .from("client_profiles")
        .select("id")
        .eq("email", user.email)
        .single();
      
      if (profile) {
        targetClientId = profile.id;
      }
    }

    if (!targetClientId) {
      return Response.json({ error: "Unauthorized access: Missing authentication" }, { status: 401 });
    }

    // Fetch message history
    // Admin uses service role; Client uses client session
    const supabase = isAdminCall ? getServiceRoleSupabase() : clientSupabase;

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("client_id", targetClientId)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data: messages });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to fetch chat logs" }, { status: 500 });
  }
}

// POST — Send a new chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, clientId } = body;

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const clientSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // No-op
        },
      },
    });

    const { data: { user } } = await clientSupabase.auth.getUser();

    let targetClientId: string | null = null;
    let sender: "client" | "coach" | null = null;
    let isAdminCall = false;

    // Check if this is an admin request
    if (verifyAdmin(request)) {
      isAdminCall = true;
      targetClientId = clientId;
      sender = "coach";
    } else if (user) {
      // Get the profile ID associated with the user's email
      const { data: profile } = await clientSupabase
        .from("client_profiles")
        .select("id")
        .eq("email", user.email)
        .single();
      
      if (profile) {
        targetClientId = profile.id;
        sender = "client";
      }
    }

    if (!targetClientId || !sender) {
      return Response.json({ error: "Unauthorized access: Missing authentication" }, { status: 401 });
    }

    // Insert message into Supabase
    const supabase = isAdminCall ? getServiceRoleSupabase() : clientSupabase;

    const { data: insertedMsg, error } = await supabase
      .from("chat_messages")
      .insert({
        client_id: targetClientId,
        sender,
        message,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data: insertedMsg });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to send message" }, { status: 500 });
  }
}
