"use client";

import React from "react";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-16 px-4 sm:px-6 md:px-8 lg:px-12 bg-onyx-card/20 backdrop-blur-md relative overflow-hidden safe-bottom">
      {/* Top subtle border-glow line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-lime/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-start relative z-10">
        
        {/* Brand/Bio Column */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-lime animate-pulse" />
            <span className="font-display font-bold tracking-wider text-sm text-ice-white uppercase">
              BODIED BY <span className="text-accent-lime">ESH</span>
            </span>
          </div>
          <p className="text-silver-slate text-sm font-light leading-relaxed max-w-sm">
            Premium resistance training, custom female biomechanics, and data-driven metabolic tracking tailored to your busy schedule.
          </p>
          
          {/* Social Icons */}
          <div className="flex gap-4 pt-2">
            <a
              href="https://instagram.com/Bodiedby_Esh"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-silver-slate hover:text-accent-lime hover:border-accent-lime/30 hover:bg-accent-lime/5 transition-all duration-300"
              aria-label="Instagram"
            >
              <svg
                className="w-5 h-5 fill-none stroke-current"
                viewBox="0 0 24 24"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://tiktok.com/@Bodiedby_Esh"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-silver-slate hover:text-accent-lime hover:border-accent-lime/30 hover:bg-accent-lime/5 transition-all duration-300"
              aria-label="TikTok"
            >
              <svg
                className="w-4 h-4 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.58-4.06-1.47-.77-.57-1.39-1.35-1.77-2.24-.04 4.07.01 8.14-.04 12.21-.11 2.27-1.25 4.49-3.23 5.62-2.14 1.25-4.96 1.34-7.16.22-2.27-1.12-3.83-3.6-3.85-6.19.01-2.91 2.05-5.6 4.93-6.11.83-.16 1.68-.15 2.51-.02v4.06c-.84-.19-1.76-.08-2.5.35-.91.53-1.46 1.55-1.43 2.61.02 1.29.9 2.5 2.14 2.87 1.24.39 2.68.04 3.51-.95.4-.48.58-1.12.57-1.74-.01-3.66.01-7.31-.01-10.97H12.52c0-2.81-.01-5.63.005-8.44z" />
              </svg>
            </a>
            <a
              href="mailto:BodiedByEsh@gmail.com"
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-silver-slate hover:text-accent-lime hover:border-accent-lime/30 hover:bg-accent-lime/5 transition-all duration-300"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Links Column */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-xs uppercase font-bold tracking-widest text-ice-white">Navigation</h4>
          <ul className="space-y-2.5 text-sm text-silver-slate font-light">
            <li>
              <Link href="/" className="hover:text-accent-lime hover:pl-1 transition-all duration-300">
                Home
              </Link>
            </li>
            <li>
              <Link href="/calculator" className="hover:text-accent-lime hover:pl-1 transition-all duration-300">
                Macro Calculator
              </Link>
            </li>
            <li>
              <Link href="/park" className="hover:text-accent-lime hover:pl-1 transition-all duration-300">
                Park Sessions
              </Link>
            </li>
            <li>
              <Link href="/logo-review" className="hover:text-accent-lime hover:pl-1 transition-all duration-300">
                Brand Feedback
              </Link>
            </li>
          </ul>
        </div>

        {/* Community & Faith Column */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs uppercase font-bold tracking-widest text-ice-white">Community & Faith</h4>
          <ul className="space-y-2.5 text-sm text-silver-slate font-light">
            <li>
              <Link
                href="/coastal"
                className="hover:text-accent-lime hover:pl-1 transition-all duration-300"
              >
                Coastal Church Walk (#3266)
              </Link>
            </li>
            <li>
              <Link
                href="/coastal?tab=devotional"
                className="hover:text-accent-lime hover:pl-1 transition-all duration-300"
              >
                Walking by Faith Devotional
              </Link>
            </li>
            <li>
              <Link
                href="/coastal?tab=journey"
                className="hover:text-accent-lime hover:pl-1 transition-all duration-300"
              >
                Church Faith Journeys
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard"
                className="hover:text-accent-lime hover:pl-1 transition-all duration-300"
              >
                Client Portal (Demo)
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact/Locations Column */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs uppercase font-bold tracking-widest text-ice-white">Connect with Esh</h4>
          <ul className="space-y-3.5 text-sm text-silver-slate font-light">
            <li className="flex items-center gap-2.5">
              <Mail className="w-4.5 h-4.5 text-accent-lime" />
              <a href="mailto:BodiedByEsh@gmail.com" className="hover:text-white transition-colors duration-300">
                BodiedByEsh@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4.5 h-4.5 text-accent-lime shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-xs uppercase tracking-wider mb-1">Active Coaching Sites</p>
                <p>Parkland · Boca Raton · Delray Beach</p>
              </div>
            </li>
          </ul>
        </div>
        
      </div>
      
      {/* Sub-footer */}
      <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-silver-slate/50 font-light relative z-10">
        <p>&copy; {new Date().getFullYear()} Bodied by Esh. All rights reserved.</p>
        <p className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
          Sideline Recomp System
        </p>
      </div>
    </footer>
  );
}
