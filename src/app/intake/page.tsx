"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Dumbbell,
  Activity,
  Flame,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
  ExternalLink,
  X,
  ArrowRight,
  Clock,
  MapPin,
  Lock,
} from "lucide-react";
import { TrackCard } from "@/components/intake/TrackCard";
import { Toast } from "@/components/intake/Toast";

interface TrackPreviewData {
  id: string;
  title: string;
  badge: string;
  href: string;
  steps: {
    number: number;
    title: string;
    description: string;
    fields: string[];
  }[];
}

const PREVIEW_DATA: Record<string, TrackPreviewData> = {
  "park-to-peak": {
    id: "park-to-peak",
    title: "Track A: Park-to-Peak Recomp",
    badge: "Track A • On-Site Cohort",
    href: "/intake/park-to-peak",
    steps: [
      {
        number: 1,
        title: "Athlete Basics & Cohort Selection",
        description: "Demographics, emergency contacts, and practice schedule preferences.",
        fields: [
          "Full Name, Email & Phone Number",
          "Practice Cohort (Mon/Wed Morning/Evening, Tue/Thu, Saturday Open)",
          "Preferred Location (Pine Trails Park, Patch Reef, Terramar)",
          "Emergency Contact Name & Phone",
        ],
      },
      {
        number: 2,
        title: "Clinical PAR-Q+ & Orthopedic Joint Audit",
        description: "Physical activity readiness screening and joint sensitivity evaluation.",
        fields: [
          "7-Point PAR-Q+ Clinical Health Screening",
          "Grass vs. Turf Uneven Surface Tolerance",
          "Spinal & Lower Chain Audit (Lumbar, Knee, Ankle, Shoulders)",
          "Past 12-Month Surgical & Injury History",
        ],
      },
      {
        number: 3,
        title: "South Florida Heat & Environmental Readiness",
        description: "Hydration baselines and tropical outdoor acclimation protocols.",
        fields: [
          "Heat Illness & Severe Cramping History",
          "Daily Hydration Volume (<64 oz, 64-100 oz, 100+ oz)",
          "Electrolyte Supplementation Strategy (LMNT, Liquid IV)",
          "Sun & Outdoor Athletic Gear Acknowledgment",
        ],
      },
      {
        number: 4,
        title: "24-Hr Weather Waiver & Digital Signature",
        description: "Inclement weather contingency protocols and binding legal release.",
        fields: [
          "24-Hour Cancellation Policy Release",
          "South Florida Lightning & Rain Contingency Protocol",
          "Physical Activity Liability Waiver",
          "Digital Signature Canvas & Legal Timestamp",
        ],
      },
    ],
  },
  "executive-concierge": {
    id: "executive-concierge",
    title: "Track B: Executive Concierge",
    badge: "Track B • Remote Concierge",
    href: "/intake/executive-concierge",
    steps: [
      {
        number: 1,
        title: "Executive Profile & Remote Work Cadence",
        description: "Professional constraints, weekly workload, and performance obstacles.",
        fields: [
          "Full Name, Email, Phone, Industry & Role",
          "Time Zone & Workload (>55+ hrs/week screening)",
          "Primary Performance Bottleneck (Time, Travel, Sleep, Diet)",
        ],
      },
      {
        number: 2,
        title: "Biotelemetry & Wearable Ecosystem",
        description: "Integration with smart health devices for real-time physiological telemetry.",
        fields: [
          "Wearables (Oura Ring, Whoop 4.0, Apple Watch Ultra, Garmin)",
          "Resting Heart Rate & Baseline HRV Tracking (ms)",
          "Average Sleep Duration & Sleep Score Ratings",
          "Daily Cognitive Energy & Subjective Fatigue Scaling",
        ],
      },
      {
        number: 3,
        title: "Sedentary Desk Ergonomics & Postural Health",
        description: "Targeting cervical spine compression, anterior pelvic tilt, and hip flexors.",
        fields: [
          "Daily Sitting Time Screening (4-12+ hrs/day)",
          "Cervical Spine Tension & Tech Neck Symptoms",
          "Anterior Pelvic Tilt & Tight Psoas Audit",
          "Workstation Setup (Standing desk, walking treadmill)",
        ],
      },
      {
        number: 4,
        title: "Executive Travel & Dining Cadence",
        description: "Managing hotel training, catered dining, and business entertainment.",
        fields: [
          "Flight & Travel Frequency (Weekly to Monthly)",
          "Business Dinners & Restaurant Dining Cadence",
          "Alcohol & Social Beverage Intake (drinks/week)",
          "Hotel Gym vs. Resistance Band Preferences",
        ],
      },
      {
        number: 5,
        title: "Dynamic Recovery Waiver & Signature",
        description: "Autoregulation agreement and remote asynchronous coaching consent.",
        fields: [
          "Dynamic Recovery Protocol Volume Auto-Downscaling Consent",
          "Asynchronous Video Check-in & Telemetry Sharing Release",
          "Digital Signature Canvas & Legal Timestamp",
        ],
      },
    ],
  },
  "nutrition-metabolic": {
    id: "nutrition-metabolic",
    title: "Track C: Nutrition & Metabolic Health",
    badge: "Track C • Metabolic Blueprint",
    href: "/intake/nutrition-metabolic",
    steps: [
      {
        number: 1,
        title: "Anthropometrics & Mifflin-St Jeor Calculation",
        description: "Dynamic client-side metabolic baseline and energy expenditure calculation.",
        fields: [
          "Biological Sex, Age, Height & Current/Target Weight",
          "Activity Multiplier & Estimated Body Fat %",
          "Live Mifflin-St Jeor BMR & TDEE Preview Engine",
        ],
      },
      {
        number: 2,
        title: "High-Performance Protein & Macro Blueprint",
        description: "Optimizing macronutrient distribution and food preferences.",
        fields: [
          "Target Protein Acknowledgment (~2.2g/kg or 1.0g/lb)",
          "Dietary Framework (Omnivore, Pescatarian, Keto, Plant-Based)",
          "Strict Food Allergies & Intolerances",
          "Excluded / Disliked Foods Listing",
        ],
      },
      {
        number: 3,
        title: "GI Health & Behavioral Eating Triggers",
        description: "Investigating gut motility, late-night triggers, and hydration.",
        fields: [
          "Bloating, Acid Reflux & Gut Motility Audit",
          "Behavioral Triggers (Late-night snacking, stress cravings)",
          "Daily Hydration & Caffeine Intake Baselines",
          "Current Supplement Stack (Creatine, Whey, Electrolytes)",
        ],
      },
      {
        number: 4,
        title: "AI Plate Scanner & 3D Mesh Consent",
        description: "Vision AI meal logging and privacy-preserved body composition scanning.",
        fields: [
          "AI Meal Plate Scanner Optical Onboarding",
          "Privacy-Preserved 3D Mesh Opt-In Consent",
          "7-Day Food Journaling Commitment",
          "Digital Signature Canvas & Legal Timestamp",
        ],
      },
    ],
  },
};

