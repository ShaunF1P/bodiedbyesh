# Explorer Subagent Handoff Report: Requirement R1 Codebase Survey

**Agent**: `explorer_survey_1`  
**Working Directory**: `c:\projects\BodiedbyEsh\.agents\explorer_survey_1`  
**Parent Agent**: Orchestrator (`d53401eb-105b-49ec-9527-128673042b41`)  
**Target Milestone**: Requirement R1 (Perimeter & Security Ingress Hardening)  
**Survey Report File**: `c:\projects\BodiedbyEsh\.agents\explorer_survey_1\report.md`  

---

## 1. Observation

Direct code inspections and ripgrep searches across `c:\projects\BodiedbyEsh` identified the following concrete observations:

### Observation 1: Hardcoded PINs & Fallbacks
- `src/app/api/admin/client-profile/route.ts`:
  - Lines 16–18: `const adminPin = request.headers.get("x-admin-pin") || request.nextUrl.searchParams.get("pin"); const configuredPin = process.env.ADMIN_PIN || "0408"; if (adminPin !== configuredPin && adminPin !== "0408" && adminPin !== "bodiedbyesh")`
  - Identical logic repeated in POST (lines 186–188) and PATCH (lines 256–258).
- `src/app/api/admin/leads/route.ts`:
  - Lines 40–43: `const authHeader = request.headers.get("x-admin-pin"); const adminPin = process.env.ADMIN_PIN || "0408"; if (authHeader !== adminPin && authHeader !== "bodiedbyesh")`
  - Identical logic in PATCH (lines 74–77).
- `src/app/api/admin/workouts/route.ts`:
  - Lines 14–18: `function verifyAdmin(request: NextRequest) { const authHeader = request.headers.get("x-admin-pin"); const adminPin = process.env.ADMIN_PIN || "0408"; return authHeader === adminPin || authHeader === "bodiedbyesh"; }`
- `src/app/api/chat/route.ts`:
  - Lines 15–18: `function verifyAdmin(request: NextRequest) { const authHeader = request.headers.get("x-admin-pin"); const adminPin = process.env.ADMIN_PIN || "0408"; return authHeader === adminPin || authHeader === "bodiedbyesh"; }`
- `src/app/api/logo-feedback/route.ts`:
  - Lines 115–118: `const authHeader = request.headers.get("x-admin-pin"); const adminPin = process.env.ADMIN_PIN || "0408"; if (authHeader !== adminPin && authHeader !== "bodiedbyesh")`
- `src/app/api/park-config/route.ts`:
  - Lines 61–63: `const adminPin = process.env.ADMIN_PIN || "0408"; if (body.pin !== adminPin && body.pin !== "bodiedbyesh")`
- `.env.example`:
  - Line 31: `ADMIN_PIN="0408"`

### Observation 2: Client-Side Auto-Seeding & Impersonation
- `src/app/dashboard/page.tsx`:
  - Line 121: `const pin = typeof window !== "undefined" ? sessionStorage.getItem("admin_pin") || "0408" : "0408";`
  - Lines 213–223:
    ```typescript
    const isStaffAdmin = savedAdminPin === "0408" || savedAdminPin === "bodiedbyesh" || adminParam === "true" || Boolean(viewAsParam);
    if (isStaffAdmin) {
      setIsAdminMode(true);
      if (!savedAdminPin) sessionStorage.setItem("admin_pin", "0408");
      try {
        const rRes = await fetch(`/api/admin/client-profile?roster=true&pin=0408`, {
          headers: { "x-admin-pin": "0408" },
          cache: "no-store",
        });
    ```
- `src/components/AdminClientSwitcher.tsx`:
  - Line 74: `const savedPin = sessionStorage.getItem("admin_pin") || "0408";`
  - Line 127: `"x-admin-pin": pin || "0408"`
- `src/app/admin/layout.tsx`:
  - Lines 44–56: Reads `sessionStorage.getItem("admin_pin")`, sends `headers: { "x-admin-pin": savedPin }`.
  - Line 73: `sessionStorage.setItem("admin_pin", pin);`
  - Lines 99–131: PIN form `<input type="password" maxLength={4} ... />`

