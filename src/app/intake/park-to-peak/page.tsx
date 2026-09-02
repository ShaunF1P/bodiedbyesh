"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sun,
  HeartPulse,
  Calendar,
  MapPin,
  Clock,
  Phone,
  User,
  Check,
  FileText,
  Loader2,
} from "lucide-react";
import { useIntakeDraft } from "@/hooks/useIntakeDraft";
import { IntakeProgress } from "@/components/intake/IntakeProgress";
import { SignaturePad } from "@/components/intake/SignaturePad";
import { Toast } from "@/components/intake/Toast";

interface ParkToPeakFormData {
  // Step 1: Athlete Basics & Logistics
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  age: string;
  gender: string;
  practiceCohort: "mon_wed" | "tue_thu" | "flexible";
  cohortTimeSlot: string;
  preferredLocation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Step 2: Clinical PAR-Q+ & Orthopedic Audit
  parqJointIssues: boolean;
  parqChestPain: boolean;
  parqDizziness: boolean;
  parqBloodPressure: boolean;
  parqDetails: string;
  kneeSensitivity: "none" | "mild" | "moderate" | "severe";
  lowerBackSensitivity: "none" | "mild" | "moderate" | "severe";
  shoulderSensitivity: "none" | "mild" | "moderate" | "severe";
  ankleSensitivity: "none" | "mild" | "moderate" | "severe";
  grassTurfTolerance: "excellent" | "moderate" | "limited";
  medicalConditions: string;
  currentMedications: string;

  // Step 3: South Florida Heat & Hydration
  heatHumidityTolerance: "high" | "moderate" | "low" | "heat_sensitive";
  priorHeatIllness: boolean;
  hydrationHabits: string;
  electrolyteStrategy: string;
  outdoorSunAcknowledgment: boolean;

  // Step 4: Policy & Waiver
  cancellationPolicyAcknowledged: boolean;
  weatherPolicyAcknowledged: boolean;
  waiverSigned: boolean;
  waiverSignature: string;
}

const INITIAL_VALUES: ParkToPeakFormData = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  age: "",
  gender: "male",
  practiceCohort: "mon_wed",
  cohortTimeSlot: "Mon/Wed Morning (6:30 AM - 7:30 AM)",
  preferredLocation: "Pine Trails Park (Parkland, FL)",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",

  parqJointIssues: false,
  parqChestPain: false,
  parqDizziness: false,
  parqBloodPressure: false,
  parqDetails: "",
  kneeSensitivity: "none",
  lowerBackSensitivity: "none",
  shoulderSensitivity: "none",
  ankleSensitivity: "none",
  grassTurfTolerance: "excellent",
  medicalConditions: "",
  currentMedications: "",

  heatHumidityTolerance: "moderate",
  priorHeatIllness: false,
  hydrationHabits: "64-100 oz/day",
  electrolyteStrategy: "Liquid IV / LMNT Electrolytes",
  outdoorSunAcknowledgment: true,

  cancellationPolicyAcknowledged: false,
  weatherPolicyAcknowledged: false,
  waiverSigned: false,
  waiverSignature: "",
};

const STEPS = [
  { title: "Basics & Logistics", subtitle: "Athlete demographics & cohorts" },
  { title: "PAR-Q+ & Orthopedic", subtitle: "Joint audit & health screening" },
  { title: "Heat & Hydration", subtitle: "South Florida acclimation" },
  { title: "Waiver & Signature", subtitle: "24-hr policy & legal release" },
];

