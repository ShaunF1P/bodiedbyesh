"use client";

import { Check } from "lucide-react";

export interface StepItem {
  title: string;
  subtitle?: string;
}

export interface IntakeProgressProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
}

export function IntakeProgress({ steps, currentStep, onStepClick }: IntakeProgressProps) {
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 1 ? Math.min(100, Math.round((currentStep / (totalSteps - 1)) * 100)) : 100;

  return (
    <div className="w-full mb-8">
      {/* Mobile step text header */}
      <div className="flex items-center justify-between sm:hidden mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-accent-lime font-bold">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-xs text-silver-slate font-medium truncate max-w-[200px]">
          {steps[currentStep]?.title}
        </span>
      </div>

      {/* Progress Bar Background */}
      <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-6 sm:mb-8">
        <div
          className="h-full bg-gradient-to-r from-accent-lime/80 via-accent-lime to-accent-lime rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(212,184,126,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Desktop Step Nodes Grid */}
      <div className="hidden sm:grid grid-flow-col auto-cols-fr gap-2 relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isClickable = onStepClick && idx <= currentStep;

          return (
            <button
              key={step.title}
              type="button"
              disabled={!isClickable}
              onClick={() => onStepClick && isClickable && onStepClick(idx)}
              className={`flex flex-col items-center text-center group transition-all ${
                isClickable ? "cursor-pointer" : "cursor-default opacity-80"
              }`}
            >
              {/* Step Circle Node */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 mb-2 ${
                  isCompleted
                    ? "bg-accent-lime text-cyber-slate shadow-[0_0_14px_rgba(212,184,126,0.4)]"
                    : isCurrent
                    ? "border-2 border-accent-lime text-accent-lime bg-[#0E0E14] shadow-[0_0_16px_rgba(212,184,126,0.3)] ring-4 ring-accent-lime/20"
                    : "border border-white/20 text-silver-slate bg-[#0E0E14]/80"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <span>{idx + 1}</span>}
              </div>

              {/* Step Title & Subtitle */}
              <span
                className={`text-xs font-semibold tracking-tight transition-colors line-clamp-1 ${
                  isCurrent
                    ? "text-ice-white font-bold"
                    : isCompleted
                    ? "text-accent-lime"
                    : "text-silver-slate"
                }`}
              >
                {step.title}
              </span>
              {step.subtitle && (
                <span className="text-[10px] text-silver-slate/70 hidden md:block line-clamp-1">
                  {step.subtitle}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
