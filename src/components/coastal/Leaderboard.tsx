"use client";

import React, { useState, useMemo } from "react";
import {
  Trophy,
  Crown,
  Award,
  Flame,
  Shield,
  Eye,
  EyeOff,
  Search,
  User,
  Users,
  Check,
  TrendingUp,
  Sparkles,
  Filter,
  MapPin,
  Calendar,
  Footprints,
} from "lucide-react";
import { LeaderboardEntry } from "@/types/coastal";
import { calculateMileage } from "@/lib/coastal/db";

interface LeaderboardProps {
  entries?: LeaderboardEntry[];
  currentUserId?: string;
  isCurrentUserAnonymous?: boolean;
  onToggleAnonymous?: (isAnon: boolean) => void;
  className?: string;
}

// Default initial leaderboard entries if none provided
const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    user_id: "leader-1",
    display_name: "Marcus Vance",
    campus: "Main Campus",
    is_anonymous: false,
    total_steps: 84200,
    total_miles: 42.1,
    active_days: 7,
    streak_days: 7,
  },
  {
    rank: 2,
    user_id: "leader-2",
    display_name: "David Kim",
    campus: "North Campus",
    is_anonymous: true,
    total_steps: 71500,
    total_miles: 35.75,
    active_days: 7,
    streak_days: 7,
  },
  {
    rank: 3,
    user_id: "leader-3",
    display_name: "Elena Rostova",
    campus: "Main Campus",
    is_anonymous: false,
    total_steps: 64800,
    total_miles: 32.4,
    active_days: 6,
    streak_days: 6,
  },
  {
    rank: 4,
    user_id: "leader-4",
    display_name: "Deacon James",
    campus: "South Campus",
    is_anonymous: false,
    total_steps: 53200,
    total_miles: 26.6,
    active_days: 6,
    streak_days: 6,
  },
  {
    rank: 5,
    user_id: "leader-5",
    display_name: "Hannah Grace",
    campus: "Main Campus",
    is_anonymous: false,
    total_steps: 48900,
    total_miles: 24.45,
    active_days: 5,
    streak_days: 5,
  },
  {
    rank: 6,
    user_id: "leader-6",
    display_name: "Sarah Miller",
    campus: "North Campus",
    is_anonymous: false,
    total_steps: 42300,
    total_miles: 21.15,
    active_days: 5,
    streak_days: 5,
  },
  {
    rank: 7,
    user_id: "leader-7",
    display_name: "Brother Thomas",
    campus: "Main Campus",
    is_anonymous: false,
    total_steps: 38700,
    total_miles: 19.35,
    active_days: 4,
    streak_days: 4,
  },
  {
    rank: 8,
    user_id: "leader-8",
    display_name: "Rachel Adams",
    campus: "South Campus",
    is_anonymous: true,
    total_steps: 35100,
    total_miles: 17.55,
    active_days: 4,
    streak_days: 4,
  },
];

