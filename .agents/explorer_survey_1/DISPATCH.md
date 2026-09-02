## 2026-08-28T19:55:14Z

Investigate and map the codebase for Requirement R1 (Perimeter & Security Ingress Hardening):
1. Search and identify all hardcoded administrative fallback PINs ("0408", "bodiedbyesh"), any related environment variable fallbacks or client-side sessionStorage auto-seeding across all routes, components, and hooks.
2. Investigate how administrative route authorization currently works across /admin, /api/admin/*, etc., and how to transition to Supabase Auth metadata role checks (user.app_metadata.role === 'admin').
3. Investigate the meal logging API (/api/meals or related endpoints), checking for Broken Object-Level Authorization (BOLA), cookie-based user session handling, and service-role client usage vs user-scoped Supabase client.
4. Investigate Stripe Checkout session creation (/api/checkout, /api/stripe/*, etc.), how Price IDs and programs are handled, where arbitrary client price IDs might be accepted, and map the whitelist structure based on validated program choice enums.
