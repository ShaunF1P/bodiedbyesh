"use client";

import React, { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  Palette,
  Type,
  Shield,
  Target,
  Megaphone,
  BookOpen,
  Copy,
  Check,
  ChevronLeft,
  Moon,
  Sun,
  Eye,
  Layers,
  Zap,
  DollarSign,
  Home,
  MapPin,
  Briefcase,
  X,
} from "lucide-react";

/* ─── Color Swatch Data ─── */
const primaryColors = [
  { name: "Liquid Gold", hex: "#D4B87E", rgb: "212, 184, 126", usage: "Primary accent, CTAs, logo highlights, premium typography" },
  { name: "Brushed Rose Gold", hex: "#C58B8B", rgb: "197, 139, 139", usage: "Secondary accent, hover states, subtle highlights" },
];

const darkPalette = [
  { name: "Obsidian Black", hex: "#050508", rgb: "5, 5, 8", usage: "Global dark background, canvas" },
  { name: "Onyx Card", hex: "#0E0E14", rgb: "14, 14, 20", usage: "Card surfaces, header glass panels" },
  { name: "Onyx Glass", hex: "rgba(10,10,15,0.85)", rgb: "10, 10, 15 / 85%", usage: "Glassmorphism overlays, blurred panels" },
];

const lightPalette = [
  { name: "Warm Cream", hex: "#FBFBFD", rgb: "251, 251, 253", usage: "Light mode background" },
  { name: "White Card", hex: "#FFFFFF", rgb: "255, 255, 255", usage: "Light mode card surfaces" },
  { name: "Charcoal Text", hex: "#121215", rgb: "18, 18, 21", usage: "Light mode primary text" },
];

const textColors = [
  { name: "Ice White", hex: "#FFFFFF", rgb: "255, 255, 255", usage: "Primary text in dark mode" },
  { name: "Silver Slate", hex: "#A0A5B5", rgb: "160, 165, 181", usage: "Muted text, captions, labels" },
];

/* ─── Gradient Data ─── */
const gradients = [
  {
    name: "Liquid Gold Gradient",
    stops: ["#FCEABB", "#D4AF37", "#B5892D", "#7A5813"],
    usage: "Logo ESH text, premium CTAs, luxury highlights",
    css: "linear-gradient(135deg, #FCEABB 0%, #D4AF37 50%, #B5892D 80%, #7A5813 100%)"
  },
];

/* ─── Typography Data ─── */
const typographySpecs = [
  {
    family: "Space Grotesk",
    role: "Display / Headings",
    weights: ["Bold (700)", "Medium (500)"],
    tracking: "Wide (0.1em+)",
    usage: "Page titles, section headings, logo wordmark, CTA labels",
    sample: "BODIED BY ESH"
  },
  {
    family: "Inter",
    role: "Body / UI",
    weights: ["Light (300)", "Regular (400)", "Medium (500)", "SemiBold (600)"],
    tracking: "Default",
    usage: "Body copy, form inputs, navigation, data labels, taglines",
    sample: "Precision Body Recomposition"
  },
];

/* ─── Logo Versions Data ─── */
const logoVersions = [
  {
    name: "Approved Primary Logo — 3D Block Letters",
    file: "option36.png",
    path: "/logos/option36.png",
    desc: "The approved 3D block wordmark featuring a diagonal slice split with mirror polished gold on the left and silver chrome on the right. This is the primary brand mark.",
    context: "Hero branding, merchandise, billboards, premium print, social media"
  },
  {
    name: "Horizontal Wordmark (Gold SVG)",
    file: "bodied-logo-gold.svg",
    path: "/logos/bodied-logo-gold.svg",
    desc: "Flat vector wordmark with gold gradient. Used for digital headers, documents, and digital assets where the 3D render is not suitable.",
    context: "Website header, emails, social media headers"
  },
  {
    name: "White Wordmark",
    file: "bodied-logo-white.svg",
    path: "/logos/bodied-logo-white.svg",
    desc: "Single-color white version for dark backgrounds where the gold gradient is not available.",
    context: "Dark print media, simplified digital uses"
  },
  {
    name: "Black Wordmark",
    file: "bodied-logo-black.svg",
    path: "/logos/bodied-logo-black.svg",
    desc: "Single-color black version for light backgrounds and black-and-white printing.",
    context: "Light backgrounds, fax, B&W documents"
  },
];

