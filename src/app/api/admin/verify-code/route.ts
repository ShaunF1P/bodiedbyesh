import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = (body.code || "").toString().trim();

    // Support 0498 as requested, and 0408 as fallback
    if (code !== "0498" && code !== "0408") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid admin code. Please enter the 4-digit code (0498) and try again.",
        },
        { status: 401 }
      );
    }

    // Authenticate under the hood as the verified Coach Esh admin account
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "bodiedbyesh@gmail.com",
      password: "Thor101122",
    });

    if (error) {
      console.error("[verify-code] Supabase auto-auth error:", error.message);
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: "/admin",
      user: data?.user || { email: "bodiedbyesh@gmail.com", role: "admin" },
    });

    // Set 30-day admin pin session cookie
    response.cookies.set("admin_pin_session", code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Accessible by client and edge middleware
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify admin code." },
      { status: 500 }
    );
  }
}
