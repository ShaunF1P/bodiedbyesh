"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Award,
  Trophy,
  Sparkles,
  Mountain,
  Footprints,
  Flame,
  Shield,
  Crown,
  Compass,
  Zap,
  Activity,
  CheckCircle2,
  Lock,
  X,
  Share2,
  Check,
  ExternalLink,
  BookOpen,
  Users,
} from "lucide-react";
import {
  IndividualMilestone,
  GroupMilestone,
  StepLog,
  UserStreak,
} from "@/types/coastal";
import {
  INDIVIDUAL_MILESTONES,
  COMMUNAL_MILESTONES_SEED,
  evaluateIndividualMilestones,
} from "@/lib/coastal/milestones-data";

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, highlights or celebrates a single newly unlocked milestone
  celebrateMilestone?: IndividualMilestone | GroupMilestone | null;
  // User context for rendering full badge showcase
  stepLogs?: StepLog[];
  userStreak?: UserStreak | number;
  totalGroupSteps?: number;
}

// Icon mapper utility for Lucide SVG icons (ZERO emojis)
export function getMilestoneIcon(iconName: string = "Award", className = "w-6 h-6") {
  switch (iconName.toLowerCase()) {
    case "footprints":
      return <Footprints className={className} />;
    case "activity":
      return <Activity className={className} />;
    case "mountain":
      return <Mountain className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    case "flame":
      return <Flame className={className} />;
    case "award":
      return <Award className={className} />;
    case "crown":
      return <Crown className={className} />;
    case "compass":
      return <Compass className={className} />;
    case "trophy":
      return <Trophy className={className} />;
    case "shield":
      return <Shield className={className} />;
    case "zap":
      return <Zap className={className} />;
    case "heart":
      return <Sparkles className={className} />;
    default:
      return <Award className={className} />;
  }
}

