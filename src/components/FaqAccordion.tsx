"use client";
import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${
              isOpen ? "border border-accent-lime/15" : "border border-white/5"
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 p-6 text-left focus-ring rounded-2xl"
              aria-expanded={isOpen}
            >
              <span className="font-display font-semibold text-lg flex items-center gap-3">
                <HelpCircle
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isOpen ? "text-accent-lime" : "text-silver-slate"
                  }`}
                />
                {item.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 shrink-0 text-silver-slate transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-accent-lime" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-6 pb-6 pt-0 text-silver-slate text-sm font-light leading-relaxed">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