export default function ParkToPeakIntakePage() {
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
  } = useIntakeDraft<ParkToPeakFormData>("park-to-peak", INITIAL_VALUES);

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
      if (!formData.emergencyContactName.trim()) {
        setErrorMessage("Emergency contact name is required.");
        return false;
      }
      if (!formData.emergencyContactPhone.trim() || formData.emergencyContactPhone.trim().length < 7) {
        setErrorMessage("Emergency contact phone number is required.");
        return false;
      }
    }

    if (currentStep === 1) {
      const hasParqPositive =
        formData.parqJointIssues ||
        formData.parqChestPain ||
        formData.parqDizziness ||
        formData.parqBloodPressure;
      if (hasParqPositive && !formData.parqDetails.trim()) {
        setErrorMessage("Please provide brief clinical details regarding your selected health condition.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.cancellationPolicyAcknowledged) {
        setErrorMessage("You must acknowledge the 24-hour session cancellation policy.");
        return false;
      }
      if (!formData.weatherPolicyAcknowledged) {
        setErrorMessage("You must acknowledge the South Florida weather contingency policy.");
        return false;
      }
      if (!formData.waiverSigned) {
        setErrorMessage("You must accept the liability waiver agreement.");
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
        track: "park-to-peak",
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim().toLowerCase(),
        clientPhone: formData.clientPhone.trim(),
        intakeData: {
          practiceCohort: formData.practiceCohort,
          cohortTimeSlot: formData.cohortTimeSlot,
          preferredLocation: formData.preferredLocation,
          age: formData.age || undefined,
          gender: formData.gender,
          emergencyContactName: formData.emergencyContactName.trim(),
          emergencyContactPhone: formData.emergencyContactPhone.trim(),
          emergencyContactRelation: formData.emergencyContactRelation.trim() || undefined,
          parqJointIssues: formData.parqJointIssues,
          parqChestPain: formData.parqChestPain,
          parqDizziness: formData.parqDizziness,
          parqBloodPressure: formData.parqBloodPressure,
          parqDetails: formData.parqDetails.trim() || undefined,
          orthopedicAudit: {
            knees: formData.kneeSensitivity,
            lowerBack: formData.lowerBackSensitivity,
            shoulders: formData.shoulderSensitivity,
            anklesFeet: formData.ankleSensitivity,
            grassTurfTolerance: formData.grassTurfTolerance,
          },
          heatHumidityTolerance: formData.heatHumidityTolerance,
          priorHeatIllness: formData.priorHeatIllness,
          hydrationHabits: formData.hydrationHabits,
          electrolyteStrategy: formData.electrolyteStrategy,
          outdoorSunAcknowledgment: formData.outdoorSunAcknowledgment,
          cancellationPolicyAcknowledged: formData.cancellationPolicyAcknowledged,
          weatherPolicyAcknowledged: formData.weatherPolicyAcknowledged,
          medicalConditions: formData.medicalConditions.trim() || undefined,
          currentMedications: formData.currentMedications.trim() || undefined,
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
        throw new Error(json.error || json.message || "Failed to submit clinical intake form.");
      }

      // Success
      setSubmissionSuccess(true);
      setSubmissionId(json.recordId || json.data?.id || `P2P-${Date.now().toString().slice(-6)}`);
      clearDraft();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      console.error("[ParkToPeak] Submission error:", err);
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
        <div className="glass-panel-lime rounded-3xl p-8 sm:p-10 text-center space-y-6 border border-accent-lime/40 shadow-[0_0_50px_rgba(212,184,126,0.15)] animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-accent-lime text-cyber-slate flex items-center justify-center mx-auto shadow-lg">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent-lime">
              Track A Ingress Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-ice-white font-display">
              Intake & Waiver Successfully Submitted
            </h1>
            <p className="text-xs sm:text-sm text-silver-slate max-w-lg mx-auto leading-relaxed">
              Welcome to the Park-to-Peak Recomp cohort, <strong className="text-ice-white">{formData.clientName}</strong>! Coach Esh has received your orthopedic audit, heat readiness profile, and signed digital waiver.
            </p>
          </div>

          {submissionId && (
            <div className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 inline-block font-mono text-xs text-silver-slate">
              Submission ID: <span className="text-accent-lime font-bold">{submissionId}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#0E0E14] border border-white/5 text-left space-y-2 text-xs text-silver-slate">
            <p className="font-semibold text-ice-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-accent-lime" />
              <span>Next Steps for Your First Practice:</span>
            </p>
            <ul className="space-y-1 pl-5 list-disc text-silver-slate/90">
              <li>You will receive an SMS and email confirmation with cohort parking coordinates.</li>
              <li>Bring a dedicated 32oz+ hydration bottle and athletic turf shoes.</li>
              <li>Arrive 10 minutes early at <strong className="text-ice-white">{formData.preferredLocation}</strong>.</li>
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent-lime text-cyber-slate font-bold text-xs hover:brightness-110 transition-all shadow-md"
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

      {/* Track Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/intake"
              className="text-xs text-silver-slate hover:text-accent-lime flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Tracks</span>
            </Link>
            <span className="text-silver-slate/40">•</span>
            <span className="text-xs font-mono font-semibold text-accent-lime">Track A</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ice-white tracking-tight font-display">
            Park-to-Peak Recomp Clinical Intake
          </h1>
          <p className="text-xs text-silver-slate mt-1">
            Outdoor athletic conditioning • Orthopedic screening • South Florida heat acclimation
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="p-2.5 rounded-2xl bg-accent-lime/10 text-accent-lime border border-accent-lime/20">
            <Dumbbell className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Restored Draft Banner */}
      {hasDraftRestored && (
        <div className="glass-panel-lime rounded-2xl p-4 flex items-center justify-between gap-3 border border-accent-lime/30 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs text-ice-white">
            <RotateCcw className="w-4 h-4 text-accent-lime shrink-0" />
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

      {/* Form Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Multi-Step Form Container */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-8">
        {/* ── STEP 1: Athlete Demographics & Practice Schedule ── */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <User className="w-5 h-5 text-accent-lime" />
                <span>Step 1: Athlete Basics & Cohort Logistics</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Provide your contact details, emergency contact, and preferred outdoor conditioning cohort.
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
                  placeholder="e.g. Michael Henderson"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
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
                  placeholder="michael@example.com"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">
                  Mobile Phone Number <span className="text-accent-violet">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.clientPhone}
                  onChange={(e) => updateFormData({ clientPhone: e.target.value })}
                  placeholder="(561) 555-0192"
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver-slate">Age</label>
                  <input
                    type="number"
                    min="16"
                    max="90"
                    value={formData.age}
                    onChange={(e) => updateFormData({ age: e.target.value })}
                    placeholder="34"
                    className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver-slate">Biological Sex</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateFormData({ gender: e.target.value })}
                    className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cohort Selection Cards */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-silver-slate flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent-lime" />
                <span>Select Cohort Practice Schedule <span className="text-accent-violet">*</span></span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "mon_wed_am",
                    label: "Mon/Wed Morning",
                    time: "6:30 AM - 7:30 AM",
                    cohort: "mon_wed" as const,
                  },
                  {
                    id: "mon_wed_pm",
                    label: "Mon/Wed Evening",
                    time: "5:30 PM - 6:30 PM",
                    cohort: "mon_wed" as const,
                  },
                  {
                    id: "tue_thu_am",
                    label: "Tue/Thu Morning",
                    time: "6:30 AM - 7:30 AM",
                    cohort: "tue_thu" as const,
                  },
                  {
                    id: "tue_thu_pm",
                    label: "Tue/Thu Evening",
                    time: "5:30 PM - 6:30 PM",
                    cohort: "tue_thu" as const,
                  },
                  {
                    id: "sat_open",
                    label: "Saturday Open Conditioning",
                    time: "8:00 AM - 9:15 AM",
                    cohort: "flexible" as const,
                  },
                ].map((item) => {
                  const fullSlot = `${item.label} (${item.time})`;
                  const isSelected = formData.cohortTimeSlot === fullSlot;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        updateFormData({
                          cohortTimeSlot: fullSlot,
                          practiceCohort: item.cohort,
                        })
                      }
                      className={`p-3.5 rounded-2xl text-left border transition-all flex items-start justify-between ${
                        isSelected
                          ? "bg-accent-lime/10 border-accent-lime text-ice-white shadow-[0_0_15px_rgba(212,184,126,0.2)]"
                          : "bg-[#0E0E14] border-white/10 text-silver-slate hover:border-white/20"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-ice-white">{item.label}</p>
                        <p className="text-xs text-accent-lime font-mono mt-0.5">{item.time}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-accent-lime bg-accent-lime text-cyber-slate" : "border-white/20"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-silver-slate flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent-lime" />
                <span>Preferred Outdoor Practice Location</span>
              </label>
              <select
                value={formData.preferredLocation}
                onChange={(e) => updateFormData({ preferredLocation: e.target.value })}
                className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
              >
                <option value="Pine Trails Park (Parkland, FL)">Pine Trails Park (Parkland, FL)</option>
                <option value="Patch Reef Park (Boca Raton, FL)">Patch Reef Park (Boca Raton, FL)</option>
                <option value="Terramar Park (Coral Springs, FL)">Terramar Park (Coral Springs, FL)</option>
                <option value="Merrit Park (Delray Beach, FL)">Merrit Park (Delray Beach, FL)</option>
              </select>
            </div>

            {/* Emergency Contact */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-lime flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <span>Emergency Contact Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-silver-slate">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyContactName}
                    onChange={(e) => updateFormData({ emergencyContactName: e.target.value })}
                    placeholder="e.g. Sarah Henderson"
                    className="w-full bg-[#0E0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:border-accent-lime focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-silver-slate">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.emergencyContactPhone}
                    onChange={(e) => updateFormData({ emergencyContactPhone: e.target.value })}
                    placeholder="(561) 555-0193"
                    className="w-full bg-[#0E0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:border-accent-lime focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-silver-slate">Relationship</label>
                  <input
                    type="text"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => updateFormData({ emergencyContactRelation: e.target.value })}
                    placeholder="Spouse / Sibling"
                    className="w-full bg-[#0E0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:border-accent-lime focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Clinical PAR-Q+ & Orthopedic Joint Audit ── */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-accent-lime" />
                <span>Step 2: Clinical PAR-Q+ & Orthopedic Joint Audit</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Physical Activity Readiness Questionnaire and lower-extremity grass/turf tolerance screening.
              </p>
            </div>

            {/* PAR-Q+ Baseline Questions */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-lime">
                PAR-Q+ Clinical Health Readiness
              </h3>

              {[
                {
                  key: "parqJointIssues" as const,
                  label: "Do you have a bone, joint, or spinal condition that could be aggravated by high-impact outdoor training?",
                },
                {
                  key: "parqChestPain" as const,
                  label: "Do you ever experience chest pain, tightness, or pressure during or after exertion?",
                },
                {
                  key: "parqDizziness" as const,
                  label: "Do you ever lose balance due to dizziness or experience episodes of syncope/fainting?",
                },
                {
                  key: "parqBloodPressure" as const,
                  label: "Are you currently taking prescription medication for blood pressure or a cardiovascular condition?",
                },
              ].map((q) => (
                <div
                  key={q.key}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    formData[q.key]
                      ? "bg-accent-violet/10 border-accent-violet/40"
                      : "bg-[#0E0E14] border-white/5"
                  }`}
                >
                  <p className="text-xs sm:text-sm text-ice-white leading-relaxed">{q.label}</p>
                  <div className="inline-flex rounded-lg p-1 bg-black/40 border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateFormData({ [q.key]: true })}
                      className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                        formData[q.key] ? "bg-accent-violet text-white" : "text-silver-slate hover:text-white"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData({ [q.key]: false })}
                      className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                        !formData[q.key] ? "bg-accent-lime text-cyber-slate" : "text-silver-slate hover:text-white"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              ))}

              {(formData.parqJointIssues ||
                formData.parqChestPain ||
                formData.parqDizziness ||
                formData.parqBloodPressure) && (
                <div className="space-y-1.5 p-4 rounded-2xl bg-accent-violet/5 border border-accent-violet/20 animate-fadeIn">
                  <label className="text-xs font-semibold text-accent-violet flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Clinical Detail for "Yes" Responses (Required)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.parqDetails}
                    onChange={(e) => updateFormData({ parqDetails: e.target.value })}
                    placeholder="Provide details (e.g. diagnosed mild hypertension managed with Lisinopril, prior L5-S1 disc herniation in 2022)."
                    className="w-full bg-[#0E0E14] border border-white/10 rounded-xl p-3 text-xs text-ice-white focus:border-accent-violet focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Orthopedic Joint Audit */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-lime">
                Orthopedic Joint Audit (Grass & Turf Screening)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    key: "kneeSensitivity" as const,
                    label: "Knee Joint Sensitivity (Patellar tracking / meniscus)",
                  },
                  {
                    key: "lowerBackSensitivity" as const,
                    label: "Lower Back / Lumbar Spine Sensitivity",
                  },
                  {
                    key: "shoulderSensitivity" as const,
                    label: "Shoulder / Rotator Cuff Sensitivity",
                  },
                  {
                    key: "ankleSensitivity" as const,
                    label: "Ankles & Feet (Achilles / Plantar fasciitis)",
                  },
                ].map((joint) => (
                  <div key={joint.key} className="space-y-1.5 p-3.5 rounded-2xl bg-[#0E0E14] border border-white/5">
                    <label className="text-xs font-semibold text-silver-slate">{joint.label}</label>
                    <select
                      value={formData[joint.key]}
                      onChange={(e) => updateFormData({ [joint.key]: e.target.value as any })}
                      className="w-full bg-black/40 border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                    >
                      <option value="none">None (Zero pain/stiffness)</option>
                      <option value="mild">Mild (Occasional tightness after workouts)</option>
                      <option value="moderate">Moderate (Requires warm-up modifications)</option>
                      <option value="severe">Severe (Requires strict exercise substitutes)</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Uneven Natural Grass vs. Turf Surface Tolerance
                </label>
                <select
                  value={formData.grassTurfTolerance}
                  onChange={(e) => updateFormData({ grassTurfTolerance: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="excellent">Excellent — Accustomed to sprinting on natural grass</option>
                  <option value="moderate">Moderate — Slight ankle instability on natural turf</option>
                  <option value="limited">Limited — Requires smooth flat surface or turf</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-silver-slate">
                  Past 12-Month Injuries or Surgeries (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.medicalConditions}
                  onChange={(e) => updateFormData({ medicalConditions: e.target.value })}
                  placeholder="e.g. Right ankle inversion sprain 6 months ago; fully cleared."
                  className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl p-3 text-xs text-ice-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: South Florida Heat & Environmental Readiness ── */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-accent-lime" />
                <span>Step 3: South Florida Heat & Environmental Readiness</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Outdoor conditioning in South Florida requires strict hydration discipline and electrolyte autoregulation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Heat & Humidity Tolerance Level
                </label>
                <select
                  value={formData.heatHumidityTolerance}
                  onChange={(e) => updateFormData({ heatHumidityTolerance: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="high">High — Fully acclimated to South Florida summer heat</option>
                  <option value="moderate">Moderate — Acclimated but requires frequent water breaks</option>
                  <option value="low">Low — New to outdoor training in tropical climate</option>
                  <option value="heat_sensitive">Heat Sensitive — Prone to rapid overheating / nausea</option>
                </select>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                <label className="text-xs font-semibold text-silver-slate">
                  Daily Baseline Water Intake
                </label>
                <select
                  value={formData.hydrationHabits}
                  onChange={(e) => updateFormData({ hydrationHabits: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none"
                >
                  <option value="<64 oz/day">Less than 64 oz / day (~2 liters)</option>
                  <option value="64-100 oz/day">64 to 100 oz / day (~2-3 liters)</option>
                  <option value="100-128 oz/day">100 to 128 oz / day (~1 gallon)</option>
                  <option value="128+ oz/day">128+ oz / day (1+ gallon disciplined)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E0E14] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-ice-white">
                    Prior History of Heat Illness or Severe Cramping?
                  </p>
                  <p className="text-[11px] text-silver-slate">
                    Heat exhaustion, heat stroke, or debilitating calf/hamstring cramps during outdoor exertion.
                  </p>
                </div>
                <div className="inline-flex rounded-lg p-1 bg-black/40 border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateFormData({ priorHeatIllness: true })}
                    className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                      formData.priorHeatIllness ? "bg-accent-violet text-white" : "text-silver-slate hover:text-white"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData({ priorHeatIllness: false })}
                    className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                      !formData.priorHeatIllness ? "bg-accent-lime text-cyber-slate" : "text-silver-slate hover:text-white"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-silver-slate">
                Electrolyte Supplementation Strategy
              </label>
              <select
                value={formData.electrolyteStrategy}
                onChange={(e) => updateFormData({ electrolyteStrategy: e.target.value })}
                className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none"
              >
                <option value="Liquid IV / LMNT Electrolytes">Daily LMNT / Liquid IV / Redmond Salt</option>
                <option value="Coconut Water / Natural Fruit">Natural hydration (Coconut water, citrus, fruits)</option>
                <option value="Plain Water Only">Plain water only (No electrolytes currently)</option>
                <option value="Coach Esh Protocol Needed">I would like Coach Esh to prescribe an electrolyte protocol</option>
              </select>
            </div>

            {/* Outdoor Readiness Commitment */}
            <label className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3 cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.outdoorSunAcknowledgment}
                onChange={(e) => updateFormData({ outdoorSunAcknowledgment: e.target.checked })}
                className="mt-0.5 rounded border-white/20 text-accent-lime focus:ring-accent-lime bg-[#0E0E14] w-4 h-4"
              />
              <span className="text-xs text-silver-slate leading-relaxed">
                I acknowledge that sessions occur outdoors in Parkland, Boca Raton, and Delray Beach parks. I agree to bring adequate hydration (32oz+ cold water), apply sunscreen as needed, and alert Coach Esh immediately if experiencing lightheadedness or heat discomfort.
              </span>
            </label>
          </div>
        )}

        {/* ── STEP 4: 24-Hr Policy, Weather Release & Digital Signature ── */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-ice-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-lime" />
                <span>Step 4: Policies, Liability Waiver & Digital Signature</span>
              </h2>
              <p className="text-xs text-silver-slate mt-1">
                Please review our 24-hour attendance policy, South Florida storm contingencies, and sign your clinical waiver.
              </p>
            </div>

            {/* Policy Checkboxes */}
            <div className="space-y-3">
              <label
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  formData.cancellationPolicyAcknowledged
                    ? "bg-accent-lime/10 border-accent-lime/40"
                    : "bg-[#0E0E14] border-white/10 hover:border-white/20"
                }`}
              >
                <input
                  type="checkbox"
                  required
                  checked={formData.cancellationPolicyAcknowledged}
                  onChange={(e) =>
                    updateFormData({ cancellationPolicyAcknowledged: e.target.checked })
                  }
                  className="mt-0.5 rounded border-white/20 text-accent-lime focus:ring-accent-lime bg-black/40 w-4 h-4 shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-ice-white">24-Hour Cancellation Policy</p>
                  <p className="text-silver-slate leading-relaxed">
                    To respect cohort capacity and coaching readiness, session cancellations or cohort switches require at least 24 hours prior notice. Unannounced absences forfeit the session credit.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  formData.weatherPolicyAcknowledged
                    ? "bg-accent-lime/10 border-accent-lime/40"
                    : "bg-[#0E0E14] border-white/10 hover:border-white/20"
                }`}
              >
                <input
                  type="checkbox"
                  required
                  checked={formData.weatherPolicyAcknowledged}
                  onChange={(e) =>
                    updateFormData({ weatherPolicyAcknowledged: e.target.checked })
                  }
                  className="mt-0.5 rounded border-white/20 text-accent-lime focus:ring-accent-lime bg-black/40 w-4 h-4 shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-ice-white">South Florida Weather & Lightning Contingency</p>
                  <p className="text-silver-slate leading-relaxed">
                    In cases of severe tropical thunderstorms or active lightning within 8 miles, sessions will relocate to covered park pavilions or be rescheduled via SMS announcement at least 45 minutes prior.
                  </p>
                </div>
              </label>
            </div>

            {/* Legal Liability Scroll Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-silver-slate">
                Physical Activity Liability & Voluntary Assumption of Risk
              </label>
              <div className="h-32 rounded-xl bg-[#0A0A0F] border border-white/10 p-3.5 overflow-y-auto text-[11px] text-silver-slate/80 leading-relaxed font-mono space-y-2">
                <p>
                  <strong>VOLUNTARY RELEASE AND WAIVER OF LIABILITY:</strong> I hereby affirm that I am voluntarily participating in outdoor physical conditioning, agility drills, and strength training conducted by Bodied by Esh LLC. I acknowledge that physical exercise involves inherent risks including, but not limited to, muscle strains, joint injuries, cardiovascular stress, and environmental heat exposure.
                </p>
                <p>
                  I declare that I have disclosed all known orthopedic limitations, medical conditions, and cardiovascular histories honestly. I assume full responsibility for my own safety and release Bodied by Esh LLC, Coach Esh, and park venues from liability for accidental injury arising during standard training protocols.
                </p>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.waiverSigned}
                  onChange={(e) => updateFormData({ waiverSigned: e.target.checked })}
                  className="rounded border-white/20 text-accent-lime focus:ring-accent-lime bg-[#0E0E14] w-4 h-4"
                />
                <span className="text-xs font-semibold text-ice-white">
                  I have read, understood, and accept the liability waiver agreement. <span className="text-accent-violet">*</span>
                </span>
              </label>
            </div>

            {/* Digital Signature Pad */}
            <div className="pt-2 border-t border-white/5">
              <SignaturePad
                value={formData.waiverSignature}
                onChange={(sig) => updateFormData({ waiverSignature: sig })}
                label="Athlete Legal Signature"
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-lime text-cyber-slate font-bold text-xs hover:brightness-110 transition-all shadow-md"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent-lime text-cyber-slate font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_25px_rgba(212,184,126,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Clinical Intake...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Digital Intake</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
