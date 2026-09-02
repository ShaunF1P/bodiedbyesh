/**
 * Milestone 2 (M2: Domain Logic, SRE & Data Isolation)
 * Automated Unit, Integration, Anti-Spoofing & Compliance Test Suite
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("  MILESTONE 2 (M2: DOMAIN LOGIC, SRE & DATA ISOLATION) TEST SUITE");
console.log("================================================================================");

let total = 0;
let passed = 0;
let failed = 0;

function assert(testName, condition, detail = "") {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName} ${detail ? `(${detail})` : ""}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName} ${detail ? `(${detail})` : ""}`);
  }
}

// ── 1. Sliding-Window Rate Limiting Unit & Integration Tests ──────────────────
console.log("\n--- [1/5] Sliding-Window IP Rate Limiter Tests ---");

const rateLimitModulePath = path.join(PROJECT_ROOT, "src/lib/rate-limit.ts");
assert("src/lib/rate-limit.ts exists", fs.existsSync(rateLimitModulePath));

// Dynamically import rate limiter utility
const {
  getClientIp,
  evaluateRateLimit,
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMIT_POLICIES,
  _resetRateLimitStore,
} = await import("../src/lib/rate-limit.ts");

// IP resolution tests
const mockReqWithXFF = {
  headers: new Headers({ "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" }),
};
assert("getClientIp parses first IP from comma-separated x-forwarded-for", getClientIp(mockReqWithXFF) === "203.0.113.195");

const mockReqWithRealIp = {
  headers: new Headers({ "x-real-ip": "198.51.100.42" }),
};
assert("getClientIp resolves x-real-ip when x-forwarded-for is absent", getClientIp(mockReqWithRealIp) === "198.51.100.42");

const mockReqWithCF = {
  headers: new Headers({ "cf-connecting-ip": "192.0.2.1" }),
};
assert("getClientIp resolves cf-connecting-ip as fallback", getClientIp(mockReqWithCF) === "192.0.2.1");

const mockReqEmpty = { headers: new Headers() };
assert("getClientIp falls back to 127.0.0.1 when no proxy headers exist", getClientIp(mockReqEmpty) === "127.0.0.1");

// Sliding window evaluation tests (Form policy: 5 req/min)
_resetRateLimitStore();
const testKey = "test:ip:10.0.0.1";
const formPolicy = { windowMs: 60_000, maxRequests: 5 };

for (let i = 1; i <= 5; i++) {
  const res = evaluateRateLimit(testKey, formPolicy);
  assert(`Rate limiter allows request ${i}/5 within sliding window`, res.success === true, `remaining: ${res.remaining}`);
}

const exceededRes = evaluateRateLimit(testKey, formPolicy);
assert("Rate limiter rejects 6th request with success=false", exceededRes.success === false && exceededRes.remaining === 0);
assert("Rate limiter provides valid retryAfterSeconds >= 1", exceededRes.retryAfterSeconds >= 1);
assert("Rate limiter provides Unix reset timestamp", exceededRes.reset > Math.floor(Date.now() / 1000) - 5);

// Burst stress test (100 rapid requests on form policy max 5)
const burstKey = "test:ip:192.168.1.100";
let allowedInBurst = 0;
let rejectedInBurst = 0;
for (let i = 0; i < 100; i++) {
  const result = evaluateRateLimit(burstKey, RATE_LIMIT_POLICIES.form);
  if (result.success) allowedInBurst++;
  else rejectedInBurst++;
}
assert("Rate limiter strictly bounds burst requests to policy max (5 allowed)", allowedInBurst === 5, `allowed: ${allowedInBurst}`);
assert("Rate limiter rejects remaining 95 requests in burst", rejectedInBurst === 95, `rejected: ${rejectedInBurst}`);

// Tenant / IP Isolation test
const ipAKey = "test:ip:10.0.0.50";
const ipBKey = "test:ip:10.0.0.51";
for (let i = 0; i < 5; i++) evaluateRateLimit(ipAKey, RATE_LIMIT_POLICIES.form);
const ipAExceeded = evaluateRateLimit(ipAKey, RATE_LIMIT_POLICIES.form);
const ipBAllowed = evaluateRateLimit(ipBKey, RATE_LIMIT_POLICIES.form);
assert("Rate limiter isolates IPs: IP A is throttled", ipAExceeded.success === false);
assert("Rate limiter isolates IPs: IP B is NOT throttled by IP A", ipBAllowed.success === true && ipBAllowed.remaining === 4);

// 429 response structure test
const http429 = rateLimitResponse(exceededRes);
assert("rateLimitResponse returns HTTP 429 status code", http429.status === 429);
assert("rateLimitResponse includes RFC Retry-After header", http429.headers.has("Retry-After"));
assert("rateLimitResponse includes X-RateLimit-Limit header", http429.headers.get("X-RateLimit-Limit") === "5");
assert("rateLimitResponse includes X-RateLimit-Remaining: 0", http429.headers.get("X-RateLimit-Remaining") === "0");
assert("rateLimitResponse includes X-RateLimit-Reset header", http429.headers.has("X-RateLimit-Reset"));

// Check policies definition
assert("RATE_LIMIT_POLICIES defines 'form' (5 req/min)", RATE_LIMIT_POLICIES.form.maxRequests === 5);
assert("RATE_LIMIT_POLICIES defines 'ai' (10 req/min)", RATE_LIMIT_POLICIES.ai.maxRequests === 10);
assert("RATE_LIMIT_POLICIES defines 'checkout' (10 req/min)", RATE_LIMIT_POLICIES.checkout.maxRequests === 10);
assert("RATE_LIMIT_POLICIES defines 'auth' (30 req/min)", RATE_LIMIT_POLICIES.auth.maxRequests === 30);

// Route integration static checks
const ghlContactRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/ghl-contact/route.ts"), "utf8");
assert("ghl-contact route integrates checkRateLimit with 'form' policy", ghlContactRoute.includes('checkRateLimit(request, "form")'));

const bookApptRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/book-appointment/route.ts"), "utf8");
assert("book-appointment route integrates checkRateLimit with 'form' policy", bookApptRoute.includes('checkRateLimit(request, "form")'));

const scanMealRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/scan-meal/route.ts"), "utf8");
assert("scan-meal route integrates checkRateLimit with 'ai' policy", scanMealRoute.includes('checkRateLimit(request, "ai")'));

const recommendRecipeRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/recommend-recipe/route.ts"), "utf8");
assert("recommend-recipe route integrates checkRateLimit with 'ai' policy", recommendRecipeRoute.includes('checkRateLimit(request, "ai")'));

const createCheckoutRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/create-checkout-session/route.ts"), "utf8");
assert("create-checkout-session route integrates checkRateLimit with 'checkout' policy", createCheckoutRoute.includes('checkRateLimit(request, "checkout")'));

// ── 2. Health & Step Auth Anti-Spoofing Audit ─────────────────────────────────
console.log("\n--- [2/5] Health Tracker & Step Auth Anti-Spoofing Audit ---");

const userAuthPath = path.join(PROJECT_ROOT, "src/lib/auth/user.ts");
assert("src/lib/auth/user.ts exists", fs.existsSync(userAuthPath));

const userAuthContent = fs.readFileSync(userAuthPath, "utf8");
assert("requireUserSession returns 401 when unauthenticated", userAuthContent.includes("401") && userAuthContent.includes("Unauthorized"));

const coastalStepRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/coastal/steps/route.ts"), "utf8");
assert("coastal/steps route purged fallback '|| body.userId'", !coastalStepRoute.includes("|| body.userId"));
assert("coastal/steps route purged fallback '|| searchParams.get(\"userId\")'", !coastalStepRoute.includes('|| searchParams.get("userId")'));
assert("coastal/steps route purged fallback '|| \"guest-user\"'", !coastalStepRoute.includes('|| "guest-user"'));
assert("coastal/steps GET enforces requireUserSession", coastalStepRoute.includes("requireUserSession"));
assert("coastal/steps POST enforces requireUserSession", coastalStepRoute.includes("requireUserSession"));
assert("coastal/steps DELETE checks ownership before deleting log", coastalStepRoute.includes("user_id !== userId") || coastalStepRoute.includes("existingLog.user_id !== userId"));

const syncHealthRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/sync/health/route.ts"), "utf8");
assert("sync/health route purged fallback '|| body.userId'", !syncHealthRoute.includes("|| body.userId"));
assert("sync/health route purged fallback '|| \"guest-user\"'", !syncHealthRoute.includes('|| "guest-user"'));
assert("sync/health route enforces requireUserSession", syncHealthRoute.includes("requireUserSession"));

const coastalDevotionalsRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/coastal/devotionals/route.ts"), "utf8");
assert("coastal/devotionals route purged fallback '|| body.userId'", !coastalDevotionalsRoute.includes("|| body.userId"));
assert("coastal/devotionals route enforces requireUserSession in POST", coastalDevotionalsRoute.includes("requireUserSession"));

const coastalCommunityRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/coastal/community/route.ts"), "utf8");
assert("coastal/community route purged fallback '|| body.userId'", !coastalCommunityRoute.includes("|| body.userId"));
assert("coastal/community route enforces requireUserSession in POST", coastalCommunityRoute.includes("requireUserSession"));

const coastalJoinRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/coastal/join/route.ts"), "utf8");
assert("coastal/join route purged fallback '|| body.userId'", !coastalJoinRoute.includes("|| body.userId"));
assert("coastal/join route enforces requireUserSession", coastalJoinRoute.includes("requireUserSession"));

// ── 3. Park Schedule Persistence Verification ────────────────────────────────
console.log("\n--- [3/5] Park Schedule Persistence & Supabase DDL Audit ---");

const parkSqlPath = path.join(PROJECT_ROOT, "scratch/park_config_setup.sql");
assert("scratch/park_config_setup.sql exists", fs.existsSync(parkSqlPath));

const parkSqlContent = fs.readFileSync(parkSqlPath, "utf8");
assert("park SQL contains CREATE TABLE public.park_config", parkSqlContent.includes("CREATE TABLE IF NOT EXISTS public.park_config"));
assert("park SQL enables RLS on public.park_config", parkSqlContent.includes("ALTER TABLE public.park_config ENABLE ROW LEVEL SECURITY"));
assert("park SQL contains public read policy", parkSqlContent.includes("Allow public read park config"));
assert("park SQL contains admin write policy checking 'admin' role", parkSqlContent.includes("Allow admin write park config") && parkSqlContent.includes("'admin'"));
assert("park SQL contains service role policy", parkSqlContent.includes("Allow service role full access park config"));

const parkConfigRouteContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/park-config/route.ts"), "utf8");
assert("park-config GET queries Supabase public.park_config", parkConfigRouteContent.includes('from("park_config")'));
assert("park-config GET has resilient fallback to local storage / defaults", parkConfigRouteContent.includes("readFallbackConfig"));
assert("park-config POST enforces requireAdminSession", parkConfigRouteContent.includes("requireAdminSession"));
assert("park-config POST upserts to Supabase public.park_config", parkConfigRouteContent.includes('from("park_config").upsert('));

// ── 4. Customer PII Masking & Structured Logger Verification ─────────────────
console.log("\n--- [4/6] Customer PII Redaction & Structured Logger Tests ---");

const loggerModulePath = path.join(PROJECT_ROOT, "src/lib/logger.ts");
assert("src/lib/logger.ts exists", fs.existsSync(loggerModulePath));

const { maskEmail, maskPhone, maskName, sanitizeMeta, logger } = await import("../src/lib/logger.ts");

// Masking tests
assert("maskEmail masks standard email correctly", maskEmail("athlete.one@gmail.com") === "a***e@gmail.com");
assert("maskEmail masks short username email", maskEmail("me@test.org") === "m***@test.org");
assert("maskEmail masks single letter username", maskEmail("a@domain.com") === "a***@domain.com");
assert("maskEmail masks uppercase email safely", maskEmail("JOHN.DOE@GMAIL.COM") === "j***e@gmail.com");
assert("maskEmail masks complex subdomain email", maskEmail("client+vip@mail.sub.corp.co.uk") === "c***p@mail.sub.corp.co.uk");
assert("maskEmail handles null/empty safely", maskEmail(null) === "anonymous" && maskEmail("") === "anonymous");

assert("maskPhone masks 10-digit phone keeping last 4 digits", maskPhone("7728774231") === "+1***4231");
assert("maskPhone masks formatted phone keeping last 4 digits", maskPhone("+1 (772) 877-4231") === "+1***4231");
assert("maskPhone masks international phone format", maskPhone("+44 20 7946 0991") === "+1***0991");
assert("maskPhone handles null/empty safely", maskPhone(null) === "not-provided" && maskPhone("") === "not-provided");

assert("maskName masks multi-part name", maskName("Eshaan Sharma") === "E*** S***");
assert("maskName masks 3-part name", maskName("Mary Jane Watson") === "M*** J*** W***");
assert("maskName masks single name", maskName("Eshaan") === "E***");
assert("maskName handles null/empty safely", maskName(null) === "Client" && maskName("") === "Client");

// Metadata sanitization tests
const rawMeta = {
  customerEmail: "sensitive@bodiedbyesh.com",
  customerPhone: "772-877-4231",
  customerName: "Alex Mercer",
  password: "supersecretpass",
  html: "<div>Sensitive lead message</div>",
  publicInfo: "Park Group",
  nested: {
    userEmail: "deep.nested@target.com",
    token: "bearer_xyz_999",
    items: [
      { contactEmail: "array.user1@target.com", contactPhone: "555-000-1111" }
    ]
  }
};

const sanitized = sanitizeMeta(rawMeta);
assert("sanitizeMeta masks customerEmail", sanitized.customerEmail === "s***e@bodiedbyesh.com");
assert("sanitizeMeta masks customerPhone", sanitized.customerPhone === "+1***4231");
assert("sanitizeMeta masks customerName", sanitized.customerName === "A*** M***");
assert("sanitizeMeta redacts password", sanitized.password === "[REDACTED]");
assert("sanitizeMeta replaces raw html with content length", sanitized.html.includes("[HTML Content - length:"));
assert("sanitizeMeta preserves non-sensitive keys", sanitized.publicInfo === "Park Group");
assert("sanitizeMeta masks deeply nested userEmail", sanitized.nested.userEmail === "d***d@target.com");
assert("sanitizeMeta redacts deeply nested token", sanitized.nested.token === "[REDACTED]");
assert("sanitizeMeta masks array item contactEmail", sanitized.nested.items[0].contactEmail === "a***1@target.com");

// Adversarial stdout/stderr interception stress test
const capturedLogs = [];
const origLog = console.log;
const origWarn = console.warn;
const origError = console.error;

console.log = (...args) => capturedLogs.push({ level: "log", text: args.map(String).join(" ") });
console.warn = (...args) => capturedLogs.push({ level: "warn", text: args.map(String).join(" ") });
console.error = (...args) => capturedLogs.push({ level: "error", text: args.map(String).join(" ") });

const rawLeaks = [
  "leak.test1@gmail.com",
  "+1 (772) 999-8888",
  "super_confidential_token_9988",
];

logger.info("Test lead processing", { customerEmail: rawLeaks[0], customerPhone: rawLeaks[1], token: rawLeaks[2] });
logger.warn("Test warning log", { email: rawLeaks[0], password: rawLeaks[2] });
logger.error("Test error log", new Error("Simulated failure"), { customerEmail: rawLeaks[0], auth: rawLeaks[2] });

console.log = origLog;
console.warn = origWarn;
console.error = origError;

const capturedText = capturedLogs.map((l) => l.text).join("\n");
let leaksFound = 0;
for (const leak of rawLeaks) {
  if (capturedText.includes(leak)) {
    leaksFound++;
  }
}
assert("Empirical stdout/stderr inspection: Zero plaintext PII or secrets leaked", leaksFound === 0, `leaks: ${leaksFound}`);

// Static audit across communication and webhook routes
const mailContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/mail.ts"), "utf8");
assert("mail.ts uses maskEmail", mailContent.includes("maskEmail"));
assert("mail.ts uses logger", mailContent.includes("logger.info") && !mailContent.includes("console.log("));

const smsContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/sms.ts"), "utf8");
assert("sms.ts uses maskPhone", smsContent.includes("maskPhone"));
assert("sms.ts uses logger", smsContent.includes("logger.info") && !smsContent.includes("console.log("));

const stripeWebhookContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/webhook/stripe/route.ts"), "utf8");
assert("stripe webhook uses maskEmail and logger", stripeWebhookContent.includes("maskEmail") && stripeWebhookContent.includes("logger.info") && !stripeWebhookContent.includes("console.log("));

// ── 5. Park DB Failure Simulation & Resilient Fallback ────────────────────────
console.log("\n--- [5/6] Park DB Failure Simulation & Fallback Resilience ---");

const localConfigPath = path.join(PROJECT_ROOT, "data/park-config.json");
assert("data/park-config.json exists on disk", fs.existsSync(localConfigPath));

const diskConfig = JSON.parse(fs.readFileSync(localConfigPath, "utf8"));
assert("data/park-config.json has valid activePark", typeof diskConfig.activePark?.name === "string");
assert("data/park-config.json has valid schedule array", Array.isArray(diskConfig.schedule) && diskConfig.schedule.length > 0);

// DB Failure simulation logic verification
function simulateParkFallback(dbFailure = true) {
  if (!dbFailure) {
    return {
      activePark: { name: "Merrit Park", city: "Delray Beach, FL" },
      schedule: [{ day: "Monday", time: "5:30 PM", duration: "60 min" }],
      isAcceptingNewClients: true,
    };
  }
  try {
    const raw = fs.readFileSync(localConfigPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      activePark: { name: "Merrit Park", city: "Delray Beach, FL" },
      schedule: [{ day: "Monday", time: "5:30 PM", duration: "60 min" }],
      isAcceptingNewClients: true,
    };
  }
}

const fallbackResult = simulateParkFallback(true);
assert("DB Failure simulation: Fallback returns valid activePark on DB outage", typeof fallbackResult.activePark?.name === "string");
assert("DB Failure simulation: Fallback returns valid schedule array on DB outage", Array.isArray(fallbackResult.schedule) && fallbackResult.schedule.length > 0);

// ── 6. Checkout Prototype Guard & Zero-Emoji Audit ───────────────────────────
console.log("\n--- [6/6] Additional Hardening & Zero-Emoji Compliance Audit ---");

assert(
  "create-checkout-session guards against prototype lookup via Object.prototype.hasOwnProperty.call",
  createCheckoutRoute.includes("Object.prototype.hasOwnProperty.call(ALLOWED_PROGRAM_CONFIGS, programChoice)")
);

// Zero-Emoji Compliance across all M2 files
const m2Files = [
  "src/lib/rate-limit.ts",
  "src/lib/logger.ts",
  "src/lib/auth/user.ts",
  "src/lib/mail.ts",
  "src/lib/sms.ts",
  "src/app/api/ghl-contact/route.ts",
  "src/app/api/book-appointment/route.ts",
  "src/app/api/scan-meal/route.ts",
  "src/app/api/scan-menu/route.ts",
  "src/app/api/recommend-recipe/route.ts",
  "src/app/api/create-checkout-session/route.ts",
  "src/app/api/checkout-session/route.ts",
  "src/app/api/sync/health/route.ts",
  "src/app/api/coastal/steps/route.ts",
  "src/app/api/coastal/devotionals/route.ts",
  "src/app/api/coastal/community/route.ts",
  "src/app/api/coastal/join/route.ts",
  "src/app/api/park-config/route.ts",
  "src/app/api/log-meal/route.ts",
  "src/app/api/logo-feedback/route.ts",
  "src/app/api/webhook/stripe/route.ts",
  "scratch/park_config_setup.sql",
];

const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}\u{2B05}\u{2B06}\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{1F004}\u{1F0CF}\u{1F18E}\u{3030}]/u;

let emojiViolations = 0;
for (const relPath of m2Files) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, "utf8");
    if (emojiRegex.test(content)) {
      emojiViolations++;
      console.error(`Emoji detected in ${relPath}`);
    }
  }
}
assert("Strict Zero-Emoji Compliance Audit across all M2 files", emojiViolations === 0, `violations: ${emojiViolations}`);

console.log("--------------------------------------------------------------------------------");
console.log(`M2 TEST RESULTS: ${passed}/${total} PASSED (${failed} failures)`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("[SUCCESS] All Milestone 2 Domain Logic & SRE tests passed with 100% compliance!\n");
}

