/**
 * Utility helper to build canonical auth redirect URLs.
 * Ensures email verification links, magic links, and password resets
 * point to the valid live domain (https://bodiedbyesh.com) and never localhost on mobile devices.
 */
export function getAuthRedirectUrl(path: string = "/coastal"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin;
    if (
      currentOrigin &&
      !currentOrigin.includes("localhost") &&
      !currentOrigin.includes("127.0.0.1")
    ) {
      return `${currentOrigin}/auth/callback?next=${encodeURIComponent(cleanPath)}`;
    }
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://bodiedbyesh.com"
  ).replace(/\/$/, "");

  return `${siteUrl}/auth/callback?next=${encodeURIComponent(cleanPath)}`;
}
