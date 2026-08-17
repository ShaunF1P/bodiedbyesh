import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false, // Disables X-Powered-By header to prevent fingerprint leakage
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src 'self' https://js.stripe.com; media-src 'self' blob:; camera 'self';",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN", // Allows iframe testing from same origin (for smoke test)
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