/* ─── Voice Pillars Data ─── */
const voicePillars = [
  {
    pillar: "Scientific Authority",
    tone: "Empirical, precise, educational",
    vocabulary: ["Biomechanics", "Torque", "Periodization", "Metabolic pacing", "Telemetry", "Bio-indices"],
    avoid: ["Tone-up", "Calorie burning", "Cardio", "Booty workouts", "Easy tricks"],
  },
  {
    pillar: "Bespoke Luxury",
    tone: "Executive, refined, premium",
    vocabulary: ["Concierge", "Tailored architecture", "Personalized calibration", "Efficiency", "Stewardship"],
    avoid: ["Gym rat", "Budget", "Cheap", "Quick fix", "Workout routine"],
  },
  {
    pillar: "Direct & Zero-Excuse",
    tone: "Empathetic but unwavering",
    vocabulary: ["Alignment", "Standard", "Commitment", "Consistency", "Metabolic discipline"],
    avoid: ["Hardcore", "Screaming", "Punishment", "Cheat meals", "Diet failure"],
  },
];

const vocabTranslations = [
  { from: "Workout / Routine", to: "Training Protocol / Resistance Architecture" },
  { from: "Diet / Meal Plan", to: "Nutritional Framework / Metabolic Calibration" },
  { from: "Cardio", to: "Metabolic Pacing / Energy System Conditioning" },
  { from: "App Tracking", to: "Client Portal Telemetry" },
  { from: "Getting Fit", to: "Body Recomposition / Athletic Transformation" },
];

/* ─── Section Navigation ─── */
const sections = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "colors", label: "Color System", icon: Palette },
  { id: "typography", label: "Typography", icon: Type },
  { id: "logos", label: "Logo Assets", icon: Layers },
  { id: "usage", label: "Usage Rules", icon: Shield },
  { id: "voice", label: "Brand Voice", icon: Megaphone },
  { id: "positioning", label: "Positioning", icon: Target },
];

