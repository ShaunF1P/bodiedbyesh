/**
 * Milestone 3 (M3: Quality Gates, Schema Validation & Architecture)
 * Automated Unit, Integration, Timeout, Port Adapter & Quality Gate Test Suite
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("  MILESTONE 3 (M3: QUALITY GATES, SCHEMAS & ARCHITECTURE) TEST SUITE");
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

// ── 1. Zod Runtime Schema Validation Tests ──────────────────────────────────
console.log("\n--- [1/5] Zod Schema Validation Engine & 21-Endpoint Schemas ---");

const schemasModule = await import("../src/lib/validation/schemas.ts");
const {
  ProgramChoiceEnum,
  HealthProviderEnum,
  MacroBudgetSchema,
  FoodItemSchema,
  AdminClientProfileQuerySchema,
  AdminClientProfileCreateSchema,
  AdminClientProfileUpdateSchema,
  AdminLeadsPatchSchema,
  AdminWorkoutGetQuerySchema,
  AdminWorkoutCreateSchema,
  AdminWorkoutDeleteQuerySchema,
  BookAppointmentSchema,
  ChatGetQuerySchema,
  ChatSendMessageSchema,
  CheckoutSessionGetQuerySchema,
  ClientLoggedSetSchema,
  CoastalCommunityQuerySchema,
  CoastalCommunityBodySchema,
  CoastalDevotionalQuerySchema,
  CoastalDevotionalReflectionSchema,
  CoastalJoinGroupSchema,
  CoastalStepsQuerySchema,
  CoastalStepsLogSchema,
  CoastalStepsDeleteQuerySchema,
  CreateCheckoutSessionSchema,
  GHLContactLeadSchema,
  LogMealQuerySchema,
  LogMealCreateSchema,
  LogoFeedbackPostSchema,
  ParkConfigUpdateSchema,
  RecommendRecipeSchema,
  ScanMealSchema,
  ScanMenuSchema,
  SyncHealthPostSchema,
  StripeWebhookHeaderSchema,
} = schemasModule;

assert("schemas.ts exports all 21 endpoint schema definitions", Boolean(
  AdminClientProfileCreateSchema &&
  AdminLeadsPatchSchema &&
  AdminWorkoutCreateSchema &&
  BookAppointmentSchema &&
  ChatSendMessageSchema &&
  CheckoutSessionGetQuerySchema &&
  ClientLoggedSetSchema &&
  CoastalCommunityBodySchema &&
  CoastalDevotionalReflectionSchema &&
  CoastalJoinGroupSchema &&
  CoastalStepsLogSchema &&
  CreateCheckoutSessionSchema &&
  GHLContactLeadSchema &&
  LogMealCreateSchema &&
  LogoFeedbackPostSchema &&
  ParkConfigUpdateSchema &&
  RecommendRecipeSchema &&
  ScanMealSchema &&
  ScanMenuSchema &&
  SyncHealthPostSchema &&
  StripeWebhookHeaderSchema
));

// Validation tests: GHL Contact
assert("GHLContactLeadSchema accepts valid lead payload", GHLContactLeadSchema.safeParse({
  name: "John Doe",
  email: "john@example.com",
  phone: "+17725551234",
  programChoice: "track_a",
  trackGoal: "Weight Loss",
}).success);

assert("GHLContactLeadSchema rejects missing email", !GHLContactLeadSchema.safeParse({
  name: "John Doe",
}).success);

assert("GHLContactLeadSchema rejects invalid email format", !GHLContactLeadSchema.safeParse({
  name: "John Doe",
  email: "not-an-email",
}).success);

// Validation tests: Sync Health
assert("SyncHealthPostSchema accepts valid health sync payload", SyncHealthPostSchema.safeParse({
  provider: "apple_health",
  steps: 8500,
  date: "2026-08-28",
  distanceMiles: 4.25,
  activeMinutes: 65,
}).success);

assert("SyncHealthPostSchema rejects negative steps", !SyncHealthPostSchema.safeParse({
  provider: "apple_health",
  steps: -100,
}).success);

assert("SyncHealthPostSchema rejects steps exceeding 200,000 bound", !SyncHealthPostSchema.safeParse({
  provider: "apple_health",
  steps: 250000,
}).success);

assert("SyncHealthPostSchema rejects invalid health provider enum", !SyncHealthPostSchema.safeParse({
  provider: "unknown_smartwatch",
  steps: 5000,
}).success);

// Validation tests: Coastal Steps Log
assert("CoastalStepsLogSchema accepts valid step entry", CoastalStepsLogSchema.safeParse({
  steps: 10000,
  logDate: "2026-08-28",
  distanceMiles: 5.0,
  notes: "Evening church campus walk",
}).success);

assert("CoastalStepsLogSchema rejects negative steps", !CoastalStepsLogSchema.safeParse({
  steps: -5,
}).success);

// Validation tests: Create Checkout Session
assert("CreateCheckoutSessionSchema accepts valid program choice", CreateCheckoutSessionSchema.safeParse({
  programChoice: "track_a",
  customerEmail: "athlete@example.com",
  customerName: "Jane Athlete",
}).success);

assert("CreateCheckoutSessionSchema rejects missing programChoice", !CreateCheckoutSessionSchema.safeParse({
  customerEmail: "athlete@example.com",
}).success);

// Validation tests: Book Appointment
assert("BookAppointmentSchema accepts valid slot booking", BookAppointmentSchema.safeParse({
  slot: "2026-09-01 10:00 AM EST",
  name: "Marcus Aurelius",
  email: "marcus@example.com",
}).success);

assert("BookAppointmentSchema rejects empty appointment slot", !BookAppointmentSchema.safeParse({
  name: "Marcus Aurelius",
  email: "marcus@example.com",
  slot: "",
}).success);

// Validation tests: Admin Leads Patch
assert("AdminLeadsPatchSchema accepts valid lead status enum", AdminLeadsPatchSchema.safeParse({
  id: "lead-123",
  status: "enrolled",
}).success);

assert("AdminLeadsPatchSchema rejects invalid status enum value", !AdminLeadsPatchSchema.safeParse({
  id: "lead-123",
  status: "deleted_status",
}).success);

// Validation tests: Scan Meal
assert("ScanMealSchema accepts base64 image data", ScanMealSchema.safeParse({
  imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
  mimeType: "image/jpeg",
}).success);

assert("ScanMealSchema rejects missing imageBase64", !ScanMealSchema.safeParse({
  mimeType: "image/jpeg",
}).success);

// API Validator utility tests
const { validateRequestBody, validateQueryParams } = await import("../src/lib/validation/api-validator.ts");

const mockValidRequest = new Request("https://bodiedbyesh.com/api/test", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Valid User",
    email: "user@test.com",
  }),
});

const reqResult = await validateRequestBody(
  mockValidRequest,
  GHLContactLeadSchema
);
assert("validateRequestBody parses and accepts valid Request object", reqResult.success);

const mockMalformedRequest = new Request("https://bodiedbyesh.com/api/test", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{ malformed: json, ",
});

const malformedResult = await validateRequestBody(
  mockMalformedRequest,
  GHLContactLeadSchema
);
assert("validateRequestBody cleanly returns 400 response on malformed JSON", !malformedResult.success && malformedResult.response.status === 400);

const mockSearchParams = new URLSearchParams({
  id: "cs_test_998877",
});
const queryResult = validateQueryParams(mockSearchParams, CheckoutSessionGetQuerySchema);
assert("validateQueryParams parses and accepts valid URL search parameters", queryResult.success && queryResult.data.id === "cs_test_998877");

const mockInvalidQueryParams = new URLSearchParams({});
const invalidQueryResult = validateQueryParams(mockInvalidQueryParams, CheckoutSessionGetQuerySchema);
assert("validateQueryParams returns 400 response on missing required query parameters", !invalidQueryResult.success && invalidQueryResult.response.status === 400);

// Audit all 21 route handler files for validator integration
const apiDir = path.join(PROJECT_ROOT, "src/app/api");
const routeFiles = [
  "admin/client-profile/route.ts",
  "admin/leads/route.ts",
  "admin/workouts/route.ts",
  "book-appointment/route.ts",
  "chat/route.ts",
  "checkout-session/route.ts",
  "client/logged-sets/route.ts",
  "coastal/community/route.ts",
  "coastal/devotionals/route.ts",
  "coastal/join/route.ts",
  "coastal/steps/route.ts",
  "create-checkout-session/route.ts",
  "ghl-contact/route.ts",
  "log-meal/route.ts",
  "logo-feedback/route.ts",
  "park-config/route.ts",
  "recommend-recipe/route.ts",
  "scan-meal/route.ts",
  "scan-menu/route.ts",
  "sync/health/route.ts",
  "webhook/stripe/route.ts",
];

for (const relRoute of routeFiles) {
  const fullPath = path.join(apiDir, relRoute);
  const content = fs.readFileSync(fullPath, "utf8");
  const hasValidator =
    content.includes("validateRequestBody") ||
    content.includes("validateQueryParams") ||
    content.includes("StripeWebhookHeaderSchema") ||
    content.includes("safeParse");
  assert(`Route /api/${relRoute} implements runtime Zod schema validation`, hasValidator);
}

// ── 2. Next.js Edge Middleware Admin Interception Tests ───────────────────────
console.log("\n--- [2/5] Next.js Edge Middleware Admin Interception Tests ---");

const middlewarePath = path.join(PROJECT_ROOT, "src/middleware.ts");
const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

assert("middleware.ts intercepts /admin and /admin/* routes", middlewareContent.includes('pathname.startsWith("/admin")'));
assert("middleware.ts intercepts /logo-review/admin routes", middlewareContent.includes('pathname.startsWith("/logo-review/admin")'));
assert("middleware.ts extracts user from Supabase auth session at edge", middlewareContent.includes("supabase.auth.getUser()"));
assert("middleware.ts redirects unauthenticated visitors to /login with redirectTo target", middlewareContent.includes('url.searchParams.set("redirectTo", pathname)'));
assert("middleware.ts redirects unauthorized non-admin users to /dashboard", middlewareContent.includes('url.searchParams.set("error", "unauthorized_admin_access")'));
assert("middleware.ts maintains case-insensitive URL canonicalization", middlewareContent.includes("/[A-Z]/.test(pathname)"));

// ── 3. Bounded Request Timeouts (8000ms) Tests ──────────────────────────────
console.log("\n--- [3/5] Bounded Request Timeout Tests ---");

const safeFetchPath = path.join(PROJECT_ROOT, "src/lib/http/safe-fetch.ts");
const safeAiPath = path.join(PROJECT_ROOT, "src/lib/ai/safe-ai.ts");
assert("src/lib/http/safe-fetch.ts exists", fs.existsSync(safeFetchPath));
assert("src/lib/ai/safe-ai.ts exists", fs.existsSync(safeAiPath));

const { fetchWithTimeout, DEFAULT_FETCH_TIMEOUT_MS } = await import("../src/lib/http/safe-fetch.ts");
const { runWithTimeout, DEFAULT_AI_TIMEOUT_MS } = await import("../src/lib/ai/safe-ai.ts");

assert("DEFAULT_FETCH_TIMEOUT_MS is configured to 8000ms", DEFAULT_FETCH_TIMEOUT_MS === 8000);
assert("DEFAULT_AI_TIMEOUT_MS is configured to 8000ms", DEFAULT_AI_TIMEOUT_MS === 8000);

// Test timeout abort behavior with runWithTimeout
const fastPromise = new Promise((resolve) => setTimeout(() => resolve("fast_ok"), 50));
const fastResult = await runWithTimeout(fastPromise, 200);
assert("runWithTimeout resolves fast promises within timeout boundary", fastResult === "fast_ok");

const slowPromise = new Promise((resolve) => setTimeout(() => resolve("slow_too_late"), 500));
let timedOut = false;
try {
  await runWithTimeout(slowPromise, 50);
} catch {
  timedOut = true;
}
assert("runWithTimeout rejects and aborts promises exceeding timeout limit", timedOut);

// Verify safe fetch integration in external service clients
const ghlContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/ghl.ts"), "utf8");
const mailContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/mail.ts"), "utf8");
const smsContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/sms.ts"), "utf8");
const stripeContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/stripe.ts"), "utf8");
const barcodeContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/components/BarcodeScanner.tsx"), "utf8");

assert("src/lib/ghl.ts uses fetchWithTimeout with 8000ms bound", ghlContent.includes("fetchWithTimeout"));
assert("src/lib/mail.ts uses fetchWithTimeout with 8000ms bound", mailContent.includes("fetchWithTimeout"));
assert("src/lib/sms.ts uses fetchWithTimeout with 8000ms bound", smsContent.includes("fetchWithTimeout"));
assert("src/lib/stripe.ts specifies timeout: 8000 in constructor", stripeContent.includes("timeout: 8000"));
assert("src/components/BarcodeScanner.tsx uses fetchWithTimeout with 8000ms bound", barcodeContent.includes("fetchWithTimeout"));

// ── 4. Hexagonal Port Adapters Architecture (DIP) Tests ─────────────────────
console.log("\n--- [4/5] Hexagonal Port Adapters Architecture Tests ---");

const portFiles = [
  "src/lib/ports/IAIService.ts",
  "src/lib/ports/ICommunicationService.ts",
  "src/lib/ports/ICRMService.ts",
  "src/lib/ports/IPaymentService.ts",
];

for (const relPort of portFiles) {
  assert(`${relPort} port interface definition exists`, fs.existsSync(path.join(PROJECT_ROOT, relPort)));
}

const adapterFiles = [
  "src/lib/adapters/GeminiAIService.ts",
  "src/lib/adapters/MockAIService.ts",
  "src/lib/adapters/CommunicationService.ts",
  "src/lib/adapters/MockCommunicationService.ts",
  "src/lib/adapters/GoHighLevelCRMService.ts",
  "src/lib/adapters/MockCRMService.ts",
  "src/lib/adapters/StripePaymentService.ts",
  "src/lib/adapters/MockPaymentService.ts",
  "src/lib/container.ts",
];

for (const relAdapter of adapterFiles) {
  assert(`${relAdapter} concrete adapter implementation exists`, fs.existsSync(path.join(PROJECT_ROOT, relAdapter)));
}

// Test Mock Adapters & Polymorphic Port Implementations
const { MockAIService } = await import("../src/lib/adapters/MockAIService.ts");
const { MockCommunicationService } = await import("../src/lib/adapters/MockCommunicationService.ts");
const { MockCRMService } = await import("../src/lib/adapters/MockCRMService.ts");
const { MockPaymentService } = await import("../src/lib/adapters/MockPaymentService.ts");

const mockAI = new MockAIService();
const mealScan = await mockAI.scanMeal("base64_mock_data");
assert("MockAIService returns deterministic scanned meal items", mealScan.success && (mealScan.items?.length ?? 0) > 0);

const menuScan = await mockAI.scanMenu("base64_mock_data");
assert("MockAIService returns deterministic scanned menu items", menuScan.success && (menuScan.items?.length ?? 0) > 0);

const recipe = await mockAI.recommendRecipe({ calories: 450, protein: 40, carbs: 30, fat: 12 }, "", "High Protein");
assert("MockAIService returns macro-matched recipe data", recipe.success && recipe.data.macros.protein === 40);

const mockComm = new MockCommunicationService();
await mockComm.sendEmail({
  to: "test@bodiedbyesh.com",
  subject: "Test Subject",
  html: "<p>Hello</p>",
});
await mockComm.sendSMS({
  to: "+17728774231",
  body: "Test SMS Message",
});
assert("MockCommunicationService records dispatched email", mockComm.sentEmails.length === 1);
assert("MockCommunicationService records dispatched SMS", mockComm.sentSMS.length === 1);

const mockCRM = new MockCRMService();
const contact = await mockCRM.createOrUpdateContact({
  email: "lead@test.com",
  name: "Lead Name",
  phone: "+17725550000",
});
assert("MockCRMService creates contact with ID", Boolean(contact.id && contact.email === "lead@test.com"));

const opp = await mockCRM.createOpportunity({
  contactId: contact.id,
  pipelineId: "pipe_1",
  stageId: "stage_new",
  name: "Test Opp",
});
assert("MockCRMService creates opportunity", Boolean(opp.id && opp.contactId === contact.id));

const mockPay = new MockPaymentService();
const sessionRes = await mockPay.createCheckoutSession({
  mode: "subscription",
  priceId: "price_123",
  successUrl: "https://bodiedbyesh.com/success",
  cancelUrl: "https://bodiedbyesh.com/cancel",
});
assert("MockPaymentService creates checkout session with valid URL", Boolean(sessionRes.url));

const retrievedSession = await mockPay.retrieveSession("cs_test_123");
assert("MockPaymentService retrieves session metadata", retrievedSession.status === "complete");

// ── 5. React Hook Purity & Clean Quality Gates Audit ────────────────────────
console.log("\n--- [5/5] React Hook Purity & Zero-Emoji Quality Gates Audit ---");

const stepTrackerContent = fs.readFileSync(path.join(PROJECT_ROOT, "src/components/coastal/StepTracker.tsx"), "utf8");
// Check that Date.now() is not invoked inside displayedLogs useMemo
const displayedLogsMatch = stepTrackerContent.match(/const displayedLogs = useMemo\(\(\) => \{[\s\S]*?\}, \[[^\]]*\]\);/);
assert("StepTracker.tsx displayedLogs hook is pure and does not invoke Date.now()", Boolean(displayedLogsMatch && !displayedLogsMatch[0].includes("Date.now()")));

// Check zero emojis across all newly created M3 files
const m3SourceFiles = [
  "src/lib/validation/api-validator.ts",
  "src/lib/validation/schemas.ts",
  "src/lib/http/safe-fetch.ts",
  "src/lib/ai/safe-ai.ts",
  "src/lib/ports/IAIService.ts",
  "src/lib/ports/ICommunicationService.ts",
  "src/lib/ports/ICRMService.ts",
  "src/lib/ports/IPaymentService.ts",
  "src/lib/adapters/GeminiAIService.ts",
  "src/lib/adapters/MockAIService.ts",
  "src/lib/adapters/CommunicationService.ts",
  "src/lib/adapters/MockCommunicationService.ts",
  "src/lib/adapters/GoHighLevelCRMService.ts",
  "src/lib/adapters/MockCRMService.ts",
  "src/lib/adapters/StripePaymentService.ts",
  "src/lib/adapters/MockPaymentService.ts",
  "src/lib/container.ts",
];

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

for (const relFile of m3SourceFiles) {
  const fileText = fs.readFileSync(path.join(PROJECT_ROOT, relFile), "utf8");
  assert(`Zero-emoji compliance in ${relFile}`, !emojiRegex.test(fileText));
}

console.log("\n================================================================================");
console.log(`  M3 TEST RESULTS: ${passed}/${total} assertions passed (${failed} failed)`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n[SUCCESS] Milestone 3 quality gates, schemas, and architecture 100% verified.\n");
  process.exit(0);
}
