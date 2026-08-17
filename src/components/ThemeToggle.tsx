"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * ThemeToggle — Animated sun/moon toggle for light/dark mode.
 *
 * Behavior:
 * 1. On mount, checks localStorage('theme') → 'light' or 'dark'
 * 2. If no saved pref, checks system prefers-color-scheme
 * 3. Applies .light class to <html> for light mode
 * 4. Saves preference on toggle
 * 5. Listens for system preference changes
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      applyTheme(initial);
    }
    setMounted(true);

    // Listen for system theme changes (if no saved pref)
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        const next = e.matches ? "dark" : "light";
        setTheme(next);
        applyTheme(next);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    const html = document.documentElement;
    if (t === "light") {
      html.classList.add("light");
    } else {
      html.classList.remove("light");
    }
    // Update meta theme-color for mobile browser chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", t === "light" ? "#F8F7FA" : "#09090E");
    }
  };

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
  };

  // Prevent hydration mismatch — render nothing until mounted
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="touch-target relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-accent-lime/40 text-silver-slate hover:text-accent-lime transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-lime overflow-hidden group"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {/* Sun icon — visible in dark mode (clicking switches to light) */}
      <Sun
        className={`w-[18px] h-[18px] absolute transition-all duration-300 ease-out ${
          theme === "dark"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-50"
        }`}
      />
      {/* Moon icon — visible in light mode (clicking switches to dark) */}
      <Moon
        className={`w-[18px] h-[18px] absolute transition-all duration-300 ease-out ${
          theme === "light"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-50"
        }`}
      />
    </button>
  );
}
