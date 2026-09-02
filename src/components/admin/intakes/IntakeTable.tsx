"use client";

import React from "react";
import {
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Archive,
  FileText,
  Dumbbell,
  ShieldCheck,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { ClientIntakeRecord, IntakeStatus, IntakeTrack } from "@/types/intake";

interface IntakeTableProps {
  intakes: ClientIntakeRecord[];
  onSelectIntake: (intake: ClientIntakeRecord) => void;
  selectedIntakeId?: string | null;
  loading?: boolean;
}

export function formatTrackName(track: IntakeTrack): string {
  switch (track) {
    case "park-to-peak":
    case "track_a":
    case "track_a_park":
    case "track_a_hybrid":
      return "Track A — Park-to-Peak";
    case "executive-concierge":
    case "track_b":
    case "track_b_hybrid":
      return "Track B — Executive Concierge";
    case "nutrition-metabolic":
    case "track_c":
      return "Track C — Nutrition & Metabolic";
    default:
      return track
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

export function getTrackBadgeStyle(track: IntakeTrack): {
  bg: string;
  text: string;
  border: string;
} {
  switch (track) {
    case "park-to-peak":
    case "track_a":
    case "track_a_park":
    case "track_a_hybrid":
      return {
        bg: "bg-accent-lime/10",
        text: "text-accent-lime",
        border: "border-accent-lime/30",
      };
    case "executive-concierge":
    case "track_b":
    case "track_b_hybrid":
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/30",
      };
    case "nutrition-metabolic":
    case "track_c":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
      };
    default:
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
      };
  }
}

export function getStatusConfig(status: IntakeStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ElementType;
} {
  switch (status) {
    case "new":
      return {
        label: "New",
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
        icon: Sparkles,
      };
    case "reviewed":
      return {
        label: "Reviewed",
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        icon: FileText,
      };
    case "enrolled":
      return {
        label: "Enrolled",
        bg: "bg-accent-lime/10",
        text: "text-accent-lime",
        border: "border-accent-lime/30",
        icon: CheckCircle2,
      };
    case "archived":
      return {
        label: "Archived",
        bg: "bg-white/5",
        text: "text-silver-slate",
        border: "border-white/10",
        icon: Archive,
      };
    default:
      return {
        label: status,
        bg: "bg-white/5",
        text: "text-silver-slate",
        border: "border-white/10",
        icon: Clock,
      };
  }
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function IntakeTable({
  intakes,
  onSelectIntake,
  selectedIntakeId,
  loading = false,
}: IntakeTableProps) {
  if (loading) {
    return (
      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden p-8">
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="h-16 bg-white/5 rounded-2xl flex items-center px-6 justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="w-32 h-3.5 bg-white/10 rounded" />
                  <div className="w-48 h-2.5 bg-white/10 rounded" />
                </div>
              </div>
              <div className="w-28 h-6 bg-white/10 rounded-full hidden sm:block" />
              <div className="w-20 h-6 bg-white/10 rounded-full hidden md:block" />
              <div className="w-24 h-8 bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (intakes.length === 0) {
    return (
      <div className="glass-panel rounded-3xl border border-white/5 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-silver-slate mx-auto mb-4">
          <Search className="w-8 h-8 opacity-40" />
        </div>
        <h3 className="font-display font-bold text-lg text-ice-white mb-1">
          No Client Intakes Found
        </h3>
        <p className="text-silver-slate text-xs max-w-md mx-auto">
          No clinical intake submissions match your selected filter criteria or search query.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-silver-slate bg-white/[0.02]">
              <th className="px-6 py-4 font-semibold">Client</th>
              <th className="px-6 py-4 font-semibold">Track</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold hidden md:table-cell">Waiver</th>
              <th className="px-6 py-4 font-semibold hidden sm:table-cell">Submitted</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {intakes.map((intake) => {
              const trackStyle = getTrackBadgeStyle(intake.track);
              const statusCfg = getStatusConfig(intake.status);
              const StatusIcon = statusCfg.icon;
              const isSelected = selectedIntakeId === intake.id;

              return (
                <tr
                  key={intake.id}
                  onClick={() => onSelectIntake(intake)}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-accent-lime/[0.08] hover:bg-accent-lime/[0.12]"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Client Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-lime/20 to-accent-lime/5 border border-accent-lime/20 flex items-center justify-center text-accent-lime font-display font-bold text-sm shrink-0">
                        {intake.client_name ? intake.client_name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ice-white text-sm truncate flex items-center gap-2">
                          <span>{intake.client_name}</span>
                          {intake.coach_notes && (
                            <span
                              title="Coach notes recorded"
                              className="w-1.5 h-1.5 rounded-full bg-accent-lime inline-block shrink-0"
                            />
                          )}
                        </div>
                        <div className="text-silver-slate text-xs truncate flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0 text-silver-slate/60" />
                          <span className="truncate">{intake.client_email}</span>
                        </div>
                        {intake.client_phone && (
                          <div className="text-silver-slate/70 text-[11px] truncate flex items-center gap-1.5 mt-0.5 sm:hidden">
                            <Phone className="w-2.5 h-2.5 shrink-0" />
                            <span>{intake.client_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Track Badge Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${trackStyle.bg} ${trackStyle.text} ${trackStyle.border}`}
                    >
                      <Dumbbell className="w-3 h-3" />
                      <span>{formatTrackName(intake.track)}</span>
                    </span>
                  </td>

                  {/* Status Pill Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusCfg.label}</span>
                    </span>
                  </td>

                  {/* Waiver Signed Column */}
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    {intake.waiver_signed ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-lime/10 text-accent-lime border border-accent-lime/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Signed & Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Pending Waiver</span>
                      </span>
                    )}
                  </td>

                  {/* Submitted Date Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-silver-slate text-xs hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-silver-slate/60" />
                      <span>{formatDate(intake.created_at)}</span>
                    </div>
                    <div className="text-[10px] text-silver-slate/50 mt-0.5 pl-4.5">
                      {formatTime(intake.created_at)}
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIntake(intake);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-accent-lime/15 border border-white/10 hover:border-accent-lime/40 text-ice-white hover:text-accent-lime text-xs font-semibold transition-all cursor-pointer group-hover:border-accent-lime/30"
                    >
                      <span>Review Clinical Intake</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
