"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Sliders,
  TrendingDown,
  TrendingUp,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Award,
  CheckCircle2,
  Plus,
  Scale,
  Ruler,
  Activity,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";

export interface TransformationEntry {
  id: string;
  date: string;
  weightLbs: number;
  waistInches: number;
  bodyFatPercent?: number;
  chestInches?: number;
  hipsInches?: number;
  notes?: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  beforeDate: string;
  afterDate: string;
  durationWeeks: number;
}

const DEFAULT_TRANSFORMATION: TransformationEntry = {
  id: "client-trans-1",
  date: "Week 12 Checkpoint",
  weightLbs: 168.4,
  waistInches: 31.0,
  bodyFatPercent: 14.8,
  chestInches: 41.5,
  hipsInches: 36.0,
  notes: "Consistently hitting 160g protein and 10k steps daily. Energy and posture significantly improved.",
  beforePhotoUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80",
  afterPhotoUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80",
  beforeDate: "Jan 15, 2026",
  afterDate: "Apr 15, 2026",
  durationWeeks: 12,
};

const METRIC_HISTORY = [
  { date: "Jan 15", weight: 184.2, waist: 35.5, bodyFat: 22.4, notes: "Kickoff Baseline" },
  { date: "Feb 01", weight: 180.6, waist: 34.8, bodyFat: 21.0, notes: "Phase 1 Adaptation" },
  { date: "Feb 15", weight: 177.1, waist: 33.9, bodyFat: 19.8, notes: "Park Conditioning" },
  { date: "Mar 01", weight: 174.5, waist: 33.0, bodyFat: 18.5, notes: "Dietary Adherence 95%" },
  { date: "Mar 15", weight: 171.8, waist: 32.2, bodyFat: 17.1, notes: "Strength PRs hit" },
  { date: "Apr 01", weight: 169.6, waist: 31.5, bodyFat: 15.9, notes: "Deficit tapering" },
  { date: "Apr 15", weight: 168.4, waist: 31.0, bodyFat: 14.8, notes: "Peak Conditioning Target" },
];

