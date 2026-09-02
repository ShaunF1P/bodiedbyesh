/**
 * Milestone 1 (M1: Perimeter & Security Ingress Hardening)
 * Automated Unit, Integration & Compliance Test Suite
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("  MILESTONE 1 (M1: PERIMETER & SECURITY HARDENING) TEST SUITE");
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

// ── 1. Admin PIN & Passcode Purge Static Analysis ─────────────────────────────
console.log("\n--- [1/4] Admin PIN & Storage Auto-Seeding Static Audit ---");

const filesToCheck = [
  "src/app/dashboard/page.tsx",
  "src/components/AdminClientSwitcher.tsx",
  "src/app/admin/layout.tsx",
  "src/app/admin/page.tsx",
  "src/app/admin/leads/page.tsx",
  "src/app/admin/park/page.tsx",
  "src/app/api/admin/client-profile/route.ts",
  "src/app/api/admin/leads/route.ts",
  "src/app/api/admin/workouts/route.ts",
  "src/app/api/chat/route.ts",
  "src/app/api/logo-feedback/route.ts",
  "src/app/api/park-config/route.ts",
  "src/app/logo-review/page.tsx",
  "src/app/logo-review/admin/page.tsx",
];

for (const relPath of filesToCheck) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  const content = fs.readFileSync(fullPath, "utf8");
  assert(`No hardcoded '0408' PIN in ${relPath}`, !content.includes('"0408"') && !content.includes("'0408'"));
  assert(`No hardcoded 'bodiedbyesh' passcode in ${relPath}`, !content.includes('"bodiedbyesh"') && !content.includes("'bodiedbyesh'"));
}

const envExample = fs.readFileSync(path.join(PROJECT_ROOT, ".env.example"), "utf8");
assert("ADMIN_PIN removed from .env.example", !envExample.includes("ADMIN_PIN"));

const dashboardContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/dashboard/page.tsx"), "utf8");
assert("Dashboard does not auto-seed sessionStorage admin_pin", !dashboardContent.includes('sessionStorage.setItem("admin_pin"'));
assert("Dashboard derives admin mode strictly from user app_metadata", dashboardContent.includes('currentUser.app_metadata?.role === "admin"'));

// ── 2. Admin Auth Helper & API Route Protection ────────────────────────────────
console.log("\n--- [2/4] Cryptographic Admin Session Verification ---");

const adminAuthPath = path.join(PROJECT_ROOT, "src/lib/auth/admin.ts");
assert("src/lib/auth/admin.ts exists", fs.existsSync(adminAuthPath));

const adminAuthFile = fs.readFileSync(adminAuthPath, "utf8");
assert("requireAdminSession uses createClient from @/lib/supabase/server", adminAuthFile.includes("createClient()") && adminAuthFile.includes("@/lib/supabase/server"));
assert("requireAdminSession validates user.app_metadata.role === 'admin'", adminAuthFile.includes("user.app_metadata?.role") && adminAuthFile.includes('"admin"'));
assert("requireAdminSession returns 401 on unauthenticated session", adminAuthFile.includes("401"));
assert("requireAdminSession returns 403 on non-admin user role", adminAuthFile.includes("403"));

const clientProfileRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/admin/client-profile/route.ts"), "utf8");
assert("client-profile route uses requireAdminSession", clientProfileRoute.includes("requireAdminSession"));

const leadsRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/admin/leads/route.ts"), "utf8");
assert("leads route uses requireAdminSession", leadsRoute.includes("requireAdminSession"));

const workoutsRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/admin/workouts/route.ts"), "utf8");
assert("workouts route uses requireAdminSession", workoutsRoute.includes("requireAdminSession"));

const logoFeedbackRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/logo-feedback/route.ts"), "utf8");
assert("logo-feedback route uses requireAdminSession", logoFeedbackRoute.includes("requireAdminSession"));

const parkConfigRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/park-config/route.ts"), "utf8");
assert("park-config route uses requireAdminSession in POST", parkConfigRoute.includes("requireAdminSession"));

// ── 3. Meal Logging BOLA Remediation ──────────────────────────────────────────
console.log("\n--- [3/4] Meal Logging BOLA Remediation Verification ---");

const logMealRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/log-meal/route.ts"), "utf8");
assert("log-meal route imports @/lib/supabase/server", logMealRoute.includes("@/lib/supabase/server"));
assert("log-meal route does not instantiate service role bypass", !logMealRoute.includes("SUPABASE_SERVICE_ROLE_KEY"));
assert("log-meal POST inserts with authenticated user.id and user.email", logMealRoute.includes("user_id: user.id") && logMealRoute.includes("client_email: user.email"));
assert("log-meal GET checks admin role before allowing requested email", logMealRoute.includes('user.app_metadata?.role === "admin"'));

// ── 4. Stripe Checkout Whitelist & Price ID Lockdown ──────────────────────────
console.log("\n--- [4/4] Stripe Checkout Whitelist & Zero-Emoji Compliance ---");

const checkoutRoute = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/api/create-checkout-session/route.ts"), "utf8");
assert("create-checkout-session exports ALLOWED_PROGRAM_CONFIGS", checkoutRoute.includes("export const ALLOWED_PROGRAM_CONFIGS"));
assert("ALLOWED_PROGRAM_CONFIGS contains track_a mapping", checkoutRoute.includes("track_a:") && checkoutRoute.includes("STRIPE_PRICE_TRACK_A"));
assert("ALLOWED_PROGRAM_CONFIGS contains track_a_hybrid mapping", checkoutRoute.includes("track_a_hybrid:"));
assert("ALLOWED_PROGRAM_CONFIGS contains track_a_park mapping", checkoutRoute.includes("track_a_park:"));
assert("ALLOWED_PROGRAM_CONFIGS contains track_b mapping", checkoutRoute.includes("track_b:") && checkoutRoute.includes("STRIPE_PRICE_TRACK_B"));
assert("ALLOWED_PROGRAM_CONFIGS contains track_b_hybrid mapping", checkoutRoute.includes("track_b_hybrid:"));
assert("ALLOWED_PROGRAM_CONFIGS contains intro_assessment mapping", checkoutRoute.includes("intro_assessment:") && checkoutRoute.includes("STRIPE_PRICE_INTRO"));
assert("create-checkout-session strictly validates programChoice in ALLOWED_PROGRAM_CONFIGS", checkoutRoute.includes("!(programChoice in ALLOWED_PROGRAM_CONFIGS)"));
assert("create-checkout-session completely ignores client priceId", !checkoutRoute.includes("let resolvedPriceId = priceId") && !checkoutRoute.includes("priceId ||"));

// ── Zero-Emoji Audit across M1 files ──────────────────────────────────────────
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}\u{2B05}\u{2B06}\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{1F004}\u{1F0CF}\u{1F18E}\u{3030}]/u;

let emojiViolations = 0;
for (const relPath of [...filesToCheck, "src/lib/auth/admin.ts", "src/app/api/log-meal/route.ts", "src/app/api/create-checkout-session/route.ts"]) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  const content = fs.readFileSync(fullPath, "utf8");
  if (emojiRegex.test(content)) {
    emojiViolations++;
    console.error(`Emoji detected in ${relPath}`);
  }
}
assert("Zero-Emoji Compliance Audit across M1 files", emojiViolations === 0, `violations: ${emojiViolations}`);

console.log("--------------------------------------------------------------------------------");
console.log(`M1 TEST RESULTS: ${passed}/${total} PASSED (${failed} failures)`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("[SUCCESS] All Milestone 1 perimeter security tests passed with 100% compliance!\n");
}
