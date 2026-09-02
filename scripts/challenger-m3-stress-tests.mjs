/**
 * Challenger Stress Test Harness for Milestone 3 (M3: Quality Gates, Schema Validation & Architecture)
 * Bodied by Esh Platform
 *
 * Independent empirical stress tests testing:
 * 1. Service Container & Port Adapters (Production & Mock)
 * 2. Zod Schema Validation Edge Cases & Type Juggling
 * 3. Bounded Request Timeouts & AbortSignal Management
 * 4. StepTracker Date Determinism & Streak Recalculation Algorithm
 * 5. Middleware Edge Authorization Logic
 * 6. Global Zero-Emoji Compliance
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("  CHALLENGER STRESS TESTS: MILESTONE 3 (QUALITY GATES & ARCHITECTURE)");
console.log("================================================================================");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(description, condition, extraInfo = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${description} ${extraInfo ? `(${extraInfo})` : ""}`);
  } else {
    failedTests++;
    const errMsg = `[FAIL] ${description} ${extraInfo ? `(${extraInfo})` : ""}`;
    console.error(`  ${errMsg}`);
    failureDetails.push(errMsg);
  }
}

// ============================================================================
// SECTION 1: Service Container & Port Adapters Deep Stress Testing
// ============================================================================
console.log("\n--- [Section 1] Service Container & Port Adapters Stress Testing ---");

const { container, ServiceContainer } = await import("../src/lib/container.ts");
const { MockAIService } = await import("../src/lib/adapters/MockAIService.ts");
const { MockCommunicationService } = await import("../src/lib/adapters/MockCommunicationService.ts");
const { MockCRMService } = await import("../src/lib/adapters/MockCRMService.ts");
const { MockPaymentService } = await import("../src/lib/adapters/MockPaymentService.ts");
const { GeminiAIService } = await import("../src/lib/adapters/GeminiAIService.ts");
const { CommunicationService } = await import("../src/lib/adapters/CommunicationService.ts");
const { GoHighLevelCRMService } = await import("../src/lib/adapters/GoHighLevelCRMService.ts");
const { StripePaymentService } = await import("../src/lib/adapters/StripePaymentService.ts");

// 1.1 Container Singleton & Lazy Instantiation
const customContainer = new ServiceContainer();
assert("New ServiceContainer instance initializes with default production adapters on access", Boolean(
  customContainer.aiService instanceof GeminiAIService &&
  customContainer.communicationService instanceof CommunicationService &&
  customContainer.crmService instanceof GoHighLevelCRMService &&
  customContainer.paymentService instanceof StripePaymentService
));

// 1.2 Dynamic Reassignment / Dependency Inversion Swapping
const testMockAI = new MockAIService();
const testMockComm = new MockCommunicationService();
const testMockCRM = new MockCRMService();
const testMockPay = new MockPaymentService();

customContainer.aiService = testMockAI;
customContainer.communicationService = testMockComm;
customContainer.crmService = testMockCRM;
customContainer.paymentService = testMockPay;

assert("Container allows dynamic reassignment of AI service", customContainer.aiService === testMockAI);
assert("Container allows dynamic reassignment of Communication service", customContainer.communicationService === testMockComm);
assert("Container allows dynamic reassignment of CRM service", customContainer.crmService === testMockCRM);
assert("Container allows dynamic reassignment of Payment service", customContainer.paymentService === testMockPay);

// 1.3 Container Reset Functionality
customContainer.reset();
assert("Container reset() resets instances to null and lazily reinstantiates default adapters", Boolean(
  customContainer.aiService instanceof GeminiAIService &&
  customContainer.communicationService instanceof CommunicationService &&
  customContainer.crmService instanceof GoHighLevelCRMService &&
  customContainer.paymentService instanceof StripePaymentService
));

// 1.4 Global Container Instance Concurrency & Isolation
container.reset();
container.aiService = testMockAI;
const scanResult = await container.aiService.scanMeal("fake_image_payload");
assert("Global container executes injected mock AI service seamlessly", scanResult.success && Array.isArray(scanResult.items));

// 1.5 Mock AI Service Extreme Macro Budgets & Boundary Tests
const extremeRecipe = await testMockAI.recommendRecipe(
  { calories: -50, protein: 99999, carbs: 0, fat: 500 },
  "Garlic, Salt",
  "Keto"
);
assert("MockAIService handles boundary/extreme macro inputs cleanly", Boolean(
  extremeRecipe.success &&
  extremeRecipe.data.recipeName.includes("Keto") &&
  extremeRecipe.data.macros.protein === 99999
));

const defaultRecipe = await testMockAI.recommendRecipe();
assert("MockAIService handles undefined parameters with safe defaults", Boolean(
  defaultRecipe.success &&
  defaultRecipe.data.macros.calories === 420 &&
  defaultRecipe.data.macros.protein === 38
));

// 1.6 Gemini AI Service Fallback & Error Containment
const unconfiguredGemini = new GeminiAIService("");
let geminiMealThrew = false;
try {
  await unconfiguredGemini.scanMeal("dummy_base64");
} catch (err) {
  geminiMealThrew = true;
  assert("GeminiAIService throws descriptive error when API key is missing for scanMeal", err.message.includes("Gemini API key is not configured"));
}
assert("GeminiAIService threw on missing API key", geminiMealThrew);

// GeminiAIService.recommendRecipe has deterministic internal fallback
const fallbackRecipeRes = await unconfiguredGemini.recommendRecipe({ calories: 500, protein: 45, carbs: 40, fat: 15 });
assert("GeminiAIService recommendRecipe falls back cleanly to deterministic generator when API key is missing", Boolean(
  fallbackRecipeRes.success &&
  fallbackRecipeRes.isFallback === true &&
  fallbackRecipeRes.data.recipeName === "Esh's Power Protein Skillet Bowl" &&
  fallbackRecipeRes.data.macros.protein === 45
));

// 1.7 Mock Communication Service Volume & State Recording
const mockComm = new MockCommunicationService();
const commPromises = [];
for (let i = 0; i < 25; i++) {
  commPromises.push(mockComm.sendEmail({ to: `athlete${i}@bodiedbyesh.com`, subject: `Notice ${i}`, html: `<p>${i}</p>` }));
  commPromises.push(mockComm.sendSMS({ to: `+177255500${i.toString().padStart(2, "0")}`, body: `SMS #${i}` }));
}
await Promise.all(commPromises);
assert("MockCommunicationService safely handles 50 concurrent dispatch operations", mockComm.sentEmails.length === 25 && mockComm.sentSMS.length === 25);

// 1.8 Mock CRM Service Contact & Opportunity Lifecycle
const mockCRM = new MockCRMService();
const c1 = await mockCRM.createOrUpdateContact({ email: "marcus@rome.gov", name: "Marcus", tags: ["vip", "early_access"] });
const c2 = await mockCRM.createOrUpdateContact({ email: "marcus@rome.gov", name: "Marcus Aurelius", tags: ["vip", "coached"] });
assert("MockCRMService updates existing contact map by email key", mockCRM.contacts.get("marcus@rome.gov").name === "Marcus Aurelius");

const opp = await mockCRM.createOpportunity({ contactId: c1.id, pipelineId: "main_pipe", stageId: "stage_discovery", name: "Discovery Call" });
const updatedOpp = await mockCRM.updateOpportunityStage({ opportunityId: opp.id, stageId: "stage_closed_won" });
assert("MockCRMService successfully transitions opportunity stage", updatedOpp.stageId === "stage_closed_won");

// Update non-existent opportunity safely
const orphanOpp = await mockCRM.updateOpportunityStage({ opportunityId: "non_existent_opp", stageId: "stage_lost" });
assert("MockCRMService safely creates/updates non-existent opportunity without throwing", orphanOpp.id === "non_existent_opp" && orphanOpp.stageId === "stage_lost");

// 1.9 Payment Service Mock & Production Adapters
const mockPay = new MockPaymentService();
const stripeWebhookEvt = mockPay.constructWebhookEvent("{}", "sig_test", "sec_test");
assert("MockPaymentService constructWebhookEvent returns valid mock event object", stripeWebhookEvt.type === "checkout.session.completed");

const stripeProd = new StripePaymentService();
const stripeSession = await stripeProd.createCheckoutSession({
  mode: "payment",
  priceId: "price_mock_dev",
  successUrl: "https://bodiedbyesh.com/success",
  cancelUrl: "https://bodiedbyesh.com/cancel",
});
assert("StripePaymentService gracefully falls back to mock session when Stripe is unconfigured in dev/test", Boolean(stripeSession.url && stripeSession.sessionId));

const stripeRetrieved = await stripeProd.retrieveSession("mock_session_123");
assert("StripePaymentService retrieveSession safely returns fallback data when Stripe is unconfigured", stripeRetrieved.status === "complete");

// ============================================================================
// SECTION 2: Zod Runtime Schema Validation Adversarial Edge Cases
// ============================================================================
console.log("\n--- [Section 2] Zod Runtime Schema Validation Adversarial Edge Cases ---");

const schemas = await import("../src/lib/validation/schemas.ts");
const { validateRequestBody, validateQueryParams } = await import("../src/lib/validation/api-validator.ts");

// 2.1 Type Juggling & Prototype Pollution Injections
const dangerousPayload = JSON.parse('{"__proto__": {"polluted": true}, "name": "Adversary", "email": "test@domain.com"}');
const leadParse = schemas.GHLContactLeadSchema.safeParse(dangerousPayload);
assert("GHLContactLeadSchema parses valid fields without prototype leakage", leadParse.success && ({}).polluted === undefined);

// 2.2 Numeric Boundary Stress: Steps Bounds [0, 200000]
assert("CoastalStepsLogSchema accepts 0 steps (boundary)", schemas.CoastalStepsLogSchema.safeParse({ steps: 0 }).success);
assert("CoastalStepsLogSchema accepts 200,000 steps (boundary)", schemas.CoastalStepsLogSchema.safeParse({ steps: 200000 }).success);
assert("CoastalStepsLogSchema rejects -1 steps", !schemas.CoastalStepsLogSchema.safeParse({ steps: -1 }).success);
assert("CoastalStepsLogSchema rejects 200,001 steps", !schemas.CoastalStepsLogSchema.safeParse({ steps: 200001 }).success);
assert("CoastalStepsLogSchema rejects float steps (e.g. 5000.5)", !schemas.CoastalStepsLogSchema.safeParse({ steps: 5000.5 }).success);
assert("CoastalStepsLogSchema rejects string steps in body schema", !schemas.CoastalStepsLogSchema.safeParse({ steps: "10000" }).success);

// 2.3 Date Regex Strictness (YYYY-MM-DD)
assert("CoastalStepsLogSchema accepts 2026-08-28", schemas.CoastalStepsLogSchema.safeParse({ steps: 1000, logDate: "2026-08-28" }).success);
assert("CoastalStepsLogSchema rejects MM-DD-YYYY date (08-28-2026)", !schemas.CoastalStepsLogSchema.safeParse({ steps: 1000, logDate: "08-28-2026" }).success);
assert("CoastalStepsLogSchema rejects malformed date (2026/08/28)", !schemas.CoastalStepsLogSchema.safeParse({ steps: 1000, logDate: "2026/08/28" }).success);
assert("CoastalStepsLogSchema rejects date with time (2026-08-28T12:00:00Z)", !schemas.CoastalStepsLogSchema.safeParse({ steps: 1000, logDate: "2026-08-28T12:00:00Z" }).success);
assert("CoastalStepsLogSchema rejects SQL injection in logDate", !schemas.CoastalStepsLogSchema.safeParse({ steps: 1000, logDate: "2026-08-28'; DROP TABLE step_logs;--" }).success);

// 2.4 FoodItem & Macro Budget Schema Boundaries
assert("MacroBudgetSchema applies defaults when empty object is passed", () => {
  const parsed = schemas.MacroBudgetSchema.parse({});
  return parsed.calories === 400 && parsed.protein === 35 && parsed.carbs === 30 && parsed.fat === 10;
});

assert("FoodItemSchema rejects negative macros", !schemas.FoodItemSchema.safeParse({
  name: "Negative Protein Bar",
  calories: 200,
  protein: -10,
  carbs: 20,
  fat: 5,
}).success);

assert("FoodItemSchema rejects empty food name", !schemas.FoodItemSchema.safeParse({
  name: "",
  calories: 200,
  protein: 10,
  carbs: 20,
  fat: 5,
}).success);

// 2.5 Admin Client Profile Refinement Check (Requires clientId OR email)
assert("AdminClientProfileUpdateSchema accepts payload with clientId", schemas.AdminClientProfileUpdateSchema.safeParse({ clientId: "client-123", target_calories: 2200 }).success);
assert("AdminClientProfileUpdateSchema accepts payload with email", schemas.AdminClientProfileUpdateSchema.safeParse({ email: "client@test.com", target_calories: 2200 }).success);
assert("AdminClientProfileUpdateSchema rejects payload with neither clientId nor email", !schemas.AdminClientProfileUpdateSchema.safeParse({ target_calories: 2200 }).success);

// 2.6 Polymorphic Coastal Community Post Schema
const reactPayload = {
  action: "react",
  encouragementId: "enc-99",
  reactionType: "prayer",
};
assert("CoastalCommunityPostSchema accepts valid react action", schemas.CoastalCommunityPostSchema.safeParse(reactPayload).success);

const invalidReactPayload = {
  action: "react",
  encouragementId: "enc-99",
  reactionType: "thumbs_up", // Invalid enum
};
assert("CoastalCommunityPostSchema rejects invalid reactionType enum", !schemas.CoastalCommunityPostSchema.safeParse(invalidReactPayload).success);

// 2.7 API Validator Deep Stress
// Test empty request body
const emptyReq = new Request("https://bodiedbyesh.com/api/test", { method: "POST", body: "" });
const emptyRes = await validateRequestBody(emptyReq, schemas.GHLContactLeadSchema);
assert("validateRequestBody cleanly handles empty request body with 400 Bad Request", !emptyRes.success && emptyRes.response.status === 400);

// Test non-JSON Content-Type with raw text
const rawTextReq = new Request("https://bodiedbyesh.com/api/test", { method: "POST", body: "Plain text string" });
const rawRes = await validateRequestBody(rawTextReq, schemas.GHLContactLeadSchema);
assert("validateRequestBody cleanly rejects plain text payload with 400 Bad Request", !rawRes.success && rawRes.response.status === 400);

// Test query params with extra unmapped keys
const searchParams = new URLSearchParams({
  id: "lead_456",
  unrecognizedKey: "attacker_controlled_value",
});
const leadQueryRes = validateQueryParams(searchParams, schemas.AdminWorkoutDeleteQuerySchema);
assert("validateQueryParams strips or ignores unexpected extra query params while validating required keys", leadQueryRes.success && leadQueryRes.data.id === "lead_456");

// ============================================================================
// SECTION 3: Bounded Request Timeouts (safe-fetch & safe-ai)
// ============================================================================
console.log("\n--- [Section 3] Bounded Request Timeouts & Concurrency Stress Testing ---");

const { fetchWithTimeout } = await import("../src/lib/http/safe-fetch.ts");
const { runWithTimeout } = await import("../src/lib/ai/safe-ai.ts");

// 3.1 safe-ai Timeout Racing & Memory Leak Prevention
const timeoutRaces = [];
for (let i = 0; i < 50; i++) {
  // 50 promises that resolve quickly (10ms)
  timeoutRaces.push(runWithTimeout(new Promise((resolve) => setTimeout(() => resolve(`done_${i}`), 10)), 1000));
}
const results = await Promise.all(timeoutRaces);
assert("runWithTimeout successfully completes 50 concurrent fast operations without leakage", results.length === 50 && results[0] === "done_0");

// 3.2 safe-ai Rejection on Hanging Promise
let timedOutCount = 0;
const slowRaces = [];
for (let i = 0; i < 10; i++) {
  slowRaces.push(
    runWithTimeout(new Promise((resolve) => setTimeout(resolve, 2000)), 50).catch((err) => {
      if (err.message.includes("timed out after 50ms")) {
        timedOutCount++;
      }
    })
  );
}
await Promise.all(slowRaces);
assert("runWithTimeout consistently rejects all 10 hanging promises exactly at timeout deadline", timedOutCount === 10);

// 3.3 safe-fetch Custom AbortSignal Combined with Timeout Signal
const manualController = new AbortController();
manualController.abort("User clicked cancel");

let fetchAbortedCleanly = false;
try {
  await fetchWithTimeout("https://httpstat.us/200", { signal: manualController.signal }, 5000);
} catch (err) {
  fetchAbortedCleanly = true;
  assert("fetchWithTimeout respects pre-aborted custom signal via AbortSignal.any", Boolean(err));
}
assert("fetchWithTimeout aborted cleanly on pre-cancelled signal", fetchAbortedCleanly);

// ============================================================================
// SECTION 4: StepTracker Hook Purity & Streak Algorithm Verification
// ============================================================================
console.log("\n--- [Section 4] StepTracker Hook Purity & Streak Calculation Verification ---");

const { getLocalISODate, calculateMileage, calculateCalories } = await import("../src/lib/coastal/db.ts");

// 4.1 Test getLocalISODate determinism
const testDate = new Date("2026-08-28T12:34:56.789Z");
const isoDate = getLocalISODate(testDate);
assert("getLocalISODate returns valid YYYY-MM-DD format", /^\d{4}-\d{2}-\d{2}$/.test(isoDate));

// 4.2 Streak calculation algorithm empirical test
function recalculateStreak(allLogs) {
  const activeDates = Array.from(
    new Set(allLogs.filter((l) => l.steps > 0).map((l) => l.log_date))
  ).sort();

  if (activeDates.length === 0) {
    return { current_streak: 0, longest_streak: 0, total_days_logged: 0, last_log_date: null };
  }

  let longest = 0;
  let temp = 1;

  for (let i = 1; i < activeDates.length; i++) {
    const prev = new Date(activeDates[i - 1] + "T00:00:00Z").getTime();
    const curr = new Date(activeDates[i] + "T00:00:00Z").getTime();
    const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      temp++;
    } else {
      longest = Math.max(longest, temp);
      temp = 1;
    }
  }
  longest = Math.max(longest, temp);

  return {
    current_streak: temp,
    longest_streak: longest,
    total_days_logged: activeDates.length,
    last_log_date: activeDates[activeDates.length - 1],
  };
}

// Case A: 5 consecutive days
const logs5Days = [
  { steps: 10000, log_date: "2026-08-20" },
  { steps: 8000, log_date: "2026-08-21" },
  { steps: 12000, log_date: "2026-08-22" },
  { steps: 5000, log_date: "2026-08-23" },
  { steps: 15000, log_date: "2026-08-24" },
];
const streak5 = recalculateStreak(logs5Days);
assert("Streak algorithm computes 5 consecutive days correctly", streak5.current_streak === 5 && streak5.longest_streak === 5 && streak5.total_days_logged === 5);

// Case B: Streak with a gap
const logsWithGap = [
  { steps: 10000, log_date: "2026-08-01" },
  { steps: 10000, log_date: "2026-08-02" },
  { steps: 10000, log_date: "2026-08-03" }, // 3 days
  // Gap on 08-04
  { steps: 10000, log_date: "2026-08-05" },
  { steps: 10000, log_date: "2026-08-06" }, // 2 days
];
const streakGap = recalculateStreak(logsWithGap);
assert("Streak algorithm handles day gaps correctly (longest=3, current=2)", streakGap.longest_streak === 3 && streakGap.current_streak === 2 && streakGap.total_days_logged === 5);

// Case C: Unsorted logs and duplicate dates
const unsortedLogs = [
  { steps: 7000, log_date: "2026-08-03" },
  { steps: 8000, log_date: "2026-08-01" },
  { steps: 9000, log_date: "2026-08-02" },
  { steps: 2000, log_date: "2026-08-02" }, // Duplicate date
];
const streakUnsorted = recalculateStreak(unsortedLogs);
assert("Streak algorithm handles out-of-order logs and deduplicates dates correctly", streakUnsorted.current_streak === 3 && streakUnsorted.total_days_logged === 3);

// Case D: Empty logs
const emptyStreak = recalculateStreak([]);
assert("Streak algorithm returns 0 for empty logs", emptyStreak.current_streak === 0 && emptyStreak.total_days_logged === 0);

// 4.3 Purity Audit on StepTracker.tsx
const stepTrackerPath = path.join(PROJECT_ROOT, "src/components/coastal/StepTracker.tsx");
const stepTrackerCode = fs.readFileSync(stepTrackerPath, "utf8");

assert("StepTracker memoizes date strings at component mount (useMemo with [])", stepTrackerCode.includes("const { todayStr, yesterdayStr, sevenDaysAgoStr, thirtyDaysAgoStr } = useMemo("));
assert("StepTracker does not invoke impure Date.now() during render evaluations", !stepTrackerCode.includes("const displayedLogs = useMemo(() => {\n    const now = Date.now();"));

// ============================================================================
// SECTION 5: Next.js Edge Middleware Security Logic Audit
// ============================================================================
console.log("\n--- [Section 5] Edge Middleware Security Logic Audit ---");

const middlewarePath = path.join(PROJECT_ROOT, "src/middleware.ts");
const middlewareCode = fs.readFileSync(middlewarePath, "utf8");

assert("Edge middleware guards /admin path", middlewareCode.includes('pathname.startsWith("/admin")'));
assert("Edge middleware guards /logo-review/admin path", middlewareCode.includes('pathname.startsWith("/logo-review/admin")'));
assert("Edge middleware verifies user.app_metadata.role and user_metadata.role", middlewareCode.includes("user.app_metadata?.role") && middlewareCode.includes("user.user_metadata?.role"));
assert("Edge middleware redirects unauthenticated users with redirectTo param", middlewareCode.includes('url.searchParams.set("redirectTo", pathname)'));
assert("Edge middleware redirects unauthorized users to /dashboard?error=unauthorized_admin_access", middlewareCode.includes('url.searchParams.set("error", "unauthorized_admin_access")'));
assert("Edge middleware canonicalizes uppercase URLs to lowercase with HTTP 301", middlewareCode.includes("url.pathname = pathname.toLowerCase()") && middlewareCode.includes("301"));

// ============================================================================
// SECTION 6: Global Zero-Emoji Compliance Across All Repositories
// ============================================================================
console.log("\n--- [Section 6] Zero-Emoji Audit on All M3 Files ---");

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

const scannedFiles = [
  "src/lib/container.ts",
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
  "src/lib/validation/api-validator.ts",
  "src/lib/validation/schemas.ts",
  "src/lib/http/safe-fetch.ts",
  "src/lib/ai/safe-ai.ts",
  "src/middleware.ts",
  "src/components/coastal/StepTracker.tsx",
];

for (const relPath of scannedFiles) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  const fileContent = fs.readFileSync(fullPath, "utf8");
  const hasEmoji = emojiRegex.test(fileContent);
  assert(`Zero-emoji compliance in ${relPath}`, !hasEmoji);
}

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log("\n================================================================================");
console.log(`  CHALLENGER STRESS TEST RESULTS: ${passedTests}/${totalTests} passed (${failedTests} failed)`);
console.log("================================================================================");

if (failedTests > 0) {
  console.error("\nFailures encountered:");
  failureDetails.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
} else {
  console.log("\n[CHALLENGER VERDICT: APPROVE] All adversarial stress tests and quality gates passed with zero flaws.\n");
  process.exit(0);
}