export default function IntakeHubPage() {
  const [toast, setToast] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const [previewTrack, setPreviewTrack] = useState<TrackPreviewData | null>(null);

  const handleCopyLink = (trackHref: string, trackTitle: string) => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = `${origin}${trackHref}`;

      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(fullUrl);
      }

      setToast({
        isOpen: true,
        title: "Direct Share Link Copied",
        message: `${trackTitle} canonical link copied to clipboard (${fullUrl})`,
      });
    } catch (err) {
      console.warn("Failed to copy link to clipboard", err);
      setToast({
        isOpen: true,
        title: "Link Copied",
        message: `Direct link: ${trackHref}`,
      });
    }
  };

  return (
    <div className="page-container max-w-6xl mx-auto space-y-12">
      {/* Toast Feedback */}
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs font-mono font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Clinical Ingress Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-ice-white tracking-tight font-display">
          Digital Clinical Client Intake Hub
        </h1>

        <p className="text-sm sm:text-base text-silver-slate leading-relaxed">
          Select your customized high-performance intake pathway or copy direct canonical links for instant athlete onboarding. All clinical data is encrypted and synced directly to Coach Esh’s portal.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-silver-slate">
            <Lock className="w-3.5 h-3.5 text-accent-lime" />
            <span>End-to-End Encrypted</span>
          </div>
          <span className="text-silver-slate/40">•</span>
          <div className="flex items-center gap-2 text-xs text-silver-slate">
            <Clock className="w-3.5 h-3.5 text-accent-lime" />
            <span>Auto-Saving Drafts</span>
          </div>
          <span className="text-silver-slate/40">•</span>
          <div className="flex items-center gap-2 text-xs text-silver-slate">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-lime" />
            <span>Digital Signature Verified</span>
          </div>
        </div>
      </div>

      {/* 3 Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* Track A */}
        <TrackCard
          trackId="park-to-peak"
          badge="Track A • On-Site Cohort"
          title="Park-to-Peak Recomp"
          subtitle="Outdoor Athletic Conditioning"
          price="$249/mo • South Florida Outdoor Cohorts"
          description="High-intensity outdoor functional conditioning and athletic body recomposition designed for South Florida athletes."
          features={[
            "Mon/Wed vs. Tue/Thu morning & evening cohorts",
            "Clinical PAR-Q+ orthopedic joint audits",
            "Grass vs. turf uneven surface tolerance screening",
            "South Florida heat & 24-hr weather waivers",
          ]}
          icon={Dumbbell}
          accentColor="lime"
          href="/intake/park-to-peak"
          onCopyLink={handleCopyLink}
          onPreview={() => setPreviewTrack(PREVIEW_DATA["park-to-peak"])}
        />

        {/* Track B */}
        <TrackCard
          trackId="executive-concierge"
          badge="Track B • Remote Concierge"
          title="Executive Concierge"
          subtitle="Remote High-Performance Architecture"
          price="$499/mo • Global 1-on-1 Biotelemetry"
          description="Precision executive physical conditioning, biotelemetry data integration, posture restoration, and travel autoregulation."
          features={[
            "Oura, Whoop, Apple Watch & Garmin sync",
            "Resting HR, HRV & CNS recovery autoregulation",
            "Cervical spine & anterior pelvic tilt desk audit",
            "Frequent flyer & business dining protocols",
          ]}
          icon={Activity}
          accentColor="purple"
          href="/intake/executive-concierge"
          onCopyLink={handleCopyLink}
          onPreview={() => setPreviewTrack(PREVIEW_DATA["executive-concierge"])}
        />

        {/* Track C */}
        <TrackCard
          trackId="nutrition-metabolic"
          badge="Track C • Metabolic Blueprint"
          title="Nutrition & Metabolic Health"
          subtitle="Custom Macro & Metabolic Recomp"
          price="Precision Macro Programming & AI Vision"
          description="Clinical metabolic engineering, dynamic Mifflin-St Jeor energy calculations, high-protein protocols, and AI vision meal logging."
          features={[
            "Live Mifflin-St Jeor BMR & TDEE preview",
            "High-performance ~2.2g/kg protein prescription",
            "GI symptoms & behavioral food trigger audit",
            "AI Meal Plate Scanner & 3D mesh consent",
          ]}
          icon={Flame}
          accentColor="amber"
          href="/intake/nutrition-metabolic"
          onCopyLink={handleCopyLink}
          onPreview={() => setPreviewTrack(PREVIEW_DATA["nutrition-metabolic"])}
        />
      </div>

      {/* Coach Esh Quick Overview Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-accent-lime/5 via-transparent to-accent-violet/5">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-accent-lime uppercase tracking-wider">
            <ClipboardList className="w-4 h-4" />
            <span>Coach Review Operations</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ice-white">
            Admin Intake Dashboard & Clinical Review
          </h2>
          <p className="text-xs sm:text-sm text-silver-slate max-w-xl">
            Access submitted athlete intakes, view digitized legal signatures, examine orthopedic alerts, and transition athletes directly into active coaching.
          </p>
        </div>

        <Link
          href="/admin/intakes"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0E0E14] hover:bg-white/10 border border-white/15 text-sm font-bold text-ice-white transition-all hover:border-accent-lime/40 shrink-0"
        >
          <span>Open Coach Portal</span>
          <ExternalLink className="w-4 h-4 text-accent-lime" />
        </Link>
      </div>

      {/* Preview Modal Overlay */}
      {previewTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col bg-[#0A0A0F]/95 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-accent-lime uppercase tracking-wider">
                  {previewTrack.badge}
                </span>
                <h3 className="text-xl font-bold text-ice-white mt-1">{previewTrack.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTrack(null)}
                aria-label="Close preview"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-silver-slate hover:text-ice-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <p className="text-xs text-silver-slate">
                Below is a clinical overview of the multi-step intake process and data points captured for this track.
              </p>

              <div className="space-y-4">
                {previewTrack.steps.map((step) => (
                  <div
                    key={step.number}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-accent-lime/15 text-accent-lime font-mono text-xs font-bold flex items-center justify-center">
                        {step.number}
                      </span>
                      <h4 className="text-sm font-bold text-ice-white">{step.title}</h4>
                    </div>
                    <p className="text-xs text-silver-slate pl-8">{step.description}</p>
                    <ul className="pl-8 pt-1 space-y-1">
                      {step.fields.map((field, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2 text-xs text-silver-slate/90">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-lime shrink-0" />
                          <span>{field}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-white/10 bg-[#0E0E14] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopyLink(previewTrack.href, previewTrack.title)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-silver-slate hover:text-ice-white border border-white/10 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Copy Share URL</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPreviewTrack(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-silver-slate hover:text-ice-white transition-colors"
                >
                  Close
                </button>
                <Link
                  href={previewTrack.href}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent-lime text-cyber-slate font-bold text-xs hover:brightness-110 transition-all shadow-md"
                >
                  <span>Launch Live Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