export default function Leaderboard({
  entries = DEFAULT_LEADERBOARD,
  currentUserId = "guest-user",
  isCurrentUserAnonymous = false,
  onToggleAnonymous,
  className = "",
}: LeaderboardProps) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all_time">("week");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [anonymousMode, setAnonymousMode] = useState<boolean>(isCurrentUserAnonymous);

  // Handle Anonymous Toggle
  const handleToggleAnonymous = () => {
    const nextVal = !anonymousMode;
    setAnonymousMode(nextVal);
    if (onToggleAnonymous) {
      onToggleAnonymous(nextVal);
    }
  };

  // Filter & process leaderboard
  const processedEntries = useMemo(() => {
    let list = [...entries];

    // Filter by campus
    if (campusFilter !== "all") {
      list = list.filter((e) => e.campus === campusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) => {
        const visibleName =
          e.is_anonymous && e.user_id !== currentUserId
            ? "faithful walker"
            : e.display_name.toLowerCase();
        return (
          visibleName.includes(q) ||
          (e.campus && e.campus.toLowerCase().includes(q))
        );
      });
    }

    // Sort descending by total_steps
    list.sort((a, b) => b.total_steps - a.total_steps);

    // Recalculate rank (dense ranking)
    let currentRank = 1;
    return list.map((item, index) => {
      if (index > 0 && item.total_steps < list[index - 1].total_steps) {
        currentRank = index + 1;
      }
      return {
        ...item,
        rank: currentRank,
        is_current_user: item.user_id === currentUserId,
      };
    });
  }, [entries, campusFilter, searchQuery, currentUserId]);

  // Extract Top 3 for Podium
  const top3 = processedEntries.slice(0, 3);
  const remainingList = processedEntries.slice(3);

  // Find Current User's standing
  const currentUserEntry = processedEntries.find((e) => e.is_current_user);

  return (
    <div
      className={`glass-panel border border-white/10 rounded-2xl p-5 sm:p-7 md:p-8 bg-onyx-card/85 relative overflow-hidden ${className}`}
      data-testid="coastal-leaderboard"
    >
      {/* Background Accent Ambient Glow */}
      <div
        className="absolute top-0 right-0 w-80 h-80 bg-accent-lime/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-lime/10 border border-accent-lime/20 flex items-center justify-center text-accent-lime">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-accent-lime font-display">
                Community Fellowship
              </span>
              <span className="text-white/20">•</span>
              <span className="text-[11px] font-medium text-silver-slate">
                Group #3266
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-ice-white">
              Top Walkers Leaderboard
            </h2>
          </div>
        </div>

        {/* Timeframe Filter Tabs */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTimeframe("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-target ${
              timeframe === "week"
                ? "bg-accent-lime text-cyber-slate font-bold shadow-sm"
                : "text-silver-slate hover:text-ice-white"
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-target ${
              timeframe === "month"
                ? "bg-accent-lime text-cyber-slate font-bold shadow-sm"
                : "text-silver-slate hover:text-ice-white"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("all_time")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-target ${
              timeframe === "all_time"
                ? "bg-accent-lime text-cyber-slate font-bold shadow-sm"
                : "text-silver-slate hover:text-ice-white"
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Anonymous Mode Privacy Banner */}
      <div className="my-5 p-3.5 sm:p-4 rounded-xl bg-cyber-slate/90 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-silver-slate shrink-0">
            {anonymousMode ? (
              <EyeOff className="w-4 h-4 text-accent-lime" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-ice-white font-display">
              Anonymous Walker Privacy Mode
            </span>
            <p className="text-[11px] text-silver-slate">
              {anonymousMode
                ? "You are walking as an Anonymous Pilgrim. Your step total counts toward the church goal while your name remains private."
                : "Your name is currently visible to church group members on the leaderboard."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleAnonymous}
          className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 touch-target ${
            anonymousMode
              ? "bg-accent-lime text-cyber-slate font-bold hover:bg-accent-lime/90"
              : "bg-white/10 hover:bg-white/15 text-ice-white border border-white/10"
          }`}
        >
          {anonymousMode ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Anonymous ON</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Walk Anonymously</span>
            </>
          )}
        </button>
      </div>

      {/* Search & Campus Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-silver-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search walker by name or campus..."
            className="w-full bg-cyber-slate/90 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-ice-white placeholder:text-silver-slate/40 focus:border-accent-lime focus:outline-none focus:ring-1 focus:ring-accent-lime transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
          <span className="text-xs text-silver-slate shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Campus:</span>
          </span>
          {["all", "Main Campus", "North Campus", "South Campus"].map((campus) => (
            <button
              key={`campus-${campus}`}
              type="button"
              onClick={() => setCampusFilter(campus)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                campusFilter === campus
                  ? "bg-white/15 text-accent-lime border border-accent-lime/30"
                  : "bg-white/5 text-silver-slate hover:text-ice-white hover:bg-white/10"
              }`}
            >
              {campus === "all" ? "All" : campus.replace(" Campus", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Display (When no search active) */}
      {!searchQuery && top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          {top3.map((entry, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;

            const displayName =
              entry.is_anonymous && entry.user_id !== currentUserId
                ? "Faithful Walker"
                : entry.display_name;

            return (
              <div
                key={`podium-${entry.user_id}`}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isFirst
                    ? "bg-accent-lime/[0.08] border-accent-lime/40 shadow-sm shadow-accent-lime/10 order-1 sm:order-2 sm:-translate-y-1"
                    : isSecond
                    ? "bg-white/[0.03] border-white/15 order-2 sm:order-1"
                    : "bg-white/[0.02] border-white/10 order-3 sm:order-3"
                }`}
              >
                {isFirst && (
                  <div className="absolute top-2 right-2">
                    <Crown className="w-4 h-4 text-accent-lime" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-extrabold ${
                        isFirst
                          ? "bg-accent-lime text-cyber-slate"
                          : isSecond
                          ? "bg-white/20 text-ice-white"
                          : "bg-white/10 text-silver-slate"
                      }`}
                    >
                      #{entry.rank}
                    </div>

                    <span className="text-[11px] font-mono text-silver-slate">
                      {entry.campus || "Main Campus"}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-ice-white font-display truncate">
                    {displayName}
                    {entry.is_current_user && (
                      <span className="ml-1.5 text-[10px] font-bold text-accent-lime">
                        (You)
                      </span>
                    )}
                  </h4>

                  <div className="mt-2 text-lg sm:text-xl font-mono font-extrabold text-accent-lime">
                    {entry.total_steps.toLocaleString()}
                    <span className="text-xs font-normal text-silver-slate ml-1">
                      steps
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-silver-slate">
                  <span>{entry.total_miles.toFixed(1)} mi</span>
                  {entry.streak_days && entry.streak_days > 0 ? (
                    <span className="flex items-center gap-1 text-accent-lime">
                      <Flame className="w-3 h-3" />
                      <span>{entry.streak_days}d streak</span>
                    </span>
                  ) : (
                    <span>{entry.active_days || 1}d active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Table / Rows */}
      <div className="rounded-xl bg-cyber-slate/90 border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 text-[11px] font-bold uppercase tracking-wider text-silver-slate border-b border-white/5">
          <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
          <div className="col-span-6 sm:col-span-6">Walker</div>
          <div className="col-span-4 sm:col-span-3 text-right">Steps</div>
          <div className="hidden sm:block sm:col-span-2 text-right">Distance</div>
        </div>

        <div className="divide-y divide-white/5">
          {processedEntries.length === 0 ? (
            <div className="py-10 text-center text-xs text-silver-slate">
              No walkers found matching current filters.
            </div>
          ) : (
            processedEntries.map((entry) => {
              const displayName =
                entry.is_anonymous && entry.user_id !== currentUserId
                  ? "Faithful Walker"
                  : entry.display_name;

              return (
                <div
                  key={`row-${entry.user_id}`}
                  className={`grid grid-cols-12 gap-2 p-3 sm:p-3.5 items-center transition-all ${
                    entry.is_current_user
                      ? "bg-accent-lime/[0.08] border-l-2 border-accent-lime"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                        entry.rank === 1
                          ? "bg-accent-lime text-cyber-slate"
                          : entry.rank === 2
                          ? "bg-white/20 text-ice-white"
                          : entry.rank === 3
                          ? "bg-white/10 text-silver-slate"
                          : "text-silver-slate"
                      }`}
                    >
                      {entry.rank}
                    </span>
                  </div>

                  {/* Walker Name & Campus */}
                  <div className="col-span-6 sm:col-span-6 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-ice-white truncate font-display">
                        {displayName}
                      </span>
                      {entry.is_current_user && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-lime text-cyber-slate uppercase">
                          You
                        </span>
                      )}
                      {entry.is_anonymous && (
                        <span
                          className="text-[10px] text-silver-slate/70"
                          title="Walking as Anonymous Pilgrim"
                        >
                          <EyeOff className="w-3 h-3 inline" />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-silver-slate">
                      {entry.campus || "Main Campus"}
                    </span>
                  </div>

                  {/* Steps Column */}
                  <div className="col-span-4 sm:col-span-3 text-right">
                    <div className="text-xs sm:text-sm font-mono font-bold text-accent-lime">
                      {entry.total_steps.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-silver-slate sm:hidden">
                      {entry.total_miles.toFixed(1)} mi
                    </div>
                  </div>

                  {/* Distance Miles Column (Desktop) */}
                  <div className="hidden sm:block sm:col-span-2 text-right font-mono text-xs text-silver-slate">
                    {entry.total_miles.toFixed(1)} mi
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
