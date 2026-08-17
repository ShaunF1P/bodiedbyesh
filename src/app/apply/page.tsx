"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

function ApplyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    commitment: "ready", // ready | undecided
    trackGoal: "recomp", // fat_loss | muscle_gain | energy
    programChoice: "track_b", // track_a (local park) | track_b (executive concierge)
    budgetConfirm: "yes", // yes | no
    name: "",
    email: "",
    phone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCanceled, setShowCanceled] = useState(false);

  // Pre-select program from query param & detect canceled checkout
  useEffect(() => {
    const track = searchParams.get("track");
    if (track === "a") {
      setFormData((prev) => ({ ...prev, programChoice: "track_a" }));
    } else if (track === "b") {
      setFormData((prev) => ({ ...prev, programChoice: "track_b" }));
    }

    if (searchParams.get("canceled") === "true") {
      setShowCanceled(true);
    }
  }, [searchParams]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Step 1: Create GHL contact
      const res = await fetch('/api/ghl-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          programChoice: formData.programChoice,
          trackGoal: formData.trackGoal,
          source: 'apply_form'
        })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to submit your application. Please try again.');
      }

      // Step 2: Create Stripe checkout session
      const checkoutRes = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programChoice: formData.programChoice,
          customerEmail: formData.email,
          customerName: formData.name,
          customerPhone: formData.phone
        })
      });

      const { url } = await checkoutRes.json();
      if (url) {
        window.location.href = url;
      } else {
        router.push('/success');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cyber-slate text-ice-white selection:bg-accent-lime selection:text-cyber-slate overflow-hidden flex flex-col">
      {/* Decorative glows */}
      <div className="absolute top-[-10%] left-[-15%] pulse-glow-lime opacity-15 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] pulse-glow-violet opacity-15 pointer-events-none" />

      {/* Header */}
      <header className="glass-panel border-b border-white/5 py-4 px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between">
        <Link href="/">
          <Logo className="cursor-pointer" />
        </Link>
        <Link
          href="/"
          className="text-xs uppercase tracking-wider font-bold text-silver-slate hover:text-white transition-all"
        >
          Exit Application
        </Link>
      </header>

      {/* Form Area */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 md:py-16">
        <div className="glass-panel border-white/5 rounded-3xl p-8 max-w-lg w-full relative">
          {/* Canceled Payment Banner */}
          {showCanceled && (
            <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm font-medium animate-fadeIn">
              Your payment was not completed. You can try again below.
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-accent-lime transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          <div className="min-h-[260px] flex flex-col justify-center">
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-accent-lime/10 text-accent-lime text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3 h-3" />
                    Commitment Check
                  </div>
                  <h3 className="font-display font-bold text-2xl">Are you ready to commit?</h3>
                  <p className="text-silver-slate text-xs mt-1 font-light">
                    Bodied by Esh is a premium coaching partnership. We ask for a 3-month baseline focus window.
                  </p>
                </div>
                <div className="grid gap-3">
                  <button
                    onClick={() => {
                      setFormData({ ...formData, commitment: "ready" });
                      handleNext();
                    }}
                    className="p-4 rounded-xl border border-white/5 bg-cyber-slate hover:border-accent-lime text-left transition-all"
                  >
                    <div className="font-semibold text-sm">Yes, I am ready to focus and commit.</div>
                    <p className="text-xs text-silver-slate mt-1">I want structured, data-driven parameters.</p>
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, commitment: "undecided" });
                      handleNext();
                    }}
                    className="p-4 rounded-xl border border-white/5 bg-cyber-slate hover:border-white/20 text-left transition-all"
                  >
                    <div className="font-semibold text-sm">I'm still looking for a quick fix.</div>
                    <p className="text-xs text-silver-slate mt-1">I might not be ready for a coaching partnership.</p>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-display font-bold text-2xl">What is your primary focus?</h3>
                  <p className="text-silver-slate text-xs mt-1 font-light">
                    Select your core target.
                  </p>
                </div>
                <div className="grid gap-3">
                  {[
                    { val: "recomp", lbl: "Body Recomposition", desc: "Build lean muscle mass while dropping body fat." },
                    { val: "fat_loss", lbl: "Fat Loss & Conditioning", desc: "Drop weight, shed body fat, and increase tone." },
                    { val: "energy", lbl: "Energy & Cognitive Recovery", desc: "Rebuild stamina and reduce brain fog." },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => {
                        setFormData({ ...formData, trackGoal: item.val });
                        handleNext();
                      }}
                      className="p-4 rounded-xl border border-white/5 bg-cyber-slate hover:border-accent-lime text-left transition-all"
                    >
                      <div className="font-semibold text-sm">{item.lbl}</div>
                      <p className="text-xs text-silver-slate mt-1">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-display font-bold text-2xl">Select Your Program Track</h3>
                  <p className="text-silver-slate text-xs mt-1 font-light">
                    How would you like to train with Esh?
                  </p>
                </div>
                <div className="grid gap-3">
                  <button
                    onClick={() => {
                      setFormData({ ...formData, programChoice: "track_a" });
                      handleNext();
                    }}
                    className="p-4 rounded-xl border border-white/5 bg-cyber-slate hover:border-accent-lime text-left transition-all"
                  >
                    <div className="font-semibold text-sm">Track A: Park-to-Peak coaching</div>
                    <p className="text-xs text-silver-slate mt-1">
                      Local South Florida outdoor training (Parkland, Boca, Coral Springs).
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, programChoice: "track_b" });
                      handleNext();
                    }}
                    className="p-4 rounded-xl border border-white/5 bg-cyber-slate hover:border-accent-lime text-left transition-all"
                  >
                    <div className="font-semibold text-sm">Track B: Executive Concierge</div>
                    <p className="text-xs text-silver-slate mt-1">
                      Fully remote 1-on-1 coaching with Oura/Whoop tracking.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-display font-bold text-2xl">Premium Program Acknowledgment</h3>
                  <p className="text-silver-slate text-xs mt-1 font-light">
                    Bodied by Esh delivers custom, high-touch programs. Our services are priced accordingly.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-accent-lime shrink-0 mt-0.5" />
                  <div className="text-xs text-silver-slate leading-relaxed">
                    Local park-side programs cost <strong className="text-accent-lime">$249/mo</strong>, while remote concierge programs are <strong className="text-accent-lime">$499/mo</strong> (3-month baseline focus window). Both tracks include custom macro blueprints and high-frequency accountability.
                  </div>
                </div>
                <div className="grid gap-3">
                  <button
                    onClick={() => {
                      setFormData({ ...formData, budgetConfirm: "yes" });
                      handleNext();
                    }}
                    className="p-4 rounded-xl border border-white/5 bg-cyber-slate hover:border-accent-lime text-left transition-all"
                  >
                    <div className="font-semibold text-sm text-accent-lime">I understand and am ready to invest.</div>
                    <p className="text-xs text-silver-slate mt-1">I value speed, custom structure, and results.</p>
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, budgetConfirm: "no" });
                      handleNext();
                    }}
                    className="p-4 rounded-xl border border-white/5 bg-cyber-slate hover:border-white/20 text-left transition-all"
                  >
                    <div className="font-semibold text-sm">I am not ready to invest right now.</div>
                    <p className="text-xs text-silver-slate mt-1">I am looking for budget-friendly alternatives.</p>
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-display font-bold text-2xl">Secure Your Strategy Audit</h3>
                  <p className="text-silver-slate text-xs mt-1 font-light">
                    Confirm your details. Esh will reach out to coordinate your kickoff.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="sarah@example.com"
                      className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1">
                      Phone Number (For SMS Sync)
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(561) 555-0199"
                      className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium animate-fadeIn">
                    {errorMessage}
                  </div>
                )}

                <div className="pt-2 flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-silver-slate hover:text-white transition-all text-center border border-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Apply & Schedule"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Step back button for earlier wizard steps */}
          {step > 1 && step < 5 && (
            <button
              onClick={handlePrev}
              className="mt-6 text-xs text-silver-slate hover:text-white transition-all block"
            >
              &larr; Go Back
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyPageInner />
    </Suspense>
  );
}
