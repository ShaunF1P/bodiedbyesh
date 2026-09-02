"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Watch,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Plane,
  Monitor,
  HeartPulse,
  User,
  Check,
  FileText,
  Loader2,
  Zap,
  Moon,
} from "lucide-react";
import { useIntakeDraft } from "@/hooks/useIntakeDraft";
import { IntakeProgress } from "@/components/intake/IntakeProgress";
import { SignaturePad } from "@/components/intake/SignaturePad";
import { Toast } from "@/components/intake/Toast";

interface ExecutiveFormData {
  // Step 1: Executive Profile
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  industryRole: string;
  timeZone: string;
  weeklyWorkHours: string;
  primaryObstacle: string;
  executiveStressLevel: "low" | "moderate" | "high" | "extreme";

  // Step 2: Biotelemetry & Wearables
  wearableDevices: string[];
  restingHeartRate: string;
  baselineHrv: string;
  averageSleepHours: string;
  averageSleepScore: string;
  dailyStrainTarget: string;
  subjectiveEnergyScore: number;
  biotelemetryConsent: boolean;

  // Step 3: Ergonomics & Posture
  dailySittingHours: string;
  cervicalSpineTension: "none" | "mild" | "moderate" | "severe";
  anteriorPelvicTilt: "none" | "mild" | "moderate" | "severe";
  hipFlexorTightness: "none" | "mild" | "moderate" | "severe";
  workstationSetup: string;

  // Step 4: Travel & Dining
  travelCadence: "rarely" | "monthly" | "biweekly" | "weekly";
  businessDinnersPerWeek: string;
  diningOutVsCooking: string;
  hotelGymPreference: string;
  alcoholDrinksPerWeek: string;

  // Step 5: Dynamic Recovery & Waiver
  dynamicRecoveryConsent: boolean;
  asyncAccountabilityConsent: boolean;
  waiverSigned: boolean;
  waiverSignature: string;
}

const INITIAL_VALUES: ExecutiveFormData = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  industryRole: "",
  timeZone: "EST (Eastern)",
  weeklyWorkHours: "55-70 hrs",
  primaryObstacle: "Time constraints & intense meeting schedule",
  executiveStressLevel: "high",

  wearableDevices: ["Oura Ring (Gen 3 / Gen 4)"],
  restingHeartRate: "58",
  baselineHrv: "45",
  averageSleepHours: "6.5",
  averageSleepScore: "78",
  dailyStrainTarget: "14.0",
  subjectiveEnergyScore: 3,
  biotelemetryConsent: true,

  dailySittingHours: "9",
  cervicalSpineTension: "moderate",
  anteriorPelvicTilt: "moderate",
  hipFlexorTightness: "moderate",
  workstationSetup: "Laptop at desk with external monitor",

  travelCadence: "monthly",
  businessDinnersPerWeek: "3",
  diningOutVsCooking: "Dining out / client dinners 4-5 nights per week",
  hotelGymPreference: "Hotel dumbbell gym & mobility work in room",
  alcoholDrinksPerWeek: "3-5 drinks/week",

  dynamicRecoveryConsent: true,
  asyncAccountabilityConsent: true,
  waiverSigned: false,
  waiverSignature: "",
};

const STEPS = [
  { title: "Profile & Cadence", subtitle: "Executive workload & constraints" },
  { title: "Biotelemetry", subtitle: "Wearables, HRV & sleep" },
  { title: "Ergonomics", subtitle: "Cervical spine & posture" },
  { title: "Travel & Dining", subtitle: "Flight & restaurant protocols" },
  { title: "Recovery Waiver", subtitle: "Autoregulation & signature" },
];

const WEARABLE_OPTIONS = [
  "Oura Ring (Gen 3 / Gen 4)",
  "Whoop (4.0)",
  "Apple Watch (Series / Ultra)",
  "Garmin (Forerunner / Fenix / Epix)",
  "Fitbit / Google Pixel Watch",
  "None (Manual Tracking)",
];

