"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { CheckCircle2, Calendar, Sparkles, Clock, Check, Loader2 } from "lucide-react";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Client / Order Details
  const [orderDetails, setOrderDetails] = useState<{
    customerEmail: string | null;
    programName: string | null;
    customerName?: string | null;
  } | null>(null);

  const timeSlots = [
    "Mon, June 18 at 9:00 AM",
    "Mon, June 18 at 10:30 AM",
    "Tue, June 19 at 1:00 PM",
    "Tue, June 19 at 3:30 PM",
    "Wed, June 20 at 10:00 AM",
    "Wed, June 20 at 11:30 AM",
  ];

  // Fetch session details from Stripe endpoint if sessionId exists
  useEffect(() => {
    if (!sessionId || sessionId === "mock_session_dev") {
      setOrderDetails({
        customerEmail: "client@bodiedbyesh.com",
        programName: "Executive Concierge",
        customerName: "Athlete",
      });
      return;
    }

    async function fetchSession() {
      try {
        const res = await fetch(`/api/checkout-session?id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setOrderDetails({
            customerEmail: data.customerEmail,
            programName: data.programName,
            customerName: data.customerName || "Athlete",
          });
        }
      } catch (err) {
        console.error("Failed to load order details:", err);
      }
    }

    fetchSession();
  }, [sessionId]);

  const handleBooking = async () => {
    if (!selectedSlot) return;

    setBookingLoading(true);
    try {
      const res = await fetch("/api/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: orderDetails?.customerEmail || "client@bodiedbyesh.com",
          name: orderDetails?.customerName || "Athlete",
          programName: orderDetails?.programName || "Coaching Program",
          slot: selectedSlot,
        }),
      });

      if (res.ok) {
        setBookingConfirmed(true);
      } else {
        console.error("Booking API returned error status");
      }
    } catch (err) {
      console.error("Failed to submit booking:", err);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cyber-slate text-ice-white selection:bg-accent-lime selection:text-cyber-slate overflow-hidden flex flex-col">
      {/* Decorative glows */}
      <div className="absolute top-[30%] right-[-10%] pulse-glow-lime opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] pulse-glow-violet opacity-15 pointer-events-none" />

      {/* Header */}
      <header className="glass-panel border-b border-white/5 py-4 px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between">
        <Link href="/">
          <Logo className="cursor-pointer" />
        </Link>
        <Link
          href="/"
          className="text-xs uppercase tracking-wider font-bold text-silver-slate hover:text-white transition-all"
        >
          Exit Success Page
        </Link>
      </header>

      {/* Main Container - max-w-6xl with flex side-by-side layout */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 md:py-16 flex flex-col md:flex-row gap-12 items-start w-full">
        {/* Left Column: Success Message */}
        <div className="w-full md:w-[58%] space-y-6 shrink-0">
          <div className="w-16 h-16 rounded-full bg-accent-lime/10 text-accent-lime flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-accent-lime/10 text-accent-lime text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Application Verified
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight">
              You're One Step Closer.
            </h1>
          </div>

          <p className="text-silver-slate text-sm font-light leading-relaxed">
            Your qualification metrics match our target profile parameters. To complete your onboarding and lock in your macro split review, schedule a 15-minute Strategy Kickoff Call with Esh using the scheduling assistant below (or to the right).
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex gap-3 text-xs text-silver-slate font-light">
              <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-accent-lime shrink-0">
                <Check className="w-3 h-3" />
              </span>
              <span>Review your custom MSJ BMR and calorie outputs.</span>
            </div>
            <div className="flex gap-3 text-xs text-silver-slate font-light">
              <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-accent-lime shrink-0">
                <Check className="w-3 h-3" />
              </span>
              <span>Select your kickoff date for either Park or Concierge sessions.</span>
            </div>
            <div className="flex gap-3 text-xs text-silver-slate font-light">
              <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-accent-lime shrink-0">
                <Check className="w-3 h-3" />
              </span>
              <span>Finalise custom software portal access log-ins.</span>
            </div>
          </div>

          {/* Alternative Payment Options */}
          <div className="glass-panel border-white/5 bg-[#0B0B0F]/60 rounded-2xl p-5 space-y-3 mt-6">
            <h4 className="text-xs uppercase tracking-wider text-accent-lime font-bold">
              Alternative Payments Accepted
            </h4>
            <p className="text-silver-slate text-xs leading-relaxed font-light">
              We support direct instant transfers via Zelle or Cash App to finalize your roster slot:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 bg-cyber-slate rounded-xl border border-white/5 flex flex-col">
                <span className="text-[10px] text-silver-slate uppercase font-semibold">Zelle</span>
                <span className="text-ice-white font-bold font-mono mt-0.5">772-877-4231</span>
              </div>
              <div className="p-3 bg-cyber-slate rounded-xl border border-white/5 flex flex-col">
                <span className="text-[10px] text-silver-slate uppercase font-semibold">Cash App</span>
                <span className="text-accent-lime font-bold font-mono mt-0.5">$nieshamuhammad</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Calendar Scheduling Widget */}
        <div className="w-full md:w-[38%] shrink-0 md:sticky md:top-24">
          <div className="glass-panel border-white/5 rounded-3xl p-6 md:p-8 relative">
            {bookingConfirmed ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full bg-accent-lime/10 text-accent-lime flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-xl mb-1">Kickoff Call Confirmed</h3>
                <p className="text-silver-slate text-xs mb-4 font-light">
                  A calendar invite and SMS reminder have been sent.
                </p>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold font-display text-accent-lime mb-6">
                  {selectedSlot}
                </div>
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
                >
                  Explore Client Portal
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-xl flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent-lime" />
                    Strategy Kickoff Scheduler
                  </h3>
                  <p className="text-silver-slate text-xs mt-1 font-light">
                    Select a 15-minute slot that fits your schedule.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-left text-xs flex justify-between items-center transition-all ${
                        selectedSlot === slot
                          ? "border-accent-lime bg-accent-lime/5 text-ice-white font-semibold"
                          : "border-white/5 bg-cyber-slate hover:border-white/10 text-silver-slate"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {slot}
                      </span>
                      {selectedSlot === slot && <span className="text-[10px] uppercase font-bold text-accent-lime">Selected</span>}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot || bookingLoading}
                  className="w-full inline-flex items-center justify-center bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                >
                  {bookingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Book Performance Audit"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cyber-slate flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
