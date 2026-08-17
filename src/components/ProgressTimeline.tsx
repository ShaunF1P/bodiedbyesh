"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  TrendingDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Snapshot {
  id: string;
  date: string; // ISO string
  imageDataUrl: string;
  bodyFatPercent: number;
  waistToHipRatio: number;
  shoulderToWaistRatio: number;
}

export interface ProgressTimelineProps {
  /** The latest scan result – used when the user clicks "Add Snapshot". */
  latestSnapshot?: {
    imageDataUrl: string;
    bodyFatPercent: number;
    waistToHipRatio: number;
    shoulderToWaistRatio: number;
  };
  /** Callback fired after a snapshot is added. */
  onAddSnapshot?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "bodied-progress-snapshots";

function loadSnapshots(): Snapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Snapshot[]) : [];
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots: Snapshot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
}

/* ------------------------------------------------------------------ */
/*  Comparison Slider (sub-component)                                  */
/* ------------------------------------------------------------------ */

function ComparisonSlider({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dividerX, setDividerX] = useState(50); // percentage 0–100
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setDividerX(Math.max(0, Math.min(100, x)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[3/4] w-full max-w-md mx-auto select-none overflow-hidden rounded-xl glass-panel-lime"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="slider"
      aria-label="Before and after comparison slider"
      aria-valuenow={Math.round(dividerX)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setDividerX((v) => Math.max(0, v - 2));
        if (e.key === "ArrowRight") setDividerX((v) => Math.min(100, v + 2));
      }}
    >
      {/* After image – full layer behind */}
      <img
        src={afterSrc}
        alt="After snapshot"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Before image – clipped to divider position */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${dividerX}%` }}
      >
        <img
          src={beforeSrc}
          alt="Before snapshot"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: containerRef.current?.offsetWidth ?? "100%" }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 z-10"
        style={{ left: `${dividerX}%`, transform: "translateX(-50%)" }}
      >
        <div className="h-full w-0.5 bg-accent-lime/80" />
      </div>

      {/* Draggable handle */}
      <div
        className="absolute z-20 flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{
          left: `${dividerX}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
        onPointerDown={onPointerDown}
      >
        <div className="h-10 w-10 rounded-full bg-accent-lime shadow-[0_0_16px_rgba(204,255,0,0.45)] flex items-center justify-center">
          <ChevronLeft className="h-3.5 w-3.5 text-cyber-slate -mr-0.5" />
          <ChevronRight className="h-3.5 w-3.5 text-cyber-slate -ml-0.5" />
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 z-10 rounded-md bg-cyber-slate/80 px-2 py-0.5 text-xs font-display text-silver-slate">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 z-10 rounded-md bg-cyber-slate/80 px-2 py-0.5 text-xs font-display text-silver-slate">
        {afterLabel}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Metric Delta Card                                                  */
/* ------------------------------------------------------------------ */

function MetricDelta({
  label,
  before,
  after,
  unit,
  icon: Icon,
  lowerIsBetter = true,
}: {
  label: string;
  before: number;
  after: number;
  unit: string;
  icon: React.ElementType;
  lowerIsBetter?: boolean;
}) {
  const delta = after - before;
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  const sign = delta > 0 ? "+" : "";
  const formatted = `${sign}${delta.toFixed(1)}${unit}`;

  return (
    <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${improved ? "bg-accent-lime/10" : "bg-accent-violet/10"}`}
      >
        <Icon
          className={`h-4.5 w-4.5 ${improved ? "text-accent-lime" : "text-accent-violet"}`}
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-silver-slate">{label}</p>
        <p
          className={`text-sm font-display font-bold ${improved ? "text-accent-lime" : "text-accent-violet"}`}
        >
          {formatted}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ProgressTimeline({
  latestSnapshot,
  onAddSnapshot,
}: ProgressTimelineProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedAfterId, setSelectedAfterId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadSnapshots();
    setSnapshots(loaded);
    if (loaded.length > 0) {
      setSelectedAfterId(loaded[loaded.length - 1].id);
    }
  }, []);

  // Persist whenever snapshots change (skip first render)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    saveSnapshots(snapshots);
  }, [snapshots]);

  /* ---- Actions --------------------------------------------------- */

  const addSnapshot = useCallback(() => {
    if (!latestSnapshot) return;
    const newSnap: Snapshot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      imageDataUrl: latestSnapshot.imageDataUrl,
      bodyFatPercent: latestSnapshot.bodyFatPercent,
      waistToHipRatio: latestSnapshot.waistToHipRatio,
      shoulderToWaistRatio: latestSnapshot.shoulderToWaistRatio,
    };
    setSnapshots((prev) => {
      const next = [...prev, newSnap];
      setSelectedAfterId(newSnap.id);
      return next;
    });
    onAddSnapshot?.();
  }, [latestSnapshot, onAddSnapshot]);

  const removeSnapshot = useCallback(
    (id: string) => {
      setSnapshots((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (selectedAfterId === id) {
          setSelectedAfterId(next.length > 0 ? next[next.length - 1].id : null);
        }
        return next;
      });
    },
    [selectedAfterId],
  );

  /* ---- Derived data ---------------------------------------------- */

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const before = sorted[0] ?? null;
  const after = sorted.find((s) => s.id === selectedAfterId) ?? sorted[sorted.length - 1] ?? null;
  const canCompare = sorted.length >= 2 && before && after && before.id !== after.id;

  const daysElapsed =
    before && after
      ? Math.round(
          (new Date(after.date).getTime() - new Date(before.date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

  /* ---- Scroll helpers for thumbnail strip ------------------------ */

  const scrollTimeline = (dir: "left" | "right") => {
    timelineRef.current?.scrollBy({
      left: dir === "left" ? -160 : 160,
      behavior: "smooth",
    });
  };

  /* ---- Empty state ----------------------------------------------- */

  if (sorted.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center animate-fadeIn">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-lime/10">
          <Camera className="h-7 w-7 text-accent-lime" />
        </div>
        <h3 className="font-display text-lg font-bold text-ice-white mb-2">
          No Progress Snapshots Yet
        </h3>
        <p className="text-sm text-silver-slate max-w-xs mx-auto mb-6">
          Complete your first body scan to start tracking your transformation
          over time.
        </p>
        {latestSnapshot && (
          <button
            onClick={addSnapshot}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-accent-lime px-5 py-2.5 text-sm font-display font-bold text-cyber-slate transition-transform hover:scale-[1.03] active:scale-[0.97]"
            aria-label="Add first progress snapshot"
          >
            <Plus className="h-4 w-4" />
            Add First Snapshot
          </button>
        )}
      </div>
    );
  }

  /* ---- Full UI --------------------------------------------------- */

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ice-white">
          Transformation Timeline
        </h2>
        {latestSnapshot && (
          <button
            onClick={addSnapshot}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-accent-lime/10 px-3 py-1.5 text-xs font-display font-bold text-accent-lime transition-colors hover:bg-accent-lime/20"
            aria-label="Add progress snapshot"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Snapshot
          </button>
        )}
      </div>

      {/* ---- Thumbnail timeline strip ---- */}
      <div className="relative">
        {sorted.length > 3 && (
          <>
            <button
              onClick={() => scrollTimeline("left")}
              className="focus-ring absolute -left-3 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-onyx-card/90 text-silver-slate hover:text-accent-lime transition-colors"
              aria-label="Scroll timeline left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollTimeline("right")}
              className="focus-ring absolute -right-3 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-onyx-card/90 text-silver-slate hover:text-accent-lime transition-colors"
              aria-label="Scroll timeline right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <div
          ref={timelineRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {sorted.map((snap, i) => {
            const isSelected = snap.id === selectedAfterId;
            const dateStr = new Date(snap.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const isBefore = i === 0;

            return (
              <button
                key={snap.id}
                onClick={() => setSelectedAfterId(snap.id)}
                className={`focus-ring group relative flex-none snap-start rounded-xl overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-accent-lime scale-[1.02]"
                    : "ring-1 ring-white/[0.06] hover:ring-accent-lime/40 hover:scale-[1.02]"
                }`}
                style={{ width: 96, height: 128 }}
                aria-label={`Snapshot from ${dateStr}${isBefore ? " (start)" : ""}${isSelected ? " (selected)" : ""}`}
              >
                <img
                  src={snap.imageDataUrl}
                  alt={`Progress ${dateStr}`}
                  className="h-full w-full object-cover"
                  draggable={false}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-cyber-slate/90 to-transparent" />

                {/* Date chip */}
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-cyber-slate/70 px-1.5 py-0.5 text-[10px] font-display text-silver-slate">
                  {dateStr}
                </span>

                {/* "Start" badge on first */}
                {isBefore && (
                  <span className="absolute top-1.5 left-1.5 rounded bg-accent-violet/80 px-1.5 py-0.5 text-[9px] font-bold text-ice-white uppercase tracking-wider">
                    Start
                  </span>
                )}

                {/* Delete button (visible on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSnapshot(snap.id);
                  }}
                  className="focus-ring absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyber-slate/80 text-silver-slate opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  aria-label={`Delete snapshot from ${dateStr}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Comparison Slider ---- */}
      {canCompare && (
        <div className="space-y-4 animate-fadeIn">
          <ComparisonSlider
            beforeSrc={before.imageDataUrl}
            afterSrc={after.imageDataUrl}
            beforeLabel={new Date(before.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            afterLabel={new Date(after.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          />

          {/* ---- Metric Deltas ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricDelta
              label="Body Fat"
              before={before.bodyFatPercent}
              after={after.bodyFatPercent}
              unit="%"
              icon={TrendingDown}
              lowerIsBetter
            />
            <MetricDelta
              label="Waist-to-Hip"
              before={before.waistToHipRatio}
              after={after.waistToHipRatio}
              unit=""
              icon={TrendingDown}
              lowerIsBetter
            />
            <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-lime/10">
                <Calendar className="h-4.5 w-4.5 text-accent-lime" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-silver-slate">Time Elapsed</p>
                <p className="text-sm font-display font-bold text-ice-white">
                  {daysElapsed} {daysElapsed === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single-snapshot hint */}
      {sorted.length === 1 && (
        <div className="glass-panel rounded-xl p-5 text-center animate-fadeIn">
          <p className="text-sm text-silver-slate">
            Add a second snapshot to unlock the{" "}
            <span className="font-bold text-accent-lime">
              before &amp; after comparison
            </span>{" "}
            slider.
          </p>
        </div>
      )}
    </div>
  );
}
