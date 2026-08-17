"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Sparkles, Target, TrendingDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoalSimulatorProps {
  /** The client's original body scan photo (loaded HTMLImageElement). */
  sourceImage: HTMLImageElement | null;
  /** Current body fat percentage (e.g. 25). */
  currentBodyFat: number;
  /** Biological sex – affects minimum safe body‑fat floor. */
  gender: "male" | "female";
  /** Normalised Y position of the waist line (0 = top, 1 = bottom). */
  waistY: number;
  /** Normalised Y position of the hip line (0 = top, 1 = bottom). */
  hipY: number;
  /** Optional body weight in kg – used for the timeline estimate. */
  bodyWeightKg?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Safe minimum BF% targets by gender. */
const MIN_BF: Record<"male" | "female", number> = {
  male: 6,
  female: 14,
};

/** Waist width reduction per 1 % BF lost (fraction). */
const WAIST_FACTOR = 0.005;
/** Hip width reduction per 1 % BF lost (fraction). */
const HIP_FACTOR = 0.003;
/** Shoulder width *increase* per 1 % BF lost (fraction). */
const SHOULDER_FACTOR = 0.001;

const DEFAULT_WEIGHT_KG = 70;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

/** Estimated weeks to reach goal at 0.5 kg fat‑loss / week. */
function estimateWeeks(
  currentBF: number,
  goalBF: number,
  weightKg: number
): number {
  if (goalBF >= currentBF) return 0;
  const fatToLoseKg = (currentBF - goalBF) * weightKg * 0.01;
  return Math.ceil(fatToLoseKg / 0.5);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GoalSimulator({
  sourceImage,
  currentBodyFat,
  gender,
  waistY,
  hipY,
  bodyWeightKg = DEFAULT_WEIGHT_KG,
}: GoalSimulatorProps) {
  // ---- State ---------------------------------------------------------------
  const minBF = MIN_BF[gender];
  const [goalBF, setGoalBF] = useState<number>(
    Math.max(currentBodyFat - 5, minBF)
  );

  // Canvas refs
  const currentCanvasRef = useRef<HTMLCanvasElement>(null);
  const goalCanvasRef = useRef<HTMLCanvasElement>(null);

  // Smoothly‑interpolated goal BF for animation
  const animatedGoalRef = useRef(goalBF);
  const rafRef = useRef<number | null>(null);
  const [displayGoalBF, setDisplayGoalBF] = useState(goalBF);

  // ---- Drawing helpers -----------------------------------------------------

  const drawOriginal = useCallback(
    (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    },
    []
  );

  /**
   * Draw a morphed version of the source image onto the goal canvas.
   *
   * Strategy:
   *  1. Above shoulders → draw untouched.
   *  2. Shoulder band → slight outward stretch.
   *  3. Waist band → horizontal squeeze toward centre.
   *  4. Hip band → smaller horizontal squeeze.
   *  5. Below hips → draw untouched.
   *
   * Each band is drawn row‑by‑row with `drawImage` using different
   * source → dest rectangles so the squeeze is smoothly graduated.
   */
  const drawMorphed = useCallback(
    (canvas: HTMLCanvasElement, img: HTMLImageElement, goalBFValue: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);

      const bfDelta = currentBodyFat - goalBFValue; // always >= 0

      // Key Y pixel positions
      const shoulderPx = Math.round(Math.max(0, waistY - 0.15) * h);
      const waistPx = Math.round(waistY * h);
      const hipPx = Math.round(hipY * h);

      // Maximum squeeze ratios at waist / hip centre
      const waistSqueeze = 1 - bfDelta * WAIST_FACTOR; // e.g. 0.975
      const hipSqueeze = 1 - bfDelta * HIP_FACTOR;
      const shoulderStretch = 1 + bfDelta * SHOULDER_FACTOR;

      // ---- 1. Region above shoulders (untouched) --------------------------
      if (shoulderPx > 0) {
        ctx.drawImage(img, 0, 0, w, shoulderPx, 0, 0, w, shoulderPx);
      }

      // ---- Helper: draw a single horizontal row with a scale applied ------
      const drawRow = (y: number, scaleX: number) => {
        const newW = w * scaleX;
        const offsetX = (w - newW) / 2;
        ctx.drawImage(img, 0, y, w, 1, offsetX, y, newW, 1);
      };

      // ---- 2. Shoulder → Waist gradient -----------------------------------
      const shoulderToWaistLen = waistPx - shoulderPx;
      for (let i = 0; i < shoulderToWaistLen; i++) {
        const t = shoulderToWaistLen > 0 ? i / shoulderToWaistLen : 0;
        // Lerp from shoulderStretch → waistSqueeze
        const scale = shoulderStretch + (waistSqueeze - shoulderStretch) * t;
        drawRow(shoulderPx + i, scale);
      }

      // ---- 3. Waist → Hip gradient ----------------------------------------
      const waistToHipLen = hipPx - waistPx;
      for (let i = 0; i < waistToHipLen; i++) {
        const t = waistToHipLen > 0 ? i / waistToHipLen : 0;
        const scale = waistSqueeze + (hipSqueeze - waistSqueeze) * t;
        drawRow(waistPx + i, scale);
      }

      // ---- 4. Hip → transition back to full width -------------------------
      const transitionEnd = Math.min(hipPx + Math.round(0.08 * h), h);
      const hipToEndLen = transitionEnd - hipPx;
      for (let i = 0; i < hipToEndLen; i++) {
        const t = hipToEndLen > 0 ? i / hipToEndLen : 1;
        const scale = hipSqueeze + (1 - hipSqueeze) * t;
        drawRow(hipPx + i, scale);
      }

      // ---- 5. Below transition (untouched) --------------------------------
      if (transitionEnd < h) {
        ctx.drawImage(
          img,
          0,
          transitionEnd,
          w,
          h - transitionEnd,
          0,
          transitionEnd,
          w,
          h - transitionEnd
        );
      }
    },
    [currentBodyFat, waistY, hipY]
  );

  // ---- Animation loop ------------------------------------------------------

  useEffect(() => {
    const animate = () => {
      const diff = goalBF - animatedGoalRef.current;
      if (Math.abs(diff) < 0.05) {
        animatedGoalRef.current = goalBF;
      } else {
        animatedGoalRef.current += diff * 0.12; // ease
      }

      setDisplayGoalBF(
        Math.round(animatedGoalRef.current * 10) / 10
      );

      if (sourceImage && goalCanvasRef.current) {
        drawMorphed(
          goalCanvasRef.current,
          sourceImage,
          animatedGoalRef.current
        );
      }

      if (Math.abs(goalBF - animatedGoalRef.current) > 0.05) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [goalBF, sourceImage, drawMorphed]);

  // ---- Draw original when the image arrives --------------------------------

  useEffect(() => {
    if (sourceImage && currentCanvasRef.current) {
      drawOriginal(currentCanvasRef.current, sourceImage);
    }
  }, [sourceImage, drawOriginal]);

  // ---- Derived data --------------------------------------------------------
  const weeks = estimateWeeks(currentBodyFat, goalBF, bodyWeightKg);
  const bfDrop = +(currentBodyFat - goalBF).toFixed(1);
  const fatLossKg = +((bfDrop * bodyWeightKg * 0.01)).toFixed(1);

  // ---- Render ---------------------------------------------------------------
  return (
    <section
      className="glass-panel rounded-2xl p-5 sm:p-8 w-full max-w-4xl mx-auto"
      aria-label="Goal body‑fat simulator"
    >
      {/* ---- Header ---- */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-lime/10">
          <Target className="w-5 h-5 text-accent-lime" />
        </div>
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-ice-white">
            Goal Simulator
          </h2>
          <p className="text-xs text-silver-slate">
            Visualise your transformation in real time
          </p>
        </div>
      </div>

      {/* ---- Image comparison ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Current */}
        <div className="relative rounded-xl overflow-hidden bg-cyber-slate border border-white/5">
          <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold uppercase tracking-wider text-silver-slate bg-cyber-slate/80 px-2 py-0.5 rounded-full">
            Current
          </span>
          {sourceImage ? (
            <canvas
              ref={currentCanvasRef}
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="flex items-center justify-center aspect-[3/4] text-silver-slate text-sm">
              No image loaded
            </div>
          )}
        </div>

        {/* Goal */}
        <div className="relative rounded-xl overflow-hidden bg-cyber-slate border border-accent-lime/10">
          <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold uppercase tracking-wider text-accent-lime bg-cyber-slate/80 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Goal
          </span>
          {sourceImage ? (
            <canvas
              ref={goalCanvasRef}
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="flex items-center justify-center aspect-[3/4] text-silver-slate text-sm">
              No image loaded
            </div>
          )}
        </div>
      </div>

      {/* ---- BF% labels ---- */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm text-silver-slate font-medium">
          Current:{" "}
          <span className="text-ice-white font-semibold">
            {currentBodyFat}%
          </span>
        </span>
        <span className="text-sm font-medium text-accent-lime">
          Goal:{" "}
          <span className="font-semibold">{displayGoalBF.toFixed(1)}%</span>
        </span>
      </div>

      {/* ---- Slider ---- */}
      <div className="relative mb-8">
        <input
          type="range"
          min={minBF}
          max={currentBodyFat}
          step={0.5}
          value={goalBF}
          onChange={(e) =>
            setGoalBF(clamp(+e.target.value, minBF, currentBodyFat))
          }
          aria-label="Target body fat percentage"
          className="goal-slider w-full h-2 rounded-full appearance-none cursor-pointer bg-onyx-card focus-ring"
        />

        {/* Track fill overlay */}
        <div
          className="absolute top-0 left-0 h-2 rounded-full bg-accent-lime/30 pointer-events-none"
          style={{
            width: `${
              ((currentBodyFat - goalBF) / (currentBodyFat - minBF)) * 100
            }%`,
          }}
        />
      </div>

      {/* ---- Stat cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* BF drop */}
        <div className="glass-panel-lime rounded-xl p-4 flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-silver-slate mb-0.5">
              Body Fat Drop
            </p>
            <p className="text-ice-white font-display text-lg font-semibold leading-tight">
              {bfDrop}
              <span className="text-sm text-silver-slate ml-0.5">%</span>
            </p>
          </div>
        </div>

        {/* Fat loss kg */}
        <div className="glass-panel-lime rounded-xl p-4 flex items-start gap-3">
          <Target className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-silver-slate mb-0.5">
              Fat to Lose
            </p>
            <p className="text-ice-white font-display text-lg font-semibold leading-tight">
              {fatLossKg}
              <span className="text-sm text-silver-slate ml-0.5">kg</span>
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="glass-panel-lime rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-silver-slate mb-0.5">
              Est. Timeline
            </p>
            <p className="text-ice-white font-display text-lg font-semibold leading-tight">
              ~{weeks}
              <span className="text-sm text-silver-slate ml-0.5">weeks</span>
            </p>
            <p className="text-[10px] text-silver-slate mt-1">
              at recommended deficit
            </p>
          </div>
        </div>
      </div>

      {/* ---- Inline slider‑thumb styles ---- */}
      <style>{`
        .goal-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #D4708F;
          box-shadow: 0 0 10px rgba(212, 112, 143, 0.5);
          cursor: pointer;
          border: 2px solid #111118;
          transition: box-shadow 0.2s ease;
        }
        .goal-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px rgba(212, 112, 143, 0.7);
        }
        .goal-slider:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 2px #111118, 0 0 0 4px #D4708F;
        }
        .goal-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #D4708F;
          box-shadow: 0 0 10px rgba(212, 112, 143, 0.5);
          cursor: pointer;
          border: 2px solid #111118;
        }
        .goal-slider::-moz-range-track {
          background: #161A22;
          height: 8px;
          border-radius: 9999px;
          border: none;
        }
      `}</style>
    </section>
  );
}