export default function TransformationStudio({
  clientName = "Member",
  isAdmin = false,
  className = "",
}: {
  clientName?: string;
  isAdmin?: boolean;
  className?: string;
}) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewAngle, setViewAngle] = useState<"front" | "side" | "back">("front");
  const [activeMetricTab, setActiveMetricTab] = useState<"comparison" | "metrics" | "gallery">("comparison");
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  // New check-in state
  const [newWeight, setNewWeight] = useState<string>("168.0");
  const [newWaist, setNewWaist] = useState<string>("30.8");
  const [newBodyFat, setNewBodyFat] = useState<string>("14.5");
  const [newNotes, setNewNotes] = useState<string>("");
  const [metricsList, setMetricsList] = useState(METRIC_HISTORY);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(2, Math.min(98, percentage)));
    },
    []
  );

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handlePointerMove(e.clientX);
    }
  };

  // Deltas calculation
  const startMetric = metricsList[0];
  const latestMetric = metricsList[metricsList.length - 1];
  const weightDelta = (latestMetric.weight - startMetric.weight).toFixed(1);
  const waistDelta = (latestMetric.waist - startMetric.waist).toFixed(1);
  const bodyFatDelta = (latestMetric.bodyFat - startMetric.bodyFat).toFixed(1);

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWeight = parseFloat(newWeight) || latestMetric.weight;
    const parsedWaist = parseFloat(newWaist) || latestMetric.waist;
    const parsedBf = parseFloat(newBodyFat) || latestMetric.bodyFat;

    const newEntry = {
      date: "Today",
      weight: parsedWeight,
      waist: parsedWaist,
      bodyFat: parsedBf,
      notes: newNotes || "Daily check-in",
    };

    setMetricsList((prev) => [...prev, newEntry]);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsLogModalOpen(false);
    }, 1200);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── Studio Header & Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/5 bg-charcoal-gray/40">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-lime mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Body Transformation & Morphometrics</span>
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-ice-white">
            {clientName}&apos;s Transformation Studio
          </h2>
          <p className="text-silver-slate text-xs mt-1">
            High-precision visual comparisons, circumference tracking, and body composition analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveMetricTab("comparison")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                activeMetricTab === "comparison"
                  ? "bg-accent-lime text-obsidian-black shadow-lg"
                  : "text-silver-slate hover:text-ice-white"
              }`}
            >
              Visual Slider
            </button>
            <button
              onClick={() => setActiveMetricTab("metrics")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                activeMetricTab === "metrics"
                  ? "bg-accent-lime text-obsidian-black shadow-lg"
                  : "text-silver-slate hover:text-ice-white"
              }`}
            >
              Metric Log
            </button>
          </div>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-accent-lime/10 border border-accent-lime/30 text-accent-lime hover:bg-accent-lime/20 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Check-In</span>
          </button>
        </div>
      </div>

      {/* ── Key Transformation Deltas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-accent-lime/20 bg-charcoal-gray/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-silver-slate">Total Weight Delta</span>
            <div className="w-8 h-8 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-3xl text-ice-white">{weightDelta}</span>
            <span className="text-xs text-silver-slate font-medium">lbs</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-accent-lime ml-auto">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{Math.abs(Number(weightDelta))} lbs reduced</span>
            </span>
          </div>
          <div className="text-[10px] text-silver-slate/80 mt-1">
            {startMetric.weight} lbs ({startMetric.date}) to {latestMetric.weight} lbs ({latestMetric.date})
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-blue-500/20 bg-charcoal-gray/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-silver-slate">Waist Reduction</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Ruler className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-3xl text-ice-white">{waistDelta}</span>
            <span className="text-xs text-silver-slate font-medium">inches</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-400 ml-auto">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{Math.abs(Number(waistDelta))} in lost</span>
            </span>
          </div>
          <div className="text-[10px] text-silver-slate/80 mt-1">
            {startMetric.waist} in ({startMetric.date}) to {latestMetric.waist} in ({latestMetric.date})
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 bg-charcoal-gray/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-silver-slate">Body Fat % Delta</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-3xl text-ice-white">{bodyFatDelta}</span>
            <span className="text-xs text-silver-slate font-medium">%</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-purple-400 ml-auto">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{Math.abs(Number(bodyFatDelta))}% drop</span>
            </span>
          </div>
          <div className="text-[10px] text-silver-slate/80 mt-1">
            {startMetric.bodyFat}% baseline to {latestMetric.bodyFat}% current estimate
          </div>
        </div>
      </div>

      {/* ── Main View Area ── */}
      {activeMetricTab === "comparison" ? (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-charcoal-gray/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ice-white">Interactive Split Comparison</h3>
                <p className="text-xs text-silver-slate">Drag the center divider left or right to inspect muscle tone and definition</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                {(["front", "side", "back"] as const).map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setViewAngle(angle)}
                    className={`px-3 py-1 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                      viewAngle === angle ? "bg-white/10 text-ice-white" : "text-silver-slate hover:text-white"
                    }`}
                  >
                    {angle}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Drag Split Screen */}
          <div
            ref={containerRef}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative w-full h-[460px] md:h-[540px] rounded-2xl overflow-hidden select-none cursor-ew-resize border border-white/10 bg-black/60 shadow-2xl"
          >
            {/* After Image (Background / Full Width) */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${DEFAULT_TRANSFORMATION.afterPhotoUrl}')`,
              }}
            >
              <div className="absolute top-4 right-4 bg-obsidian-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-accent-lime/30 text-accent-lime text-xs font-bold shadow-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AFTER — {DEFAULT_TRANSFORMATION.afterDate} ({latestMetric.weight} lbs)</span>
              </div>
            </div>

            {/* Before Image (Clipped Left Layer) */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${DEFAULT_TRANSFORMATION.beforePhotoUrl}')`,
                clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
              }}
            >
              <div className="absolute top-4 left-4 bg-obsidian-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-silver-slate text-xs font-bold shadow-lg flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>BEFORE — {DEFAULT_TRANSFORMATION.beforeDate} ({startMetric.weight} lbs)</span>
              </div>
            </div>

            {/* Draggable Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-accent-lime shadow-[0_0_15px_rgba(204,255,0,0.8)] cursor-ew-resize z-20 flex items-center justify-center"
              style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-8 h-8 rounded-full bg-accent-lime text-obsidian-black flex items-center justify-center shadow-xl font-bold border-2 border-obsidian-black">
                <Sliders className="w-4 h-4" />
              </div>
            </div>

            {/* Bottom Floating Stats Tag */}
            <div className="absolute bottom-4 left-4 right-4 bg-obsidian-black/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between text-xs text-silver-slate z-10">
              <span className="font-semibold text-ice-white">12-Week Transformation Phase: {DEFAULT_TRANSFORMATION.notes}</span>
              <div className="flex items-center gap-3">
                <span className="text-accent-lime font-bold">Δ -{Math.abs(Number(weightDelta))} lbs</span>
                <span className="text-blue-400 font-bold">Δ -{Math.abs(Number(waistDelta))} in</span>
                <span className="text-purple-400 font-bold">Δ -{Math.abs(Number(bodyFatDelta))}% BF</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Metric History Table View ── */
        <div className="glass-panel rounded-3xl border border-white/5 bg-charcoal-gray/30 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-ice-white">Biometric Progress Log</h3>
              <p className="text-xs text-silver-slate">Historical weigh-ins, circumference measures, and body fat tracking</p>
            </div>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs font-semibold hover:bg-accent-lime/20 cursor-pointer"
            >
              Add Entry
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-wider text-silver-slate bg-white/[0.02] border-b border-white/5">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Weight (lbs)</th>
                  <th className="px-6 py-3 font-semibold">Waist (in)</th>
                  <th className="px-6 py-3 font-semibold">Est. Body Fat</th>
                  <th className="px-6 py-3 font-semibold">Coaching Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {metricsList.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-semibold text-ice-white">{entry.date}</td>
                    <td className="px-6 py-4 text-silver-slate">
                      <span className="font-bold text-ice-white">{entry.weight}</span> lbs
                    </td>
                    <td className="px-6 py-4 text-silver-slate">{entry.waist} in</td>
                    <td className="px-6 py-4 text-silver-slate">{entry.bodyFat}%</td>
                    <td className="px-6 py-4 text-silver-slate text-xs">{entry.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Entry Modal ── */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/10 bg-obsidian-black space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                  <Scale className="w-4 h-4" />
                </div>
                <h4 className="font-display font-bold text-lg text-ice-white">Log Biometric Check-In</h4>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-silver-slate hover:text-white p-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMetric} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-silver-slate mb-1">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-ice-white focus:border-accent-lime focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-silver-slate mb-1">
                    Waist (in)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWaist}
                    onChange={(e) => setNewWaist(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-ice-white focus:border-accent-lime focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-silver-slate mb-1">
                    Body Fat %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBodyFat}
                    onChange={(e) => setNewBodyFat(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-ice-white focus:border-accent-lime focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-silver-slate mb-1">
                  Check-in Notes / Adherence
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g., Followed meal plan 100%, 12k average steps, feeling energized"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-ice-white focus:border-accent-lime focus:outline-none"
                />
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Check-in recorded successfully!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-silver-slate hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent-lime text-obsidian-black text-xs font-bold hover:bg-accent-lime/90 cursor-pointer shadow-lg"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
