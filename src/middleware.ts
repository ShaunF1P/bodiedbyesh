import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Case-Insensitive Routing Redirect ─────────────────────────────────────
  // Redirect requests with uppercase path letters to their lowercase equivalents
  // Excludes _next internal paths, api endpoints, and files with extensions
  if (
    /[A-Z]/.test(pathname) &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.includes(".")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 301);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard route
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      // Not logged in -> redirect to /login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    
    // Check if email is verified
    if (!user.email_confirmed_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("verified", "false");
      return NextResponse.redirect(url);
    }
  }

  // If visiting /login and already logged in and verified, redirect to /dashboard
  if (pathname.startsWith("/login") && user && user.email_confirmed_at) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run middleware on all page requests except assets and internal routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
