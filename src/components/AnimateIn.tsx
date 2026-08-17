"use client";
import React, { useEffect, useRef, useState } from "react";

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Direction the element enters FROM. E.g., "bottom" means it slides up from below. */
  from?: "top" | "bottom" | "left" | "right";
  /** Kept for backward compat — alias for `from`. */
  direction?: "up" | "left" | "right";
}

export default function AnimateIn({
  children,
  className = "",
  delay = 0,
  from,
  direction,
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Resolve direction: `from` takes priority over `direction`
  const resolvedFrom = from ?? (direction === "up" ? "bottom" : direction === "left" ? "left" : direction === "right" ? "right" : "bottom");

  const transforms: Record<string, string> = {
    top: "translateY(-24px)",
    bottom: "translateY(24px)",
    left: "translateX(-24px)",
    right: "translateX(24px)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0)" : transforms[resolvedFrom],
        transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
