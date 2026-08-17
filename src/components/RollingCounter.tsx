"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

interface RollingCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function RollingCounter({
  value,
  duration = 1200,
  prefix = "",
  suffix = "",
  className = "",
}: RollingCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const rafId = useRef<number | null>(null);
  const hasAnimated = useRef(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  const animate = useCallback(
    (from: number, to: number) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);

      let startTimestamp: number | null = null;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);

        // Cubic ease-out for premium feel
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * (to - from) + from);
        setDisplayValue(current);

        if (progress < 1) {
          rafId.current = window.requestAnimationFrame(step);
        } else {
          setDisplayValue(to);
          previousValue.current = to;
        }
      };

      rafId.current = window.requestAnimationFrame(step);
    },
    [duration]
  );

  // Intersection Observer: animate only when visible
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate(0, value);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, animate]);

  // Re-animate when value changes (for dashboard live counters)
  useEffect(() => {
    if (hasAnimated.current && previousValue.current !== value) {
      animate(previousValue.current, value);
    }
  }, [value, animate]);

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <span ref={elementRef} className={`font-display font-bold tabular-nums ${className}`}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