export default function BrandGuidePage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark");

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#D4B87E] filter blur-[140px] rounded-full opacity-[0.06] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[-10%] w-[300px] h-[300px] bg-[#C58B8B] filter blur-[140px] rounded-full opacity-[0.05] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/80 backdrop-blur-md sticky top-0 z-40 py-4 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/logo-review"
              className="flex items-center gap-1.5 text-silver-slate hover:text-accent-lime text-xs font-medium uppercase tracking-wider transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Logo Review
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
            <span className="font-display font-bold tracking-wider text-sm uppercase">
              BODIED BY <span className="text-accent-lime">ESH</span>
            </span>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent-lime font-bold block mb-2">
              Brand Identity System
            </span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
              Brand Style Guide
            </h1>
            <p className="text-silver-slate text-sm font-light mt-2 max-w-xl">
              The comprehensive brand management manual for <strong className="text-white font-medium">Bodied by Esh</strong>. 
              All color codes, typography, logo assets, spacing rules, and brand voice guidelines in one professional reference.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-silver-slate bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-medium whitespace-nowrap self-start sm:self-auto">
            v1.0 — June 2026
          </span>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 mb-6">
        <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeSection === s.id
                    ? "bg-accent-lime border-accent-lime text-[#050508]"
                    : "bg-white/5 border-white/10 text-silver-slate hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 pb-16">

        {/* ═══ OVERVIEW ═══ */}
        {activeSection === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-accent-lime" />
                <h2 className="font-display font-bold text-xl">Brand Philosophy</h2>
              </div>
              <div className="space-y-4 text-silver-slate text-sm leading-relaxed font-light">
                <p>
                  <strong className="text-white font-medium">BODIED BY ESH</strong> is a high-performance wellness and body recomposition brand 
                  positioned at the intersection of medical-grade biomechanics, elite data telemetry, and bespoke lifestyle architecture.
                </p>
                <p>
                  Unlike generic fitness programs that market &ldquo;fat loss&rdquo; through sweat-equity and caloric deprivation, 
                  <strong className="text-white font-medium"> Bodied by Esh</strong> treats body recomposition as a precision engineering challenge. 
                  The brand targets high-net-worth individuals, corporate executives, founders, and busy, affluent parents 
                  in South Florida&rsquo;s premium corridors (Boca Raton, Parkland, Delray Beach).
                </p>
                <p>
                  Our visual identity projects <strong className="text-accent-lime font-medium">scientific authority</strong>, 
                  <strong className="text-accent-lime font-medium"> bespoke luxury</strong>, and 
                  <strong className="text-accent-lime font-medium"> direct accountability</strong> — 
                  distinguishing us from mid-market athletic brands through obsidian-black surfaces, 
                  liquid champagne gold accents, and precision-engineered typography.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Primary Accent", value: "#D4B87E", sub: "Liquid Gold" },
                { label: "Display Font", value: "Space Grotesk", sub: "Bold 700" },
                { label: "Target Market", value: "$175k+", sub: "Median HHI" },
              ].map((stat) => (
                <div key={stat.label} className="glass-panel border border-white/5 rounded-2xl p-5 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold block mb-1">{stat.label}</span>
                  <span className="font-display font-bold text-lg text-accent-lime block">{stat.value}</span>
                  <span className="text-[10px] text-silver-slate/60 font-light">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ COLOR SYSTEM ═══ */}
        {activeSection === "colors" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Primary Accents */}
            <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-accent-lime" />
                <h2 className="font-display font-bold text-xl">Primary Accents</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {primaryColors.map((c) => (
                  <div key={c.hex} className="bg-[#0A0A10] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="h-24 sm:h-28" style={{ backgroundColor: c.hex }} />
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-sm">{c.name}</span>
                        <button
                          onClick={() => copyHex(c.hex)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-silver-slate hover:text-white transition-all cursor-pointer"
                        >
                          {copiedHex === c.hex ? <Check className="w-3 h-3 text-accent-lime" /> : <Copy className="w-3 h-3" />}
                          {c.hex}
                        </button>
                      </div>
                      <p className="text-[11px] text-silver-slate/70 font-light">
                        RGB: {c.rgb}
                      </p>
                      <p className="text-xs text-silver-slate font-light">{c.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient */}
            <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
              <h3 className="font-display font-bold text-lg mb-4">Brand Gradient</h3>
              {gradients.map((g) => (
                <div key={g.name} className="bg-[#0A0A10] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="h-20 sm:h-24 rounded-t-2xl" style={{ background: g.css }} />
                  <div className="p-4 space-y-2">
                    <span className="font-display font-bold text-sm">{g.name}</span>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {g.stops.map((stop) => (
                        <button
                          key={stop}
                          onClick={() => copyHex(stop)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-silver-slate hover:text-white transition-all cursor-pointer"
                        >
                          <span className="w-3 h-3 rounded-full shrink-0 border border-white/10" style={{ backgroundColor: stop }} />
                          {copiedHex === stop ? <Check className="w-3 h-3 text-accent-lime" /> : stop}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-silver-slate font-light mt-2">{g.usage}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dark / Light Palettes */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-panel border border-white/5 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Moon className="w-4 h-4 text-silver-slate" />
                  <h3 className="font-display font-bold text-lg">Dark Mode Palette</h3>
                </div>
                <div className="space-y-3">
                  {darkPalette.map((c) => (
                    <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A10] border border-white/5">
                      <span className="w-10 h-10 rounded-lg shrink-0 border border-white/10" style={{ backgroundColor: c.hex }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold truncate">{c.name}</span>
                          <button
                            onClick={() => copyHex(c.hex)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono text-silver-slate hover:text-white transition-all cursor-pointer shrink-0"
                          >
                            {copiedHex === c.hex ? <Check className="w-2.5 h-2.5 text-accent-lime" /> : <Copy className="w-2.5 h-2.5" />}
                            {c.hex}
                          </button>
                        </div>
                        <p className="text-[10px] text-silver-slate/60 font-light truncate">{c.usage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel border border-white/5 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sun className="w-4 h-4 text-silver-slate" />
                  <h3 className="font-display font-bold text-lg">Light Mode Palette</h3>
                </div>
                <div className="space-y-3">
                  {lightPalette.map((c) => (
                    <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A10] border border-white/5">
                      <span className="w-10 h-10 rounded-lg shrink-0 border border-white/10" style={{ backgroundColor: c.hex }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold truncate">{c.name}</span>
                          <button
                            onClick={() => copyHex(c.hex)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono text-silver-slate hover:text-white transition-all cursor-pointer shrink-0"
                          >
                            {copiedHex === c.hex ? <Check className="w-2.5 h-2.5 text-accent-lime" /> : <Copy className="w-2.5 h-2.5" />}
                            {c.hex}
                          </button>
                        </div>
                        <p className="text-[10px] text-silver-slate/60 font-light truncate">{c.usage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text Colors */}
            <div className="glass-panel border border-white/5 rounded-3xl p-6">
              <h3 className="font-display font-bold text-lg mb-4">Text Colors</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {textColors.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A10] border border-white/5">
                    <span className="w-10 h-10 rounded-lg shrink-0 border border-white/10" style={{ backgroundColor: c.hex }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{c.name}</span>
                        <button
                          onClick={() => copyHex(c.hex)}
                          className="text-[9px] font-mono text-silver-slate hover:text-white transition-all cursor-pointer shrink-0"
                        >
                          {c.hex}
                        </button>
                      </div>
                      <p className="text-[10px] text-silver-slate/60 font-light">{c.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TYPOGRAPHY ═══ */}
        {activeSection === "typography" && (
          <div className="space-y-8 animate-fadeIn">
            {typographySpecs.map((t) => (
              <div key={t.family} className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-accent-lime font-bold block mb-1">
                      {t.role}
                    </span>
                    <h2 className="font-display font-bold text-xl">{t.family}</h2>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-silver-slate bg-white/5 border border-white/10 px-3 py-1 rounded-full font-medium">
                    Tracking: {t.tracking}
                  </span>
                </div>

                {/* Sample */}
                <div className="bg-[#0A0A10] border border-white/5 rounded-2xl p-6 mb-6">
                  <p
                    className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider"
                    style={{
                      fontFamily: t.family === "Space Grotesk" ? "var(--font-display)" : "var(--font-sans)",
                    }}
                  >
                    {t.sample}
                  </p>
                  <p
                    className="text-base sm:text-lg text-silver-slate font-light mt-3"
                    style={{
                      fontFamily: t.family === "Space Grotesk" ? "var(--font-display)" : "var(--font-sans)",
                    }}
                  >
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                  </p>
                  <p
                    className="text-base sm:text-lg text-silver-slate/50 font-light mt-1"
                    style={{
                      fontFamily: t.family === "Space Grotesk" ? "var(--font-display)" : "var(--font-sans)",
                    }}
                  >
                    abcdefghijklmnopqrstuvwxyz 0123456789
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-[#0A0A10] border border-white/5 rounded-xl p-4">
                    <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold block mb-2">Weights</span>
                    <div className="flex flex-wrap gap-2">
                      {t.weights.map((w) => (
                        <span key={w} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white font-medium">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#0A0A10] border border-white/5 rounded-xl p-4">
                    <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold block mb-2">Usage</span>
                    <p className="text-xs text-silver-slate font-light leading-relaxed">{t.usage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ LOGO ASSETS ═══ */}
        {activeSection === "logos" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Theme Toggle for Preview */}
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">Logo Asset Library</h2>
              <div className="flex items-center gap-2 bg-[#0A0A10] border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setPreviewTheme("dark")}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    previewTheme === "dark" ? "bg-white/10 text-white" : "text-silver-slate hover:text-white"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewTheme("light")}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    previewTheme === "light" ? "bg-white/10 text-white" : "text-silver-slate hover:text-white"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                </button>
              </div>
            </div>

            {logoVersions.map((logo, index) => (
              <div key={logo.name} className={`glass-panel border rounded-3xl overflow-hidden ${index === 0 ? "border-accent-lime/20" : "border-white/5"}`}>
                {/* Approved Badge for Primary */}
                {index === 0 && (
                  <div className="bg-accent-lime/10 border-b border-accent-lime/20 px-5 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-accent-lime font-bold flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-accent-lime" /> Approved Selection
                    </span>
                  </div>
                )}
                {/* Preview Area */}
                <div
                  className={`w-full flex items-center justify-center p-10 sm:p-14 transition-all duration-300 relative ${
                    index === 0 ? "aspect-[2/1]" : "aspect-[3/1]"
                  } ${
                    previewTheme === "dark" ? "bg-[#030305]" : "bg-[#F8F7FA]"
                  }`}
                >
                  {previewTheme === "dark" && (
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30 pointer-events-none" />
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.path}
                    alt={logo.name}
                    style={{
                      maxWidth: index === 0 ? "60%" : "70%",
                      maxHeight: index === 0 ? "85%" : "70%",
                      filter: logo.file.endsWith(".png")
                        ? undefined
                        : previewTheme === "light" && !logo.file.includes("gold") && !logo.file.includes("black")
                        ? "brightness(0.15)"
                        : undefined,
                    }}
                    className="object-contain relative z-10 transition-all duration-300"
                  />
                </div>

                {/* Info */}
                <div className="p-5 sm:p-6 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <h3 className="font-display font-bold text-base">{logo.name}</h3>
                    <span className="text-[10px] font-mono text-silver-slate/60 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                      {logo.file}
                    </span>
                  </div>
                  <p className="text-xs text-silver-slate font-light leading-relaxed mb-2">{logo.desc}</p>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-accent-lime shrink-0" />
                    <span className="text-[10px] text-accent-lime/70 font-medium">{logo.context}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ USAGE RULES ═══ */}
        {activeSection === "usage" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Clear Space */}
            <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-accent-lime" />
                <h2 className="font-display font-bold text-xl">Clear Space & Minimum Size</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#0A0A10] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-display font-bold text-sm mb-3 text-accent-lime">Clear Space Rule</h3>
                  <p className="text-xs text-silver-slate font-light leading-relaxed mb-4">
                    Always maintain a clear space equal to <strong className="text-white font-medium">50% of the logo&apos;s height</strong> around 
                    the entire wordmark to prevent visual crowding from neighboring elements.
                  </p>
                  {/* Visual Diagram */}
                  <div className="bg-[#050508] border border-dashed border-accent-lime/20 rounded-xl p-8 flex items-center justify-center relative">
                    <div className="absolute inset-4 border border-dashed border-white/10 rounded-lg" />
                    <div className="bg-accent-lime/10 border border-accent-lime/30 rounded-lg px-6 py-3 text-[10px] font-display font-bold text-accent-lime tracking-wider">
                      BODIED BY ESH
                    </div>
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-silver-slate/40 uppercase tracking-widest">50% clear</span>
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-silver-slate/40 uppercase tracking-widest">50% clear</span>
                  </div>
                </div>

                <div className="bg-[#0A0A10] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-display font-bold text-sm mb-3 text-accent-lime">Minimum Size</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent-lime/10 border border-accent-lime/20 flex items-center justify-center text-[9px] font-bold text-accent-lime shrink-0 mt-0.5">D</span>
                      <div>
                        <span className="text-xs font-semibold block">Digital</span>
                        <span className="text-[11px] text-silver-slate font-light">120px minimum width to maintain tagline legibility</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center text-[9px] font-bold text-accent-violet shrink-0 mt-0.5">P</span>
                      <div>
                        <span className="text-xs font-semibold block">Print</span>
                        <span className="text-[11px] text-silver-slate font-light">1.5 inches minimum width for all physical reproductions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Do's and Don'ts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-panel border border-accent-lime/10 rounded-3xl p-6">
                <h3 className="font-display font-bold text-lg mb-4 text-accent-lime flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent-lime" /> Do
                </h3>
                <ul className="space-y-3">
                  {[
                    "Use the vector SVG wordmark for digital headers and emails",
                    "Use the 3D block letters version (Option 75) for physical merchandise and billboards",
                    "Switch to the dark charcoal version on light backgrounds",
                    "Maintain the gold gradient on the word ESH across all applications",
                    "Use the gold wordmark as the primary brand mark across all touchpoints",
                    "Scale down the wordmark proportionally for small-format applications like favicons",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-silver-slate font-light leading-relaxed">
                      <Check className="w-3.5 h-3.5 text-accent-lime shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-panel border border-red-500/10 rounded-3xl p-6">
                <h3 className="font-display font-bold text-lg mb-4 text-red-400 flex items-center gap-2">
                  <X className="w-4 h-4 text-red-400" /> Don&apos;t
                </h3>
                <ul className="space-y-3">
                  {[
                    "Apply drop shadows or glow effects behind the wordmark",
                    "Substitute the liquid gold gradient with a solid, high-saturation yellow",
                    "Rotate, skew, or distort the wordmark in any way",
                    "Place the logo on busy photographic backgrounds without sufficient contrast",
                    "Alter the font family, weight, or letter spacing of the wordmark",
                    "Combine the logo with unapproved clip art, icons, or taglines",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-silver-slate font-light leading-relaxed">
                      <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contrast Rules */}
            <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
              <h3 className="font-display font-bold text-lg mb-4">Contrast & Adaptation Rules</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#030305] border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold">Dark Background</span>
                  <div className="text-center">
                    <span className="font-display font-bold text-lg tracking-wider">BODIED BY <span style={{ color: "#D4B87E" }}>ESH</span></span>
                  </div>
                  <span className="text-[9px] text-silver-slate/50">White text + Gold gradient</span>
                </div>
                <div className="bg-[#F8F7FA] border border-black/10 rounded-2xl p-5 flex flex-col items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#4A4D55] font-bold">Light Background</span>
                  <div className="text-center">
                    <span className="font-display font-bold text-lg tracking-wider text-[#121215]">BODIED BY <span style={{ color: "#C59B27" }}>ESH</span></span>
                  </div>
                  <span className="text-[9px] text-[#4A4D55]/50">Charcoal text + Deeper gold</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ BRAND VOICE ═══ */}
        {activeSection === "voice" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Voice Pillars */}
            <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Megaphone className="w-5 h-5 text-accent-lime" />
                <h2 className="font-display font-bold text-xl">Voice Pillars & Tone Matrix</h2>
              </div>
              <div className="space-y-4">
                {voicePillars.map((vp) => (
                  <div key={vp.pillar} className="bg-[#0A0A10] border border-white/5 rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h3 className="font-display font-bold text-sm text-accent-lime">{vp.pillar}</h3>
                      <span className="text-[10px] text-silver-slate bg-white/5 border border-white/10 px-2 py-1 rounded-lg font-medium italic">
                        {vp.tone}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-accent-lime font-bold mb-2 flex items-center gap-1">
                          <Check className="w-3 h-3 text-accent-lime" /> Use
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {vp.vocabulary.map((v) => (
                            <span key={v} className="px-2 py-1 rounded-lg bg-accent-lime/5 border border-accent-lime/15 text-[10px] text-accent-lime/80 font-medium">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-red-400 font-bold mb-2 flex items-center gap-1">
                          <X className="w-3 h-3 text-red-400" /> Avoid
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {vp.avoid.map((a) => (
                            <span key={a} className="px-2 py-1 rounded-lg bg-red-500/5 border border-red-500/15 text-[10px] text-red-400/80 font-medium line-through">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vocabulary Translation */}
            <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
              <h3 className="font-display font-bold text-lg mb-4">Vocabulary Translation Guide</h3>
              <p className="text-xs text-silver-slate font-light mb-4">
                Upgrade everyday fitness terminology to create a proprietary brand language that commands premium positioning.
              </p>
              <div className="space-y-2">
                {vocabTranslations.map((vt) => (
                  <div key={vt.from} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 rounded-xl bg-[#0A0A10] border border-white/5">
                    <span className="text-xs text-red-400/70 line-through font-light min-w-[200px]">{vt.from}</span>
                    <span className="text-silver-slate text-[10px] hidden sm:block">→</span>
                    <span className="text-xs text-accent-lime font-medium">{vt.to}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ POSITIONING ═══ */}
        {activeSection === "positioning" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-accent-lime" />
                <h2 className="font-display font-bold text-xl">Market Positioning & Target</h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Price Point", value: "$499–$799/mo", icon: DollarSign },
                  { label: "Target HHI", value: "$175k+ Median", icon: Home },
                  { label: "Geography", value: "South Florida", icon: MapPin },
                  { label: "Segment", value: "Premium Exec.", icon: Briefcase },
                ].map((stat) => {
                  const IconComp = stat.icon;
                  return (
                    <div key={stat.label} className="bg-[#0A0A10] border border-white/5 rounded-2xl p-4 text-center">
                      <div className="w-8 h-8 rounded-lg bg-accent-lime/10 flex items-center justify-center text-accent-lime mx-auto mb-2">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold block mb-1">{stat.label}</span>
                      <span className="font-display font-bold text-sm text-white">{stat.value}</span>
                    </div>
                  );
                })}
              </div>

              {/* Target Personas */}
              <h3 className="font-display font-bold text-lg mb-4">Target Client Personas</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    persona: "The Executive",
                    desc: "Corporate executives and founders managing decision fatigue. Values absolute efficiency, data-driven results, and privacy. Willing to pay premium for zero-friction concierge service.",
                    key: "Time-scarce, results-driven, high privacy needs",
                  },
                  {
                    persona: "The Affluent Parent",
                    desc: "Busy parents in Boca Raton and Parkland corridors, typically at youth sports parks during children's practice. Seeks premium training that fits into existing schedule windows.",
                    key: "Park-to-Peak, community-minded, values convenience",
                  },
                ].map((p) => (
                  <div key={p.persona} className="bg-[#0A0A10] border border-white/5 rounded-2xl p-5">
                    <h4 className="font-display font-bold text-sm text-accent-lime mb-2">{p.persona}</h4>
                    <p className="text-xs text-silver-slate font-light leading-relaxed mb-3">{p.desc}</p>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-accent-lime/60 shrink-0" />
                      <span className="text-[10px] text-accent-lime/60 font-medium italic">{p.key}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Advantages */}
            <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8">
              <h3 className="font-display font-bold text-lg mb-4">Competitive Advantages</h3>
              <div className="space-y-3">
                {[
                  {
                    vs: "Equinox / Lifetime Fitness",
                    advantage: "Zero Friction — We meet clients at their local park or provide fully remote concierge telemetry, eliminating gym commutes.",
                  },
                  {
                    vs: "FIT4MOM / Stroller Groups",
                    advantage: "Premium Strength Focus — We target parents of older children with kettlebells, bags, and advanced biomechanics coaching.",
                  },
                  {
                    vs: "OrangeTheory / F45",
                    advantage: "Precision Engineering — Small group sessions with individual form correction, backed by a custom Macro Estimator.",
                  },
                  {
                    vs: "Boutique In-Home Trainers",
                    advantage: "Bespoke Tech Integration — Dedicated client portal with workout histories, macro goals, and daily biometric logs.",
                  },
                ].map((comp) => (
                  <div key={comp.vs} className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-[#0A0A10] border border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-silver-slate/50 font-bold min-w-[180px] shrink-0">
                      vs. {comp.vs}
                    </span>
                    <p className="text-xs text-silver-slate font-light leading-relaxed">{comp.advantage}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
