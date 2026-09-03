import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";

export type AdminAuthResult =
  | { user: User; error: null }
  | { user: null; error: Response };

/**
 * Validates that the incoming request has a valid Supabase Auth session
 * and that the authenticated user possesses the 'admin' role in app_metadata,
 * OR has a verified admin PIN session (0498 / 0408).
 */
export async function requireAdminSession(request?: NextRequest): Promise<AdminAuthResult> {
  try {
    // 1. Check verified admin code cookie or header
    const cookieStore = await cookies();
    const pinCookie = cookieStore.get("admin_pin_session")?.value;
    const headerPin = request?.headers?.get("x-admin-pin") || (await headers()).get("x-admin-pin");
    const hasValidPin = pinCookie === "0498" || pinCookie === "0408" || headerPin === "0498" || headerPin === "0408";

    if (hasValidPin) {
      const mockAdminUser: any = {
        id: "4adf0e87-4852-4ce7-9c77-1b7cbbfb96d5",
        email: "bodiedbyesh@gmail.com",
        role: "authenticated",
        app_metadata: { role: "admin", provider: "email" },
        user_metadata: { full_name: "Coach Esh" },
      };
      return { user: mockAdminUser, error: null };
    }

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

    const ADMIN_EMAILS = [
      "bodiedbyesh@gmail.com",
      "nieshaedwards314@gmail.com",
      "niesha0314@gmail.com",
      "kashaunmuhammad@gmail.com",
    ];
    const role = user.app_metadata?.role;
    const isEmailAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

    if (role !== "admin" && !isEmailAdmin) {
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
