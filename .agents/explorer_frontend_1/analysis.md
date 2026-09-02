# Frontend Architecture & Clinical Intake UI/UX Specification

## Executive Summary
This document provides a comprehensive frontend architecture investigation, design system analysis, and granular UI/UX specification for the **Bodied by Esh Digital Clinical Intake Suite**.

The suite consists of:
1. **Coach Esh Intake Hub (`/intake`)**: 1-click canonical share link generation with visual toast feedback, track overview cards, and interactive modal previews.
2. **Track A: Park-to-Peak Recomp (`/intake/park-to-peak`)**: On-site athletic conditioning intake with Mon/Wed vs. Tue/Thu cohort selection, clinical PAR-Q+ orthopedic joint audits (grass/turf surface screening), South Florida heat/humidity readiness, and 24-hr weather policy waivers with digital signatures.
3. **Track B: Executive Concierge (`/intake/executive-concierge`)**: Remote high-performance intake with biotelemetry onboarding (Oura/Whoop/Apple Watch/Garmin; resting HR, HRV, sleep, strain), sedentary desk ergonomics (cervical spine, anterior pelvic tilt, hip flexors), travel/dining cadence, and dynamic recovery waivers.
4. **Track C: Nutrition & Metabolic Health (`/intake/nutrition-metabolic`)**: Custom macro & metabolic recomp intake with anthropometric baselines (Mifflin-St Jeor variables, body fat %, AI mesh consent), high-performance protein targets (~2.2g/kg), GI/behavioral triggers, and AI Meal Plate Scanner onboarding.
5. **Client-Side Draft Engine (`useIntakeDraft`)**: Real-time debounced LocalStorage draft persistence and restore banner to prevent data loss on mobile interruptions.
6. **Digital Signature Pad (`SignaturePad.tsx`)**: Touch and mouse canvas signature capture with stroke smoothing, typed signature fallback, and legal attestation timestamping.
7. **Admin Intake Review Portal (`/admin/intakes`)**: Comprehensive clinical dashboard integrated into `src/app/admin/layout.tsx` featuring track filtering, search, status transitions (`new`, `reviewed`, `enrolled`, `archived`), and full clinical response inspection drawers.

---

## 1. Frontend Architecture & Design System Tokens

### 1.1 Next.js 16 + React 19 App Router Environment
- **Framework**: Next.js 16.2.9 with React 19.2.4 (React Server Components + Client Components).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`).
- **Icons**: Lucide React (`lucide-react: ^1.18.0`) exclusively. **Global Rule 1 strictly enforced: ZERO Unicode/AI emojis.**
- **Client Boundaries**: Multi-step forms, canvas signatures, and interactive copy-to-clipboard interactions must declare `"use client";` at the top of the file and wrap search param dependencies in `<Suspense>`.

### 1.2 Obsidian Gold Glassmorphism Design System Tokens
Extracted directly from `src/app/globals.css`:

| Token | CSS Variable (Dark / Default) | CSS Variable (Light Mode) | Tailwind Class | Semantic Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Surface Background** | `#050508` | `#FBFBFD` | `bg-cyber-slate` | Main page background |
| **Glass Surface** | `rgba(10, 10, 15, 0.85)` | `rgba(245, 245, 248, 0.90)` | `bg-onyx-glass` / `.glass-panel` | Glassmorphic containers |
| **Card Surface** | `#0E0E14` | `#FFFFFF` | `bg-onyx-card` / `bg-[#0E0E14]` | Inner cards, input backgrounds |
| **Obsidian Gold Accent** | `#D4B87E` | `#C59B27` | `text-accent-lime`, `bg-accent-lime`, `border-accent-lime` | Primary brand accent, CTAs, highlights |
| **Rose Gold Accent** | `#C58B8B` | `#B07474` | `text-accent-violet`, `bg-accent-violet` | Secondary accents, recovery tags |
| **Ice White Foreground** | `#FFFFFF` | `#121215` | `text-ice-white` | Primary headings, high-contrast copy |
| **Silver Slate Muted** | `#A0A5B5` | `#4A4D55` | `text-silver-slate` | Subtitles, labels, descriptions |

