import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * GET /auth/callback
 * Handles PKCE exchange and email verification redirects from Supabase Auth.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/coastal";

  // Determine production / host origin
  const host = request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const defaultBase = process.env.NEXT_PUBLIC_SITE_URL || "https://bodiedbyesh.com";
  const origin = host && !host.includes("localhost") ? `${proto}://${host}` : defaultBase;

  const targetUrl = new URL(next.startsWith("/") ? next : `/${next}`, origin);

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const response = NextResponse.redirect(targetUrl.toString());

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        targetUrl.searchParams.set("verified", "true");
        return NextResponse.redirect(targetUrl.toString());
      } else {
        console.error("Auth callback exchange error:", error);
      }
    }
  }

  return NextResponse.redirect(targetUrl.toString());
}
