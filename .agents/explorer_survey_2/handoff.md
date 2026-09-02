# Handoff Report: Explorer Survey 2 (Requirement R2)

## 1. Observation
1. **Rate Limiting Gaps**:
   - `src/app/api/ghl-contact/route.ts` (lines 15–181) and `src/app/api/book-appointment/route.ts` (lines 13–101) have no rate limiting. Both endpoints trigger outbound SMS via Twilio (`sendSMS`, line 110 in `ghl-contact/route.ts`, line 88 in `book-appointment/route.ts`) and email via Resend/SMTP (`sendEmail`, line 95 in `ghl-contact/route.ts`, line 56 & 82 in `book-appointment/route.ts`).
   - Grep search for `ratelimit`, `rate-limit`, `rateLimit`, and `@upstash` across `src/` yielded 0 matches.
2. **Health Tracker & Step Auth Spoofing**:
   - `src/app/api/sync/health/route.ts` (lines 86–87):
     ```ts
     const auth = await getAuthUser(request);
     const userId = auth?.user?.id || body.userId || "guest-user";
     ```
   - `src/app/api/coastal/steps/route.ts` (lines 42, 88, 145):
     ```ts
     // GET line 42:
     const userId = auth?.user?.id || searchParams.get("userId") || "guest-user";
     // POST line 88:
     const userId = auth?.user?.id || body.userId || "guest-user";
     // DELETE line 145:
     const userId = auth?.user?.id || searchParams.get("userId") || "guest-user";
     ```
   - `src/app/api/coastal/devotionals/route.ts` (line 116):
     ```ts
     const userId = auth?.user?.id || body.userId || "guest-user";
     ```
   - `src/app/api/coastal/community/route.ts` (line 101):
     ```ts
     const userId = auth?.user?.id || body.userId || "guest-user";
     ```
   - `src/app/api/coastal/join/route.ts` (line 40):
     ```ts
     const userId = auth?.user?.id || body.userId;
     ```
3. **Park Schedule Configuration Ephemeral Storage**:
   - `src/app/api/park-config/route.ts` (lines 5, 33–43, 80–84):
     ```ts
     const CONFIG_PATH = path.join(process.cwd(), "data", "park-config.json");
     ...
     await fs.writeFile(CONFIG_PATH, JSON.stringify(configData, null, 2));
     ```
   - `src/app/api/park-config/route.ts` (lines 60–64):
     ```ts
     const adminPin = process.env.ADMIN_PIN || "0408";
     if (body.pin !== adminPin && body.pin !== "bodiedbyesh") {
       return Response.json({ error: "Unauthorized" }, { status: 401 });
     }
     ```
   - `public.park_config` PostgreSQL table does not exist in any database setup migration files (`scratch/coastal_3266_setup.sql`, `scratch/database_setup.sql`, `scratch/phase2_setup.sql`).
4. **Customer PII Logging in Stdout**:
   - `src/lib/mail.ts` (lines 33, 45–53):
     ```ts
     console.log(`[Email] Successfully sent email to ${to} via Resend.`);
     ...
     console.log(`
     ==================================================
     [SIMULATED EMAIL SENT]
     To: ${to}
     Subject: ${subject}
     Content HTML:
     ${html}
     ==================================================
     `);
     ```
   - `src/lib/sms.ts` (lines 36, 48–54):
     ```ts
     console.log(`[SMS] Successfully sent SMS to ${to} via Twilio.`);
     ...
     console.log(`
     ==================================================
     [SIMULATED SMS SENT]
     To: ${to}
     Body: ${body}
     ==================================================
     `);
     ```
   - `src/app/api/ghl-contact/route.ts` (line 142):
     ```ts
     console.log(`[GHL] Contact upserted: ${contact.id} (${email})`);
     ```
   - `src/app/api/webhook/stripe/route.ts` (lines 56–58, line 81):
     ```ts
     console.log(`[stripe-webhook] [SUCCESS] Checkout completed — session ${session.id}, email: ${session.customer_email}`);
     ...
     console.log(`[stripe-webhook] Updated lead status in Supabase to active for ${cleanedEmail}`);
     ```

## 2. Logic Chain
1. From **Observation 1**: Because `/api/ghl-contact` and `/api/book-appointment` trigger paid SMS/Email notifications without any rate limiting, an automated script can trigger unbounded API calls, leading to financial exhaustion and SMS spam against Coach Esh.
2. From **Observation 2**: Because `getAuthUser` failures fall back to `body.userId` or `searchParams.userId`, an unauthenticated client can impersonate any arbitrary `user_id` to read, insert, or delete step logs, reflections, and community feed items.
3. From **Observation 3**: Because `src/app/api/park-config/route.ts` relies on local filesystem write operations (`fs.writeFile` to `data/park-config.json`), updates fail or are lost on serverless environments where local disk is read-only or ephemeral. Migrating to `public.park_config` with Supabase Auth role checks provides durable persistence and secure admin access.
4. From **Observation 4**: Because `console.log` directly outputs unmasked email addresses, phone numbers, and full HTML/SMS payloads containing client names and programs, production log collectors will ingest sensitive customer PII.

## 3. Caveats
- Upstash Redis credentials are not currently present in `.env.local`. Therefore, the rate limiter must be implemented with a zero-dependency in-memory sliding-window ring buffer while supporting optional Upstash Redis configuration via environment variables.
- Legacy frontend components (like `StepTracker.tsx` or `HealthTrackerSyncModal.tsx`) pass `userId` in payloads. When enforcing server-side session authentication, the server will derive `userId` solely from the verified session JWT (`user.id`) and reject unauthenticated requests with HTTP 401.

## 4. Conclusion
Requirement R2 remediation must execute four core architectural changes:
1. Implement in-memory sliding-window IP rate limiting (`src/lib/rate-limit.ts`) and apply it across public form and AI endpoints.
2. Replace fallback `userId` logic with strict `@supabase/ssr` session authentication (`auth.user.id`) across `/api/sync/health`, `/api/coastal/steps`, `/api/coastal/devotionals`, `/api/coastal/community`, and `/api/coastal/join`, returning 401 on missing session.
3. Create `public.park_config` PostgreSQL table in Supabase, update `/api/park-config/route.ts` to read/write from Supabase with JSON fallback, and secure administrative updates via Supabase Auth metadata role checks.
4. Implement `src/lib/logger.ts` with PII masking functions (`maskEmail`, `maskPhone`, `maskName`) and replace all unredacted `console.log` statements in `mail.ts`, `sms.ts`, `ghl-contact/route.ts`, and `stripe/route.ts`.

## 5. Verification Method
- **Rate Limiting**: Execute concurrent curl/fetch requests to `/api/ghl-contact` and `/api/book-appointment` (e.g. 6 rapid POST requests). Verify requests 1–5 return status 200/400 and request 6 returns status 429 with `Retry-After` header.
- **Session Authentication**: Send unauthenticated POST requests with `{ "steps": 5000, "userId": "<spoofed-uuid>" }` to `/api/sync/health` and `/api/coastal/steps`. Verify both return HTTP 401 Unauthorized.
- **Park Schedule Persistence**: Run `GET /api/park-config` to verify config is returned from `public.park_config` (or fallback). Send `POST /api/park-config` with an authenticated admin cookie and verify update persists in Supabase.
- **PII Logging**: Trigger simulated email and SMS dispatches. Inspect standard output and verify emails are masked (`j***e@domain.com`), phone numbers are masked (`+1***4231`), and full HTML payloads are suppressed in production mode.
- **Test Runner**: Run `npm test` and `node scripts/run-coastal-tests.mjs` to ensure 100% test pass rate.
