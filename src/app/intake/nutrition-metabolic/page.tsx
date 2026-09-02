"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Flame,
  Utensils,
  Camera,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Scale,
  Sparkles,
  Zap,
  Check,
  FileText,
  Loader2,
  User,
  HeartPulse,
} from "lucide-react";
import { useIntakeDraft } from "@/hooks/useIntakeDraft";
import { IntakeProgress } from "@/components/intake/IntakeProgress";
import { SignaturePad } from "@/components/intake/SignaturePad";
import { Toast } from "@/components/intake/Toast";
import { lbsToKg, inToCm, bmrMifflin } from "@/lib/fitness-calculators";

interface NutritionFormData {
  // Step 1: Anthropometrics
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  age: string;
  biologicalSex: "male" | "female";
  heightFeet: string;
  heightInches: string;
  currentWeightLbs: string;
  targetWeightLbs: string;
  estimatedBodyFatPercent: string;
  activityMultiplier: "sedentary" | "light" | "moderate" | "heavy" | "athlete";

  // Step 2: Protein & Dietary Blueprint
  proteinTargetAcknowledged: boolean;
  dietaryFramework: string;
  dietaryRestrictions: string[];
  foodAllergies: string;
  foodsRefused: string;
  mealPrepHabits: "cooks_daily" | "meal_preps_weekly" | "meal_service" | "dining_out";

  // Step 3: GI & Behavioral
  bloatingFrequency: "never" | "occasional" | "frequent" | "daily";
  acidReflux: boolean;
  emotionalEating: boolean;
  lateNightSnacking: boolean;
  caffeineDailyIntake: string;
  dailyWaterOz: string;
  activeSupplements: string[];

  // Step 4: AI Tools & Waiver
  aiMealPlateScannerConsent: boolean;
  aiMeshConsent: boolean;
  foodJournalCommitment: boolean;
  waiverSigned: boolean;
  waiverSignature: string;
}

const INITIAL_VALUES: NutritionFormData = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  age: "32",
  biologicalSex: "female",
  heightFeet: "5",
  heightInches: "6",
  currentWeightLbs: "155",
  targetWeightLbs: "140",
  estimatedBodyFatPercent: "26",
  activityMultiplier: "moderate",

  proteinTargetAcknowledged: true,
  dietaryFramework: "Omnivore (High-Protein Whole Foods)",
  dietaryRestrictions: [],
  foodAllergies: "",
  foodsRefused: "",
  mealPrepHabits: "meal_preps_weekly",

  bloatingFrequency: "occasional",
  acidReflux: false,
  emotionalEating: true,
  lateNightSnacking: true,
  caffeineDailyIntake: "2 cups black coffee / day",
  dailyWaterOz: "80-100 oz/day",
  activeSupplements: ["Whey Protein Isolate", "Electrolytes (LMNT)", "Magnesium"],

  aiMealPlateScannerConsent: true,
  aiMeshConsent: true,
  foodJournalCommitment: true,
  waiverSigned: false,
  waiverSignature: "",
};

const STEPS = [
  { title: "Anthropometrics", subtitle: "Mifflin-St Jeor & baselines" },
  { title: "Protein & Macros", subtitle: "Dietary framework & allergies" },
  { title: "GI & Triggers", subtitle: "Gut motility & cravings" },
  { title: "AI Consent & Waiver", subtitle: "Plate scanner & signature" },
];

const DIETARY_ALLERGY_OPTIONS = [
  "Lactose / Dairy",
  "Gluten / Celiac",
  "Shellfish",
  "Tree Nuts",
  "Peanuts",
  "Soy",
  "Eggs",
  "Nightshades",
];

const SUPPLEMENT_OPTIONS = [
  "Creatine Monohydrate",
  "Whey / Plant Protein Isolate",
  "Electrolytes (LMNT / Liquid IV)",
  "Daily Multivitamin",
  "Vitamin D3 / K2",
  "Omega-3 Fish Oil",
  "Magnesium Glycinate",
  "None",
];

const ACTIVITY_FACTORS: Record<string, { multiplier: number; label: string }> = {
  sedentary: { multiplier: 1.2, label: "Sedentary (Desk work, little exercise)" },
  light: { multiplier: 1.375, label: "Light (1-3 workout sessions/week)" },
  moderate: { multiplier: 1.55, label: "Moderate (3-5 sessions/week)" },
  heavy: { multiplier: 1.725, label: "Heavy (6-7 intense sessions/week)" },
  athlete: { multiplier: 1.9, label: "Athlete (2x/day competitive training)" },
};

export default function NutritionMetabolicIntakePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ isOpen: boolean; title: string; message?: string }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const {
    formData,
    updateFormData,
    hasDraftRestored,
    draftTimestamp,
    clearDraft,
    dismissRestoredBanner,
  } = useIntakeDraft<NutritionFormData>("nutrition-metabolic", INITIAL_VALUES);

  // Dynamic Metabolic Calculations
  const calculations = useMemo(() => {
    const ageNum = Number(formData.age) || 30;
    const feetNum = Number(formData.heightFeet) || 5;
    const inchesNum = Number(formData.heightInches) || 6;
    const totalInches = feetNum * 12 + inchesNum;
    const weightLbsNum = Number(formData.currentWeightLbs) || 150;

    const weightKg = lbsToKg(weightLbsNum);
    const heightCm = inToCm(totalInches);

    const bmr = Math.round(bmrMifflin(weightKg, heightCm, ageNum, formData.biologicalSex));
    const factor = ACTIVITY_FACTORS[formData.activityMultiplier]?.multiplier || 1.55;
    const tdee = Math.round(bmr * factor);

    // High performance protein ~2.2g/kg (approx 1g per lb)
    const targetProteinGrams = Math.round(weightLbsNum * 1.0);

    return {
      bmr,
      tdee,
      targetProteinGrams,
      deficitTarget: Math.round(tdee - 450),
      weightKg: Math.round(weightKg * 10) / 10,
    };
  }, [
    formData.age,
    formData.biologicalSex,
    formData.heightFeet,
    formData.heightInches,
    formData.currentWeightLbs,
    formData.activityMultiplier,
  ]);

  const toggleAllergy = (allergy: string) => {
    const current = formData.dietaryRestrictions || [];
    if (current.includes(allergy)) {
      updateFormData({ dietaryRestrictions: current.filter((a) => a !== allergy) });
    } else {
      updateFormData({ dietaryRestrictions: [...current, allergy] });
    }
  };

  const toggleSupplement = (supp: string) => {
    const current = formData.activeSupplements || [];
    if (supp === "None") {
      updateFormData({ activeSupplements: ["None"] });
      return;
    }
    const filtered = current.filter((s) => s !== "None");
    if (filtered.includes(supp)) {
      updateFormData({ activeSupplements: filtered.filter((s) => s !== supp) });
    } else {
      updateFormData({ activeSupplements: [...filtered, supp] });
    }
  };

  const validateCurrentStep = (): boolean => {
    setErrorMessage(null);

    if (currentStep === 0) {
      if (!formData.clientName.trim()) {
        setErrorMessage("Please enter your full legal name.");
        return false;
      }
      if (!formData.clientEmail.trim() || !formData.clientEmail.includes("@")) {
        setErrorMessage("Please enter a valid email address.");
        return false;
      }
      if (!formData.clientPhone.trim() || formData.clientPhone.trim().length < 7) {
        setErrorMessage("Please enter a valid phone number.");
        return false;
      }
      if (!formData.currentWeightLbs || Number(formData.currentWeightLbs) <= 50) {
        setErrorMessage("Please provide a valid current weight in pounds.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.aiMealPlateScannerConsent) {
        setErrorMessage("You must accept the AI Plate Scanner privacy consent.");
        return false;
      }
      if (!formData.waiverSigned) {
        setErrorMessage("You must accept the nutrition coaching liability waiver agreement.");
        return false;
      }
      if (!formData.waiverSignature.trim() || formData.waiverSignature.trim().length < 2) {
        setErrorMessage("A digital legal signature (drawn or typed) is required.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const feet = Number(formData.heightFeet) || 5;
      const inches = Number(formData.heightInches) || 6;
      const totalInches = feet * 12 + inches;

      const payload = {
        track: "nutrition-metabolic",
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim().toLowerCase(),
        clientPhone: formData.clientPhone.trim(),
        intakeData: {
          age: formData.age ? Number(formData.age) : undefined,
          biologicalSex: formData.biologicalSex,
          heightInches: totalInches,
          currentWeightLbs: Number(formData.currentWeightLbs),
          targetWeightLbs: formData.targetWeightLbs ? Number(formData.targetWeightLbs) : undefined,
          estimatedBodyFatPercent: formData.estimatedBodyFatPercent
            ? Number(formData.estimatedBodyFatPercent)
            : undefined,
          activityMultiplier: formData.activityMultiplier,
          dailyProteinTargetGrams: calculations.targetProteinGrams,
          calculatedBmr: calculations.bmr,
          calculatedTdee: calculations.tdee,
          dietaryRestrictions: formData.dietaryRestrictions,
          foodAllergies: formData.foodAllergies.trim() || undefined,
          foodsRefused: formData.foodsRefused.trim() || undefined,
          dietaryFramework: formData.dietaryFramework,
          mealPrepHabits: formData.mealPrepHabits,
          giBehavioralTriggers: {
            bloatingFrequency: formData.bloatingFrequency,
            acidReflux: formData.acidReflux,
            emotionalEating: formData.emotionalEating,
            lateNightSnacking: formData.lateNightSnacking,
            caffeineDailyIntake: formData.caffeineDailyIntake || undefined,
          },
          dailyWaterOz: formData.dailyWaterOz,
          activeSupplements: formData.activeSupplements,
          aiMealPlateScannerConsent: formData.aiMealPlateScannerConsent,
          aiMeshConsent: formData.aiMeshConsent,
          foodJournalCommitment: formData.foodJournalCommitment,
        },
        waiverSigned: formData.waiverSigned,
        waiverSignature: formData.waiverSignature.trim(),
        waiverSignedAt: new Date().toISOString(),
      };

      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || json.message || "Failed to submit nutrition intake.");
      }

      setSubmissionSuccess(true);
      setSubmissionId(json.recordId || json.data?.id || `NUTRI-${Date.now().toString().slice(-6)}`);
      clearDraft();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      console.error("[NutritionMetabolic] Submission error:", err);
      const msg = err instanceof Error ? err.message : "Submission failed. Please check your inputs and try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRestoredDate = (iso: string | null) => {
    if (!iso) return "recently";
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "recently";
    }
  };

  // Render Success Screen
  if (submissionSuccess) {
    return (
      <div className="page-container max-w-2xl mx-auto py-8">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center space-y-6 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-cyber-slate flex items-center justify-center mx-auto shadow-lg font-bold">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Track C Ingress Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-ice-white font-display">
              Metabolic Blueprint Initialized
            </h1>
            <p className="text-xs sm:text-sm text-silver-slate max-w-lg mx-auto leading-relaxed">
              Welcome to the Nutrition & Metabolic Health program, <strong className="text-ice-white">{formData.clientName}</strong>! Coach Esh has received your anthropometric data, Mifflin-St Jeor metabolic calculations, food trigger audit, and AI vision consent.
            </p>
          </div>

          {submissionId && (
            <div className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 inline-block font-mono text-xs text-silver-slate">
              Blueprint ID: <span className="text-amber-400 font-bold">{submissionId}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#0E0E14] border border-white/5 text-left space-y-2 text-xs text-silver-slate">
            <p className="font-semibold text-ice-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Your Metabolic Baseline Target Summary:</span>
            </p>
            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="p-2 rounded-xl bg-white/5 text-center">
                <p className="text-[10px] text-silver-slate">BMR</p>
                <p className="text-xs font-bold text-ice-white">{calculations.bmr} kcal</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 text-center">
                <p className="text-[10px] text-silver-slate">TDEE</p>
                <p className="text-xs font-bold text-amber-400">{calculations.tdee} kcal</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 text-center">
                <p className="text-[10px] text-silver-slate">Protein Target</p>
                <p className="text-xs font-bold text-accent-lime">{calculations.targetProteinGrams}g / day</p>
              </div>
            </div>
            <ul className="space-y-1 pl-5 list-disc text-silver-slate/90">
              <li>Coach Esh will deliver your customized macro blueprint within 24 hours.</li>
              <li>You will receive AI Meal Plate Scanner activation credentials to log optical meal photos.</li>
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 text-cyber-slate font-bold text-xs hover:bg-amber-400 transition-all shadow-md"
            >
              Return to Homepage
            </Link>
            <Link
              href="/intake"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-silver-slate hover:text-ice-white border border-white/10 text-xs font-medium transition-all"
            >
              Intake Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl mx-auto space-y-8">
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/intake"
              className="text-xs text-silver-slate hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Tracks</span>
            </Link>
            <span className="text-silver-slate/40">•</span>
            <span className="text-xs font-mono font-semibold text-amber-400">Track C</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ice-white tracking-tight font-display">
            Nutrition & Metabolic Health Intake
          </h1>
          <p className="text-xs text-silver-slate mt-1">
            Mifflin-St Jeor metabolic baselines • High-protein macros • AI Plate Scanner onboarding
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Restored Draft Banner */}
      {hasDraftRestored && (
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-3 border border-amber-500/30 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs text-ice-white">
            <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Unsaved draft auto-restored from <strong>{formatRestoredDate(draftTimestamp)}</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={dismissRestoredBanner}
              className="text-xs text-silver-slate hover:text-ice-white px-2 py-1 rounded"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={clearDraft}
              className="text-xs text-accent-violet hover:underline px-2 py-1 rounded"
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {/* Step Progress Tracker */}
      <IntakeProgress
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step < currentStep) setCurrentStep(step);
        }}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-8">
        {/* ── STEP 1: Anthropometrics & Baselines ── */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <span>Step 1: Anthropometrics & Clinical Energy Baselines</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Enter your physical dimensions for real-time Mifflin-St Jeor BMR, TDEE, and high-performance protein calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-xs font-semibold text-silver-slate">
                  Full Legal Name <span className="text-accent-violet">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => updateFormData({ clientName: e.target.value })}
                  placeholder="e.g. Jessica Sterling"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-silver-slate">
                  Email Address <span className="text-accent-violet">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => updateFormData({ clientEmail: e.target.value })}
                  placeholder="jessica@example.com"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">
                  Mobile Phone <span className="text-accent-violet">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.clientPhone}
                  onChange={(e) => updateFormData({ clientPhone: e.target.value })}
                  placeholder="(561) 555-0144"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">Biological Sex *</label>
                <select
                  value={formData.biologicalSex}
                  onChange={(e) => updateFormData({ biologicalSex: e.target.value as any })}
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-ice-white focus:outline-none"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">Age (Years) *</label>
                <input
                  type="number"
                  min="16"
                  max="95"
                  value={formData.age}
                  onChange={(e) => updateFormData({ age: e.target.value })}
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">Height (Ft & In) *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min="4"
                    max="7"
                    value={formData.heightFeet}
                    onChange={(e) => updateFormData({ heightFeet: e.target.value })}
                    placeholder="5 ft"
                    className="w-full bg-[#0E0E14] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-ice-white text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={formData.heightInches}
                    onChange={(e) => updateFormData({ heightInches: e.target.value })}
                    placeholder="6 in"
                    className="w-full bg-[#0E0E14] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-ice-white text-center"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">Current Wt (lbs) *</label>
                <input
                  type="number"
                  min="60"
                  max="500"
                  value={formData.currentWeightLbs}
                  onChange={(e) => updateFormData({ currentWeightLbs: e.target.value })}
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">Target Goal Weight (lbs)</label>
                <input
                  type="number"
                  value={formData.targetWeightLbs}
                  onChange={(e) => updateFormData({ targetWeightLbs: e.target.value })}
                  placeholder="e.g. 140"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-ice-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">
                  Activity Level Multiplier
                </label>
                <select
                  value={formData.activityMultiplier}
                  onChange={(e) => updateFormData({ activityMultiplier: e.target.value as any })}
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-ice-white focus:outline-none"
                >
                  <option value="sedentary">Sedentary (Desk work, little exercise)</option>
                  <option value="light">Light (1-3 workouts / week)</option>
                  <option value="moderate">Moderate (3-5 workouts / week)</option>
                  <option value="heavy">Heavy (6-7 intense workouts / week)</option>
                  <option value="athlete">Athlete (2x/day competitive training)</option>
                </select>
              </div>
            </div>

            {/* Live Dynamic Mifflin-St Jeor Engine Card */}
            <div className="glass-panel-lime rounded-2xl p-5 border border-amber-500/30 space-y-3 bg-gradient-to-r from-amber-500/10 via-transparent to-accent-lime/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                    Live Mifflin-St Jeor Clinical Calculations
                  </span>
                </div>
                <span className="text-[10px] font-mono text-silver-slate">Dynamic Engine</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#0E0E14]/80 border border-white/5 text-center">
                  <span className="text-[10px] text-silver-slate uppercase font-mono">Basal BMR</span>
                  <p className="text-lg font-black text-ice-white mt-0.5">{calculations.bmr}</p>
                  <span className="text-[9px] text-silver-slate/60">kcal / day base</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0E0E14]/80 border border-amber-500/20 text-center shadow-sm">
                  <span className="text-[10px] text-amber-400 uppercase font-mono">Estimated TDEE</span>
                  <p className="text-lg font-black text-amber-400 mt-0.5">{calculations.tdee}</p>
                  <span className="text-[9px] text-silver-slate/60">maintenance kcal</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0E0E14]/80 border border-accent-lime/20 text-center shadow-sm">
                  <span className="text-[10px] text-accent-lime uppercase font-mono">Protein Prescript</span>
                  <p className="text-lg font-black text-accent-lime mt-0.5">{calculations.targetProteinGrams}g</p>
                  <span className="text-[9px] text-silver-slate/60">~2.2g/kg LBM</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: High-Performance Protein & Macro Blueprint ── */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                <span>Step 2: High-Performance Protein & Macro Blueprint</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Bodied by Esh prioritizes lean mass preservation and metabolic rate via optimized amino acid distribution.
              </p>
            </div>

            {/* Protein Target Banner */}
            <label className="p-4 rounded-2xl bg-accent-lime/10 border border-accent-lime/30 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.proteinTargetAcknowledged}
                onChange={(e) => updateFormData({ proteinTargetAcknowledged: e.target.checked })}
                className="mt-0.5 rounded border-accent-lime text-accent-lime focus:ring-accent-lime bg-[#0E0E14] w-4 h-4 shrink-0"
              />
              <div className="text-xs space-y-1">
                <p className="font-bold text-ice-white">
                  High-Protein Recomposition Strategy Acknowledgment (~{calculations.targetProteinGrams}g/day)
                </p>
                <p className="text-silver-slate leading-relaxed">
                  I understand that Bodied by Esh utilizes high-protein protocols (~2.2g per kg / 1.0g per lb) to preserve metabolically active muscle tissue and maximize satiety during body recomposition.
                </p>
              </div>
            </label>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-silver-slate">
                Dietary Strategy Framework Preference
              </label>
              <select
                value={formData.dietaryFramework}
                onChange={(e) => updateFormData({ dietaryFramework: e.target.value })}
                className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none"
              >
                <option value="Omnivore (High-Protein Whole Foods)">Omnivore (High-Protein Whole Foods)</option>
                <option value="High-Protein Pescatarian">High-Protein Pescatarian (Fish & Seafood)</option>
                <option value="Mediterranean Flexible">Mediterranean Flexible</option>
                <option value="Low-Carb / Ketogenic">Low-Carb / Ketogenic Recomp</option>
                <option value="Plant-Based / High-Protein Vegan">Plant-Based / High-Protein Vegan</option>
                <option value="Intermittent Fasting (16/8 Window)">Intermittent Fasting (16/8 Protocol)</option>
              </select>
            </div>

            {/* Allergies / Restrictions Multi-Select */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-silver-slate">
                Strict Food Allergies & Intolerances (Multi-select)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DIETARY_ALLERGY_OPTIONS.map((allergy) => {
                  const isChecked = (formData.dietaryRestrictions || []).includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs font-medium flex items-center justify-between ${
                        isChecked
                          ? "bg-amber-500/15 border-amber-400 text-ice-white shadow-sm"
                          : "bg-[#0E0E14] border-white/10 text-silver-slate hover:border-white/20"
                      }`}
                    >
                      <span className="truncate">{allergy}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">
                  Other Allergies / Sensitivities
                </label>
                <input
                  type="text"
                  value={formData.foodAllergies}
                  onChange={(e) => updateFormData({ foodAllergies: e.target.value })}
                  placeholder="e.g. Severe histamine intolerance, artificial sweetener sensitivity"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-ice-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">
                  Foods You Refuse to Eat (Dislikes)
                </label>
                <input
                  type="text"
                  value={formData.foodsRefused}
                  onChange={(e) => updateFormData({ foodsRefused: e.target.value })}
                  placeholder="e.g. Cilantro, mushrooms, organ meats"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-ice-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-silver-slate">Current Meal Preparation Rhythm</label>
              <select
                value={formData.mealPrepHabits}
                onChange={(e) => updateFormData({ mealPrepHabits: e.target.value as any })}
                className="w-full bg-[#0E0E14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none"
              >
                <option value="meal_preps_weekly">Weekly batch meal prep on Sundays</option>
                <option value="cooks_daily">Cooks fresh meals daily</option>
                <option value="meal_service">Subscribed to prepared meal delivery (e.g. Factor, MegaFit)</option>
                <option value="dining_out">Predominantly takeout / restaurant dining</option>
              </select>
            </div>
          </div>
        )}

        {/* ── STEP 3: Gastrointestinal Health & Triggers ── */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-amber-400" />
                <span>Step 3: Gastrointestinal Health & Behavioral Eating Triggers</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Optimizing nutrient absorption, gut microbiome integrity, and eliminating stress-induced eating loops.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Post-Meal Bloating & Gut Distension
                </label>
                <select
                  value={formData.bloatingFrequency}
                  onChange={(e) => updateFormData({ bloatingFrequency: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="never">Never — Flat stomach and easy digestion</option>
                  <option value="occasional">Occasional — Only after heavy restaurant meals</option>
                  <option value="frequent">Frequent — Noticeable distension multiple days/week</option>
                  <option value="daily">Daily — Severe discomfort after almost every meal</option>
                </select>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Daily Hydration Baseline (oz / day)
                </label>
                <select
                  value={formData.dailyWaterOz}
                  onChange={(e) => updateFormData({ dailyWaterOz: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="<64 oz/day">&lt; 64 oz / day (Low hydration)</option>
                  <option value="64-80 oz/day">64 to 80 oz / day</option>
                  <option value="80-100 oz/day">80 to 100 oz / day</option>
                  <option value="120+ oz/day">120+ oz / day (1 Gallon disciplined)</option>
                </select>
              </div>
            </div>

            {/* Behavioral Triggers Grid */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-silver-slate">
                Behavioral Triggers & Gastrointestinal Symptoms
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    formData.acidReflux
                      ? "bg-amber-500/10 border-amber-400 text-ice-white"
                      : "bg-[#0E0E14] border-white/10 text-silver-slate"
                  }`}
                >
                  <span className="text-xs font-medium">Acid Reflux / GERD</span>
                  <input
                    type="checkbox"
                    checked={formData.acidReflux}
                    onChange={(e) => updateFormData({ acidReflux: e.target.checked })}
                    className="rounded border-white/20 text-amber-500 w-4 h-4"
                  />
                </label>

                <label
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    formData.emotionalEating
                      ? "bg-amber-500/10 border-amber-400 text-ice-white"
                      : "bg-[#0E0E14] border-white/10 text-silver-slate"
                  }`}
                >
                  <span className="text-xs font-medium">Stress Cravings / Snacking</span>
                  <input
                    type="checkbox"
                    checked={formData.emotionalEating}
                    onChange={(e) => updateFormData({ emotionalEating: e.target.checked })}
                    className="rounded border-white/20 text-amber-500 w-4 h-4"
                  />
                </label>

                <label
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    formData.lateNightSnacking
                      ? "bg-amber-500/10 border-amber-400 text-ice-white"
                      : "bg-[#0E0E14] border-white/10 text-silver-slate"
                  }`}
                >
                  <span className="text-xs font-medium">Late-Night Eating Loop</span>
                  <input
                    type="checkbox"
                    checked={formData.lateNightSnacking}
                    onChange={(e) => updateFormData({ lateNightSnacking: e.target.checked })}
                    className="rounded border-white/20 text-amber-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>

            {/* Daily Supplements */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-silver-slate">
                Active Daily Supplement Stack (Multi-select)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SUPPLEMENT_OPTIONS.map((supp) => {
                  const isChecked = (formData.activeSupplements || []).includes(supp);
                  return (
                    <button
                      key={supp}
                      type="button"
                      onClick={() => toggleSupplement(supp)}
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs font-medium flex items-center justify-between ${
                        isChecked
                          ? "bg-amber-500/15 border-amber-400 text-ice-white shadow-sm"
                          : "bg-[#0E0E14] border-white/10 text-silver-slate hover:border-white/20"
                      }`}
                    >
                      <span className="truncate">{supp}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: AI Meal Plate Scanner & Consent ── */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <span>Step 4: AI Vision Tools Consent & Coaching Waiver</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Review our optical meal recognition guidelines, privacy-preserved 3D body composition consent, and sign your intake agreement.
              </p>
            </div>

            {/* AI Plate Scanner & 3D Mesh Consents */}
            <div className="space-y-3">
              <label
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  formData.aiMealPlateScannerConsent
                    ? "bg-amber-500/10 border-amber-400/50"
                    : "bg-[#0E0E14] border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  required
                  checked={formData.aiMealPlateScannerConsent}
                  onChange={(e) =>
                    updateFormData({ aiMealPlateScannerConsent: e.target.checked })
                  }
                  className="mt-0.5 rounded border-white/20 text-amber-500 focus:ring-amber-400 bg-black/40 w-4 h-4 shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-ice-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Meal Plate Scanner Optical Onboarding</span>
                  </p>
                  <p className="text-silver-slate leading-relaxed">
                    I agree to use the Bodied by Esh AI Meal Plate Scanner to capture photographic logs of meals for automatic macro estimation and feedback.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  formData.aiMeshConsent
                    ? "bg-amber-500/10 border-amber-400/50"
                    : "bg-[#0E0E14] border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.aiMeshConsent}
                  onChange={(e) => updateFormData({ aiMeshConsent: e.target.checked })}
                  className="mt-0.5 rounded border-white/20 text-amber-500 focus:ring-amber-400 bg-black/40 w-4 h-4 shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-ice-white flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>Privacy-Preserved 3D Body Mesh Opt-In</span>
                  </p>
                  <p className="text-silver-slate leading-relaxed">
                    I authorize encrypted 3D silhouette landmark estimation for tracking body recomposition changes without storing raw facial imagery.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  formData.foodJournalCommitment
                    ? "bg-amber-500/10 border-amber-400/50"
                    : "bg-[#0E0E14] border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.foodJournalCommitment}
                  onChange={(e) =>
                    updateFormData({ foodJournalCommitment: e.target.checked })
                  }
                  className="mt-0.5 rounded border-white/20 text-amber-500 focus:ring-amber-400 bg-black/40 w-4 h-4 shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-ice-white">7-Day Initial Food Journaling Commitment</p>
                  <p className="text-silver-slate leading-relaxed">
                    I commit to logging all meals, snacks, and beverages for the first 7 days to establish my true caloric baseline and metabolic response curve.
                  </p>
                </div>
              </label>
            </div>

            {/* Legal Liability Scroll Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-silver-slate">
                Nutrition Coaching & Dietary Counseling Waiver
              </label>
              <div className="h-32 rounded-xl bg-[#0A0A0F] border border-white/10 p-3.5 overflow-y-auto text-[11px] text-silver-slate/80 leading-relaxed font-mono space-y-2">
                <p>
                  <strong>NUTRITIONAL COUNSELING ACKNOWLEDGMENT:</strong> I acknowledge that nutritional guidelines provided by Bodied by Esh LLC and Coach Esh are designed for athletic conditioning, body recomposition, and general wellness. They do not constitute medical nutrition therapy or diagnosis for medical diseases.
                </p>
                <p>
                  I declare that I have disclosed all known food allergies and medical conditions honestly. I understand that implementing nutritional changes is voluntary and I release Bodied by Esh LLC from liability for dietary intolerances not previously disclosed.
                </p>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.waiverSigned}
                  onChange={(e) => updateFormData({ waiverSigned: e.target.checked })}
                  className="rounded border-white/20 text-amber-500 focus:ring-amber-400 bg-[#0E0E14] w-4 h-4"
                />
                <span className="text-xs font-semibold text-ice-white">
                  I have read, understood, and accept the nutrition coaching waiver agreement. <span className="text-accent-violet">*</span>
                </span>
              </label>
            </div>

            {/* Signature Canvas */}
            <div className="pt-2 border-t border-white/5">
              <SignaturePad
                value={formData.waiverSignature}
                onChange={(sig) => updateFormData({ waiverSignature: sig })}
                label="Athlete / Client Legal Signature"
                required
              />
            </div>
          </div>
        )}

        {/* Navigation / Submission Controls */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-silver-slate hover:text-ice-white text-xs font-semibold border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-cyber-slate font-bold text-xs hover:bg-amber-400 transition-all shadow-md"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 text-cyber-slate font-bold text-sm hover:bg-amber-400 transition-all shadow-[0_0_25px_rgba(245,158,11,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Metabolic Blueprint...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Nutrition Intake</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
