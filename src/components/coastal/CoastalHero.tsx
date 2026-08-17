"use client";

import React from "react";
import {
  ShieldCheck,
  Footprints,
  Users,
  Compass,
  Flame,
  Sparkles,
  ArrowRight,
  UserCheck,
  LogIn,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";
import { GroupStats, GroupMember } from "@/types/coastal";

export interface CoastalHeroProps {
  stats?: GroupStats | null;
  user?: { id: string; email?: string; name?: string } | null;
  member?: GroupMember | null;
  isGuest?: boolean;
  onJoinClick?: () => void;
  onLogStepsClick?: () => void;
  onDevotionalClick?: () => void;
  onAuthClick?: () => void;
  className?: string;
}

export default function CoastalHero({
  stats,
  user,
  member,
  isGuest = false,
  onJoinClick,
  onLogStepsClick,
  onDevotionalClick,
  onAuthClick,
  className = "",
}: CoastalHeroProps) {
  const totalSteps = stats?.total_steps ?? 328450;
  const totalMiles = stats?.total_miles ?? 164.22;
  const activeWalkers = stats?.active_members_count ?? 28;
  const currentMilestone = stats?.current_milestone;
  const nextMilestone = stats?.next_milestone;

  const isAuthenticated = Boolean(user && user.id && user.id !== "guest-user");
  const isLinkedMember = Boolean(member || isAuthenticated);
  const displayName = member?.display_name || user?.name || (user?.email ? user.email.split("@")[0] : null);

  return (
    <div className={`relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 ${className}`}>
      {/* Background ambient glow circles */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--t-accent, #D4B87E)" }}
      />
      <div
        className="pointer-events-none absolute top-48 -right-20 w-80 h-80 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: "var(--t-violet, #C58B8B)" }}
      />

      <div className="page-container relative z-10">
        {/* Top Badges / Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          {/* Verified Group Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel-lime border border-accent-lime/30 bg-cyber-slate/80 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-accent-lime shrink-0" />
            <span className="text-xs font-medium tracking-wide text-accent-lime uppercase">
              Coastal Community Church
            </span>
            <span className="h-3 w-px bg-accent-lime/30" />
            <span className="text-xs font-semibold text-ice-white">Group #3266</span>
          </div>

          {/* User Membership or Guest Preview Status */}
          {isAuthenticated ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-white/10 bg-cyber-slate/60 text-xs text-ice-white">
              <UserCheck className="w-3.5 h-3.5 text-accent-lime" />
              <span>
                Active Member: <strong className="text-accent-lime">{displayName || "Faithful Walker"}</strong>
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-white/10 bg-cyber-slate/60 text-xs text-silver-slate">
              <span className="inline-block w-2 h-2 rounded-full bg-accent-lime/80 animate-pulse" />
              <span>Guest Preview Mode</span>
              {onAuthClick && (
                <button
                  type="button"
                  onClick={onAuthClick}
                  className="ml-1 text-xs font-medium text-accent-lime hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hero Title & Subtitle */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-accent-lime uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Faith & Fitness Step Fellowship
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ice-white leading-[1.15] mb-4">
            Walking by Faith,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-lime via-[#E8D4A8] to-accent-violet">
              Conditioning in Fellowship
            </span>
          </h1>
          <p className="text-base sm:text-lg text-silver-slate leading-relaxed">
            Welcome to the official Coastal Community Church (#3266) walking community powered by Bodied by Esh.
            Log your daily steps, nourish your spirit with daily scripture reflections, and walk together toward communal
            faith milestones.
          </p>
        </div>

        {/* Quick Statistics Ticker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Card 1: Total Church Steps */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-accent-lime/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-silver-slate uppercase tracking-wider">
                Church Steps
              </span>
              <div className="p-2 rounded-xl bg-accent-lime/10 text-accent-lime">
                <Footprints className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-ice-white tracking-tight">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-xs text-silver-slate mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-accent-lime" />
              <span>Collective walk</span>
            </div>
          </div>

          {/* Card 2: Collective Miles */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-accent-lime/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-silver-slate uppercase tracking-wider">
                Collective Miles
              </span>
              <div className="p-2 rounded-xl bg-accent-lime/10 text-accent-lime">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-ice-white tracking-tight">
              {totalMiles.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <div className="text-xs text-silver-slate mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-accent-lime" />
              <span>Distance covered</span>
            </div>
          </div>

          {/* Card 3: Active Walkers */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-accent-lime/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-silver-slate uppercase tracking-wider">
                Active Walkers
              </span>
              <div className="p-2 rounded-xl bg-accent-lime/10 text-accent-lime">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-ice-white tracking-tight">
              {activeWalkers}
            </div>
            <div className="text-xs text-silver-slate mt-1 flex items-center gap-1">
              <Flame className="w-3 h-3 text-accent-lime" />
              <span>Fellowship members</span>
            </div>
          </div>

          {/* Card 4: Current Faith Milestone */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-accent-lime/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-silver-slate uppercase tracking-wider">
                Next Journey
              </span>
              <div className="p-2 rounded-xl bg-accent-violet/10 text-accent-violet">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-bold text-ice-white tracking-tight truncate">
              {nextMilestone?.title || currentMilestone?.title || "Jericho March"}
            </div>
            <div className="text-xs text-accent-lime mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-accent-lime" />
              <span>
                {nextMilestone ? `${((nextMilestone.target_steps - (nextMilestone.remaining_steps || 0)) / nextMilestone.target_steps * 100).toFixed(0)}% Complete` : "100% Complete"}
              </span>
            </div>
          </div>
        </div>

        {/* Primary and Secondary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          {/* Primary Action Button */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onLogStepsClick}
              className="touch-target inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-cyber-slate bg-accent-lime hover:bg-[#E8D4A8] shadow-lg shadow-accent-lime/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Footprints className="w-5 h-5 text-cyber-slate" />
              <span>Log Daily Steps</span>
              <ArrowRight className="w-4 h-4 text-cyber-slate" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onJoinClick || onAuthClick}
              className="touch-target inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-cyber-slate bg-accent-lime hover:bg-[#E8D4A8] shadow-lg shadow-accent-lime/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-cyber-slate" />
              <span>Join Walking Group (#3266)</span>
              <ArrowRight className="w-4 h-4 text-cyber-slate" />
            </button>
          )}

          {/* Secondary Action Buttons */}
          <button
            type="button"
            onClick={onLogStepsClick}
            className="touch-target inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-medium text-ice-white glass-panel border border-white/15 hover:border-accent-lime/40 hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Footprints className="w-4 h-4 text-accent-lime" />
            <span>{isAuthenticated ? "View My Tracker" : "Log Steps as Guest"}</span>
          </button>

          {onDevotionalClick && (
            <button
              type="button"
              onClick={onDevotionalClick}
              className="touch-target inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-medium text-silver-slate glass-panel border border-white/10 hover:text-ice-white hover:border-white/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-accent-violet" />
              <span>Walking by Faith Devotional</span>
            </button>
          )}
        </div>

        {/* Guest Preview Notice Banner */}
        {!isAuthenticated && (
          <div className="mt-6 p-3.5 sm:p-4 rounded-xl glass-panel border border-accent-lime/20 bg-cyber-slate/60 flex items-center justify-between gap-3 text-xs sm:text-sm text-silver-slate">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-accent-lime shrink-0" />
              <span>
                You are viewing in <strong className="text-ice-white">Guest Preview Mode</strong>. Steps logged on this
                device will save locally. Sign in anytime to sync to the church leaderboard and faith milestones.
              </span>
            </div>
            {onAuthClick && (
              <button
                type="button"
                onClick={onAuthClick}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-accent-lime/15 hover:bg-accent-lime/25 text-accent-lime font-medium transition-colors cursor-pointer"
              >
                Sign In Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
