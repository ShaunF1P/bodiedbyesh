"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  BookOpen,
  Sparkles,
  Footprints,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Save,
  Share2,
  Check,
  CheckCircle2,
  Volume2,
  VolumeX,
  Copy,
  HeartHandshake,
  Flame,
  RefreshCw,
  Clock,
  Shield,
} from "lucide-react";
import { FaithDevotional, DevotionalReflection } from "@/types/coastal";
import {
  DEVOTIONALS_DATA,
  getDevotionalByDay,
  getDevotionalForDate,
} from "@/lib/coastal/devotionals-data";
import { saveReflection, getReflections } from "@/lib/coastal/db";

interface ScriptureCardProps {
  initialDay?: number;
  userId?: string;
  groupId?: string;
  onReflectionSaved?: (reflection: DevotionalReflection) => void;
  className?: string;
}

export default function ScriptureCard({
  initialDay,
  userId = "guest-user",
  groupId = "3266-coastal-church",
  onReflectionSaved,
  className = "",
}: ScriptureCardProps) {
  // Determine starting day (1-14)
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    if (initialDay && initialDay >= 1 && initialDay <= 14) {
      return initialDay;
    }
    const todayDevotional = getDevotionalForDate(new Date());
    return todayDevotional.day_number;
  });

  const [devotional, setDevotional] = useState<FaithDevotional>(() =>
    getDevotionalByDay(selectedDay)
  );

  // Reflection journal state
  const [reflectionText, setReflectionText] = useState<string>("");
  const [isSharedToFeed, setIsSharedToFeed] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [copiedScripture, setCopiedScripture] = useState<boolean>(false);
  const [actionCompleted, setActionCompleted] = useState<boolean>(false);

  // Audio text-to-speech state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);

  const [, startTransition] = useTransition();

  // Check speech synthesis support on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSpeechSupported(true);
    }
  }, []);

  // Update current devotional when day changes
  useEffect(() => {
    const nextDev = getDevotionalByDay(selectedDay);
    setDevotional(nextDev);
    setSaveStatus("idle");

    // Load saved reflection for this day from localStorage or DB
    const storageKey = `coastal_reflection_${userId}_day_${selectedDay}`;
    try {
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        setReflectionText(parsed.text || "");
        setIsSharedToFeed(Boolean(parsed.isShared));
      } else {
        setReflectionText("");
        setIsSharedToFeed(false);
      }
    } catch {
      setReflectionText("");
    }

    // Load action completed state
    const actionKey = `coastal_action_done_${userId}_day_${selectedDay}`;
    try {
      const completed = localStorage.getItem(actionKey) === "true";
      setActionCompleted(completed);
    } catch {
      setActionCompleted(false);
    }

    // Stop speaking if switching days
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [selectedDay, userId]);

  // Handle Day Navigation
  const handlePrevDay = () => {
    setSelectedDay((prev) => (prev > 1 ? prev - 1 : 14));
  };

  const handleNextDay = () => {
    setSelectedDay((prev) => (prev < 14 ? prev + 1 : 1));
  };

  const handleSetToday = () => {
    const todayDev = getDevotionalForDate(new Date());
    setSelectedDay(todayDev.day_number);
  };

  // Copy scripture text to clipboard
  const handleCopyScripture = async () => {
    try {
      const textToCopy = `"${devotional.scripture_text}"\n— ${devotional.scripture_ref}\n(Walking by Faith — Coastal Community Church #3266)`;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedScripture(true);
      setTimeout(() => setCopiedScripture(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Toggle Action Challenge Completed
  const handleToggleActionCompleted = () => {
    const nextState = !actionCompleted;
    setActionCompleted(nextState);
    const actionKey = `coastal_action_done_${userId}_day_${selectedDay}`;
    try {
      localStorage.setItem(actionKey, String(nextState));
    } catch {
      // Ignore storage errors
    }
  };

  // Handle Text-to-Speech Audio Playback
  const handleToggleSpeech = () => {
    if (!speechSupported || typeof window === "undefined") return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Clear any existing queue
    const speechContent = `Day ${devotional.day_number}. ${devotional.title}. Scripture: ${devotional.scripture_ref}. ${devotional.scripture_text}. Reflection: ${devotional.reflection_prompt}. Prayer: ${devotional.prayer_focus}. Walking Challenge: ${devotional.walking_action}`;

    const utterance = new SpeechSynthesisUtterance(speechContent);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Save Reflection Handler
  const handleSaveReflection = async () => {
    if (!reflectionText.trim()) return;

    setIsSaving(true);
    setSaveStatus("idle");

    const storageKey = `coastal_reflection_${userId}_day_${selectedDay}`;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          text: reflectionText.trim(),
          isShared: isSharedToFeed,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Fallback
    }

    try {
      const res = await saveReflection({
        userId,
        devotionalId: devotional.id,
        dayNumber: devotional.day_number,
        reflectionText: reflectionText.trim(),
        groupId,
        isShared: isSharedToFeed,
      });

      if (res.success && res.reflection) {
        setSaveStatus("saved");
        if (onReflectionSaved) {
          onReflectionSaved(res.reflection);
        }
      } else {
        setSaveStatus("saved"); // Local fallback succeeded
      }
    } catch {
      setSaveStatus("saved"); // Local fallback succeeded
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3500);
    }
  };

  return (
    <div
      className={`glass-panel border border-white/10 rounded-2xl p-5 sm:p-7 md:p-8 bg-onyx-card/85 relative overflow-hidden ${className}`}
      data-testid="scripture-devotional-card"
    >
      {/* Background Subtle Accent Glow */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent-lime/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Header: Curriculum Title, Day Selector & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-lime/10 border border-accent-lime/20 flex items-center justify-center text-accent-lime">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-accent-lime font-display">
                Walking by Faith
              </span>
              <span className="text-white/20">•</span>
              <span className="text-[11px] font-medium text-silver-slate">
                14-Day Curriculum
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-ice-white">
              Day {devotional.day_number}: {devotional.title}
            </h2>
          </div>
        </div>

        {/* Day Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSetToday}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-silver-slate hover:text-ice-white transition-all flex items-center gap-1.5 touch-target"
            title="Jump to Today's Devotional"
          >
            <Calendar className="w-3.5 h-3.5 text-accent-lime" />
            <span>Today</span>
          </button>

          {speechSupported && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`p-2 rounded-lg text-xs font-medium border transition-all touch-target flex items-center justify-center ${
                isSpeaking
                  ? "bg-accent-lime/20 border-accent-lime text-accent-lime animate-pulse"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-silver-slate hover:text-ice-white"
              }`}
              title={isSpeaking ? "Stop Audio" : "Listen to Devotional"}
              aria-label={isSpeaking ? "Stop Audio" : "Listen to Devotional"}
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          )}

          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-md hover:bg-white/10 text-silver-slate hover:text-ice-white transition-colors touch-target flex items-center justify-center"
              aria-label="Previous Day Devotional"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs font-mono font-bold text-accent-lime">
              {selectedDay}/14
            </span>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-md hover:bg-white/10 text-silver-slate hover:text-ice-white transition-colors touch-target flex items-center justify-center"
              aria-label="Next Day Devotional"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 14-Day Micro Navigation Pills */}
      <div className="py-3 overflow-x-auto scrollbar-hide flex items-center gap-1.5 border-b border-white/5">
        {DEVOTIONALS_DATA.map((d) => {
          const isCurrent = d.day_number === selectedDay;
          return (
            <button
              key={`nav-day-${d.day_number}`}
              type="button"
              onClick={() => setSelectedDay(d.day_number)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                isCurrent
                  ? "bg-accent-lime text-cyber-slate shadow-sm shadow-accent-lime/20"
                  : "bg-white/5 text-silver-slate hover:text-ice-white hover:bg-white/10"
              }`}
            >
              D{d.day_number}
            </button>
          );
        })}
      </div>

      {/* Theme Pill */}
      <div className="mt-5 flex items-center gap-2">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-accent-lime/10 text-accent-lime border border-accent-lime/20">
          Theme: {devotional.theme}
        </span>
      </div>

      {/* Scripture Verbatim Card */}
      <div className="mt-4 rounded-xl bg-cyber-slate/90 border border-white/5 p-4 sm:p-5 relative group">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-lime shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-lime font-display">
                {devotional.scripture_ref}
              </span>
            </div>
            <p className="text-sm sm:text-base font-light italic leading-relaxed text-ice-white/95 whitespace-pre-line pl-6 border-l-2 border-accent-lime/40">
              {devotional.scripture_text}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyScripture}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-silver-slate hover:text-ice-white transition-all shrink-0 touch-target flex items-center justify-center"
            title="Copy Scripture"
            aria-label="Copy Scripture"
          >
            {copiedScripture ? (
              <Check className="w-4 h-4 text-accent-lime" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content Grid: Reflection Commentary & Guided Prayer */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reflection Commentary & Prompt */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-silver-slate text-xs font-semibold uppercase tracking-wider">
              <HeartHandshake className="w-4 h-4 text-accent-lime" />
              <span>Spiritual Reflection</span>
            </div>
            <p className="text-xs sm:text-sm text-silver-slate leading-relaxed">
              {devotional.reflection_prompt}
            </p>
          </div>
        </div>

        {/* Guided Prayer Focus */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-silver-slate text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-4 h-4 text-accent-lime" />
              <span>Guided Prayer</span>
            </div>
            <p className="text-xs sm:text-sm text-silver-slate leading-relaxed italic">
              &quot;{devotional.prayer_focus}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Physical Walking Challenge Action Box */}
      <div
        className={`mt-4 p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          actionCompleted
            ? "bg-accent-lime/10 border-accent-lime/30"
            : "bg-white/[0.03] border-white/10"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              actionCompleted
                ? "bg-accent-lime text-cyber-slate"
                : "bg-accent-lime/15 text-accent-lime"
            }`}
          >
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ice-white font-display">
                Physical Walking Prompt
              </span>
              {actionCompleted && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-lime text-cyber-slate uppercase">
                  Completed
                </span>
              )}
            </div>
            <p className="text-xs text-silver-slate mt-0.5 leading-normal">
              {devotional.walking_action}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleActionCompleted}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 touch-target ${
            actionCompleted
              ? "bg-accent-lime text-cyber-slate font-bold hover:bg-accent-lime/90"
              : "bg-white/10 hover:bg-white/15 text-ice-white border border-white/10"
          }`}
        >
          {actionCompleted ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Conquered</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Private Reflection Journal */}
      <div className="mt-6 pt-5 border-t border-white/5">
        <div className="flex items-center justify-between mb-2.5">
          <label
            htmlFor="devotional-reflection-input"
            className="text-xs font-bold uppercase tracking-wider text-silver-slate flex items-center gap-2 font-display"
          >
            <span>My Private Walk Reflection</span>
            <span className="text-[10px] font-normal lowercase text-silver-slate/70">
              (Day {devotional.day_number} Journal)
            </span>
          </label>
          <span className="text-[11px] font-mono text-silver-slate/60">
            {reflectionText.length}/4000
          </span>
        </div>

        <div className="relative">
          <textarea
            id="devotional-reflection-input"
            rows={3}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Write your prayers, takeaways, or revelations from today's walk and scripture..."
            maxLength={4000}
            className="w-full bg-cyber-slate/95 border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-ice-white placeholder:text-silver-slate/40 focus:border-accent-lime focus:outline-none focus:ring-1 focus:ring-accent-lime resize-y min-h-[90px] transition-all"
          />
        </div>

        {/* Reflection Controls: Share to Feed & Save Button */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSharedToFeed}
              onChange={(e) => setIsSharedToFeed(e.target.checked)}
              className="w-4 h-4 rounded bg-white/5 border border-white/20 text-accent-lime focus:ring-accent-lime focus:ring-offset-0"
            />
            <span className="text-xs text-silver-slate flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-accent-lime/80" />
              <span>Share note to Community Encouragement Feed</span>
            </span>
          </label>

          <div className="flex items-center gap-2.5">
            {saveStatus === "saved" && (
              <span className="text-xs text-accent-lime flex items-center gap-1 font-medium animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                <span>Saved securely</span>
              </span>
            )}

            <button
              type="button"
              disabled={isSaving || !reflectionText.trim()}
              onClick={handleSaveReflection}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-accent-lime hover:bg-accent-lime/90 disabled:opacity-40 disabled:cursor-not-allowed text-cyber-slate transition-all flex items-center gap-2 shadow-sm shadow-accent-lime/10 touch-target"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Journal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
