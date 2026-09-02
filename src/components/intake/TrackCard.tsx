"use client";

import Link from "next/link";
import { Copy, Eye, ArrowRight, CheckCircle2 } from "lucide-react";

export interface TrackCardProps {
  trackId: string;
  badge: string;
  title: string;
  subtitle: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: "lime" | "purple" | "amber";
  href: string;
  onCopyLink: (trackHref: string, trackTitle: string) => void;
  onPreview: () => void;
}

export function TrackCard({
  badge,
  title,
  subtitle,
  price,
  description,
  features,
  icon: Icon,
  accentColor = "lime",
  href,
  onCopyLink,
  onPreview,
}: TrackCardProps) {
  const colorStyles = {
    lime: {
      badge: "bg-accent-lime/10 text-accent-lime border-accent-lime/30",
      iconBg: "bg-accent-lime/10 text-accent-lime border-accent-lime/20",
      glow: "hover:border-accent-lime/50 hover:shadow-[0_0_24px_rgba(212,184,126,0.15)]",
      cta: "bg-accent-lime text-cyber-slate hover:brightness-110",
      featureIcon: "text-accent-lime",
    },
    purple: {
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      glow: "hover:border-purple-500/50 hover:shadow-[0_0_24px_rgba(168,85,247,0.15)]",
      cta: "bg-purple-500 text-white hover:bg-purple-600",
      featureIcon: "text-purple-400",
    },
    amber: {
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      glow: "hover:border-amber-500/50 hover:shadow-[0_0_24px_rgba(245,158,11,0.15)]",
      cta: "bg-amber-500 text-cyber-slate font-bold hover:bg-amber-400",
      featureIcon: "text-amber-400",
    },
  }[accentColor];

  return (
    <div
      className={`glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border border-white/10 ${colorStyles.glow} relative group`}
    >
      <div>
        {/* Header Badge & Action Icons */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <span
            className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${colorStyles.badge}`}
          >
            {badge}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCopyLink(href, title)}
              title="Copy Direct Share Link"
              aria-label={`Copy Direct Link for ${title}`}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-silver-slate hover:text-ice-white transition-colors border border-white/5"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onPreview}
              title="Preview Intake Questions"
              aria-label={`Preview questions for ${title}`}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-silver-slate hover:text-ice-white transition-colors border border-white/5"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5 mb-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${colorStyles.iconBg}`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-ice-white tracking-tight">{title}</h3>
            <p className="text-xs text-silver-slate font-medium">{subtitle}</p>
          </div>
        </div>

        {/* Price & Cadence */}
        <div className="my-3 py-2 px-3 rounded-xl bg-white/5 border border-white/5">
          <p className="text-xs font-mono font-semibold text-ice-white">{price}</p>
        </div>

        {/* Description */}
        <p className="text-xs text-silver-slate leading-relaxed mb-5">{description}</p>

        {/* Key Clinical Features */}
        <div className="space-y-2 mb-6">
          <p className="text-[11px] font-mono uppercase tracking-wider text-silver-slate/70 font-semibold">
            Clinical Protocols & Ingress
          </p>
          <ul className="space-y-1.5">
            {features.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-silver-slate">
                <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colorStyles.featureIcon}`} />
                <span className="leading-tight">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-4 border-t border-white/5">
        <Link
          href={href}
          className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-md group/btn ${colorStyles.cta}`}
        >
          <span>Start Intake Form</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