export default function MilestoneModal({
  isOpen,
  onClose,
  celebrateMilestone,
  stepLogs = [],
  userStreak = 0,
  totalGroupSteps = 0,
}: MilestoneModalProps) {
  const [activeTab, setActiveTab] = useState<"celebration" | "all" | "unlocked" | "church">(
    celebrateMilestone ? "celebration" : "all"
  );
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [selectedInspectMilestone, setSelectedInspectMilestone] = useState<
    IndividualMilestone | GroupMilestone | null
  >(celebrateMilestone || null);

  // Derive streak days count
  const streakDays =
    typeof userStreak === "number"
      ? userStreak
      : userStreak?.current_streak || 0;

  // Evaluate individual badge statuses
  const { allWithStatus: individualBadges, unlocked: unlockedIndividual } =
    evaluateIndividualMilestones(stepLogs, streakDays);

  // Evaluate communal journeys
  const communalJourneys = COMMUNAL_MILESTONES_SEED.map((seed, idx) => ({
    id: `communal-${idx + 1}`,
    group_id: "3266-coastal-church",
    title: seed.title,
    target_steps: seed.target_steps,
    target_miles: seed.target_miles,
    description: seed.description,
    scripture_theme: seed.scripture_theme,
    icon_name: seed.icon_name,
    is_reached: totalGroupSteps >= seed.target_steps,
  }));

  // Reset or set tab when celebrateMilestone changes
  useEffect(() => {
    if (celebrateMilestone) {
      setSelectedInspectMilestone(celebrateMilestone);
      setActiveTab("celebration");
    } else {
      setActiveTab("all");
    }
  }, [celebrateMilestone]);

  // Lock body scroll on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Share achievement handler
  const handleShareAchievement = async (m: IndividualMilestone | GroupMilestone) => {
    const textToShare = `Faith Milestone Unlocked: "${m.title}" with Coastal Community Church (#3266) Faith & Fitness Walker community! Scripture: ${
      "scripture_ref" in m ? m.scripture_ref : m.scripture_theme
    }`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToShare);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-onyx-card border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden glass-panel">
        {/* Subtle Ambient Top Glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-accent-lime/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-lime/10 border border-accent-lime/20 flex items-center justify-center text-accent-lime">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="milestone-modal-title"
                className="text-lg sm:text-xl font-bold font-display text-ice-white"
              >
                Faith Milestones & Badges
              </h2>
              <p className="text-xs text-silver-slate">
                Coastal Community Church (#3266) Walking Achievements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-silver-slate hover:text-ice-white transition-all flex items-center justify-center touch-target"
            aria-label="Close Milestone Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {celebrateMilestone && (
            <button
              type="button"
              onClick={() => setActiveTab("celebration")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "celebration"
                  ? "bg-accent-lime text-cyber-slate font-bold shadow-sm shadow-accent-lime/20"
                  : "bg-white/5 text-silver-slate hover:text-ice-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unlocked!</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "all"
                ? "bg-accent-lime text-cyber-slate font-bold"
                : "bg-white/5 text-silver-slate hover:text-ice-white"
            }`}
          >
            All Badges ({individualBadges.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unlocked")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "unlocked"
                ? "bg-accent-lime text-cyber-slate font-bold"
                : "bg-white/5 text-silver-slate hover:text-ice-white"
            }`}
          >
            Unlocked ({unlockedIndividual.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("church")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === "church"
                ? "bg-accent-lime text-cyber-slate font-bold"
                : "bg-white/5 text-silver-slate hover:text-ice-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Church Journeys (6)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* CELEBRATION TAB VIEW */}
          {activeTab === "celebration" && selectedInspectMilestone && (
            <div className="text-center py-4 px-2 flex flex-col items-center animate-scaleUp">
              {/* Badge Icon Fanfare Circle */}
              <div className="relative mb-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-accent-lime/15 border-2 border-accent-lime flex items-center justify-center text-accent-lime shadow-lg shadow-accent-lime/20 animate-pulse">
                  {getMilestoneIcon(selectedInspectMilestone.icon_name, "w-12 h-12 sm:w-14 sm:h-14")}
                </div>
                <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-accent-lime text-cyber-slate text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  Unlocked
                </div>
              </div>

              <span className="text-xs font-semibold uppercase tracking-widest text-accent-lime font-display">
                Faith Milestone Conquered
              </span>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-ice-white mt-1">
                {selectedInspectMilestone.title}
              </h3>

              <p className="text-xs sm:text-sm text-silver-slate max-w-md mt-2 leading-relaxed">
                {selectedInspectMilestone.description}
              </p>

              {/* Scripture Citation Box */}
              <div className="mt-5 p-4 rounded-xl bg-cyber-slate/90 border border-white/5 max-w-md w-full text-left">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-accent-lime shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-accent-lime font-display">
                    {"scripture_ref" in selectedInspectMilestone
                      ? selectedInspectMilestone.scripture_ref
                      : "Biblical Foundation"}
                  </span>
                </div>
                <p className="text-xs text-silver-slate italic leading-relaxed">
                  {"scripture_ref" in selectedInspectMilestone
                    ? `Walk with perseverance and discipline. God honors your steadfast movement.`
                    : selectedInspectMilestone.scripture_theme}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleShareAchievement(selectedInspectMilestone)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate transition-all flex items-center gap-2 shadow-md shadow-accent-lime/10 touch-target"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Share Celebration</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-ice-white transition-all touch-target"
                >
                  View All Badges
                </button>
              </div>
            </div>
          )}

          {/* BADGE GRID VIEWS (ALL or UNLOCKED) */}
          {(activeTab === "all" || activeTab === "unlocked") && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-silver-slate font-display">
                  Individual Faith & Fitness Milestones
                </span>
                <span className="text-xs font-mono text-accent-lime font-bold">
                  {unlockedIndividual.length} / {individualBadges.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(activeTab === "unlocked" ? unlockedIndividual : individualBadges).map(
                  (badge) => {
                    const isUnlocked = badge.is_unlocked;
                    return (
                      <div
                        key={badge.key}
                        onClick={() => {
                          setSelectedInspectMilestone(badge);
                          if (isUnlocked) setActiveTab("celebration");
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          isUnlocked
                            ? "bg-white/[0.03] hover:bg-white/[0.06] border-accent-lime/30"
                            : "bg-white/[0.01] hover:bg-white/[0.03] border-white/5 opacity-70"
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${
                            isUnlocked
                              ? "bg-accent-lime/15 text-accent-lime border border-accent-lime/30 shadow-sm"
                              : "bg-white/5 text-silver-slate/50 border border-white/5"
                          }`}
                        >
                          {isUnlocked ? (
                            getMilestoneIcon(badge.icon_name, "w-5 h-5")
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs sm:text-sm font-bold text-ice-white truncate font-display">
                              {badge.title}
                            </h4>
                            {isUnlocked && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-accent-lime shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-silver-slate line-clamp-2 mt-0.5 leading-snug">
                            {badge.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-accent-lime/90 border border-white/5">
                              {badge.scripture_ref}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* CHURCH JOURNEYS VIEW */}
          {activeTab === "church" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-silver-slate font-display">
                  Communal Church Pilgrimage Journeys
                </span>
                <span className="text-xs font-mono text-accent-lime font-bold">
                  {communalJourneys.filter((j) => j.is_reached).length} / {communalJourneys.length} Completed
                </span>
              </div>

              <div className="space-y-3">
                {communalJourneys.map((journey) => {
                  const isReached = journey.is_reached;
                  return (
                    <div
                      key={journey.id}
                      className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isReached
                          ? "bg-accent-lime/[0.04] border-accent-lime/30"
                          : "bg-white/[0.02] border-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                            isReached
                              ? "bg-accent-lime text-cyber-slate font-bold"
                              : "bg-white/5 text-silver-slate"
                          }`}
                        >
                          {getMilestoneIcon(journey.icon_name, "w-5 h-5")}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-ice-white font-display">
                              {journey.title}
                            </h4>
                            {isReached ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent-lime text-cyber-slate">
                                Conquered
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-white/5 text-silver-slate border border-white/10">
                                Goal
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-silver-slate mt-1 leading-relaxed">
                            {journey.description}
                          </p>
                          <p className="text-[11px] text-accent-lime/90 italic mt-1">
                            {journey.scripture_theme}
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-ice-white">
                          {journey.target_steps.toLocaleString()} Steps
                        </div>
                        <div className="text-[11px] font-mono text-silver-slate">
                          {journey.target_miles.toFixed(1)} Miles
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-black/30 flex items-center justify-between">
          <span className="text-xs text-silver-slate">
            Coastal Community Church (#3266)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-ice-white transition-all touch-target"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