### 1.3 Key Utility Classes & Glass Tokens
- `.glass-panel`: `background: var(--t-glass); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.06);`
- `.glass-panel-lime`: `background: var(--t-glass); backdrop-filter: blur(12px); border: 1px solid color-mix(in srgb, var(--t-accent) 18%, transparent);`
- `.glass-panel-violet`: `background: var(--t-glass); backdrop-filter: blur(12px); border: 1px solid color-mix(in srgb, var(--t-violet) 20%, transparent);`
- `.focus-ring`: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-lime`
- Input fields: `w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all`

---

## 2. Granular Route & Form UI Specifications

### 2.1 Unified Coach Hub (`/intake`)
**URL**: `/intake`  
**Purpose**: Central launchpad for Coach Esh to distribute direct intake links, and for inbound clients to discover and select their appropriate intake track.

#### Visual Layout & Key Components
1. **Hero Header**:
   - Eyebrow Badge: `<Sparkles className="w-3.5 h-3.5 text-accent-lime" />` "Clinical Ingress Portal"
   - Headline: "Digital Clinical Client Intake Hub"
   - Subtitle: "Select your customized high-performance intake pathway or copy direct canonical links for instant athlete onboarding."
2. **3 Track Selector Cards (Grid 1-col on mobile, 3-col on desktop)**:
   - **Track A Card**:
     - Badge: `Track A • On-Site Cohort` (`bg-accent-lime/10 text-accent-lime border-accent-lime/20`)
     - Icon: `Dumbbell` (Obsidian Gold)
     - Title: `Park-to-Peak Recomp`
     - Price: `$249/mo • South Florida Outdoor Cohorts`
     - Features: Mon/Wed vs. Tue/Thu cohorts, PAR-Q+ orthopedic joint audits, grass/turf screening, heat readiness waiver.
     - Actions:
       - Primary CTA: `Start Track A Intake` (`bg-accent-lime text-cyber-slate font-bold`)
       - Secondary Action: `Copy Link` button with `Link2` / `Copy` icon
       - Tertiary Action: `Preview Form` modal button with `Eye` icon
   - **Track B Card**:
     - Badge: `Track B • Remote Concierge` (`bg-purple-500/10 text-purple-400 border-purple-500/20`)
     - Icon: `Activity` / `Watch` (Purple/Gold)
     - Title: `Executive Concierge`
     - Price: `$499/mo • Global 1-on-1 Biotelemetry`
     - Features: Oura/Whoop/Apple Watch onboarding, resting HR/HRV/strain, cervical spine/APT desk ergonomics, travel/dining cadence.
     - Actions: `Start Track B Intake`, `Copy Link`, `Preview Form`.
   - **Track C Card**:
     - Badge: `Track C • Metabolic Blueprint` (`bg-amber-500/10 text-amber-400 border-amber-500/20`)
     - Icon: `Utensils` / `Flame` (Amber/Gold)
     - Title: `Nutrition & Metabolic Health`
     - Price: `Precision Macro Programming & AI Vision`
     - Features: Mifflin-St Jeor anthropometrics, body fat % baseline, ~2.2g/kg protein targets, GI/trigger audits, AI Meal Plate Scanner.
     - Actions: `Start Track C Intake`, `Copy Link`, `Preview Form`.
3. **1-Click Direct Link Copy Engine**:
   - Reads `window.location.origin` to construct absolute canonical URLs:
     - `${origin}/intake/park-to-peak`
     - `${origin}/intake/executive-concierge`
     - `${origin}/intake/nutrition-metabolic`
   - Copies to clipboard via `navigator.clipboard.writeText(...)`.
   - Triggers floating Glassmorphic Toast banner at bottom-right (`animate-slideInRight`) with 3.5s auto-dismiss.
4. **Preview Modal**:
   - Triggered by `Preview Form` button.
   - Glassmorphic modal overlay (`bg-black/85 backdrop-blur-md`).
   - Displays all sections, clinical questions, and waiver requirements without requiring form progression.
   - Includes "Launch Live Form" direct action.

---

### 2.2 Track A: Park-to-Peak Recomp Form (`/intake/park-to-peak`)
**URL**: `/intake/park-to-peak`  
**Purpose**: On-site South Florida athlete clinical intake capturing athletic logistics, orthopedic tolerances, heat acclimation, and legal releases.

#### Multi-Step Form Sections:
* **Step 1: Athlete Demographics & Practice Schedule**
  - Full Name (required, text)
  - Email Address (required, email)
  - Phone Number (required, tel)
  - Date of Birth / Age (required, date or number)
  - Gender Identity / Biological Sex (required, select/radio: Male, Female, Other)
  - Emergency Contact Name & Phone (required, text)
  - Cohort Practice Selection (required, radio/cards):
    - `Mon/Wed Morning (6:30 AM - 7:30 AM)`
    - `Mon/Wed Evening (5:30 PM - 6:30 PM)`
    - `Tue/Thu Morning (6:30 AM - 7:30 AM)`
    - `Tue/Thu Evening (5:30 PM - 6:30 PM)`
    - `Saturday Open Athletic Conditioning (8:00 AM)`
  - Preferred Location (Pine Trails Park Parkland, Patch Reef Boca, Terramar Coral Springs).

* **Step 2: Clinical PAR-Q+ & Orthopedic Joint Audit**
  - PAR-Q+ 7 Baseline Yes/No Questions:
    1. Has your doctor ever said that you have a heart condition and should only perform physical activity recommended by a doctor?
    2. Do you feel pain in your chest when you perform physical activity?
    3. In the past month, have you had chest pain when you were not performing physical activity?
    4. Do you lose your balance because of dizziness or do you ever lose consciousness?
    5. Do you have a bone or joint problem (e.g. knee, ankle, lower back, shoulder) that could be made worse by a change in your physical activity?
    6. Is your doctor currently prescribing drugs for your blood pressure or heart condition?
    7. Do you know of any other reason why you should not perform physical activity?
  - Orthopedic Joint Audit (Multi-select + detail fields):
    - Grass/Turf Surface Tolerance: Achilles tendonitis, Plantar fasciitis, Knee patellar tracking, Shin splints on uneven natural grass.
    - Spinal Mobility: Lumbar spine flare-ups, Sciatica, Thoracic stiffness.
    - Upper Extremity: Rotator cuff impingement, Elbow tendinopathy.
    - Surgeries or acute injuries in past 12 months (Text area).

* **Step 3: South Florida Environmental & Heat/Humidity Readiness**
  - Prior history of heat illness / severe cramps / heat exhaustion (Yes/No + details).
  - Hydration Baseline (select: `<64 oz/day`, `64-100 oz/day`, `100+ oz/day`).
  - Electrolyte supplementation experience (e.g., LMNT, Liquid IV, none).
  - Sun & outdoor readiness acknowledgment (sunscreen, protective athletic gear, dedicated water bottle).

* **Step 4: 24-Hour Policy, Inclement Weather Policy & Digital Signature Waiver**
  - 24-Hour Cancellation Policy Acknowledgment checkbox: Notice required 24 hours prior to cohort session to retain credit.
  - South Florida Weather Contingency Policy checkbox: In cases of severe lightning/thunderstorms, sessions transfer to covered park pavilion or reschedule.
  - Comprehensive Physical Activity Liability Waiver text box.
  - Digital Signature Pad (interactive canvas for touch/mouse stroke capture + typed name option).
  - Date & Legal Attestation timestamp.

---

### 2.3 Track B: Executive Concierge Form (`/intake/executive-concierge`)
**URL**: `/intake/executive-concierge`  
**Purpose**: Remote high-performance intake for busy executives, founders, and professionals focusing on biotelemetry, postural ergonomics, travel cadence, and dynamic recovery.

#### Multi-Step Form Sections:
* **Step 1: Executive Profile & Work Cadence**
  - Full Name, Email, Phone Number.
  - Professional Title & Industry (text).
  - Time Zone (EST, CST, MST, PST, International).
  - Average Work Hours per Week (`<40 hrs`, `40-55 hrs`, `55-70 hrs`, `70+ hrs`).
  - Primary Performance Obstacle (Time constraints, Travel, Stress/Sleep, Nutrition discipline).

* **Step 2: Biotelemetry & Wearable Ecosystem Onboarding**
  - Primary Wearable Device (Multi-select/cards):
    - `Oura Ring (Gen 3 / Gen 4)`
    - `Whoop (4.0)`
    - `Apple Watch (Series / Ultra)`
    - `Garmin (Forerunner / Fenix / Epix)`
    - `Fitbit / Google Pixel Watch`
    - `None (Manual Logging)`
  - Current Biometric Baselines:
    - Resting Heart Rate (bpm, estimated/known)
    - Heart Rate Variability (HRV average in ms, if tracked)
    - Average Nightly Sleep Duration (`<5 hrs`, `5-6 hrs`, `6-7 hrs`, `7-8 hrs`, `8+ hrs`)
    - Sleep Quality Rating (1 to 5 scale)
    - Daily Cognitive Fatigue / Energy Level (1 to 5 scale)
  - Biotelemetry Cloud Share Consent (Yes/No to integrate with Bodied by Esh metrics).

* **Step 3: Sedentary Desk Ergonomics & Postural Health**
  - Daily Sitting Hours (`<4 hrs`, `4-8 hrs`, `8-12 hrs`, `12+ hrs`).
  - Cervical Spine & Neck Assessment: Tech neck, cervical tightness, tension headaches, upper trap knots (Multi-select).
  - Anterior Pelvic Tilt (APT) & Lower Chain Assessment: Tight hip flexors/psoas, lower back dull ache after sitting, glute amnesia (Multi-select).
  - Workstation Setup: Laptop on lap/desk, Standing desk, Ergonomic monitor arm, Under-desk walking treadmill.

* **Step 4: Executive Travel & Dining Cadence**
  - Domestic / International Travel Frequency (Weekly, 2-3x/month, Monthly, Quarterly, Rare).
  - Restaurant & Business Dining Frequency (Meals per week dining out / catered).
  - Alcohol & Networking Intake (Drinks/week: `0`, `1-4`, `5-9`, `10+`).
  - Hotel Gym / Travel Training Preference (Bodyweight/Bands, Hotel dumbbell gym, Commercial gym day-passes).

* **Step 5: Dynamic Recovery Protocol & Remote Coaching Agreement**
  - High-Frequency Asynchronous Accountability Consent (Loom video check-ins, WhatsApp / SMS daily metrics).
  - Dynamic Recovery Volume Adjustment Waiver: Acknowledgment that workout volume/intensity will automatically downscale when HRV or sleep indicates systemic CNS fatigue.
  - Digital Signature Pad & Legal Attestation.

---

### 2.4 Track C: Nutrition & Metabolic Health Form (`/intake/nutrition-metabolic`)
**URL**: `/intake/nutrition-metabolic`  
**Purpose**: Precision metabolic recomp intake capturing anthropometrics, Mifflin-St Jeor variables, high-performance protein targets, GI triggers, and AI vision tools.

#### Multi-Step Form Sections:
* **Step 1: Anthropometric Baselines & Metabolic Calculation**
  - Full Name, Email, Phone Number.
  - Biological Sex (Male / Female - required for clinical Mifflin-St Jeor equation).
  - Age (years).
  - Height (Feet & Inches or Centimeters).
  - Current Weight (lbs).
  - Target Goal Weight (lbs).
  - Known or Estimated Body Fat % (Optional: Navy tape circumference inputs - waist, neck, hip).
  - Baseline Activity Level (Sedentary, Light, Moderate, Active, Very Active).
  - **Live Dynamic Calculation Box**:
    - Real-time client-side preview of Mifflin-St Jeor BMR and Estimated TDEE based on inputs from `src/lib/fitness-calculators.ts`.

* **Step 2: High-Performance Protein & Macro Blueprint**
  - High-Performance Protein Target Acknowledgment (~2.2g/kg or 1.0g/lb target for muscle preservation and satiety).
  - Dietary Strategy Preference (Omnivore, High-Protein Pescatarian, Low-Carb / Ketogenic, Plant-Based / Vegan, Mediterranean, Intermittent Fasting).
  - Strict Food Allergies & Intolerances (Lactose/Dairy, Gluten/Celiac, Shellfish, Tree Nuts, Peanuts, Soy, Eggs, Corn, Nightshades, Other).
  - Foods you absolutely refuse to eat (text area).

* **Step 3: Gastrointestinal Health & Behavioral Eating Triggers**
  - GI Symptoms Audit: Bloating after meals, Acid reflux/GERD, Sluggish bowel motility, Food sensitivity flare-ups (Multi-select).
  - Eating Behavioral Triggers:
    - Late-night snacking
    - High-stress work crunch cravings (sugar/simple carbs)
    - Weekend social bingeing
    - Skipping meals during busy workdays
  - Daily Hydration (oz/day) & Caffeine Intake (cups of coffee/energy drinks per day).
  - Active Daily Supplements (Creatine monohydrate, Whey/Plant isolate, Electrolytes, Multivitamin, Vitamin D3/K2, Omega-3s, Magnesium, None).

* **Step 4: AI Meal Plate Scanner Onboarding & 3D Mesh Consent**
  - AI Meal Plate Scanner Overview: Client learns how to photograph meals for Gemini AI macronutrient parsing.
  - AI 3D Body Mesh Privacy & Consent:
    - Explicit client opt-in for privacy-preserved body composition scanning (MediaPipe / Gemini AI vision).
    - Confirmation that raw facial imagery is never public and data is encrypted.
  - 7-Day Initial Food Journaling Commitment.
  - Digital Signature Pad & Legal Attestation.

---

## 3. Client-Side LocalStorage Auto-Save & Restore Engine

### 3.1 Hook Architecture (`useIntakeDraft.ts`)
To prevent data loss from accidental mobile browser refreshes, tab closures, or phone calls:

```ts
"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export function useIntakeDraft<T>(storageKey: string, initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Restore draft on initial client mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.data && parsed.updatedAt) {
          setFormData(parsed.data);
          setDraftTimestamp(parsed.updatedAt);
          setHasDraftRestored(true);
        }
      }
    } catch (err) {
      console.warn("Failed to restore intake draft from LocalStorage", err);
    }
  }, [storageKey]);

  // 2. Debounced auto-save (500ms delay)
  const updateFormData = useCallback((updater: Partial<T> | ((prev: T) => T)) => {
    setFormData((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : { ...prev, ...updater };
      
      setIsSaving(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const payload = {
            data: next,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(storageKey, JSON.stringify(payload));
          setIsSaving(false);
        } catch (err) {
          console.warn("Failed to persist intake draft to LocalStorage", err);
          setIsSaving(false);
        }
      }, 500);

      return next;
    });
  }, [storageKey]);

  // 3. Explicit clear draft (on successful submit or user reset)
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setFormData(initialValues);
      setHasDraftRestored(false);
      setDraftTimestamp(null);
    } catch (err) {
      console.warn("Failed to clear intake draft", err);
    }
  }, [storageKey, initialValues]);

  return {
    formData,
    updateFormData,
    setFormData,
    hasDraftRestored,
    draftTimestamp,
    isSaving,
    clearDraft,
  };
}
```

### 3.2 Draft Restored UI Banner
When `hasDraftRestored === true`, a glassmorphic banner appears at the top of the form:
- Icon: `<RotateCcw className="w-4 h-4 text-accent-lime animate-spin" />`
- Message: `Unsaved draft restored from ${formatDateTime(draftTimestamp)}.`
- Actions:
  - `Dismiss` (keeps restored draft)
  - `Clear & Start Fresh` (calls `clearDraft()`)

---

## 4. Digital Signature Pad Component (`SignaturePad.tsx`)

### 4.1 Component Design
- HTML5 `<canvas>` element with 2x retina DPI scaling for crisp digital signatures.
- Smooth Bézier or quadratic curve stroke rendering.
- Dual mode:
  1. **Draw Signature** (default for mobile touch & desktop mouse).
  2. **Type Signature** (accessible fallback for keyboard users).
- Output: Exports clean Base64 PNG image URL (`data:image/png;base64,...`) or typed name attestation.
- Required validation: Checks that user has drawn non-blank stroke or typed their full legal name.

---

## 5. Admin Intake Review Portal (`/admin/intakes`)

### 5.1 Portal Navigation & Layout Integration
- Update `src/app/admin/layout.tsx` to add `Client Intakes` to `NAV_ITEMS`:
```ts
{ href: "/admin/intakes", label: "Client Intakes", icon: ClipboardCheck },
```

### 5.2 Admin Dashboard Architecture (`src/app/admin/intakes/page.tsx`)
- **Header & Metric Cards**:
  - Total Intakes
  - Track A (Park-to-Peak) Count
  - Track B (Executive Concierge) Count
  - Track C (Nutrition & Metabolic) Count
  - Pending Review / New Submissions
- **Search & Filters**:
  - Full-text search (Name, Email, Phone).
  - Track Filter Tabs: `All Tracks`, `Track A (Park-to-Peak)`, `Track B (Executive)`, `Track C (Nutrition)`.
  - Status Filter: `All`, `New`, `Reviewed`, `Enrolled`, `Archived`.
- **Intakes Table & Card Grid**:
  - Client Name & Avatar initial
  - Contact Details (Email, Phone)
  - Track Badge (`bg-accent-lime/10 text-accent-lime` / `bg-purple-500/10 text-purple-400` / `bg-amber-500/10 text-amber-400`)
  - Status Badge with live status dropdown
  - Submission Timestamp
  - PAR-Q+ Health Risk Alert Indicator (Red warning badge if client checked 'Yes' to cardiac/joint questions)
  - Action: `Review Clinical Intake` button
- **Full Clinical Response Drawer / Modal (`IntakeDetailModal.tsx`)**:
  - Complete view of all submitted fields organized into tabbed/accordion sections:
    - **Demographics & Logistics**: Practice cohort, location, emergency contact, occupation, time zone.
    - **Clinical & Orthopedic Findings**: Highlighted PAR-Q+ questions, joint sensitivities, heat tolerance, ergonomics.
    - **Biometrics & Nutrition Blueprint**: Wearable details, resting HR/HRV, BMR/TDEE calculations, dietary preferences, GI symptoms.
    - **Signed Digital Waiver**: Displays rendered signature canvas image, legal timestamp, IP address, and signed policies.
  - **Quick Coach Actions**:
    - Change Review Status (`new` -> `reviewed` -> `enrolled`)
    - 1-Click "Create Client Profile" in Supabase
    - "Open Live Assist Dashboard"
    - "Send Welcome Email / SMS Kickoff"
    - "Export Intake Summary (PDF/JSON)"

---

## 6. Design System & Iconography Compliance Checklist

- [x] **Zero AI / Unicode Emojis**: 100% Lucide React SVG icons used across all headers, cards, badges, and buttons.
- [x] **Obsidian Gold Palette**: Exact colors (`#050508`, `#0E0E14`, `#D4B87E`, `#C58B8B`, `#FFFFFF`, `#A0A5B5`) matching `globals.css`.
- [x] **Glassmorphism Tokens**: `.glass-panel`, `.glass-panel-lime`, `.glass-panel-violet`, `.focus-ring`.
- [x] **Mobile Responsiveness**: Verified fluid layouts down to 390px iPhone viewports and safe-area utilities (`safe-x`, `safe-top`, `safe-bottom`).
- [x] **SSR & Next.js 16 Compatibility**: Proper `"use client";` directives and `<Suspense>` boundaries around client search parameters.

---
*Report generated by Teamwork Explorer (Frontend, Forms & Design System).*