export default function ExecutiveConciergeIntakePage() {
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
  } = useIntakeDraft<ExecutiveFormData>("executive-concierge", INITIAL_VALUES);

  const toggleWearable = (device: string) => {
    const current = formData.wearableDevices || [];
    if (device === "None (Manual Tracking)") {
      updateFormData({ wearableDevices: ["None (Manual Tracking)"] });
      return;
    }
    const filtered = current.filter((d) => d !== "None (Manual Tracking)");
    if (filtered.includes(device)) {
      updateFormData({ wearableDevices: filtered.filter((d) => d !== device) });
    } else {
      updateFormData({ wearableDevices: [...filtered, device] });
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
        setErrorMessage("Please enter a valid business/personal email address.");
        return false;
      }
      if (!formData.clientPhone.trim() || formData.clientPhone.trim().length < 7) {
        setErrorMessage("Please enter a valid mobile number for VIP check-ins.");
        return false;
      }
    }

    if (currentStep === 4) {
      if (!formData.dynamicRecoveryConsent) {
        setErrorMessage("You must agree to the Dynamic Recovery Autoregulation protocol.");
        return false;
      }
      if (!formData.waiverSigned) {
        setErrorMessage("You must accept the remote coaching liability waiver agreement.");
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
      const payload = {
        track: "executive-concierge",
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim().toLowerCase(),
        clientPhone: formData.clientPhone.trim(),
        intakeData: {
          industryRole: formData.industryRole.trim() || undefined,
          timeZone: formData.timeZone,
          weeklyWorkHours: formData.weeklyWorkHours,
          primaryObstacle: formData.primaryObstacle,
          executiveStressLevel: formData.executiveStressLevel,
          wearableDevices: formData.wearableDevices,
          restingHeartRate: formData.restingHeartRate ? Number(formData.restingHeartRate) : undefined,
          baselineHrv: formData.baselineHrv ? Number(formData.baselineHrv) : undefined,
          averageSleepHours: formData.averageSleepHours ? Number(formData.averageSleepHours) : undefined,
          averageSleepScore: formData.averageSleepScore ? Number(formData.averageSleepScore) : undefined,
          dailyStrainTarget: formData.dailyStrainTarget ? Number(formData.dailyStrainTarget) : undefined,
          subjectiveEnergyScore: formData.subjectiveEnergyScore,
          biotelemetryConsent: formData.biotelemetryConsent,
          deskErgonomics: {
            cervicalSpineTension: formData.cervicalSpineTension,
            anteriorPelvicTilt: formData.anteriorPelvicTilt,
            hipFlexorTightness: formData.hipFlexorTightness,
            dailySittingHours: formData.dailySittingHours ? Number(formData.dailySittingHours) : 8,
          },
          workstationSetup: formData.workstationSetup,
          travelCadence: formData.travelCadence,
          businessDinnersPerWeek: formData.businessDinnersPerWeek ? Number(formData.businessDinnersPerWeek) : 2,
          diningOutVsCooking: formData.diningOutVsCooking || undefined,
          hotelGymPreference: formData.hotelGymPreference,
          alcoholDrinksPerWeek: formData.alcoholDrinksPerWeek,
          dynamicRecoveryConsent: formData.dynamicRecoveryConsent,
          asyncAccountabilityConsent: formData.asyncAccountabilityConsent,
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
        throw new Error(json.error || json.message || "Failed to submit executive intake.");
      }

      setSubmissionSuccess(true);
      setSubmissionId(json.recordId || json.data?.id || `EXEC-${Date.now().toString().slice(-6)}`);
      clearDraft();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      console.error("[ExecutiveConcierge] Submission error:", err);
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
        <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center space-y-6 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.15)] animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-purple-500 text-white flex items-center justify-center mx-auto shadow-lg">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
              Track B Ingress Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-ice-white font-display">
              Executive Concierge Intake Activated
            </h1>
            <p className="text-xs sm:text-sm text-silver-slate max-w-lg mx-auto leading-relaxed">
              Welcome to the Executive Concierge roster, <strong className="text-ice-white">{formData.clientName}</strong>! Coach Esh has received your biotelemetry profile, posture audit, travel constraints, and signed dynamic recovery agreement.
            </p>
          </div>

          {submissionId && (
            <div className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 inline-block font-mono text-xs text-silver-slate">
              Concierge Case ID: <span className="text-purple-400 font-bold">{submissionId}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#0E0E14] border border-white/5 text-left space-y-2 text-xs text-silver-slate">
            <p className="font-semibold text-ice-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Next Steps for VIP Onboarding:</span>
            </p>
            <ul className="space-y-1 pl-5 list-disc text-silver-slate/90">
              <li>Coach Esh will review your HRV & resting HR baselines within 12 hours.</li>
              <li>You will receive an encrypted private Loom video message and calendar link for your 1-on-1 strategy call.</li>
              <li>Wearable data integration tokens will be delivered via private SMS/email.</li>
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-600 transition-all shadow-md"
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
              className="text-xs text-silver-slate hover:text-purple-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Tracks</span>
            </Link>
            <span className="text-silver-slate/40">•</span>
            <span className="text-xs font-mono font-semibold text-purple-400">Track B</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ice-white tracking-tight font-display">
            Executive Concierge Clinical Intake
          </h1>
          <p className="text-xs text-silver-slate mt-1">
            Remote biotelemetry • Postural restoration • Dynamic recovery autoregulation
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Restored Draft Banner */}
      {hasDraftRestored && (
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-3 border border-purple-500/30 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs text-ice-white">
            <RotateCcw className="w-4 h-4 text-purple-400 shrink-0" />
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
        {/* ── STEP 1: Executive Profile & Work Cadence ── */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                <span>Step 1: Executive Profile & Professional Cadence</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Tell us about your professional demands, travel frequency, and primary physical obstacles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">
                  Full Legal Name <span className="text-accent-violet">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => updateFormData({ clientName: e.target.value })}
                  placeholder="e.g. David Vance"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">
                  Email Address <span className="text-accent-violet">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => updateFormData({ clientEmail: e.target.value })}
                  placeholder="david@vanceholdings.com"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">
                  Direct Mobile Number <span className="text-accent-violet">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.clientPhone}
                  onChange={(e) => updateFormData({ clientPhone: e.target.value })}
                  placeholder="(305) 555-0188"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">Title / Industry</label>
                <input
                  type="text"
                  value={formData.industryRole}
                  onChange={(e) => updateFormData({ industryRole: e.target.value })}
                  placeholder="e.g. Managing Partner, Private Equity"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">Primary Time Zone</label>
                <select
                  value={formData.timeZone}
                  onChange={(e) => updateFormData({ timeZone: e.target.value })}
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none"
                >
                  <option value="EST (Eastern)">EST (Eastern US / New York / Miami)</option>
                  <option value="CST (Central)">CST (Central US / Chicago / Austin)</option>
                  <option value="MST (Mountain)">MST (Mountain US / Denver / Phoenix)</option>
                  <option value="PST (Pacific)">PST (Pacific US / Los Angeles / SF)</option>
                  <option value="GMT / BST (London)">GMT / BST (London / Western Europe)</option>
                  <option value="International / Other">International / Frequent Cross-Continent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">Average Weekly Work Hours</label>
                <select
                  value={formData.weeklyWorkHours}
                  onChange={(e) => updateFormData({ weeklyWorkHours: e.target.value })}
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none"
                >
                  <option value="<40 hrs">&lt; 40 hours / week</option>
                  <option value="40-55 hrs">40 to 55 hours / week</option>
                  <option value="55-70 hrs">55 to 70 hours / week (High demand)</option>
                  <option value="70+ hrs">70+ hours / week (Extreme crunch)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-silver-slate">
                Primary Physical & Performance Obstacle
              </label>
              <select
                value={formData.primaryObstacle}
                onChange={(e) => updateFormData({ primaryObstacle: e.target.value })}
                className="w-full bg-[#0E0E14] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none"
              >
                <option value="Time constraints & intense meeting schedule">
                  Time constraints & intense meeting schedule
                </option>
                <option value="Frequent flight travel & hotel disruptions">
                  Frequent flight travel & hotel disruptions
                </option>
                <option value="Mental exhaustion / Low sleep quality">
                  Mental exhaustion & poor sleep recovery
                </option>
                <option value="Client entertaining & dining out calories">
                  Client dinners & social dining calorie control
                </option>
              </select>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
              <label className="text-xs font-semibold text-silver-slate">Subjective Executive Stress Level</label>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {(["low", "moderate", "high", "extreme"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateFormData({ executiveStressLevel: lvl })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                      formData.executiveStressLevel === lvl
                        ? "bg-purple-500 text-white border-purple-400 shadow-sm"
                        : "bg-black/40 text-silver-slate border-white/10 hover:border-white/20"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Biotelemetry & Wearable Ecosystem ── */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <Watch className="w-5 h-5 text-purple-400" />
                <span>Step 2: Biotelemetry & Wearable Ecosystem</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Bodied by Esh uses real-time physiological telemetry (HRV, resting HR, sleep architecture) to autoregulate your training volume.
              </p>
            </div>

            {/* Wearable Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-silver-slate">
                Select Your Active Wearable Health Trackers (Multi-select)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WEARABLE_OPTIONS.map((device) => {
                  const isChecked = (formData.wearableDevices || []).includes(device);
                  return (
                    <button
                      key={device}
                      type="button"
                      onClick={() => toggleWearable(device)}
                      className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between text-xs font-medium ${
                        isChecked
                          ? "bg-purple-500/10 border-purple-400 text-ice-white shadow-sm"
                          : "bg-[#0E0E14] border-white/10 text-silver-slate hover:border-white/20"
                      }`}
                    >
                      <span>{device}</span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? "bg-purple-500 border-purple-400 text-white" : "border-white/20"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Biometric Baselines */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-[11px] font-semibold text-silver-slate flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-purple-400" />
                  <span>Resting HR (bpm)</span>
                </label>
                <input
                  type="number"
                  min="35"
                  max="140"
                  value={formData.restingHeartRate}
                  onChange={(e) => updateFormData({ restingHeartRate: e.target.value })}
                  placeholder="e.g. 54"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-[11px] font-semibold text-silver-slate flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Baseline HRV (ms)</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="250"
                  value={formData.baselineHrv}
                  onChange={(e) => updateFormData({ baselineHrv: e.target.value })}
                  placeholder="e.g. 62"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-[11px] font-semibold text-silver-slate flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Avg Nightly Sleep (hrs)</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="12"
                  value={formData.averageSleepHours}
                  onChange={(e) => updateFormData({ averageSleepHours: e.target.value })}
                  placeholder="e.g. 6.5"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Cloud Sync Consent */}
            <label className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3 cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.biotelemetryConsent}
                onChange={(e) => updateFormData({ biotelemetryConsent: e.target.checked })}
                className="mt-0.5 rounded border-white/20 text-purple-500 focus:ring-purple-400 bg-[#0E0E14] w-4 h-4"
              />
              <span className="text-xs text-silver-slate leading-relaxed">
                I authorize Bodied by Esh to receive anonymized biotelemetry summaries (sleep score, recovery index, resting HR) to adapt daily workout prescriptions.
              </span>
            </label>
          </div>
        )}

        {/* ── STEP 3: Sedentary Desk Ergonomics & Posture ── */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-purple-400" />
                <span>Step 3: Sedentary Desk Ergonomics & Postural Health</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Prolonged desk sitting creates upper crossed syndrome (tech neck) and anterior pelvic tilt (tight hip flexors / weak glutes).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Daily Sitting Hours (Desk, Meetings, Driving)
                </label>
                <select
                  value={formData.dailySittingHours}
                  onChange={(e) => updateFormData({ dailySittingHours: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="4">&lt; 4 hours / day (Active / Standing)</option>
                  <option value="6">4 to 6 hours / day</option>
                  <option value="8">7 to 9 hours / day (Standard executive)</option>
                  <option value="11">10 to 12+ hours / day (Extensive sitting)</option>
                </select>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Cervical Spine / Tech Neck Tension
                </label>
                <select
                  value={formData.cervicalSpineTension}
                  onChange={(e) => updateFormData({ cervicalSpineTension: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="none">None — Zero neck tightness or headaches</option>
                  <option value="mild">Mild — Upper trap tightness at end of day</option>
                  <option value="moderate">Moderate — Regular cervical stiffness & knots</option>
                  <option value="severe">Severe — Chronic tension headaches or radiating tingling</option>
                </select>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Anterior Pelvic Tilt & Lower Back Dull Ache
                </label>
                <select
                  value={formData.anteriorPelvicTilt}
                  onChange={(e) => updateFormData({ anteriorPelvicTilt: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="none">None — Neutral pelvis & comfortable lumbar spine</option>
                  <option value="mild">Mild — Lower back stiff when standing after sitting</option>
                  <option value="moderate">Moderate — Noticeable pelvic tilt & lumbar arch fatigue</option>
                  <option value="severe">Severe — Recurring lumbar pain and tight psoas</option>
                </select>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Hip Flexor / Psoas Tightness
                </label>
                <select
                  value={formData.hipFlexorTightness}
                  onChange={(e) => updateFormData({ hipFlexorTightness: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="none">None — Full hip extension without restriction</option>
                  <option value="mild">Mild — Tightness during deep lunges/squats</option>
                  <option value="moderate">Moderate — Significant resistance in hip extension</option>
                  <option value="severe">Severe — Chronically locked anterior hip chain</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-silver-slate">Primary Workstation Setup</label>
              <input
                type="text"
                value={formData.workstationSetup}
                onChange={(e) => updateFormData({ workstationSetup: e.target.value })}
                placeholder="e.g. Electric standing desk + Herman Miller Aeron + Laptop on external stand"
                className="w-full bg-[#0E0E14] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: Executive Travel & Dining Cadence ── */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <Plane className="w-5 h-5 text-purple-400" />
                <span>Step 4: Executive Travel & Dining Cadence</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                We construct frictionless workout and nutrition protocols that travel with you across flight delays and business dinners.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Domestic / International Travel Frequency
                </label>
                <select
                  value={formData.travelCadence}
                  onChange={(e) => updateFormData({ travelCadence: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="rarely">Rarely (&lt; 1 trip every 3 months)</option>
                  <option value="monthly">Monthly (1 trip per month)</option>
                  <option value="biweekly">Bi-weekly (2 trips per month)</option>
                  <option value="weekly">Weekly (Frequent flyer / Constant travel)</option>
                </select>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Business & Restaurant Dinners (Meals / Week)
                </label>
                <select
                  value={formData.businessDinnersPerWeek}
                  onChange={(e) => updateFormData({ businessDinnersPerWeek: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="1">0 to 1 dinner / week</option>
                  <option value="3">2 to 3 dinners / week</option>
                  <option value="5">4 to 5 dinners / week</option>
                  <option value="7">6+ dinners / week (Almost daily dining out)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-silver-slate">
                Dining Routine & Restaurant Strategy
              </label>
              <textarea
                rows={2}
                value={formData.diningOutVsCooking}
                onChange={(e) => updateFormData({ diningOutVsCooking: e.target.value })}
                placeholder="e.g. Steakhouse dinners with clients Tuesday-Thursday; home cooking or meal prep on weekends."
                className="w-full bg-[#0E0E14] border border-white/10 focus:border-purple-400 rounded-xl p-3 text-xs text-ice-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Hotel Gym & Travel Training Preference
                </label>
                <select
                  value={formData.hotelGymPreference}
                  onChange={(e) => updateFormData({ hotelGymPreference: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="Hotel dumbbell gym & mobility work in room">
                    Hotel dumbbell gym & in-room mobility
                  </option>
                  <option value="Resistance bands / bodyweight in hotel room only">
                    Resistance bands & bodyweight in hotel room
                  </option>
                  <option value="Commercial gym day-pass (Equinox / Lifetime)">
                    Commercial gym day-pass (Equinox / Lifetime)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Alcohol & Social Beverage Cadence
                </label>
                <select
                  value={formData.alcoholDrinksPerWeek}
                  onChange={(e) => updateFormData({ alcoholDrinksPerWeek: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="0 drinks/week">0 drinks (Non-drinker / Sober)</option>
                  <option value="1-2 drinks/week">1 to 2 drinks / week (Social glass of wine)</option>
                  <option value="3-5 drinks/week">3 to 5 drinks / week (Networking cocktails)</option>
                  <option value="6+ drinks/week">6+ drinks / week (Frequent entertaining)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: Dynamic Recovery & Remote Waiver ── */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>Step 5: Dynamic Recovery Protocol & Remote Coaching Release</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Acknowledge the dynamic volume autoregulation framework and execute your digital signature.
              </p>
            </div>

            {/* Dynamic Autoregulation Consent */}
            <div className="space-y-3">
              <label
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  formData.dynamicRecoveryConsent
                    ? "bg-purple-500/10 border-purple-400/50"
                    : "bg-[#0E0E14] border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  required
                  checked={formData.dynamicRecoveryConsent}
                  onChange={(e) => updateFormData({ dynamicRecoveryConsent: e.target.checked })}
                  className="mt-0.5 rounded border-white/20 text-purple-500 focus:ring-purple-400 bg-black/40 w-4 h-4 shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-ice-white">
                    Dynamic Recovery Autoregulation Acknowledgment
                  </p>
                  <p className="text-silver-slate leading-relaxed">
                    I understand that when wearable metrics (HRV depression, resting HR elevation, acute sleep deficits) signal systemic central nervous system fatigue, Coach Esh will dynamically scale back workout volume into restorative active recovery sessions.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  formData.asyncAccountabilityConsent
                    ? "bg-purple-500/10 border-purple-400/50"
                    : "bg-[#0E0E14] border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  required
                  checked={formData.asyncAccountabilityConsent}
                  onChange={(e) => updateFormData({ asyncAccountabilityConsent: e.target.checked })}
                  className="mt-0.5 rounded border-white/20 text-purple-500 focus:ring-purple-400 bg-black/40 w-4 h-4 shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-ice-white">
                    Asynchronous Video & Biotelemetry Communication Agreement
                  </p>
                  <p className="text-silver-slate leading-relaxed">
                    I agree to participate in high-frequency asynchronous check-ins via private Loom video breakdowns and SMS/WhatsApp performance metrics.
                  </p>
                </div>
              </label>
            </div>

            {/* Legal Waiver Text */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-silver-slate">
                Remote High-Performance Coaching Liability Release
              </label>
              <div className="h-32 rounded-xl bg-[#0A0A0F] border border-white/10 p-3.5 overflow-y-auto text-[11px] text-silver-slate/80 leading-relaxed font-mono space-y-2">
                <p>
                  <strong>REMOTE PHYSICAL COACHING RELEASE:</strong> I acknowledge that remote fitness coaching involves self-guided physical exertion conducted in hotel, home, or commercial gym facilities. I affirm that I am medically cleared for progressive resistance training and cardiovascular exercise.
                </p>
                <p>
                  I release Bodied by Esh LLC and Coach Esh from liability regarding unforeseen injuries or health complications sustained during unobserved remote workouts. I agree to heed physiological fatigue warnings and execute exercises within my orthopedic capabilities.
                </p>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.waiverSigned}
                  onChange={(e) => updateFormData({ waiverSigned: e.target.checked })}
                  className="rounded border-white/20 text-purple-500 focus:ring-purple-400 bg-[#0E0E14] w-4 h-4"
                />
                <span className="text-xs font-semibold text-ice-white">
                  I have read, understood, and accept the remote coaching waiver agreement. <span className="text-accent-violet">*</span>
                </span>
              </label>
            </div>

            {/* Signature Canvas */}
            <div className="pt-2 border-t border-white/5">
              <SignaturePad
                value={formData.waiverSignature}
                onChange={(sig) => updateFormData({ waiverSignature: sig })}
                label="Executive Digital Legal Signature"
                required
              />
            </div>
          </div>
        )}

        {/* Form Footer Controls */}
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-600 transition-all shadow-md"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-purple-500 text-white font-bold text-sm hover:bg-purple-600 transition-all shadow-[0_0_25px_rgba(168,85,247,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Concierge Intake...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Executive Intake</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
