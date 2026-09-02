import { NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { validateRequestBody, validateQueryParams } from "@/lib/validation/api-validator";
import { ChatGetQuerySchema, ChatSendMessageSchema } from "@/lib/validation/schemas";

function getServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role keys not configured.");
  }
  return createClient(url, key);
}

// GET — Retrieve chat message history
export async function GET(request: NextRequest) {
  try {
    const queryValidation = validateQueryParams(
      request.nextUrl.searchParams,
      ChatGetQuerySchema
    );
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { clientId: clientIdParam } = queryValidation.data;

    const clientSupabase = await createServerSupabase();
    const { data: { user }, error: authError } = await clientSupabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized access: Missing authentication" }, { status: 401 });
    }

    let targetClientId: string | null = null;
    const isAdmin = user.app_metadata?.role === "admin";

    if (isAdmin) {
      targetClientId = clientIdParam || null;
    } else {
      // Get the profile ID associated with the authenticated user
      const { data: profile } = await clientSupabase
        .from("client_profiles")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (profile) {
        targetClientId = profile.id;
      }
    }

    if (!targetClientId) {
      return Response.json({ error: "Client profile not found" }, { status: 404 });
    }

    // Fetch message history
    // Admin uses service role; Client uses client session
    const supabase = isAdmin ? getServiceRoleSupabase() : clientSupabase;

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
    const validation = await validateRequestBody(request, ChatSendMessageSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { message, clientId } = validation.data;

    const clientSupabase = await createServerSupabase();
    const { data: { user }, error: authError } = await clientSupabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized access: Missing authentication" }, { status: 401 });
    }

    let targetClientId: string | null = null;
    let sender: "client" | "coach" | null = null;
    const isAdmin = user.app_metadata?.role === "admin";

    if (isAdmin) {
      targetClientId = clientId || null;
      sender = "coach";
    } else {
      // Get the profile ID associated with the user
      const { data: profile } = await clientSupabase
        .from("client_profiles")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (profile) {
        targetClientId = profile.id;
        sender = "client";
      }
    }

    if (!targetClientId || !sender) {
      return Response.json({ error: "Client profile not found" }, { status: 404 });
    }

    // Insert message into Supabase
    const supabase = isAdmin ? getServiceRoleSupabase() : clientSupabase;

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
