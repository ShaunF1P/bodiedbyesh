import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export type AdminAuthResult =
  | { user: User; error: null }
  | { user: null; error: Response };

/**
 * Validates that the incoming request has a valid Supabase Auth session
 * and that the authenticated user possesses the 'admin' role in app_metadata.
 */
export async function requireAdminSession(request?: NextRequest): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        error: Response.json(
          { error: "Unauthorized: Authentication required" },
          { status: 401 }
        ),
      };
    }

    const role = user.app_metadata?.role;
    if (role !== "admin") {
      return {
        user: null,
        error: Response.json(
          { error: "Forbidden: Administrator privileges required" },
          { status: 403 }
        ),
      };
    }

    return { user, error: null };
  } catch (err: any) {
    return {
      user: null,
      error: Response.json(
        { error: "Internal authentication verification failure" },
        { status: 500 }
      ),
    };
  }
}
