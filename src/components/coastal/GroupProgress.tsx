"use client";

import React, { useState } from "react";
import {
  Shield,
  Compass,
  Mountain,
  Heart,
  Crown,
  Trophy,
  Users,
  Flame,
  TrendingUp,
  CheckCircle2,
  Lock,
  RefreshCw,
  ArrowRight,
  MapPin,
  Footprints,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GroupStats, GroupMilestone } from "@/types/coastal";
import { COMMUNAL_MILESTONES_SEED } from "@/lib/coastal/milestones-data";

interface GroupProgressProps {
  stats?: GroupStats | null;
  onRefresh?: () => void;
  onContributeClick?: () => void;
  onViewMilestonesClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

// Icon mapper for Lucide SVG icons (strictly zero emojis)
function getJourneyIcon(iconName: string = "Shield", className = "w-5 h-5") {
  switch (iconName.toLowerCase()) {
    case "compass":
      return <Compass className={className} />;
    case "mountain":
      return <Mountain className={className} />;
    case "heart":
      return <Heart className={className} />;
    case "crown":
      return <Crown className={className} />;
    case "trophy":
      return <Trophy className={className} />;
    case "shield":
    default:
      return <Shield className={className} />;
  }
}

export default function GroupProgress({
  stats,
  onRefresh,
  onContributeClick,
  onViewMilestonesClick,
  isLoading = false,
  className = "",
}: GroupProgressProps) {
  const [expandedMilestoneIndex, setExpandedMilestoneIndex] = useState<number | null>(null);

  // Fallback default values
  const totalSteps = stats?.total_steps ?? 328450;
  const totalMiles = stats?.total_miles ?? 164.22;
  const activeMembersCount = stats?.active_members_count ?? 28;

  // Evaluate 6 communal milestones against total group steps
  const milestones = COMMUNAL_MILESTONES_SEED.map((seed, index) => {
    const isReached = totalSteps >= seed.target_steps;
    return {
      index,
      title: seed.title,
      targetSteps: seed.target_steps,
      targetMiles: seed.target_miles,
      description: seed.description,
      scriptureTheme: seed.scripture_theme,
      iconName: seed.icon_name,
      isReached,
      remainingSteps: Math.max(0, seed.target_steps - totalSteps),
    };
  });

  // Find next milestone to conquer
  const nextMilestone = milestones.find((m) => !m.isReached) || milestones[milestones.length - 1];
  const reachedCount = milestones.filter((m) => m.isReached).length;

  // Target steps for the current progress segment
  const currentGoalSteps = nextMilestone ? nextMilestone.targetSteps : 2500000;
  const progressPercent = Math.min(100, Math.round((totalSteps / currentGoalSteps) * 10000) / 100);

  const toggleExpand = (idx: number) => {
    setExpandedMilestoneIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div
      className={`glass-panel border border-white/10 rounded-2xl p-5 sm:p-7 md:p-8 bg-onyx-card/85 relative overflow-hidden ${className}`}
      data-testid="coastal-group-progress"
    >
      {/* Top Background Ambient Light */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-accent-lime/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-accent-lime font-display">
              Communal Goal
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[11px] font-medium text-silver-slate">
              Group #3266
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-ice-white mt-0.5">
            Church Faith Journey
          </h2>
          <p className="text-xs sm:text-sm text-silver-slate mt-1">
            Targeting the <strong className="text-ice-white">{nextMilestone.title}</strong> ({nextMilestone.targetSteps.toLocaleString()} Steps)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-silver-slate hover:text-ice-white transition-all touch-target flex items-center justify-center disabled:opacity-50"
              title="Refresh Community Stats"
              aria-label="Refresh Community Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-accent-lime" : ""}`} />
            </button>
          )}

          {onContributeClick && (
            <button
              type="button"
              onClick={onContributeClick}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate transition-all flex items-center gap-1.5 shadow-sm shadow-accent-lime/10 touch-target"
            >
              <Footprints className="w-4 h-4" />
              <span>Log Steps</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-silver-slate text-xs font-semibold uppercase tracking-wider">
            <Footprints className="w-3.5 h-3.5 text-accent-lime" />
            <span>Total Steps</span>
          </div>
          <div className="text-lg sm:text-2xl font-mono font-extrabold text-ice-white mt-1">
            {totalSteps.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-silver-slate text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-accent-lime" />
            <span>Miles Conquered</span>
          </div>
          <div className="text-lg sm:text-2xl font-mono font-extrabold text-ice-white mt-1">
            {totalMiles.toFixed(1)} <span className="text-xs font-normal text-silver-slate">mi</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-silver-slate text-xs font-semibold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-accent-lime" />
            <span>Active Walkers</span>
          </div>
          <div className="text-lg sm:text-2xl font-mono font-extrabold text-ice-white mt-1">
            {activeMembersCount} <span className="text-xs font-normal text-silver-slate">members</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-silver-slate text-xs font-semibold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-accent-lime" />
            <span>Milestones Won</span>
          </div>
          <div className="text-lg sm:text-2xl font-mono font-extrabold text-accent-lime mt-1">
            {reachedCount} / 6 <span className="text-xs font-normal text-silver-slate">goals</span>
          </div>
        </div>
      </div>

      {/* Primary Progress Bar Section */}
      <div className="p-5 rounded-xl bg-cyber-slate/90 border border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-lime" />
            <span className="font-bold text-ice-white font-display">
              Target: {nextMilestone.title}
            </span>
          </div>
          <div className="font-mono text-silver-slate">
            <strong className="text-accent-lime font-bold">{totalSteps.toLocaleString()}</strong> / {currentGoalSteps.toLocaleString()} steps ({progressPercent}%)
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-lime/80 via-accent-lime to-accent-lime shadow-sm shadow-accent-lime/30 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(2, Math.min(100, progressPercent))}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-silver-slate">
          <span>
            {nextMilestone.remainingSteps > 0
              ? `${nextMilestone.remainingSteps.toLocaleString()} steps remaining to unlock next milestone`
              : "Communal goal fully achieved!"}
          </span>
          <span className="font-mono text-accent-lime font-semibold">
            {((nextMilestone.remainingSteps / 2000)).toFixed(1)} mi to go
          </span>
        </div>
      </div>

      {/* Communal Milestone Roadmap Pathway */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-silver-slate font-display flex items-center gap-2">
            <span>Milestone Pilgrimage Roadmap</span>
            <span className="text-[10px] font-normal text-silver-slate/70">
              (6 Faith Landmarks)
            </span>
          </h3>

          {onViewMilestonesClick && (
            <button
              type="button"
              onClick={onViewMilestonesClick}
              className="text-xs text-accent-lime hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All Badges</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {milestones.map((m) => {
            const isExpanded = expandedMilestoneIndex === m.index;
            const isCurrent = !m.isReached && (m.index === 0 || milestones[m.index - 1].isReached);

            return (
              <div
                key={`roadmap-${m.index}`}
                onClick={() => toggleExpand(m.index)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  m.isReached
                    ? "bg-accent-lime/[0.04] border-accent-lime/30 hover:border-accent-lime/50"
                    : isCurrent
                    ? "bg-white/[0.04] border-accent-lime/40 shadow-sm shadow-accent-lime/5 hover:border-accent-lime"
                    : "bg-white/[0.01] border-white/5 opacity-60 hover:opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        m.isReached
                          ? "bg-accent-lime text-cyber-slate font-bold"
                          : isCurrent
                          ? "bg-accent-lime/20 text-accent-lime border border-accent-lime/40 animate-pulse"
                          : "bg-white/5 text-silver-slate"
                      }`}
                    >
                      {getJourneyIcon(m.iconName, "w-4 h-4")}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {m.isReached ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-accent-lime text-cyber-slate flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Reached</span>
                        </span>
                      ) : isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-accent-lime/20 text-accent-lime border border-accent-lime/30">
                          In Progress
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-white/5 text-silver-slate border border-white/5 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </span>
                      )}

                      <button
                        type="button"
                        className="text-silver-slate hover:text-ice-white p-0.5"
                        aria-label="Toggle Milestone Details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-ice-white font-display">
                    {m.title}
                  </h4>

                  <div className="flex items-center gap-2 mt-1 font-mono text-xs text-silver-slate">
                    <span>{m.targetSteps.toLocaleString()} steps</span>
                    <span>•</span>
                    <span>{m.targetMiles.toFixed(0)} mi</span>
                  </div>

                  <p className="text-xs text-silver-slate mt-1.5 leading-relaxed line-clamp-2">
                    {m.description}
                  </p>
                </div>

                {/* Expanded Scripture & Story Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/5 text-xs text-silver-slate animate-fadeIn space-y-1.5">
                    <div className="font-semibold text-accent-lime font-display">
                      Biblical Landmark Theme:
                    </div>
                    <p className="italic text-[11px] leading-relaxed text-ice-white/90">
                      {m.scriptureTheme}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
