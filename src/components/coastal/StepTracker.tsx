"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Footprints,
  Flame,
  Calendar,
  Clock,
  Compass,
  Zap,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Trophy,
  Sparkles,
  TrendingUp,
  Info,
  ChevronRight,
  Save,
  X,
  AlertCircle,
  Loader2,
  Lock,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { StepLog, UserStreak } from "@/types/coastal";
import {
  calculateMileage,
  calculateActiveMinutes,
  calculateCalories,
} from "@/lib/coastal/db";

export interface StepTrackerProps {
  userId?: string | null;
  groupId?: string;
  isAuthenticated?: boolean;
  initialLogs?: StepLog[];
  initialStreak?: UserStreak | null;
  onLogAdded?: (log: StepLog, newStreak?: UserStreak) => void;
  onOpenAuthModal?: () => void;
  className?: string;
}

const PRESET_STEPS = [1000, 2500, 5000, 10000];
const DEFAULT_DAILY_GOAL = 10000;
const GUEST_STORAGE_KEY = "coastal_guest_step_logs";

export default function StepTracker({
  userId,
  groupId = "3266-coastal-church",
  isAuthenticated = false,
  initialLogs = [],
  initialStreak = null,
  onLogAdded,
  onOpenAuthModal,
  className = "",
}: StepTrackerProps) {
  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [stepCountInput, setStepCountInput] = useState<string>("5000");
  const [notesInput, setNotesInput] = useState<string>("");
  const [dailyGoal, setDailyGoal] = useState<number>(DEFAULT_DAILY_GOAL);

  // Data State
  const [logs, setLogs] = useState<StepLog[]>(initialLogs);
  const [streak, setStreak] = useState<UserStreak>(
    initialStreak || {
      current_streak: 0,
      longest_streak: 0,
      total_days_logged: 0,
      last_log_date: null,
    }
  );

  // UI / Action State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editStepsInput, setEditStepsInput] = useState<string>("");
  const [editNotesInput, setEditNotesInput] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "7days" | "30days">("7days");

  // Load initial logs / localStorage guest state
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        const saved = localStorage.getItem(GUEST_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLogs(parsed);
            recalculateStreak(parsed);
          }
        }
      } catch (err) {
        console.warn("Could not read local guest step logs:", err);
      }
    } else if (initialLogs && initialLogs.length > 0) {
      setLogs(initialLogs);
    }
  }, [isAuthenticated, initialLogs]);

  // Recalculate streak helper for local client updates
  const recalculateStreak = (allLogs: StepLog[]) => {
    const activeDates = Array.from(
      new Set(allLogs.filter((l) => l.steps > 0).map((l) => l.log_date))
    ).sort();

    if (activeDates.length === 0) {
      setStreak({ current_streak: 0, longest_streak: 0, total_days_logged: 0, last_log_date: null });
      return;
    }

    let longest = 0;
    let temp = 1;

    for (let i = 1; i < activeDates.length; i++) {
      const prev = new Date(activeDates[i - 1] + "T00:00:00Z").getTime();
      const curr = new Date(activeDates[i] + "T00:00:00Z").getTime();
      const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        temp++;
      } else {
        longest = Math.max(longest, temp);
        temp = 1;
      }
    }
    longest = Math.max(longest, temp);

    const newStreakObj: UserStreak = {
      current_streak: temp,
      longest_streak: longest,
      total_days_logged: activeDates.length,
      last_log_date: activeDates[activeDates.length - 1],
    };

    setStreak(newStreakObj);
    return newStreakObj;
  };

  // Computed Values for Real-time display based on input
  const numericSteps = parseInt(stepCountInput, 10) || 0;
  const liveMileage = calculateMileage(numericSteps);
  const liveMinutes = calculateActiveMinutes(numericSteps);
  const liveCalories = calculateCalories(numericSteps);

  // Today's total logged steps
  const todayTotalSteps = useMemo(() => {
    const logToday = logs.find((l) => l.log_date === todayStr);
    return logToday ? logToday.steps : 0;
  }, [logs, todayStr]);

  const goalProgressPercentage = Math.min(100, Math.round((todayTotalSteps / dailyGoal) * 100));

  // Quick Preset Click Handler
  const handleQuickAdd = (preset: number) => {
    const current = parseInt(stepCountInput, 10) || 0;
    setStepCountInput(String(current + preset));
  };

  const handleSetPreset = (preset: number) => {
    setStepCountInput(String(preset));
  };

  // Submit Step Log Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericSteps <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a positive step count." });
      return;
    }
    if (numericSteps > 150000) {
      setStatusMessage({ type: "error", text: "Step count must be between 1 and 150,000." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const newLog: StepLog = {
      id: `log-${Date.now()}`,
      user_id: userId || "guest-user",
      group_id: groupId,
      log_date: selectedDate,
      steps: numericSteps,
      distance_miles: liveMileage,
      active_minutes: liveMinutes,
      calories_burned: liveCalories,
      source: "manual",
      notes: notesInput.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (isAuthenticated) {
        // Send to backend API
        const response = await fetch("/api/coastal/steps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            steps: numericSteps,
            logDate: selectedDate,
            distanceMiles: liveMileage,
            activeMinutes: liveMinutes,
            notes: notesInput.trim(),
            groupId,
          }),
        });

        const json = await response.json();
        if (!json.success) {
          throw new Error(json.error || "Failed to save steps on server.");
        }

        const serverLog = json.data?.log || newLog;
        const updatedLogs = [
          serverLog,
          ...logs.filter((l) => l.log_date !== selectedDate && l.id !== serverLog.id),
        ].sort((a, b) => b.log_date.localeCompare(a.log_date));

        setLogs(updatedLogs);
        if (json.data?.streak) {
          setStreak(json.data.streak);
        } else {
          recalculateStreak(updatedLogs);
        }

        if (onLogAdded) onLogAdded(serverLog, json.data?.streak);
      } else {
        // Guest mode: save locally
        const updatedLogs = [
          newLog,
          ...logs.filter((l) => l.log_date !== selectedDate),
        ].sort((a, b) => b.log_date.localeCompare(a.log_date));

        setLogs(updatedLogs);
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedLogs));
        const updatedStreak = recalculateStreak(updatedLogs);

        if (onLogAdded) onLogAdded(newLog, updatedStreak);
      }

      setStatusMessage({
        type: "success",
        text: `Logged ${numericSteps.toLocaleString()} steps (${liveMileage} mi) for ${selectedDate === todayStr ? "Today" : selectedDate}!`,
      });
      setNotesInput("");
    } catch (err: any) {
      console.warn("Step submission warning:", err);
      // Fallback local update
      const updatedLogs = [
        newLog,
        ...logs.filter((l) => l.log_date !== selectedDate),
      ].sort((a, b) => b.log_date.localeCompare(a.log_date));

      setLogs(updatedLogs);
      const updatedStreak = recalculateStreak(updatedLogs);
      setStatusMessage({
        type: "success",
        text: `Steps recorded (${numericSteps.toLocaleString()} steps) locally!`,
      });
      if (onLogAdded) onLogAdded(newLog, updatedStreak);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Log Handler
  const handleDeleteLog = async (logId: string) => {
    const toDelete = logs.find((l) => l.id === logId);
    if (!toDelete) return;

    try {
      if (isAuthenticated) {
        await fetch(`/api/coastal/steps?id=${logId}`, { method: "DELETE" });
      }
      const filtered = logs.filter((l) => l.id !== logId);
      setLogs(filtered);
      if (!isAuthenticated) {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(filtered));
      }
      recalculateStreak(filtered);
      setStatusMessage({ type: "success", text: "Log entry removed." });
    } catch (err) {
      console.warn("Error deleting log:", err);
    }
  };

  // Save Inline Edit Handler
  const handleSaveEdit = async (logId: string) => {
    const editSteps = parseInt(editStepsInput, 10);
    if (isNaN(editSteps) || editSteps <= 0 || editSteps > 150000) {
      return;
    }

    const target = logs.find((l) => l.id === logId);
    if (!target) return;

    const updatedLog: StepLog = {
      ...target,
      steps: editSteps,
      distance_miles: calculateMileage(editSteps),
      active_minutes: calculateActiveMinutes(editSteps),
      calories_burned: calculateCalories(editSteps),
      notes: editNotesInput.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (isAuthenticated) {
      try {
        await fetch("/api/coastal/steps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            steps: updatedLog.steps,
            logDate: updatedLog.log_date,
            notes: updatedLog.notes,
            groupId,
          }),
        });
      } catch (err) {
        console.warn("Edit API save error:", err);
      }
    }

    const updatedList = logs.map((l) => (l.id === logId ? updatedLog : l));
    setLogs(updatedList);
    if (!isAuthenticated) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedList));
    }
    recalculateStreak(updatedList);
    setEditingLogId(null);
    setStatusMessage({ type: "success", text: "Step entry updated." });
  };

  // Filtered logs for history display
  const displayedLogs = useMemo(() => {
    if (historyFilter === "7days") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      return logs.filter((l) => l.log_date >= sevenDaysAgo);
    }
    if (historyFilter === "30days") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      return logs.filter((l) => l.log_date >= thirtyDaysAgo);
    }
    return logs;
  }, [logs, historyFilter]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner: Streak & Daily Goal Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Active Walking Streak */}
        <div className="glass-panel-lime p-5 rounded-2xl border border-accent-lime/30 bg-[#0E0E14] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent-lime">
              Active Streak
            </span>
            <div className="p-2 rounded-xl bg-accent-lime/10 text-accent-lime">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-ice-white tracking-tight">
              {streak.current_streak}
            </span>
            <span className="text-sm font-medium text-silver-slate">Days Consecutive</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-silver-slate">
            <span>Longest: <strong className="text-ice-white">{streak.longest_streak} Days</strong></span>
            <span>Total Logged: <strong className="text-accent-lime">{streak.total_days_logged} Days</strong></span>
          </div>
        </div>

        {/* Card 2: Today's Goal Progress */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#0E0E14] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-silver-slate">
              Today&apos;s 10k Goal
            </span>
            <div className="p-2 rounded-xl bg-accent-lime/10 text-accent-lime">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-ice-white tracking-tight">
              {todayTotalSteps.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-silver-slate">/ {dailyGoal.toLocaleString()}</span>
          </div>
          {/* Linear Progress Bar */}
          <div className="mt-3 w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-lime to-[#E8D4A8] transition-all duration-500 rounded-full"
              style={{ width: `${goalProgressPercentage}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-silver-slate">
            <span>{goalProgressPercentage}% Completed</span>
            {todayTotalSteps >= dailyGoal ? (
              <span className="text-accent-lime font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Goal Met!
              </span>
            ) : (
              <span>{(dailyGoal - todayTotalSteps).toLocaleString()} steps left</span>
            )}
          </div>
        </div>

        {/* Card 3: Today's Dynamic Output */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#0E0E14] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-silver-slate">
              Today&apos;s Output
            </span>
            <div className="p-2 rounded-xl bg-accent-violet/10 text-accent-violet">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <div className="text-2xl font-bold text-ice-white">
                {calculateMileage(todayTotalSteps)}
              </div>
              <div className="text-xs text-silver-slate flex items-center gap-1 mt-0.5">
                <Compass className="w-3 h-3 text-accent-lime" /> Miles Walked
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-ice-white">
                {calculateActiveMinutes(todayTotalSteps)}
              </div>
              <div className="text-xs text-silver-slate flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-accent-violet" /> Active Mins
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-silver-slate flex items-center justify-between">
            <span>Est. Burn: <strong className="text-ice-white">{calculateCalories(todayTotalSteps)} kcal</strong></span>
            <span className="text-accent-lime">100 steps/min</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Step Entry Form Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0E0E14] relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-ice-white tracking-tight flex items-center gap-2">
              <Footprints className="w-6 h-6 text-accent-lime" />
              Log Daily Walking Steps
            </h3>
            <p className="text-xs sm:text-sm text-silver-slate mt-1">
              Record steps for today or past days. Calculates distance & minutes in real time.
            </p>
          </div>

          {/* Date Selector Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? "bg-accent-lime text-cyber-slate shadow-sm"
                  : "glass-panel border border-white/10 text-silver-slate hover:text-ice-white"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const yDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                setSelectedDate(yDate);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedDate !== todayStr && selectedDate === new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                  ? "bg-accent-lime text-cyber-slate shadow-sm"
                  : "glass-panel border border-white/10 text-silver-slate hover:text-ice-white"
              }`}
            >
              Yesterday
            </button>
            <div className="relative">
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-ice-white focus:outline-none focus:border-accent-lime cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-xs sm:text-sm ${
              statusMessage.type === "success"
                ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-200"
                : "bg-red-950/40 border border-red-500/30 text-red-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{statusMessage.text}</div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-silver-slate hover:text-ice-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick-Add Presets Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-silver-slate">
                Quick-Add Presets
              </span>
              <span className="text-xs text-silver-slate">Click to add to step total</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_STEPS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickAdd(preset)}
                  className="touch-target py-2.5 px-3 rounded-xl glass-panel border border-white/10 hover:border-accent-lime/40 hover:bg-accent-lime/10 text-xs font-semibold text-ice-white transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                >
                  <Plus className="w-3.5 h-3.5 text-accent-lime group-hover:scale-110 transition-transform" />
                  <span>+{preset.toLocaleString()} steps</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Numeric Input & Dynamic Conversion Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Input Field */}
            <div className="lg:col-span-6">
              <label htmlFor="step-count-input" className="block text-xs font-medium uppercase tracking-wider text-silver-slate mb-2">
                Step Count for {selectedDate === todayStr ? "Today" : selectedDate}
              </label>
              <div className="relative">
                <Footprints className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-lime pointer-events-none" />
                <input
                  id="step-count-input"
                  type="number"
                  min="1"
                  max="150000"
                  required
                  placeholder="e.g. 8420"
                  value={stepCountInput}
                  onChange={(e) => setStepCountInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-ice-white text-lg font-bold placeholder:text-silver-slate/40 focus:outline-none focus:border-accent-lime focus:ring-1 focus:ring-accent-lime transition-colors"
                />
              </div>
            </div>

            {/* Live Distance & Active Minutes Real-time Badges */}
            <div className="lg:col-span-6 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center">
                <span className="text-xs text-silver-slate uppercase font-medium">Distance</span>
                <span className="text-lg font-bold text-accent-lime mt-0.5">{liveMileage}</span>
                <span className="text-[11px] text-silver-slate">miles</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center">
                <span className="text-xs text-silver-slate uppercase font-medium">Walking Time</span>
                <span className="text-lg font-bold text-ice-white mt-0.5">{liveMinutes}</span>
                <span className="text-[11px] text-silver-slate">minutes</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center">
                <span className="text-xs text-silver-slate uppercase font-medium">Calories</span>
                <span className="text-lg font-bold text-accent-violet mt-0.5">{liveCalories}</span>
                <span className="text-[11px] text-silver-slate">kcal</span>
              </div>
            </div>
          </div>

          {/* Optional Walking Notes / Prayer Intentions */}
          <div>
            <label htmlFor="walk-notes-input" className="block text-xs font-medium uppercase tracking-wider text-silver-slate mb-2">
              Walk Notes / Prayer Reflection (Optional)
            </label>
            <input
              id="walk-notes-input"
              type="text"
              placeholder="e.g. Sunrise prayer walk by the church pier, prayed for health & healing."
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-ice-white text-sm placeholder:text-silver-slate/40 focus:outline-none focus:border-accent-lime transition-colors"
            />
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || numericSteps <= 0}
              className="touch-target flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-cyber-slate bg-accent-lime hover:bg-[#E8D4A8] disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-accent-lime/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyber-slate" />
                  <span>Recording Steps...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-cyber-slate" />
                  <span>Save Step Entry ({numericSteps.toLocaleString()} steps)</span>
                </>
              )}
            </button>

            {!isAuthenticated && onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="touch-target px-4 py-3.5 rounded-xl border border-white/15 hover:border-accent-lime/40 text-xs font-medium text-silver-slate hover:text-ice-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-accent-lime" />
                <span>Sign in to sync to church goal</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Step Log History Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0E0E14]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-ice-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-lime" />
              Activity Log History
            </h4>
            <p className="text-xs text-silver-slate mt-0.5">
              Review your logged walks, edit entries, or monitor consistency.
            </p>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setHistoryFilter("7days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                historyFilter === "7days"
                  ? "bg-accent-lime text-cyber-slate font-semibold"
                  : "text-silver-slate hover:text-ice-white"
              }`}
            >
              Past 7 Days
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter("30days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                historyFilter === "30days"
                  ? "bg-accent-lime text-cyber-slate font-semibold"
                  : "text-silver-slate hover:text-ice-white"
              }`}
            >
              Past 30 Days
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                historyFilter === "all"
                  ? "bg-accent-lime text-cyber-slate font-semibold"
                  : "text-silver-slate hover:text-ice-white"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Log Entries List */}
        {displayedLogs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5">
            <Footprints className="w-8 h-8 text-silver-slate/40 mx-auto mb-2" />
            <p className="text-sm text-silver-slate">No step logs found for this timeframe.</p>
            <p className="text-xs text-silver-slate/70 mt-1">Use the logger above to record your first steps!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedLogs.map((log) => {
              const isEditing = editingLogId === log.id;

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-accent-lime/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {isEditing ? (
                    <div className="w-full space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-silver-slate mb-1">Step Count</label>
                          <input
                            type="number"
                            min="1"
                            max="150000"
                            value={editStepsInput}
                            onChange={(e) => setEditStepsInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-ice-white text-sm focus:outline-none focus:border-accent-lime"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-silver-slate mb-1">Notes</label>
                          <input
                            type="text"
                            value={editNotesInput}
                            onChange={(e) => setEditNotesInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-ice-white text-sm focus:outline-none focus:border-accent-lime"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingLogId(null)}
                          className="px-3 py-1.5 rounded-lg border border-white/15 text-xs text-silver-slate hover:text-ice-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(log.id)}
                          className="px-3 py-1.5 rounded-lg bg-accent-lime text-cyber-slate font-semibold text-xs hover:bg-[#E8D4A8]"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Left: Date & Steps */}
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-accent-lime/10 text-accent-lime shrink-0">
                          <Footprints className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-ice-white">
                              {log.steps.toLocaleString()} steps
                            </span>
                            {log.steps >= dailyGoal && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-lime/15 text-accent-lime text-[11px] font-medium">
                                <Trophy className="w-3 h-3" /> Goal Met
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-silver-slate mt-0.5 flex items-center gap-2">
                            <span>{log.log_date}</span>
                            <span>•</span>
                            <span>{log.distance_miles} miles</span>
                            <span>•</span>
                            <span>{log.active_minutes} min</span>
                          </div>
                          {log.notes && (
                            <p className="text-xs text-silver-slate/90 italic mt-1 bg-white/5 px-2.5 py-1 rounded-md">
                              &ldquo;{log.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLogId(log.id);
                            setEditStepsInput(String(log.steps));
                            setEditNotesInput(log.notes || "");
                          }}
                          className="p-2 rounded-lg text-silver-slate hover:text-accent-lime hover:bg-white/5 transition-colors cursor-pointer"
                          title="Edit step entry"
                          aria-label="Edit step entry"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-2 rounded-lg text-silver-slate hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                          title="Delete entry"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