### Observation 3: Meal Logging BOLA & Service Role Bypass
- `src/app/api/log-meal/route.ts`:
  - Lines 15–22: Instantiates `createClient(url, key)` using `SUPABASE_SERVICE_ROLE_KEY`.
  - Lines 26–56: `POST` parses `const { clientEmail, mealType, items, imageUrl } = body;` and inserts `client_email: clientEmail || "guest"` directly with service role without checking user auth session.
  - Lines 71–83: `GET` parses `const email = searchParams.get("email") || "guest";` and executes `supabase.from("meal_log").select("*").eq("client_email", email)` with service role.

### Observation 4: Stripe Checkout Price ID Parameter Tampering
- `src/app/api/create-checkout-session/route.ts`:
  - Lines 14–25: `const { priceId, programChoice, ... } = body; let resolvedPriceId = priceId;`
  - Accepts any client-supplied `priceId` without server-side validation against environment variables.
  - Derives mode from unvalidated client param: `const isSubscription = programChoice === "track_a" || programChoice === "track_b"; const mode = isSubscription ? "subscription" : "payment";`
- `src/app/apply/page.tsx`:
  - Lines 15, 30, 32, 220, 232: Program choices used on frontend are `"track_a"` and `"track_b"`.
  - `src/app/park/page.tsx` uses `"track_a_park"`.
  - `src/app/login/page.tsx` uses `"Portal Access Request"`.

---

## 2. Logic Chain

1. **Premise 1 (PIN Ingress Flaw)**: The presence of static PIN strings (`"0408"`, `"bodiedbyesh"`) hardcoded in `route.ts` files (Observation 1) means that possession of a static 4-digit code grants full administrative access to all leads, workouts, chats, park settings, and client profiles, bypassing Supabase Auth and Row Level Security (RLS).
2. **Premise 2 (Auto-Seeding Exploit)**: In `src/app/dashboard/page.tsx` (Observation 2), visiting with `?admin=true` or `?viewAs=...` automatically writes `"0408"` to `sessionStorage` and immediately fires an authenticated admin request to `/api/admin/client-profile?roster=true&pin=0408`. This allows an unauthenticated external user to extract the full coaching roster.
3. **Premise 3 (BOLA in Meal Logging)**: In `src/app/api/log-meal/route.ts` (Observation 3), because the handler relies on `SUPABASE_SERVICE_ROLE_KEY` and reads `email` from query parameters and request body, any caller can view any user's nutrition data or inject fraudulent records without authentication.
4. **Premise 4 (Price ID Injection)**: In `src/app/api/create-checkout-session/route.ts` (Observation 4), trusting `priceId` from the request body allows arbitrary price tampering during checkout.
5. **Conclusion**: Remediating Requirement R1 requires (a) deleting all hardcoded PIN fallbacks and client storage auto-seeding, (b) introducing server-side session checks verifying `user.app_metadata.role === 'admin'`, (c) securing `/api/log-meal` with cookie-based user-scoped client session verification, and (d) locking down `/api/create-checkout-session` with a strict `ALLOWED_PROGRAM_CONFIGS` whitelist enum.

---

## 3. Caveats

- **Existing Smoke Test Dependency**: `smoke_test_suite.mjs` currently relies on `headers: { 'x-admin-pin': '0408' }` to test admin routes. When the PIN barrier is removed, the smoke test suite must be updated to expect `401 Unauthorized` for unauthenticated requests and test authenticated access via mock or valid session cookies.
- **Admin User Provisioning**: Ensure that Coach Esh's administrative Supabase Auth account has `user.app_metadata = { role: 'admin' }` configured in Supabase Auth so that login to `/admin` succeeds.
- No other caveats.

---

## 4. Conclusion

Requirement R1 has been thoroughly surveyed and mapped across all routes, components, and APIs. The vulnerability mechanics are completely understood, and the remediation designs are documented in `c:\projects\BodiedbyEsh\.agents\explorer_survey_1\report.md`.

---

## 5. Verification Method

To independently verify the observations:
1. Grep for PIN patterns:
   `rg "0408|bodiedbyesh|ADMIN_PIN" src/`
2. Inspect dashboard auto-seeding:
   `rg -n "sessionStorage.setItem\(\"admin_pin\"" src/`
3. Inspect meal log service role usage:
   `rg -n "SUPABASE_SERVICE_ROLE_KEY" src/app/api/log-meal/`
4. Inspect checkout price resolution:
   `rg -n "resolvedPriceId" src/app/api/create-checkout-session/`
