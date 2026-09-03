import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── 1. Case-Insensitive Routing Canonicalization ──────────────────────────
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
        cookiesToSet.forEach(({ name, value }) =>
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

  const ADMIN_EMAILS = [
    "bodiedbyesh@gmail.com",
    "nieshaedwards314@gmail.com",
    "niesha0314@gmail.com",
    "kashaunmuhammad@gmail.com",
  ];

  const adminPinCookie = request.cookies.get("admin_pin_session")?.value;
  const hasValidPinSession = adminPinCookie === "0498" || adminPinCookie === "0408";

  // ── 2. Intercept /admin, /admin/*, and /logo-review/admin ───────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/logo-review/admin")) {
    if (!user && !hasValidPinSession) {
      // Unauthenticated -> redirect to /login with redirectTo parameter
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    const userRole = user?.app_metadata?.role as string | undefined;
    const isEmailAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

    if (!hasValidPinSession && userRole !== "admin" && !isEmailAdmin) {
      // Unauthorized non-admin user -> redirect to /dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "unauthorized_admin_access");
      return NextResponse.redirect(url);
    }
  }

  // ── 3. Intercept /dashboard Routes ─────────────────────────────────────────
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

  // ── 4. Redirect Authenticated Users Away from /login ───────────────────────
  if (pathname.startsWith("/login") && user && user.email_confirmed_at) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const userRole = user.app_metadata?.role as string | undefined;
    const isEmailAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
    const isAdmin = userRole === "admin" || isEmailAdmin;

    const url = request.nextUrl.clone();
    if (redirectTo && redirectTo.startsWith("/admin") && isAdmin) {
      url.pathname = redirectTo;
      url.search = "";
    } else if (isAdmin) {
      url.pathname = "/admin";
      url.search = "";
    } else {
      url.pathname = "/dashboard";
      url.search = "";
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run middleware on all page requests except assets and internal routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
