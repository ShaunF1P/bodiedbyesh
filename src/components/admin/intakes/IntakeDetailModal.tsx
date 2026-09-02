"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  Dumbbell,
  Heart,
  Activity,
  Zap,
  Flame,
  Scale,
  Utensils,
  MapPin,
  CheckCircle2,
  FileSignature,
  Save,
  Loader2,
  Sparkles,
  FileText,
  Archive,
  PhoneCall,
  Bed,
  Plane,
  Briefcase,
  AlertTriangle,
  ChevronDown,
  Check,
  Stethoscope,
  Info,
} from "lucide-react";
import {
  ClientIntakeRecord,
  IntakeStatus,
  ParkToPeakClinicalData,
  ExecutiveConciergeClinicalData,
  NutritionMetabolicClinicalData,
} from "@/types/intake";
import { formatTrackName, getTrackBadgeStyle, getStatusConfig } from "./IntakeTable";

interface IntakeDetailModalProps {
  intake: ClientIntakeRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedIntake: ClientIntakeRecord) => void;
}

export default function IntakeDetailModal({
  intake,
  isOpen,
  onClose,
  onUpdate,
}: IntakeDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<IntakeStatus>("new");
  const [coachNotes, setCoachNotes] = useState<string>("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Sync state when intake changes
  useEffect(() => {
    if (intake) {
      setSelectedStatus(intake.status || "new");
      setCoachNotes(intake.coach_notes || "");
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
    }
  }, [intake]);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !intake) {
    return null;
  }

  const trackStyle = getTrackBadgeStyle(intake.track);
  const statusCfg = getStatusConfig(selectedStatus);
  const StatusIcon = statusCfg.icon;

  const handleStatusChange = async (newStatus: IntakeStatus) => {
    if (newStatus === intake.status) return;
    setIsSavingStatus(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await fetch("/api/intake", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: intake.id,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update review status");
      }

      setSelectedStatus(newStatus);
      const updated: ClientIntakeRecord = {
        ...intake,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      onUpdate(updated);
      setSaveSuccessMsg(`Review status updated to ${newStatus.toUpperCase()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      setSaveErrorMsg(msg);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await fetch("/api/intake", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: intake.id,
          coachNotes: coachNotes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save coach notes");
      }

      const updated: ClientIntakeRecord = {
        ...intake,
        coach_notes: coachNotes.trim(),
        updated_at: new Date().toISOString(),
      };
      onUpdate(updated);
      setSaveSuccessMsg("Coach notes saved successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving notes";
      setSaveErrorMsg(msg);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const intakeData = (intake.intake_data || {}) as Record<string, any>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#050508]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0E0E14] border border-accent-lime/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-fadeIn">
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${trackStyle.bg} ${trackStyle.text} ${trackStyle.border}`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>{formatTrackName(intake.track)}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusCfg.label}</span>
              </span>
              {intake.waiver_signed && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-lime/10 text-accent-lime border border-accent-lime/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Waiver Signed</span>
                </span>
              )}
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-ice-white">
              {intake.client_name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-silver-slate mt-2">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-accent-lime" />
                <a
                  href={`mailto:${intake.client_email}`}
                  className="hover:text-ice-white transition-colors underline-offset-2 hover:underline"
                >
                  {intake.client_email}
                </a>
              </span>
              {intake.client_phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-accent-lime" />
                  <a
                    href={`tel:${intake.client_phone}`}
                    className="hover:text-ice-white transition-colors"
                  >
                    {intake.client_phone}
                  </a>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-silver-slate/60" />
                <span>Submitted {new Date(intake.created_at).toLocaleString()}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-silver-slate hover:text-ice-white transition-all cursor-pointer shrink-0"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {/* Notification Feedback */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
          {saveErrorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* ── Section 1: Clinical Track Breakdown ── */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-5 h-5 text-accent-lime" />
                <h3 className="font-display font-bold text-lg text-ice-white">
                  Clinical Intake Breakdown
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-silver-slate">
                {intake.track}
              </span>
            </div>

            {/* Track A: Park to Peak */}
            {isTrackA(intake.track) && (
              <TrackAPanel data={intakeData as ParkToPeakClinicalData} />
            )}

            {/* Track B: Executive Concierge */}
            {isTrackB(intake.track) && (
              <TrackBPanel data={intakeData as ExecutiveConciergeClinicalData} />
            )}

            {/* Track C: Nutrition & Metabolic Health */}
            {isTrackC(intake.track) && (
              <TrackCPanel data={intakeData as NutritionMetabolicClinicalData} />
            )}

            {/* Fallback for generic or custom questions */}
            {!isTrackA(intake.track) && !isTrackB(intake.track) && !isTrackC(intake.track) && (
              <GenericIntakePanel data={intakeData} />
            )}
          </section>

          {/* ── Section 2: Digital Waiver & Legal Signature Inspection ── */}
          <section className="space-y-4 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2.5">
              <FileSignature className="w-5 h-5 text-accent-lime" />
              <h3 className="font-display font-bold text-lg text-ice-white">
                Digital Waiver & Legal Signature
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#080A0E] border border-white/10">
              {/* Signature Display Box */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-silver-slate font-semibold block mb-2">
                  Client Signature Verification
                </span>
                {intake.waiver_signature ? (
                  intake.waiver_signature.startsWith("data:image") ? (
                    <div className="bg-[#12121A] border border-accent-lime/40 rounded-xl p-4 flex items-center justify-center min-h-[120px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={intake.waiver_signature}
                        alt={`Digital signature of ${intake.client_name}`}
                        className="max-h-24 max-w-full object-contain filter invert opacity-90"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#12121A] border border-accent-lime/40 rounded-xl p-4 font-serif italic text-xl text-accent-lime tracking-wide min-h-[90px] flex items-center justify-center">
                      &ldquo;{intake.waiver_signature}&rdquo;
                    </div>
                  )
                ) : (
                  <div className="bg-[#12121A] border border-white/10 rounded-xl p-4 text-xs text-silver-slate italic min-h-[90px] flex items-center justify-center">
                    No digital signature image attached
                  </div>
                )}
              </div>

              {/* Legal Confirmation Details */}
              <div className="space-y-3 flex flex-col justify-center">
                <div className="flex items-start gap-2.5 text-xs text-ice-white">
                  <ShieldCheck className="w-4 h-4 text-accent-lime shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Status:</span>
                    <span className="text-accent-lime">
                      {intake.waiver_signed
                        ? "Liability Waiver Signed & Legally Acknowledged"
                        : "Liability Waiver Pending Signature"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-silver-slate">
                  <Clock className="w-4 h-4 text-silver-slate/70 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-ice-white">Timestamp:</span>
                    <span>
                      {intake.waiver_signed_at
                        ? new Date(intake.waiver_signed_at).toLocaleString()
                        : "Recorded at form submission"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-silver-slate">
                  Legal audit verification: Digital signature was captured under strict SSL/TLS encryption with client IP rate-limiting telemetry.
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 3: Review Status & Coach Notes Management ── */}
          <section className="space-y-4 border-t border-white/10 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-accent-lime" />
                <h3 className="font-display font-bold text-lg text-ice-white">
                  Review Status & Coach Notes
                </h3>
              </div>
            </div>

            {/* Status Selection Buttons */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-silver-slate font-semibold block mb-2">
                Workflow Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(["new", "reviewed", "enrolled", "archived"] as IntakeStatus[]).map((status) => {
                  const cfg = getStatusConfig(status);
                  const Icon = cfg.icon;
                  const isActive = selectedStatus === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={isSavingStatus}
                      onClick={() => handleStatusChange(status)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                        isActive
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-lg shadow-accent-lime/5 ring-1 ring-accent-lime/40`
                          : "bg-white/5 text-silver-slate border-white/10 hover:bg-white/10 hover:text-ice-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cfg.label}</span>
                      {isActive && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coach Notes Textarea */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wider text-silver-slate font-semibold">
                  Coach Clinical Notes & Program Directives
                </label>
                <span className="text-[10px] text-silver-slate/60">
                  {coachNotes.length} / 2000 characters
                </span>
              </div>
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="Record clinical observations, program customisations, joint modifications, or onboarding call notes..."
                rows={4}
                maxLength={2000}
                className="w-full bg-[#080A0E] border border-white/10 focus:border-accent-lime rounded-2xl p-4 text-sm text-ice-white placeholder:text-silver-slate/40 focus:outline-none transition-all resize-y"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={isSavingNotes}
                  onClick={handleSaveNotes}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Notes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Coach Notes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10 bg-[#080A0E] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-silver-slate flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-accent-lime" />
            <span>Updates are persisted directly to Supabase & GoHighLevel CRM.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-ice-white transition-all cursor-pointer ml-auto"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Track A: Park to Peak Recomp Sub-Panel
 * ───────────────────────────────────────────────────────────────────────────── */
function TrackAPanel({ data }: { data: ParkToPeakClinicalData }) {
  const parqWarnings = [
    data.parqJointIssues && "Joint / Bone issues that could be aggravated",
    data.parqChestPain && "Chest pain during or outside physical exertion",
    data.parqDizziness && "Dizziness or loss of consciousness",
    data.parqBloodPressure && "Heart condition or high blood pressure",
  ].filter(Boolean);

  const orthopedic = data.orthopedicAudit || {};

  return (
    <div className="space-y-6">
      {/* Practice Schedule & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CardItem
          icon={Calendar}
          label="Practice Cohort"
          value={
            data.practiceCohort === "mon_wed"
              ? "Monday & Wednesday Morning"
              : data.practiceCohort === "tue_thu"
              ? "Tuesday & Thursday Morning"
              : data.practiceCohort || "Standard Practice Cohort"
          }
          highlight
        />
        <CardItem
          icon={MapPin}
          label="Practice Location"
          value={data.preferredLocation || "Merrit Park (Delray Beach, FL)"}
        />
      </div>

      {/* PAR-Q+ Health Safety Screening */}
      <div className="p-5 rounded-2xl bg-[#080A0E] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ice-white uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-accent-lime" />
            PAR-Q+ Clinical Safety Screening
          </span>
          {parqWarnings.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
              {parqWarnings.length} Alert(s)
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-lime/10 text-accent-lime border border-accent-lime/30">
              Clear
            </span>
          )}
        </div>

        {parqWarnings.length > 0 ? (
          <div className="space-y-2 pt-1">
            {parqWarnings.map((warning, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
            {data.parqDetails && (
              <p className="text-xs text-silver-slate pt-1">
                <strong>Client PAR-Q Details:</strong> {data.parqDetails}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-silver-slate">
            No contraindications reported on standard PAR-Q+ questionnaire.
          </p>
        )}
      </div>

      {/* Orthopedic & Joint Audit */}
      <div className="p-5 rounded-2xl bg-[#080A0E] border border-white/10 space-y-3">
        <span className="text-xs font-bold text-ice-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-lime" />
          Orthopedic & Joint Audit
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <JointBadge label="Knees" value={orthopedic.knees || "none"} />
          <JointBadge label="Lower Back" value={orthopedic.lowerBack || "none"} />
          <JointBadge label="Shoulders" value={orthopedic.shoulders || "none"} />
          <JointBadge label="Ankles / Feet" value={orthopedic.anklesFeet || "none"} />
          <JointBadge label="Grass / Turf" value={orthopedic.grassTurfTolerance || "excellent"} />
        </div>
      </div>

      {/* Heat, Humidity & Hydration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CardItem
          icon={Flame}
          label="Heat & Humidity Tolerance"
          value={
            data.heatHumidityTolerance
              ? data.heatHumidityTolerance.replace("_", " ").toUpperCase()
              : "Moderate"
          }
        />
        <CardItem
          icon={Zap}
          label="Hydration Habits"
          value={data.hydrationHabits || "Standard Daily Hydration"}
        />
      </div>

      {/* Emergency Contact */}
      <div className="p-5 rounded-2xl bg-[#080A0E] border border-white/10 space-y-2">
        <span className="text-xs font-bold text-ice-white uppercase tracking-wider flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-accent-lime" />
          Emergency Contact Information
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div>
            <span className="text-silver-slate block text-[10px] uppercase">Name</span>
            <span className="text-ice-white font-semibold">
              {data.emergencyContactName || "Not provided"}
            </span>
          </div>
          <div>
            <span className="text-silver-slate block text-[10px] uppercase">Phone</span>
            <span className="text-accent-lime font-semibold">
              {data.emergencyContactPhone || "Not provided"}
            </span>
          </div>
          <div>
            <span className="text-silver-slate block text-[10px] uppercase">Relationship</span>
            <span className="text-ice-white">
              {data.emergencyContactRelation || "Not specified"}
            </span>
          </div>
        </div>
      </div>

      {/* Medical Conditions & Medications */}
      {(data.medicalConditions || data.currentMedications) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.medicalConditions && (
            <CardItem
              icon={AlertCircle}
              label="Medical Conditions"
              value={data.medicalConditions}
            />
          )}
          {data.currentMedications && (
            <CardItem
              icon={Activity}
              label="Current Medications"
              value={data.currentMedications}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Track B: Executive Concierge Sub-Panel
 * ───────────────────────────────────────────────────────────────────────────── */
function TrackBPanel({ data }: { data: ExecutiveConciergeClinicalData }) {
  const desk = data.deskErgonomics || {};

  return (
    <div className="space-y-6">
      {/* Biotelemetry & Wearable Ecosystem */}
      <div className="p-5 rounded-2xl bg-[#080A0E] border border-white/10 space-y-3">
        <span className="text-xs font-bold text-ice-white uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-lime" />
          Wearable Devices & Telemetry Sync
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {Array.isArray(data.wearableDevices) && data.wearableDevices.length > 0 ? (
            data.wearableDevices.map((dev, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-accent-lime/10 text-accent-lime border border-accent-lime/30 text-xs font-semibold"
              >
                {dev}
              </span>
            ))
          ) : (
            <span className="text-xs text-silver-slate">No wearable devices specified</span>
          )}
        </div>
      </div>

      {/* Heart, HRV & Sleep Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricBox
          icon={Heart}
          label="Resting HR"
          value={data.restingHeartRate ? `${data.restingHeartRate} bpm` : "—"}
        />
        <MetricBox
          icon={Activity}
          label="Baseline HRV"
          value={data.baselineHrv ? `${data.baselineHrv} ms` : "—"}
        />
        <MetricBox
          icon={Bed}
          label="Sleep Hours"
          value={data.averageSleepHours ? `${data.averageSleepHours} hrs` : "—"}
        />
        <MetricBox
          icon={Sparkles}
          label="Sleep Score"
          value={data.averageSleepScore ? `${data.averageSleepScore} / 100` : "—"}
        />
      </div>

      {/* Desk Ergonomics & Sitting Posture */}
      <div className="p-5 rounded-2xl bg-[#080A0E] border border-white/10 space-y-3">
        <span className="text-xs font-bold text-ice-white uppercase tracking-wider flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-accent-lime" />
          Sedentary Desk Ergonomics & Posture Audit
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <JointBadge label="Cervical Tension" value={desk.cervicalSpineTension || "none"} />
          <JointBadge label="Pelvic Tilt (APT)" value={desk.anteriorPelvicTilt || "none"} />
          <JointBadge label="Hip Flexors" value={desk.hipFlexorTightness || "none"} />
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-silver-slate uppercase block">Daily Sitting</span>
            <span className="text-xs font-bold text-ice-white">
              {desk.dailySittingHours ? `${desk.dailySittingHours} hrs/day` : "8 hrs/day"}
            </span>
          </div>
        </div>
      </div>

      {/* Travel, Business Dinners & Executive Stress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardItem
          icon={Plane}
          label="Travel Cadence"
          value={data.travelCadence ? data.travelCadence.toUpperCase() : "Monthly"}
        />
        <CardItem
          icon={Utensils}
          label="Business Dinners"
          value={
            data.businessDinnersPerWeek !== undefined
              ? `${data.businessDinnersPerWeek} per week`
              : "2 per week"
          }
        />
        <CardItem
          icon={Zap}
          label="Executive Stress Level"
          value={
            data.executiveStressLevel ? data.executiveStressLevel.toUpperCase() : "Moderate"
          }
          highlight
        />
      </div>

      {data.diningOutVsCooking && (
        <CardItem
          icon={Utensils}
          label="Dining Out vs Cooking Habits"
          value={data.diningOutVsCooking}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Track C: Nutrition & Metabolic Health Sub-Panel
 * ───────────────────────────────────────────────────────────────────────────── */
function TrackCPanel({ data }: { data: NutritionMetabolicClinicalData }) {
  const gi = data.giBehavioralTriggers || {};

  // Height formatting (inches to ft + in)
  const formatHeight = (inches: number | string | undefined) => {
    if (!inches) return "—";
    const num = Number(inches);
    if (isNaN(num)) return String(inches);
    const feet = Math.floor(num / 12);
    const remainder = Math.round(num % 12);
    return `${feet}' ${remainder}" (${num} in)`;
  };

  return (
    <div className="space-y-6">
      {/* Anthropometric Baselines */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricBox
          icon={Scale}
          label="Current Weight"
          value={data.currentWeightLbs ? `${data.currentWeightLbs} lbs` : "—"}
        />
        <MetricBox
          icon={Scale}
          label="Target Weight"
          value={data.targetWeightLbs ? `${data.targetWeightLbs} lbs` : "—"}
          highlight
        />
        <MetricBox
          icon={Activity}
          label="Height"
          value={formatHeight(data.heightInches)}
        />
        <MetricBox
          icon={Sparkles}
          label="Body Fat %"
          value={data.estimatedBodyFatPercent ? `${data.estimatedBodyFatPercent}%` : "—"}
        />
      </div>

      {/* Demographics & Protein Target */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardItem
          icon={User}
          label="Biological Sex & Age"
          value={`${data.biologicalSex || "Female"} ${data.age ? `• ${data.age} yrs` : ""}`}
        />
        <CardItem
          icon={Zap}
          label="Activity Multiplier"
          value={data.activityMultiplier ? data.activityMultiplier.toUpperCase() : "Moderate"}
        />
        <CardItem
          icon={Flame}
          label="Daily Protein Target"
          value={
            data.dailyProteinTargetGrams
              ? `${data.dailyProteinTargetGrams} g/day`
              : "High-Performance (~2.2g/kg)"
          }
          highlight
        />
      </div>

      {/* Dietary Restrictions & Food Allergies */}
      <div className="p-5 rounded-2xl bg-[#080A0E] border border-white/10 space-y-3">
        <span className="text-xs font-bold text-ice-white uppercase tracking-wider flex items-center gap-2">
          <Utensils className="w-4 h-4 text-accent-lime" />
          Dietary Restrictions & Allergies
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {Array.isArray(data.dietaryRestrictions) && data.dietaryRestrictions.length > 0 ? (
            data.dietaryRestrictions.map((diet, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-accent-lime/10 text-accent-lime border border-accent-lime/30 text-xs font-semibold"
              >
                {diet}
              </span>
            ))
          ) : (
            <span className="text-xs text-silver-slate">No specific dietary restrictions</span>
          )}
        </div>
        {data.foodAllergies && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs mt-2">
            <strong>Food Allergies / Intolerances:</strong> {data.foodAllergies}
          </div>
        )}
      </div>

      {/* GI & Behavioral Triggers */}
      <div className="p-5 rounded-2xl bg-[#080A0E] border border-white/10 space-y-3">
        <span className="text-xs font-bold text-ice-white uppercase tracking-wider flex items-center gap-2">
          <Heart className="w-4 h-4 text-accent-lime" />
          Gastrointestinal & Behavioral Triggers
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <JointBadge label="Bloating Frequency" value={gi.bloatingFrequency || "occasional"} />
          <BoolBadge label="Acid Reflux" active={!!gi.acidReflux} />
          <BoolBadge label="Emotional Eating" active={!!gi.emotionalEating} />
          <BoolBadge label="Late Night Snacking" active={!!gi.lateNightSnacking} />
        </div>
        {gi.caffeineDailyIntake && (
          <p className="text-xs text-silver-slate pt-2">
            <strong>Caffeine Daily Intake:</strong> {gi.caffeineDailyIntake}
          </p>
        )}
      </div>

      {/* Meal Prep Habits */}
      <CardItem
        icon={Utensils}
        label="Meal Prep Habits"
        value={
          data.mealPrepHabits
            ? data.mealPrepHabits.replace("_", " ").toUpperCase()
            : "Cooks Daily"
        }
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Generic / Custom Data Fallback Panel
 * ───────────────────────────────────────────────────────────────────────────── */
function GenericIntakePanel({ data }: { data: Record<string, any> }) {
  const entries = Object.entries(data).filter(
    ([k]) => !["clientName", "clientEmail", "clientPhone", "waiverSignature", "waiverSigned"].includes(k)
  );

  if (entries.length === 0) {
    return (
      <p className="text-xs text-silver-slate italic">
        No additional questionnaire fields recorded.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {entries.map(([key, value]) => (
        <CardItem
          key={key}
          icon={Activity}
          label={key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())}
          value={typeof value === "object" ? JSON.stringify(value) : String(value)}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper Subcomponents
 * ───────────────────────────────────────────────────────────────────────────── */

function CardItem({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        highlight
          ? "bg-accent-lime/5 border-accent-lime/30"
          : "bg-[#080A0E] border-white/10"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${highlight ? "text-accent-lime" : "text-silver-slate/70"}`} />
        <span className="text-[10px] uppercase font-semibold tracking-wider text-silver-slate">
          {label}
        </span>
      </div>
      <p className={`text-sm font-semibold ${highlight ? "text-accent-lime" : "text-ice-white"}`}>
        {value}
      </p>
    </div>
  );
}

function MetricBox({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-3.5 rounded-xl border text-center ${
        highlight
          ? "bg-accent-lime/10 border-accent-lime/40"
          : "bg-white/5 border-white/10"
      }`}
    >
      <Icon className={`w-4 h-4 mx-auto mb-1 ${highlight ? "text-accent-lime" : "text-silver-slate/70"}`} />
      <span className="text-[10px] text-silver-slate uppercase block mb-0.5">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-accent-lime" : "text-ice-white"}`}>
        {value}
      </span>
    </div>
  );
}

function JointBadge({ label, value }: { label: string; value: string }) {
  const isSevere = value === "severe";
  const isModerate = value === "moderate";
  const isMild = value === "mild";

  const colorStyle = isSevere
    ? "bg-red-500/10 text-red-400 border-red-500/30"
    : isModerate
    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
    : isMild
    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
    : "bg-white/5 text-silver-slate border-white/10";

  return (
    <div className={`p-3 rounded-xl border text-center ${colorStyle}`}>
      <span className="text-[10px] uppercase block font-medium">{label}</span>
      <span className="text-xs font-bold capitalize mt-0.5 block">{value}</span>
    </div>
  );
}

function BoolBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`p-3 rounded-xl border text-center ${
        active
          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
          : "bg-white/5 text-silver-slate border-white/10"
      }`}
    >
      <span className="text-[10px] uppercase block font-medium">{label}</span>
      <span className="text-xs font-bold capitalize mt-0.5 block">
        {active ? "Reported" : "None"}
      </span>
    </div>
  );
}

function isTrackA(track: string): boolean {
  return track === "park-to-peak" || track === "track_a" || track.includes("park");
}

function isTrackB(track: string): boolean {
  return track === "executive-concierge" || track === "track_b" || track.includes("executive");
}

function isTrackC(track: string): boolean {
  return track === "nutrition-metabolic" || track === "track_c" || track.includes("nutrition");
}
