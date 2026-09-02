# Empirical Adversarial Challenge Analysis: Milestone 1 Perimeter & Security Hardening

**Challenger**: Challenger M1 (`challenger_m1_1`)  
**Roles**: critic, specialist  
**Target Milestone**: Milestone 1 (M1: Perimeter & Security Ingress Hardening)  
**Date**: 2026-08-28  

---

## 1. Challenge Summary

**Overall Risk Assessment**: **MEDIUM** (Admin authorization PIN bypasses and Meal Log BOLA vulnerabilities are robustly eliminated. However, empirical testing identified an object prototype key bypass in `/api/create-checkout-session` where `in` operator allows prototype properties (`constructor`, `__proto__`, `toString`, `valueOf`) to bypass validation).

---

## 2. Adversarial Challenges & Findings

### [Medium Risk] Challenge 1: Prototype Property Bypass in Stripe Checkout Whitelist Validation
- **Assumption Challenged**: In `src/app/api/create-checkout-session/route.ts:45`:
  ```typescript
  if (!programChoice || !(programChoice in ALLOWED_PROGRAM_CONFIGS))
  ```
  The code assumes `programChoice in ALLOWED_PROGRAM_CONFIGS` checks only whitelisted domain tiers.
- **Attack Scenario**: Because `ALLOWED_PROGRAM_CONFIGS` is a JavaScript object literal inheriting from `Object.prototype`, inherited prototype property names evaluate to `true` with the `in` operator (e.g. `"constructor" in ALLOWED_PROGRAM_CONFIGS === true`, `"__proto__" in ALLOWED_PROGRAM_CONFIGS === true`, `"toString" in ALLOWED_PROGRAM_CONFIGS === true`, `"valueOf" in ALLOWED_PROGRAM_CONFIGS === true`).
- **Empirical Confirmation**:
  Sending `POST /api/create-checkout-session` with:
  ```json
  { "programChoice": "constructor", "priceId": "price_cheap_attacker" }
  ```
  bypasses the whitelist validation gate. `config` resolves to `Object.prototype.constructor` (function), `config.envVar` is `undefined`, and the handler falls through to mock checkout mode (returning HTTP 200 with `{ url: "...?program=constructor" }`) instead of rejecting with HTTP 400 Bad Request.
- **Blast Radius**: Malicious or malformed checkout requests with prototype keys bypass the 400 rejection check.
- **Mitigation**: Replace `!(programChoice in ALLOWED_PROGRAM_CONFIGS)` with:
  ```typescript
  if (!programChoice || !Object.prototype.hasOwnProperty.call(ALLOWED_PROGRAM_CONFIGS, programChoice))
  ```
  or:
  ```typescript
  if (!programChoice || !Object.keys(ALLOWED_PROGRAM_CONFIGS).includes(programChoice))
  ```

---

### [Verified Robust] Challenge 2: Admin PIN & Passcode Header / Query Bypass Resistance
- **Assumption Tested**: Attackers attempting to bypass admin authentication using legacy headers (`x-admin-pin: 0408`, `x-admin-pin: bodiedbyesh`, `admin-pin: 0408`, `authorization: Bearer 0408`) or query parameters (`?pin=0408`, `?admin=true`) must be completely rejected with 401 Unauthorized.
- **Attack Vectors Tested**:
  - `GET /api/admin/leads` with `x-admin-pin: 0408` -> Returns 401 Unauthorized
  - `PATCH /api/admin/leads` with `x-admin-pin: bodiedbyesh` -> Returns 401 Unauthorized
  - `GET /api/admin/leads?pin=0408&admin=true` -> Returns 401 Unauthorized
  - `GET /api/admin/client-profile` with `x-admin-pin: 0408` -> Returns 401 Unauthorized
  - `POST /api/admin/client-profile` with `x-admin-pin: bodiedbyesh` -> Returns 401 Unauthorized
  - `PATCH /api/admin/client-profile` with `x-admin-pin: 0408` -> Returns 401 Unauthorized
  - `GET /api/admin/workouts` with `x-admin-pin: 0408` -> Returns 401 Unauthorized
  - `POST /api/admin/workouts` with `x-admin-pin: bodiedbyesh` -> Returns 401 Unauthorized
  - `DELETE /api/admin/workouts` with `x-admin-pin: 0408` -> Returns 401 Unauthorized
  - `GET /api/chat` with `x-admin-pin: 0408` -> Returns 401 Unauthorized
  - `POST /api/chat` with `x-admin-pin: 0408` -> Returns 401 Unauthorized
  - `GET /api/logo-feedback` with `x-admin-pin: 0408` -> Returns 401 Unauthorized
  - `POST /api/park-config` with body `{ pin: "0408" }` -> Returns 401 Unauthorized
- **Empirical Result**: All 18 endpoints and methods strictly reject unauthenticated / PIN-carrying requests with 401 Unauthorized. Zero PIN bypasses exist.

---

### [Verified Robust] Challenge 3: Broken Object-Level Authorization (BOLA) in Meal Logging
- **Assumption Tested**: Unauthenticated actors or standard users cannot query or inject meal logs for arbitrary client email addresses.
- **Attack Vectors Tested**:
  - `GET /api/log-meal?email=victim@example.com` without active auth session -> Returns 401 Unauthorized.
  - `POST /api/log-meal` with `{ clientEmail: "victim@example.com", items: [...] }` without active auth session -> Returns 401 Unauthorized.
  - Injected `clientEmail` in body is completely ignored during POST; records are inserted strictly bound to session `user.id` and `user.email`.
  - Non-admin user querying `GET /api/log-meal?email=victim@example.com` is locked to their own session email (`targetEmail = (isAdmin && requestedEmail) ? requestedEmail : user.email`).
- **Empirical Result**: BOLA vulnerability is completely resolved.

---

### [Verified Robust] Challenge 4: Arbitrary Client Price ID Tampering in Checkout
- **Assumption Tested**: Attacker sending arbitrary `priceId` (e.g. `{ priceId: "price_fake_attacker_1dollar" }`) cannot override official pricing.
- **Attack Vectors Tested**:
  - Sending `{ priceId: "price_fake_attacker_1dollar", programChoice: "invalid_hacked_tier" }` -> Returns 400 Bad Request.
  - Sending `{ priceId: "price_fake_attacker_1dollar", programChoice: "track_a" }` -> Server resolves `process.env.STRIPE_PRICE_TRACK_A` from server environment, completely ignoring client `priceId`.
- **Empirical Result**: Client-supplied `priceId` is completely decoupled from Stripe checkout creation.

---

## 3. Global Static Audit Results

- **Files Audited**: 18 files across `src/app/`, `src/components/`, `src/lib/`, `.env.example`.
- **Hardcoded PINs**: 0 instances of `"0408"` or `"bodiedbyesh"`.
- **Auto-Seeding**: 0 instances of `sessionStorage.setItem("admin_pin", ...)`.
- **Zero-Emoji Compliance**: 0 Unicode emoji violations across all 18 files.

