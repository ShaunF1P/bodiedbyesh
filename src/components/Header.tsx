"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { Menu, X, ClipboardList, ArrowRight, Shield } from "lucide-react";

const navLinks: { href: string; label: string; badge?: boolean; highlight?: boolean }[] = [
  { href: "/intake", label: "Client Intake", badge: true, highlight: true },
  { href: "/park", label: "Park-to-Peak Program" },
  { href: "/calculator", label: "Recomp Estimator" },
  { href: "/coastal", label: "Coastal Walk" },
  { href: "/dashboard", label: "Client Portal (Demo)" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Top Client Onboarding Notification Bar */}
      <div className="bg-gradient-to-r from-accent-lime/15 via-cyber-slate to-accent-violet/15 border-b border-accent-lime/25 py-2 px-4 text-center text-xs text-ice-white flex items-center justify-center gap-2 relative z-50">
        <span className="inline-flex items-center gap-1.5 text-accent-lime font-bold uppercase tracking-wider text-[11px]">
          <ClipboardList className="w-3.5 h-3.5" />
          Client Intake
        </span>
        <span className="text-silver-slate hidden sm:inline">· New or enrolled client? Complete your clinical onboarding protocol:</span>
        <Link
          href="/intake"
          className="inline-flex items-center gap-1 text-accent-lime hover:text-white underline font-bold transition-colors"
        >
          Access Intake Forms
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 safe-top py-4 px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between">
        <Link href="/">
          <Logo className="cursor-pointer" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-silver-slate">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-accent-lime transition-colors flex items-center gap-1.5 ${
                link.highlight ? "text-accent-lime font-semibold" : ""
              }`}
            >
              {link.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
              )}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/intake"
            className="hidden md:inline-flex items-center justify-center bg-accent-lime/15 border border-accent-lime/40 hover:bg-accent-lime hover:text-cyber-slate text-accent-lime px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all gap-1.5 shadow-sm shadow-accent-lime/10"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Client Intake
          </Link>
          <Link
            href="/apply"
            className="hidden sm:inline-flex items-center justify-center bg-transparent border border-white/10 hover:border-accent-lime hover:text-accent-lime px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
          >
            Apply for Coaching
          </Link>
          <Link
            href="/calculator"
            className="hidden sm:inline-flex items-center justify-center bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-accent-lime/10 hover:shadow-accent-lime/20 transition-all"
          >
            Get Free Macro Plan
          </Link>

          {/* Coach Admin Link */}
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-accent-lime/40 text-silver-slate hover:text-accent-lime transition-all"
            title="Coach Admin Portal"
            aria-label="Coach Admin Portal"
          >
            <Shield className="w-3.5 h-3.5" />
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-accent-lime/40 text-ice-white hover:text-accent-lime transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-lime"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-300 md:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 transition-all ${
            mobileOpen ? "backdrop-blur-sm" : "backdrop-blur-none"
          }`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <nav
          className={`absolute top-0 right-0 h-full w-[min(80vw,320px)] bg-onyx-card border-l border-white/5 flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <span className="font-display font-bold text-sm uppercase tracking-wider text-silver-slate">
              Menu
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-accent-lime/40 text-ice-white hover:text-accent-lime transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-lime"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Intake Protocol Callout */}
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-accent-lime/10 border border-accent-lime/30 flex flex-col gap-2 shadow-lg shadow-accent-lime/5">
            <div className="flex items-center gap-2 text-accent-lime font-bold text-xs uppercase tracking-wider">
              <ClipboardList className="w-4 h-4" />
              <span>New Client Onboarding</span>
            </div>
            <p className="text-xs text-silver-slate font-light leading-snug">
              Enrolled client? Complete your clinical intake form for Track A, Track B, or Nutrition.
            </p>
            <Link
              href="/intake"
              onClick={() => setMobileOpen(false)}
              className="mt-1 flex items-center justify-center gap-1.5 bg-accent-lime text-cyber-slate font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl hover:bg-accent-lime/90 transition-all shadow-md shadow-accent-lime/20"
            >
              Access Intake Forms
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Nav Links */}
          <div className="flex-1 flex flex-col gap-2 p-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-silver-slate hover:text-ice-white hover:bg-white/5 transition-all text-base font-medium"
              >
                {link.badge && (
                  <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
                )}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Drawer CTAs */}
          <div className="p-6 safe-bottom border-t border-white/5 flex flex-col gap-3">
            <Link
              href="/apply"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center bg-transparent border border-white/10 hover:border-accent-lime hover:text-accent-lime px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Apply for Coaching
            </Link>
            <Link
              href="/calculator"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-accent-lime/10 hover:shadow-accent-lime/20 transition-all"
            >
              Get Free Macro Plan
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-silver-slate hover:text-accent-lime transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Coach Admin Portal
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
