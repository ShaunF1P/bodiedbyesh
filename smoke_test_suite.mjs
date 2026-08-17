const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testEndpoint(name, path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'SmokeTestAgent/1.0',
        ...(options.headers || {}),
      },
    });
    const duration = Date.now() - start;
    const isOk = options.expectedStatus
      ? res.status === options.expectedStatus
      : (res.status >= 200 && res.status < 400);
    let body = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    if (isOk) {
      console.log(`[PASS] ${name} -> ${res.status} (${duration}ms)`);
      return { success: true, status: res.status, body };
    } else {
      console.error(`[FAIL] ${name} -> ${res.status} (expected ${options.expectedStatus || '2xx/3xx'}) (${duration}ms)`);
      return { success: false, status: res.status, body };
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[ERROR] ${name} -> ${err.message} (${duration}ms)`);
    return { success: false, error: err.message };
  }
}

export async function runAllSmokeTests() {
  console.log(`\n======================================================`);
  console.log(`  BODIEDBYESH AUTOMATED SUITE & VERIFICATION HARNESS  `);
  console.log(`  Target Base: ${BASE_URL}                            `);
  console.log(`======================================================\n`);

  const results = [];

  // 1. Page Routes
  const pageRoutes = [
    { name: 'Home Landing Page', path: '/' },
    { name: 'Apply & Strategy Form', path: '/apply' },
    { name: 'Client Dashboard', path: '/dashboard' },
    { name: 'Coastal Faith & Fitness Landing', path: '/coastal' },
    { name: 'Coastal Walking Portal (#3266)', path: '/coastal-walk' },
    { name: 'Macro & Goal Calculator', path: '/calculator' },
    { name: 'Brand & Visual Guide', path: '/brand-guide' },
    { name: 'Client Login Portal', path: '/login' },
    { name: 'Admin Hub', path: '/admin' },
    { name: 'Admin Leads Table', path: '/admin/leads' },
    { name: 'Admin Park Settings', path: '/admin/park' },
  ];

  console.log(`--- [1/4] Auditing Core Web Routes ---`);
  for (const route of pageRoutes) {
    results.push(await testEndpoint(route.name, route.path));
  }

  // 2. Coastal Community API Endpoints
  console.log(`\n--- [2/4] Testing Coastal Walking & Devotional APIs ---`);
  results.push(await testEndpoint('Coastal Community Stats (GET)', '/api/coastal/community?group_id=coastal'));
  results.push(await testEndpoint('Coastal Devotionals API (GET)', '/api/coastal/devotionals?date=' + new Date().toISOString().split('T')[0]));
  results.push(await testEndpoint('Coastal Step Logging (POST)', '/api/coastal/steps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'test-qa-user',
      steps: 5280,
      notes: 'Morning faith walk test run',
      activity_type: 'walk',
      group_id: 'coastal',
      user_name: 'QA Walker',
    }),
  }));

  // 3. Admin Security PIN Barrier & Endpoints
  console.log(`\n--- [3/4] Testing Admin Security Barrier & CRM APIs ---`);
  // Expect 401 Unauthorized without PIN
  results.push(await testEndpoint('Admin Leads Unauthorized (GET)', '/api/admin/leads', {
    expectedStatus: 401,
  }));
  // Expect 200 with correct PIN
  results.push(await testEndpoint('Admin Leads Authorized (GET)', '/api/admin/leads', {
    headers: { 'x-admin-pin': '0408' },
    expectedStatus: 200,
  }));
  // Admin Client Profile endpoint
  results.push(await testEndpoint('Admin Client Profile Lookup (GET)', '/api/admin/client-profile?email=test@example.com&pin=0408', {
    headers: { 'x-admin-pin': '0408' },
  }));
  // Admin Workouts endpoint (requires clientId UUID)
  results.push(await testEndpoint('Admin Workouts Feed (GET)', '/api/admin/workouts?clientId=00000000-0000-0000-0000-000000000000', {
    headers: { 'x-admin-pin': '0408' },
  }));

  // 4. Client Core APIs & AI Services
  console.log(`\n--- [4/4] Testing Client Workout & AI Services ---`);
  results.push(await testEndpoint('Park Config API (GET)', '/api/park-config'));
  results.push(await testEndpoint('Client Logged Sets Unauthorized Barrier (POST)', '/api/client/logged-sets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId: 'mock-id', setIndex: 0 }),
    expectedStatus: 401, // Verifies Supabase authentication barrier
  }));
  results.push(await testEndpoint('Recipe Advisor AI API (POST)', '/api/recommend-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      remainingMacros: { calories: 450, protein: 40, carbs: 35, fat: 12 },
      pantryIngredients: 'chicken breast, jasmine rice, spinach',
    }),
  }));

  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;

  console.log(`\n======================================================`);
  console.log(`  SMOKE TEST SUMMARY: ${passed}/${total} PASSED (${failed} failed)`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('smoke_test_suite.mjs')) {
  runAllSmokeTests();
}
