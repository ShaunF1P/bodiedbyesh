import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { User, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export type UserAuthResult =
  | { user: User; error: null; supabase: SupabaseClient }
  | { user: null; error: Response; supabase: SupabaseClient | null };

/**
 * Validates that the incoming request has a valid Supabase Auth session.
 * Rejects unauthenticated requests with HTTP 401 Unauthorized.
 */
export async function requireUserSession(request?: NextRequest): Promise<UserAuthResult> {
  try {
    let supabase: SupabaseClient;

    if (request) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return {
          user: null,
          error: Response.json(
            { success: false, error: "Supabase configuration missing" },
            { status: 500 }
          ),
          supabase: null,
        };
      }

      supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      });
    } else {
      supabase = await createClient();
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        error: Response.json(
          { success: false, error: "Unauthorized: Active user session required" },
          { status: 401 }
        ),
        supabase,
      };
    }

    return { user, error: null, supabase };
  } catch (err: any) {
    return {
      user: null,
      error: Response.json(
        { success: false, error: "Authentication verification failure: " + (err.message || "") },
        { status: 401 }
      ),
      supabase: null,
    };
  }
}

/**
 * Optional session retrieval without enforcing 401.
 */
export async function getAuthUser(request?: NextRequest): Promise<{ user: User; supabase: SupabaseClient } | null> {
  try {
    const result = await requireUserSession(request);
    if (result.user && result.supabase) {
      return { user: result.user, supabase: result.supabase };
    }
    return null;
  } catch {
    return null;
  }
}
