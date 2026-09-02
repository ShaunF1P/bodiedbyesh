"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: "success" | "error" | "info";
  durationMs?: number;
}

export function Toast({
  isOpen,
  onClose,
  title,
  message,
  type = "success",
  durationMs = 3500,
}: ToastProps) {
  useEffect(() => {
    if (!isOpen || durationMs <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [isOpen, durationMs, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      borderClass: "border-accent-lime/40",
      iconColor: "text-accent-lime",
      bgBadge: "bg-accent-lime/10",
    },
    error: {
      icon: AlertCircle,
      borderClass: "border-accent-violet/40",
      iconColor: "text-accent-violet",
      bgBadge: "bg-accent-violet/10",
    },
    info: {
      icon: Info,
      borderClass: "border-white/20",
      iconColor: "text-silver-slate",
      bgBadge: "bg-white/10",
    },
  }[type];

  const IconComponent = typeConfig.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full px-4 sm:px-0 animate-slideInRight"
    >
      <div
        className={`glass-panel ${typeConfig.borderClass} shadow-[0_8px_30px_rgba(0,0,0,0.8)] rounded-2xl p-4 flex items-start gap-3 bg-[#0A0A0F]/95 backdrop-blur-xl border`}
      >
        <div className={`p-2 rounded-xl ${typeConfig.bgBadge} ${typeConfig.iconColor} shrink-0`}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-sm font-bold text-ice-white">{title}</p>
          {message && <p className="text-xs text-silver-slate mt-0.5 leading-relaxed">{message}</p>}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="text-silver-slate hover:text-ice-white transition-colors p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
