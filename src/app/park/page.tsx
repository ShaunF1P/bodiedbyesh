"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import AnimateIn from "@/components/AnimateIn";
import Footer from "@/components/Footer";
import {
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Flame,
  Zap,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Package,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ScheduleSlot {
  day: string;
  time: string;
  duration: string;
}

interface ParkConfig {
  activePark: {
    name: string;
    city: string;
    address: string;
    meetingSpot: string;
    googleMapsUrl: string;
  };
  schedule: ScheduleSlot[];
  whatToBring: string[];
  coachNotes: string;
  isAcceptingNewClients: boolean;
  lastUpdated: string;
}

export default function ParkProgram() {
  const [config, setConfig] = useState<ParkConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [formState, setFormState] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/park-config", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/ghl-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          programChoice: "track_a_park",
          trackGoal: config?.activePark.name || "Park Program",
          source: "park_program",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Park lead capture error:", err);
      setSubmitError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-slate flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
          <p className="text-silver-slate text-sm">Loading park details...</p>
        </div>
      </div>
    );
  }

  // Error / no config fallback
  if (error || !config) {
    return (
      <div className="min-h-screen bg-cyber-slate flex items-center justify-center px-6">
        <div className="glass-panel rounded-3xl p-8 max-w-md text-center border border-white/5">
          <AlertCircle className="w-10 h-10 text-accent-lime mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl mb-2 text-ice-white">Park info loading</h2>
          <p className="text-silver-slate text-sm mb-6">
            We&apos;re updating our park details. Please check back in a moment or contact Esh directly.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent-lime font-display font-bold uppercase tracking-wider text-xs"
          >
            Back to Home
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { activePark, schedule, whatToBring, coachNotes, isAcceptingNewClients, lastUpdated } = config;

  return (
    <div className="relative min-h-screen bg-cyber-slate text-ice-white overflow-hidden">
      {/* Glow Elements */}
      <div className="absolute top-[10%] right-[-10%] pulse-glow-lime opacity-15 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] pulse-glow-violet opacity-20 pointer-events-none" />

      <Header />

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 space-y-8">
          <AnimateIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-lime/20 bg-accent-lime/5 text-accent-lime text-xs font-medium uppercase tracking-wider mb-6">
              <MapPin className="w-3.5 h-3.5" />
              Live Park Location
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight mb-4">
              The Sideline Recomp Method:{" "}
              <span className="text-accent-lime">Park-to-Peak</span>
            </h1>
            <p className="text-silver-slate text-lg font-light leading-relaxed">
              Why spend 6 hours a week scrolling in your car or sitting on hard bleachers during your
              kids&apos; sports practices? We bring premium resistance training, structural movement
              patterns, and data-driven macro templates directly to the park.
            </p>
          </AnimateIn>

          {/* ─── Active Park Card ─── */}
          <AnimateIn delay={100}>
            <div className="glass-panel-lime rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-6 right-6 text-accent-lime/10">
                <MapPin className="w-16 h-16" />
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-lime animate-pulse" />
                <span className="text-accent-lime text-[10px] font-bold uppercase tracking-widest">
                  Current Location
                </span>
              </div>

              <h2 className="font-display font-bold text-3xl mb-1 text-ice-white">
                {activePark.name}
              </h2>
              <p className="text-silver-slate text-sm mb-6">{activePark.city}</p>

              <div className="space-y-4 mb-6">
                <div className="flex gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
                  <div>
                    <span className="text-silver-slate text-xs uppercase tracking-wider">Address</span>
                    <p className="font-medium mt-0.5">{activePark.address}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <Clock className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
                  <div>
                    <span className="text-silver-slate text-xs uppercase tracking-wider">Meeting Spot</span>
                    <p className="font-medium mt-0.5">{activePark.meetingSpot}</p>
                  </div>
                </div>
              </div>

              {activePark.googleMapsUrl && (
                <a
                  href={activePark.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent-lime font-display font-bold uppercase tracking-wider text-xs hover:translate-x-0.5 transition-all"
                >
                  Open in Google Maps
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </AnimateIn>

          {/* ─── Schedule ─── */}
          <AnimateIn delay={200}>
            <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl">Session Schedule</h3>
              </div>

              {schedule.length > 0 ? (
                <div className="space-y-3">
                  {schedule.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-2xl bg-cyber-slate border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime font-display font-bold text-xs">
                          {slot.day.slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-display font-semibold text-base">{slot.day}</p>
                          <p className="text-silver-slate text-xs">{slot.duration} session</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-accent-lime text-lg">{slot.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-silver-slate text-sm text-center py-6">
                  Schedule is being updated. Check back soon!
                </p>
              )}
            </div>
          </AnimateIn>

          {/* ─── What to Bring ─── */}
          {whatToBring.length > 0 && (
            <AnimateIn delay={300}>
              <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-xl">What to Bring</h3>
                </div>
                <ul className="space-y-3">
                  {whatToBring.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
                      <span className="text-silver-slate">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
          )}

          {/* Your Coach Profile Card */}
          <AnimateIn delay={340}>
            <div className="glass-panel border-white/5 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-center">
              {/* Coach Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/coach_esh_park.png"
                alt="Coach Esh"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-accent-lime/20 shadow-lg shadow-accent-lime/5"
              />
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-1 bg-accent-lime/10 border border-accent-lime/20 px-2 py-0.5 rounded-full text-accent-lime text-[10px] font-bold uppercase tracking-wider">
                  Head Coach &amp; Founder
                </div>
                <h3 className="font-display font-bold text-xl text-white">Niesha &quot;Esh&quot; Muhammad</h3>
                <p className="text-silver-slate text-sm font-light leading-relaxed">
                  Specializing in body recomposition, female biomechanics, and outdoor athletic restoration. Esh handles all local Park-to-Peak coaching sessions on-site.
                </p>
              </div>
            </div>
          </AnimateIn>

          {/* ─── Coaching Notes ─── */}
          {coachNotes && (
            <AnimateIn delay={350}>
              <div className="p-5 rounded-2xl bg-accent-lime/5 border border-accent-lime/15 flex gap-3">
                <FileText className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
                <div>
                  <p className="text-accent-lime text-xs font-bold uppercase tracking-wider mb-1">
                    Coach&apos;s Note
                  </p>
                  <p className="text-silver-slate text-sm font-light leading-relaxed">{coachNotes}</p>
                </div>
              </div>
            </AnimateIn>
          )}

          {/* ─── Last Updated ─── */}
          <AnimateIn delay={400}>
            <p className="text-silver-slate/50 text-[10px] uppercase tracking-wider">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          </AnimateIn>
        </div>

        {/* ─── Right Column: Booking Form ─── */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <AnimateIn from="right" delay={200}>
            <div className="glass-panel border-white/5 rounded-3xl p-8 relative">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-accent-lime/10 text-accent-lime flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-2">You&apos;re on the list!</h3>
                  <p className="text-silver-slate text-sm font-light leading-relaxed mb-6">
                    Esh will review your details and send you an SMS shortly to coordinate your trial
                    session at{" "}
                    <span className="text-accent-lime font-bold">{activePark.name}</span>.
                  </p>
                  <Link
                    href="/calculator"
                    className="inline-flex items-center gap-2 text-accent-lime font-display font-bold uppercase tracking-wider text-xs hover:translate-x-1 transition-all"
                  >
                    Configure Your Macros
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : !isAcceptingNewClients ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-accent-violet/10 text-accent-violet flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-2">Waitlist Mode</h3>
                  <p className="text-silver-slate text-sm font-light leading-relaxed mb-6">
                    Park sessions are currently full. Drop your info below and we&apos;ll notify you
                    when a spot opens up.
                  </p>
                  <Link
                    href="/apply"
                    className="inline-flex items-center gap-2 bg-accent-violet text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Join Executive Track Instead
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-lime/10 text-accent-lime text-[10px] font-bold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" />
                      Exclusive Local Offer
                    </div>
                    <h3 className="font-display font-bold text-2xl">Claim a Free Park Session</h3>
                    <p className="text-silver-slate text-xs font-light mt-1">
                      Try Track A on us at{" "}
                      <span className="text-accent-lime font-semibold">{activePark.name}</span>.
                      Meet Esh, review your macro split, and experience the sideline method.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="parkFormName"
                        className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1.5"
                      >
                        Your Full Name
                      </label>
                      <input
                        id="parkFormName"
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="parkFormEmail"
                        className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1.5"
                      >
                        Email Address
                      </label>
                      <input
                        id="parkFormEmail"
                        type="email"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        placeholder="sarah@example.com"
                        className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="parkFormPhone"
                        className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1.5"
                      >
                        Phone Number (For SMS Sync)
                      </label>
                      <input
                        id="parkFormPhone"
                        type="tel"
                        required
                        value={formState.phone}
                        onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                        placeholder="(561) 555-0199"
                        className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1.5">
                        Session Location
                      </label>
                      <div className="w-full bg-white/5 border border-white/5 text-silver-slate rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-accent-lime" />
                        {activePark.name} ({activePark.city})
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all focus-ring"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Claim Free Trial Session"
                    )}
                  </button>
                </form>
              )}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Program Mechanics */}
      <section className="py-24 bg-onyx-card/30 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <AnimateIn className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-5xl mb-4">
              How Park-to-Peak Works
            </h2>
            <p className="text-silver-slate max-w-xl mx-auto font-light">
              A premium personal training experience located right on the sidelines. Zero commute,
              maximum efficiency.
            </p>
          </AnimateIn>

          <div className="grid md:grid-cols-3 gap-8">
            <AnimateIn delay={100}>
              <div className="glass-panel rounded-2xl p-6 border-white/5 h-full">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="font-display font-semibold text-lg mb-2">
                  1. Bring Your Basics
                </h4>
                <p className="text-silver-slate text-sm font-light leading-relaxed">
                  Please bring your own mat, water bottle, booty bands, and gloves if needed. Esh provides
                  all heavy mobile strength equipment (kettlebells, powerbags, etc.) on-site.
                </p>
              </div>
            </AnimateIn>
            <AnimateIn delay={200}>
              <div className="glass-panel rounded-2xl p-6 border-white/5 h-full">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-display font-semibold text-lg mb-2">
                  2. Scheduled During Practice
                </h4>
                <p className="text-silver-slate text-sm font-light leading-relaxed">
                  Workouts start 10 minutes after drop-off and conclude 10 minutes before pickup,
                  maximizing your focus window.
                </p>
              </div>
            </AnimateIn>
            <AnimateIn delay={300}>
              <div className="glass-panel rounded-2xl p-6 border-white/5 h-full">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime mb-4">
                  <Flame className="w-5 h-5" />
                </div>
                <h4 className="font-display font-semibold text-lg mb-2">3. App-Driven Tracking</h4>
                <p className="text-silver-slate text-sm font-light leading-relaxed">
                  Beyond the physical park workouts, access the full Bodied by Esh macro portal to sync
                  variables and log daily metrics.
                </p>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
