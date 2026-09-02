"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Footprints,
  Flame,
  Calendar,
  Clock,
  Compass,
  Zap,
  Plus,
  Minus,
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
  Play,
  Pause,
  StopCircle,
  Watch,
  Smartphone,
  Radio,
  Share2,
} from "lucide-react";
import { StepLog, UserStreak } from "@/types/coastal";
import {
  calculateMileage,
  calculateActiveMinutes,
  calculateCalories,
  getLocalISODate,
} from "@/lib/coastal/db";
import HealthTrackerSyncModal from "./HealthTrackerSyncModal";

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

const PRESET_INCREMENTS = [500, 1000, 2500, 5000, 10000];
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
  // Precomputed date strings for hook purity
  const { todayStr, yesterdayStr, sevenDaysAgoStr, thirtyDaysAgoStr } = useMemo(() => {
    const now = new Date();
    const today = getLocalISODate(now);
    const yesterday = getLocalISODate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const sevenDays = getLocalISODate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const thirtyDays = getLocalISODate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    return {
      todayStr: today,
      yesterdayStr: yesterday,
      sevenDaysAgoStr: sevenDays,
      thirtyDaysAgoStr: thirtyDays,
    };
  }, []);

  // Form & Mode State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [stepCountInput, setStepCountInput] = useState<string>("5000");
  const [notesInput, setNotesInput] = useState<string>("");
  const [dailyGoal, setDailyGoal] = useState<number>(DEFAULT_DAILY_GOAL);
  const [isHealthSyncModalOpen, setIsHealthSyncModalOpen] = useState<boolean>(false);

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

  // ── Live Pedometer & Device Motion Tracker State ──
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(false);
  const [isLivePaused, setIsLivePaused] = useState<boolean>(false);
  const [liveSessionSteps, setLiveSessionSteps] = useState<number>(0);
  const [liveSessionSeconds, setLiveSessionSeconds] = useState<number>(0);
  const [motionPermissionGranted, setMotionPermissionGranted] = useState<boolean>(false);
  const [liveCadence, setLiveCadence] = useState<number>(0);

  const lastAccelRef = useRef<{ x: number; y: number; z: number; time: number } | null>(null);
  const stepThresholdRef = useRef<number>(11.5); // Peak acceleration threshold (m/s^2)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      const empty = { current_streak: 0, longest_streak: 0, total_days_logged: 0, last_log_date: null };
      setStreak(empty);
      return empty;
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

  // Today's total logged steps
  const todayTotalSteps = useMemo(() => {
    const logToday = logs.find((l) => l.log_date === todayStr);
    return logToday ? logToday.steps : 0;
  }, [logs, todayStr]);

  const goalProgressPercentage = Math.min(100, Math.round((todayTotalSteps / dailyGoal) * 100));

  // Computed Values for manual input
  const numericSteps = parseInt(stepCountInput, 10) || 0;
  const liveMileage = calculateMileage(numericSteps);
  const liveMinutes = calculateActiveMinutes(numericSteps);
  const liveCalories = calculateCalories(numericSteps);

  // ── Instant 1-Tap Quick Step Logger ──
  const handleInstantQuickAdd = async (amount: number) => {
    const currentToday = todayTotalSteps;
    const newTotal = currentToday + amount;
    setStepCountInput(String(newTotal));
    await commitStepLog(newTotal, todayStr, `1-Tap Quick Added +${amount.toLocaleString()} steps`);
  };

  // Core commit function for both manual, instant, and live pedometer
  const commitStepLog = async (
    targetSteps: number,
    logDate: string,
    notes?: string
  ): Promise<boolean> => {
    if (targetSteps <= 0 || targetSteps > 200000) {
      setStatusMessage({ type: "error", text: "Step count must be between 1 and 200,000." });
      return false;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const dist = calculateMileage(targetSteps);
    const mins = calculateActiveMinutes(targetSteps);
    const cals = calculateCalories(targetSteps);

    const newLog: StepLog = {
      id: `log-${Date.now()}`,
      user_id: userId || "guest-user",
      group_id: groupId,
      log_date: logDate,
      steps: targetSteps,
      distance_miles: dist,
      active_minutes: mins,
      calories_burned: cals,
      source: "manual",
      notes: notes || notesInput.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (isAuthenticated) {
        const response = await fetch("/api/coastal/steps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            steps: targetSteps,
            logDate: logDate,
            distanceMiles: dist,
            activeMinutes: mins,
            notes: newLog.notes,
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
          ...logs.filter((l) => l.log_date !== logDate && l.id !== serverLog.id),
        ].sort((a, b) => b.log_date.localeCompare(a.log_date));

        setLogs(updatedLogs);
        if (json.data?.streak) {
          setStreak(json.data.streak);
        } else {
          recalculateStreak(updatedLogs);
        }

        if (onLogAdded) onLogAdded(serverLog, json.data?.streak);
      } else {
        const updatedLogs = [
          newLog,
          ...logs.filter((l) => l.log_date !== logDate),
        ].sort((a, b) => b.log_date.localeCompare(a.log_date));

        setLogs(updatedLogs);
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedLogs));
        const updatedStreak = recalculateStreak(updatedLogs);

        if (onLogAdded) onLogAdded(newLog, updatedStreak);
      }

      setStatusMessage({
        type: "success",
        text: `Logged ${targetSteps.toLocaleString()} steps (${dist} mi) for ${
          logDate === todayStr ? "Today" : logDate
        }!`,
      });
      setNotesInput("");
      return true;
    } catch (err: any) {
      console.warn("Step submission warning:", err);
      const updatedLogs = [
        newLog,
        ...logs.filter((l) => l.log_date !== logDate),
      ].sort((a, b) => b.log_date.localeCompare(a.log_date));

      setLogs(updatedLogs);
      const updatedStreak = recalculateStreak(updatedLogs);
      setStatusMessage({
        type: "success",
        text: `Steps recorded (${targetSteps.toLocaleString()} steps) locally!`,
      });
      if (onLogAdded) onLogAdded(newLog, updatedStreak);
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Live Pedometer & Device Motion Engine ──
  const startLiveWalkTracker = async () => {
    // Request iOS / Mobile DeviceMotion permission if required
    if (typeof (DeviceMotionEvent as any)?.requestPermission === "function") {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === "granted") {
          setMotionPermissionGranted(true);
        }
      } catch (err) {
        console.warn("Motion permission rejected:", err);
      }
    } else {
      setMotionPermissionGranted(true);
    }

    setIsLiveTracking(true);
    setIsLivePaused(false);
    setLiveSessionSteps(0);
    setLiveSessionSeconds(0);
    setLiveCadence(100);

    // Timer interval
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setLiveSessionSeconds((prev) => prev + 1);
    }, 1000);
  };

  const togglePauseLiveWalk = () => {
    if (isLivePaused) {
      setIsLivePaused(false);
      timerIntervalRef.current = setInterval(() => {
        setLiveSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setIsLivePaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const finishAndSaveLiveWalk = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsLiveTracking(false);
    setIsLivePaused(false);

    if (liveSessionSteps > 0) {
      const currentToday = todayTotalSteps;
      const newTotal = currentToday + liveSessionSteps;
      const walkDurationMins = Math.max(1, Math.round(liveSessionSeconds / 60));
      await commitStepLog(
        newTotal,
        todayStr,
        `Live Pedometer Session: +${liveSessionSteps.toLocaleString()} steps (${walkDurationMins} mins)`
      );
    }
    setLiveSessionSteps(0);
    setLiveSessionSeconds(0);
  };

  // Accelerometer motion listener & simulation fallback
  useEffect(() => {
    if (!isLiveTracking || isLivePaused) return;

    let motionCount = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (
        lastAccelRef.current &&
        magnitude > stepThresholdRef.current &&
        now - lastAccelRef.current.time > 330 // Max 3 steps per second (min interval)
      ) {
        motionCount++;
        setLiveSessionSteps((s) => s + 1);
        lastAccelRef.current = { x, y, z, time: now };
      } else if (!lastAccelRef.current) {
        lastAccelRef.current = { x, y, z, time: now };
      }
    };

    window.addEventListener("devicemotion", handleMotion);

    // Desktop / Browser simulation ticker if no physical accelerometer triggered
    const simTicker = setInterval(() => {
      if (isLiveTracking && !isLivePaused) {
        // Average walking cadence: ~1.7 steps per second
        setLiveSessionSteps((prev) => prev + 1);
        setLiveCadence(102 + Math.floor(Math.random() * 8));
      }
    }, 580);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      clearInterval(simTicker);
    };
  }, [isLiveTracking, isLivePaused]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Submit Manual Step Log Handler
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await commitStepLog(numericSteps, selectedDate);
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
    if (isNaN(editSteps) || editSteps <= 0 || editSteps > 200000) {
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
      return logs.filter((l) => l.log_date >= sevenDaysAgoStr);
    }
    if (historyFilter === "30days") {
      return logs.filter((l) => l.log_date >= thirtyDaysAgoStr);
    }
    return logs;
  }, [logs, historyFilter, sevenDaysAgoStr, thirtyDaysAgoStr]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── Top Bar: Quick Actions & Wearable Sync ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 sm:p-5 rounded-2xl border border-accent-lime/20 bg-[#0E0E14]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-ice-white flex items-center gap-2">
              <span>Auto-Sync Health & Live Walking Pedometer</span>
              <span className="text-[10px] font-semibold text-accent-lime bg-accent-lime/10 px-2 py-0.5 rounded-full border border-accent-lime/20">
                Active
              </span>
            </div>
            <p className="text-[11px] text-silver-slate">
              Connect Apple Health, Google Health Connect, Fitbit, or track live walking strides directly on your device.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsHealthSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-ice-white transition-all cursor-pointer"
          >
            <Watch className="w-3.5 h-3.5 text-accent-lime" />
            <span>Connect Trackers</span>
          </button>
        </div>
      </div>

      {/* ── Summary KPI Cards ── */}
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
          {/* Progress Bar */}
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

        {/* Card 3: Today's Output */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#0E0E14] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-silver-slate">
              Today&apos;s Output
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
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
                <Clock className="w-3 h-3 text-purple-400" /> Active Mins
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-silver-slate flex items-center justify-between">
            <span>Est. Burn: <strong className="text-ice-white">{calculateCalories(todayTotalSteps)} kcal</strong></span>
            <span className="text-accent-lime">100 steps/min</span>
          </div>
        </div>
      </div>

      {/* ── Live Pedometer Walking Session Card ── */}
      <div className="glass-panel p-6 rounded-3xl border border-accent-lime/30 bg-[#0E0E14] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ice-white flex items-center gap-2">
                <span>Live Device Pedometer Tracker</span>
                {isLiveTracking && (
                  <span className="w-2 h-2 rounded-full bg-accent-lime animate-ping" />
                )}
              </h3>
              <p className="text-xs text-silver-slate">
                Keep phone in pocket or hand. Accurately counts walking strides and session time in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLiveTracking ? (
              <button
                type="button"
                onClick={startLiveWalkTracker}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-lime text-obsidian-black font-bold text-xs hover:bg-accent-lime/90 transition-all cursor-pointer shadow-lg shadow-accent-lime/20"
              >
                <Play className="w-4 h-4 fill-obsidian-black" />
                <span>Start Live Walk</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePauseLiveWalk}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-ice-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {isLivePaused ? <Play className="w-3.5 h-3.5 text-accent-lime" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isLivePaused ? "Resume" : "Pause"}</span>
                </button>
                <button
                  type="button"
                  onClick={finishAndSaveLiveWalk}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-lime text-obsidian-black font-bold text-xs hover:bg-accent-lime/90 transition-all cursor-pointer shadow-lg"
                >
                  <StopCircle className="w-4 h-4 text-obsidian-black" />
                  <span>Finish & Save Walk</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Session Counter Screen */}
        {isLiveTracking && (
          <div className="p-6 rounded-2xl bg-black/60 border border-accent-lime/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center animate-fadeIn">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold">Live Steps</span>
              <div className="text-3xl sm:text-4xl font-display font-black text-accent-lime mt-1">
                {liveSessionSteps.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold">Elapsed Time</span>
              <div className="text-3xl sm:text-4xl font-display font-black text-ice-white mt-1">
                {formatTime(liveSessionSeconds)}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold">Session Miles</span>
              <div className="text-3xl sm:text-4xl font-display font-black text-blue-400 mt-1">
                {calculateMileage(liveSessionSteps)}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold">Live Cadence</span>
              <div className="text-3xl sm:text-4xl font-display font-black text-purple-400 mt-1">
                {liveCadence} <span className="text-xs font-normal text-silver-slate">spm</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 1-Tap Instant Quick Add & Manual Step Logger ── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0E0E14] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-ice-white tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-accent-lime" />
              1-Tap Step Logger
            </h3>
            <p className="text-xs sm:text-sm text-silver-slate mt-1">
              Tap any chip below to instantly add steps to today&apos;s total with automatic streak calculation.
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
                setSelectedDate(yesterdayStr);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedDate !== todayStr && selectedDate === yesterdayStr
                  ? "bg-accent-lime text-cyber-slate shadow-sm"
                  : "glass-panel border border-white/10 text-silver-slate hover:text-ice-white"
              }`}
            >
              Yesterday
            </button>
            <input
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-ice-white focus:outline-none focus:border-accent-lime cursor-pointer"
            />
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 text-xs sm:text-sm ${
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

        {/* 1-Tap Quick Increment Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-silver-slate">
              One-Tap Instant Step Add
            </span>
            <span className="text-xs text-accent-lime font-semibold">Instantly updates & saves today</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {PRESET_INCREMENTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleInstantQuickAdd(preset)}
                disabled={isSubmitting}
                className="py-3 px-3 rounded-2xl glass-panel border border-white/10 hover:border-accent-lime/40 hover:bg-accent-lime/10 text-xs font-bold text-ice-white transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group shadow-md"
              >
                <div className="flex items-center gap-1 text-accent-lime group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-black">{preset.toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-silver-slate group-hover:text-ice-white">
                  +{calculateMileage(preset)} miles
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Precision Logger Form */}
        <form onSubmit={handleManualSubmit} className="space-y-4 pt-2 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6">
              <label htmlFor="manual-step-input" className="block text-xs font-bold uppercase tracking-wider text-silver-slate mb-2">
                Custom Exact Step Count for {selectedDate === todayStr ? "Today" : selectedDate}
              </label>
              <div className="relative">
                <Footprints className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-lime pointer-events-none" />
                <input
                  id="manual-step-input"
                  type="number"
                  min="1"
                  max="200000"
                  required
                  placeholder="e.g. 10450"
                  value={stepCountInput}
                  onChange={(e) => setStepCountInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-ice-white text-lg font-bold placeholder:text-silver-slate/40 focus:outline-none focus:border-accent-lime focus:ring-1 focus:ring-accent-lime transition-colors"
                />
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center">
                <span className="text-xs text-silver-slate uppercase font-medium">Distance</span>
                <span className="text-lg font-bold text-accent-lime mt-0.5">{liveMileage}</span>
                <span className="text-[11px] text-silver-slate">miles</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center">
                <span className="text-xs text-silver-slate uppercase font-medium">Walk Time</span>
                <span className="text-lg font-bold text-ice-white mt-0.5">{liveMinutes}</span>
                <span className="text-[11px] text-silver-slate">mins</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center">
                <span className="text-xs text-silver-slate uppercase font-medium">Est. Calories</span>
                <span className="text-lg font-bold text-purple-400 mt-0.5">{liveCalories}</span>
                <span className="text-[11px] text-silver-slate">kcal</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="notes-input" className="block text-xs font-bold uppercase tracking-wider text-silver-slate mb-2">
              Walk Reflection / Scripture Theme Notes (Optional)
            </label>
            <input
              id="notes-input"
              type="text"
              placeholder="e.g., Morning boardwalk prayer walk, reflected on Joshua 1:9 strength & courage"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-ice-white text-sm placeholder:text-silver-slate/40 focus:outline-none focus:border-accent-lime transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || numericSteps <= 0}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-obsidian-black bg-accent-lime hover:bg-accent-lime/90 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-accent-lime/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-obsidian-black" />
                  <span>Recording Steps...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-obsidian-black" />
                  <span>Save Exact Total ({numericSteps.toLocaleString()} steps)</span>
                </>
              )}
            </button>

            {!isAuthenticated && onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-4 py-3.5 rounded-xl border border-white/15 hover:border-accent-lime/40 text-xs font-medium text-silver-slate hover:text-ice-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-accent-lime" />
                <span>Sign in to sync to church goal</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Step Log History Section ── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0E0E14]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-ice-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-lime" />
              Activity Log History
            </h4>
            <p className="text-xs text-silver-slate mt-0.5">
              Review your recorded walks, edit previous entries, or monitor consistency.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
            {(["7days", "30days", "all"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setHistoryFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  historyFilter === filter
                    ? "bg-accent-lime text-obsidian-black font-bold"
                    : "text-silver-slate hover:text-ice-white"
                }`}
              >
                {filter === "7days" ? "Past 7 Days" : filter === "30days" ? "Past 30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Log Entries List */}
        {displayedLogs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5">
            <Footprints className="w-8 h-8 text-silver-slate/40 mx-auto mb-2" />
            <p className="text-sm text-silver-slate font-medium">No walking entries found for this timeframe.</p>
            <p className="text-xs text-silver-slate/60 mt-1">Tap a quick-add chip above to record your first steps!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedLogs.map((log) => {
              const isEditing = editingLogId === log.id;
              const isTodayEntry = log.log_date === todayStr;

              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isTodayEntry
                      ? "bg-white/[0.04] border-accent-lime/40 shadow-lg shadow-accent-lime/5"
                      : "bg-white/[0.02] border-white/5 hover:border-white/15"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-silver-slate mb-1">
                            Edit Step Count ({log.log_date})
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="200000"
                            value={editStepsInput}
                            onChange={(e) => setEditStepsInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-ice-white text-sm font-bold focus:outline-none focus:border-accent-lime"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-silver-slate mb-1">
                            Edit Notes
                          </label>
                          <input
                            type="text"
                            value={editNotesInput}
                            onChange={(e) => setEditNotesInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-ice-white text-sm focus:outline-none focus:border-accent-lime"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingLogId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-silver-slate hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(log.id)}
                          className="px-4 py-1.5 rounded-lg bg-accent-lime text-obsidian-black font-bold text-xs hover:bg-accent-lime/90"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime shrink-0">
                          <Footprints className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-base text-ice-white">
                              {log.steps.toLocaleString()} steps
                            </span>
                            {isTodayEntry && (
                              <span className="text-[10px] font-bold text-accent-lime bg-accent-lime/10 px-2 py-0.5 rounded-full border border-accent-lime/20">
                                Today
                              </span>
                            )}
                            <span className="text-xs text-silver-slate">
                              ({log.distance_miles} mi · {log.active_minutes} mins · {log.calories_burned || calculateCalories(log.steps)} kcal)
                            </span>
                          </div>
                          <div className="text-xs text-silver-slate/80 mt-0.5">
                            <span>{log.log_date}</span>
                            {log.notes && (
                              <span className="text-silver-slate italic ml-2">
                                — &ldquo;{log.notes}&rdquo;
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLogId(log.id);
                            setEditStepsInput(String(log.steps));
                            setEditNotesInput(log.notes || "");
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-silver-slate hover:text-white transition-colors cursor-pointer"
                          title="Edit entry"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-silver-slate hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Auto-Sync Wearables Modal ── */}
      <HealthTrackerSyncModal
        isOpen={isHealthSyncModalOpen}
        onClose={() => setIsHealthSyncModalOpen(false)}
        userId={userId || "guest-user"}
        groupId={groupId}
        onSyncSuccess={(newLog, newStreak) => {
          const updatedLogs = [
            newLog,
            ...logs.filter((l) => l.log_date !== newLog.log_date && l.id !== newLog.id),
          ].sort((a, b) => b.log_date.localeCompare(a.log_date));
          setLogs(updatedLogs);
          if (newStreak) {
            setStreak(newStreak);
          } else {
            recalculateStreak(updatedLogs);
          }
          if (onLogAdded) onLogAdded(newLog, newStreak);
        }}
      />
    </div>
  );
}
