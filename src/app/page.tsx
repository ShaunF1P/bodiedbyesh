import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FaqAccordion from "@/components/FaqAccordion";
import AnimateIn from "@/components/AnimateIn";
import RollingCounter from "@/components/RollingCounter";
import {
  Flame,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Cpu,
  Heart,
  TrendingUp,
  ClipboardList,
} from "lucide-react";

const faqItems = [
  {
    question: "Do I have to work out in public?",
    answer: (
      <>
        No. If you choose{" "}
        <strong className="text-ice-white">Track A (Park-to-Peak)</strong>,
        training occurs on-site at select South Florida parks (currently Merrit
        Park in Delray Beach) on designated turf/grassy areas adjacent to youth
        athletics. If you choose{" "}
        <strong className="text-ice-white">Track B (Executive Concierge)</strong>
        , your program is fully remote and optimized for your local gym, home
        workout area, or hotel gym.
      </>
    ),
  },
  {
    question: "How are macros calculated?",
    answer:
      "We utilize the Mifflin-St Jeor equation to establish your Basal Metabolic Rate (BMR), adjusted for daily activity multiplier coefficients. We then structure your protein requirements (typically 2.2g per kg of bodyweight) and partition carbohydrate and fat percentages depending on your primary body recomposition goal.",
  },
  {
    question: "How do the AI scanners work in the dashboard?",
    answer:
      "The AI Meal Photo Scanner maps contours and highlights bounding boxes over your meal photograph to estimate food volumes and output macro estimations. The AI Body scanner uses visual coordinates to generate skeletal meshes that compute waist-to-hip ratios and body fat distributions.",
  },
  {
    question: "Can I sync my Oura Ring or Whoop band?",
    answer:
      "Yes, our client portal supports REST API integrations with Oura and Whoop, alongside Apple HealthKit and Google Health Connect. Your coach can view daily HRV, sleep stages, and recovery indices to adjust your workouts on-the-fly.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-cyber-slate text-ice-white selection:bg-accent-lime selection:text-cyber-slate overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] pulse-glow-violet opacity-30 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] pulse-glow-lime opacity-20 pointer-events-none" />

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <AnimateIn from="top" delay={100}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-lime/20 bg-accent-lime/5 text-accent-lime text-xs font-medium uppercase tracking-wider mb-8 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            The Sideline Transformation System
          </div>
        </AnimateIn>

        {/* Title */}
        <AnimateIn from="bottom" delay={200}>
          <h1 className="font-display font-bold text-4xl sm:text-6xl md:text-7xl tracking-tight leading-tight max-w-5xl mb-6">
            The Premium Body Recomposition Engine for{" "}
            <span className="bg-gradient-to-r from-accent-lime via-accent-lime to-accent-violet bg-clip-text text-transparent">
              High-Performers
            </span>
          </h1>
        </AnimateIn>

        {/* Subtitle */}
        <AnimateIn from="bottom" delay={350}>
          <p className="text-silver-slate text-lg sm:text-xl max-w-3xl mb-12 font-light leading-relaxed">
            Outsource your fitness and nutrition friction. We provide data-driven physical architectures
            tailored directly around your high-stakes calendar, whether you are waiting on the sidelines
            of youth sports practice in South Florida or scaling a venture.
          </p>
        </AnimateIn>

        {/* Hero CTAs */}
        <AnimateIn from="bottom" delay={500}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
            <Link
              href="/calculator"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-8 py-4 rounded-full text-sm font-bold uppercase tracking-wider transition-all gap-2 group shadow-xl shadow-accent-lime/15"
            >
              Calculate Your Macros
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/apply"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-ice-white px-8 py-4 rounded-full text-sm font-bold uppercase tracking-wider transition-all"
            >
              Apply for Elite Coaching
            </Link>
          </div>

          {/* Quick Intake Access */}
          <div className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-silver-slate shadow-sm hover:border-accent-lime/40 transition-colors">
            <ClipboardList className="w-3.5 h-3.5 text-accent-lime" />
            <span>Enrolled client looking for your onboarding form?</span>
            <Link href="/intake" className="text-accent-lime hover:text-white underline font-bold transition-colors">
              Access Intake Forms →
            </Link>
          </div>
        </AnimateIn>

        {/* Live Counters */}
        <AnimateIn from="bottom" delay={650}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl w-full mt-24 pt-12 border-t border-white/5">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-display font-bold text-accent-lime mb-2">
                <RollingCounter value={42} suffix=" lbs" />
              </div>
              <p className="text-silver-slate text-xs uppercase tracking-widest font-medium">Avg Fat Loss</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-display font-bold text-accent-lime mb-2">
                <RollingCounter value={8} suffix="%" />
              </div>
              <p className="text-silver-slate text-xs uppercase tracking-widest font-medium">Avg Body Fat Drop</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-display font-bold text-accent-lime mb-2">
                <RollingCounter value={3} suffix=" hrs" />
              </div>
              <p className="text-silver-slate text-xs uppercase tracking-widest font-medium">Weekly Workout Time</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-display font-bold text-accent-lime mb-2">
                <RollingCounter value={100} suffix="%" />
              </div>
              <p className="text-silver-slate text-xs uppercase tracking-widest font-medium">Science &amp; Data Backed</p>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* The Bifurcated Business Model Tracks */}
      <section className="py-24 px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <AnimateIn from="bottom">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-5xl mb-4">Choose Your Transformation Track</h2>
            <p className="text-silver-slate max-w-2xl mx-auto font-light">
              We have designed two distinct paths to eliminate scheduling friction, ensuring your body reflects the standard of your drive.
            </p>
          </div>
        </AnimateIn>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Track A: Park-to-Peak (Sports Moms) */}
          <AnimateIn from="left" delay={100}>
            <div className="relative glass-panel-lime rounded-3xl p-8 lg:p-12 overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:shadow-accent-lime/5 transition-all duration-300 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-lime/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-2xl sm:text-3xl mb-2">Track A: Park-to-Peak Recomp</h3>
                <p className="text-accent-lime/80 text-xs font-semibold uppercase tracking-wider mb-6">
                  For Local South Florida Sports-Practice Parents
                </p>
                <p className="text-silver-slate mb-8 font-light leading-relaxed">
                  Stop scroll-looping in your car or sitting passively on the sidelines. We bring elite coaching, progressive strength training equipment, and custom macro coaching directly to the park lawn during your child&#39;s sports practice.
                </p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3 text-sm text-silver-slate">
                    <CheckCircle className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
                    <span>Sessions twice a week: Monday &amp; Wednesday or Tuesday &amp; Thursday.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-silver-slate">
                    <CheckCircle className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
                    <span>Bring your own mat, water, booty bands, and gloves if needed.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-silver-slate">
                    <CheckCircle className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" />
                    <span>Conducted on-site at Delray Beach parks (currently at Merrit Park).</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mt-auto">
                <Link
                  href="/park"
                  className="inline-flex items-center justify-center bg-accent-lime text-cyber-slate px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-accent-lime/90 transition-all text-center"
                >
                  Explore Park Programs
                </Link>
                <Link
                  href="/intake/park-to-peak"
                  className="inline-flex items-center justify-center border border-accent-lime/40 bg-accent-lime/10 hover:bg-accent-lime hover:text-cyber-slate text-accent-lime px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all text-center gap-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Fill Track A Intake
                </Link>
              </div>
            </div>
          </AnimateIn>

          {/* Track B: Executive Concierge (1-on-1 Remote) */}
          <AnimateIn from="right" delay={200}>
            <div className="relative glass-panel-violet rounded-3xl p-8 lg:p-12 overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:shadow-accent-violet/5 transition-all duration-300 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-violet/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent-violet/10 flex items-center justify-center text-accent-violet mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-2xl sm:text-3xl mb-2">Track B: Executive Concierge</h3>
                <p className="text-accent-violet/80 text-xs font-semibold uppercase tracking-wider mb-6">
                  For Remote &amp; Busy Corporate Professionals
                </p>
                <p className="text-silver-slate mb-8 font-light leading-relaxed">
                  A 100% outsourced, premium remote coaching architecture. We monitor your sleep bio-feedback (Oura/Apple Health/Whoop), HRV, and stress levels, dynamically adjusting your training and nutrition plans weekly so you never experience plateaus or burnout.
                </p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3 text-sm text-silver-slate">
                    <CheckCircle className="w-5 h-5 text-accent-violet shrink-0 mt-0.5" />
                    <span>Real-time wearable metrics synchronization (Sleep, HRV, active energy).</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-silver-slate">
                    <CheckCircle className="w-5 h-5 text-accent-violet shrink-0 mt-0.5" />
                    <span>Concierge 1-on-1 access to Esh for instant restaurant menu and travel swops.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-silver-slate">
                    <CheckCircle className="w-5 h-5 text-accent-violet shrink-0 mt-0.5" />
                    <span>Bespoke program dynamically adapting to travel, sleep depth, and workload.</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mt-auto">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center bg-accent-violet text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-accent-violet/90 transition-all text-center shadow-lg shadow-accent-violet/15"
                >
                  Apply for Track B
                </Link>
                <Link
                  href="/intake/executive-concierge"
                  className="inline-flex items-center justify-center border border-accent-violet/40 bg-accent-violet/10 hover:bg-accent-violet hover:text-white text-accent-violet px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all text-center gap-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Fill Track B Intake
                </Link>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Dedicated Client Onboarding & Intake Section */}
      <section className="py-20 px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl mx-auto border-t border-white/5 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-lime/5 filter blur-[120px] rounded-full pointer-events-none" />
        <AnimateIn from="bottom">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-accent-lime/30 bg-accent-lime/10 text-accent-lime text-xs font-bold uppercase tracking-wider mb-4 shadow-sm shadow-accent-lime/10">
              <ClipboardList className="w-4 h-4" />
              Client Onboarding Portal
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-ice-white mb-4 tracking-tight">
              Access Your Clinical Intake Protocol
            </h2>
            <p className="text-silver-slate text-base sm:text-lg font-light leading-relaxed">
              Exceeding NASM, ACSM, and Precision Nutrition standards. If Coach Esh has enrolled or invited you, complete your specialized digital protocol below to initialize your bio-telemetry, schedules, and custom architecture.
            </p>
          </div>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
          {/* Card 1: Track A */}
          <AnimateIn from="bottom" delay={100}>
            <div className="glass-panel border-white/10 hover:border-accent-lime/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full group transition-all duration-300 shadow-xl hover:shadow-accent-lime/10">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent-lime/10 text-accent-lime flex items-center justify-center mb-5">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-accent-lime uppercase tracking-widest">Intake Protocol 1</span>
                <h3 className="font-display font-bold text-2xl text-ice-white mt-1 mb-3">Track A: Park-to-Peak</h3>
                <p className="text-silver-slate text-sm font-light leading-relaxed mb-6">
                  For South Florida sports parents training on-site at Delray Beach parks (Merrit Park). Includes youth practice schedule sync, clinical PAR-Q+ joint audit, and heat readiness.
                </p>
                <div className="space-y-2 mb-8 text-xs text-silver-slate">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
                    <span>Cohort &amp; Field Schedule Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
                    <span>ACSM Turf &amp; Grass Joint Audit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
                    <span>Florida Heat &amp; Hydration Protocol</span>
                  </div>
                </div>
              </div>
              <Link
                href="/intake/park-to-peak"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-full bg-accent-lime text-cyber-slate font-bold text-xs uppercase tracking-wider hover:bg-accent-lime/90 transition-all shadow-md shadow-accent-lime/20"
              >
                Start Track A Intake Form
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimateIn>

          {/* Card 2: Track B */}
          <AnimateIn from="bottom" delay={200}>
            <div className="glass-panel border-white/10 hover:border-accent-violet/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full group transition-all duration-300 shadow-xl hover:shadow-accent-violet/10">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent-violet/10 text-accent-violet flex items-center justify-center mb-5">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-accent-violet uppercase tracking-widest">Intake Protocol 2</span>
                <h3 className="font-display font-bold text-2xl text-ice-white mt-1 mb-3">Track B: Executive Concierge</h3>
                <p className="text-silver-slate text-sm font-light leading-relaxed mb-6">
                  For corporate executives and traveling founders. Onboards Oura/Whoop bio-telemetry, screens desk posture compensations, audits travel cadence, and configures dining swaps.
                </p>
                <div className="space-y-2 mb-8 text-xs text-silver-slate">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
                    <span>Oura / Whoop / HealthKit Telemetry</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
                    <span>Cervical Spine &amp; Ergonomic Screen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
                    <span>Concierge Restaurant Menu Swaps</span>
                  </div>
                </div>
              </div>
              <Link
                href="/intake/executive-concierge"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-full bg-accent-violet text-white font-bold text-xs uppercase tracking-wider hover:bg-accent-violet/90 transition-all shadow-md shadow-accent-violet/20"
              >
                Start Track B Intake Form
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimateIn>

          {/* Card 3: Nutrition */}
          <AnimateIn from="bottom" delay={300}>
            <div className="glass-panel border-white/10 hover:border-accent-lime/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full group transition-all duration-300 shadow-xl hover:shadow-accent-lime/10">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent-lime/10 text-accent-lime flex items-center justify-center mb-5">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-accent-lime uppercase tracking-widest">Intake Protocol 3</span>
                <h3 className="font-display font-bold text-2xl text-ice-white mt-1 mb-3">Nutrition &amp; Metabolic Health</h3>
                <p className="text-silver-slate text-sm font-light leading-relaxed mb-6">
                  For custom macro architecture and metabolic recomp clients. Collects Mifflin-St Jeor variables, ~2.2g/kg protein targets, digestive symptoms, and AI scanner onboarding.
                </p>
                <div className="space-y-2 mb-8 text-xs text-silver-slate">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
                    <span>Mifflin-St Jeor BMR Baselines</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
                    <span>High-Performance Protein Partitioning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
                    <span>AI Meal Plate Scanner Setup</span>
                  </div>
                </div>
              </div>
              <Link
                href="/intake/nutrition-metabolic"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-full bg-accent-lime text-cyber-slate font-bold text-xs uppercase tracking-wider hover:bg-accent-lime/90 transition-all shadow-md shadow-accent-lime/20"
              >
                Start Nutrition Intake Form
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimateIn>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 border border-white/15 hover:border-accent-lime/50 text-ice-white hover:text-accent-lime text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-accent-lime/10"
          >
            <ClipboardList className="w-4 h-4 text-accent-lime" />
            Open Unified Client Intake Hub &amp; Copy Direct Links
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Meet the Creator Profile */}
      <section className="py-16 px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl mx-auto border-t border-white/5">
        <AnimateIn from="bottom">
          <div className="glass-panel border-white/5 rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[200px] h-[200px] bg-[#B84D72] filter blur-[100px] rounded-full opacity-10 pointer-events-none" />
            
            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/coach_esh_selfie.png"
              alt="Niesha Muhammad"
              className="w-32 h-32 md:w-44 md:h-44 rounded-3xl object-cover border border-accent-lime/25 shadow-lg shadow-accent-lime/10 shrink-0"
            />
            
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent-lime/20 bg-accent-lime/5 text-accent-lime text-xs font-semibold uppercase tracking-wider">
                Founder &amp; Head Coach
              </div>
              <h2 className="font-display font-bold text-3xl text-white">Niesha &quot;Esh&quot; Muhammad</h2>
              <p className="text-silver-slate font-light leading-relaxed max-w-3xl">
                I built Bodied by Esh for busy high-performers who want to take control of their physical architecture. Whether training park-side in Delray Beach during your kids&#39; practice or remotely tracking biometric telemetry from your wearable, my mission is to deliver elite structure, accountability, and real data-backed results.
              </p>
              <div className="pt-2">
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-2 text-accent-lime font-display font-bold uppercase tracking-wider text-xs hover:translate-x-1 transition-all"
                >
                  Apply for 1-on-1 Coaching
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* Advanced AI Telemetry Section */}
      <section className="py-24 bg-onyx-card/40 border-y border-white/5 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] animate-grid-glow pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 flex flex-col lg:flex-row items-center gap-16">
          <AnimateIn from="left" className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-lime/20 bg-accent-lime/5 text-accent-lime text-xs font-medium uppercase tracking-wider mb-6">
              <Cpu className="w-3.5 h-3.5" />
              Technology Stack
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl mb-6 leading-tight">
              Wearable Integrations &amp; Advanced AI Telemetry
            </h2>
            <p className="text-silver-slate font-light leading-relaxed mb-8">
              Bodied by Esh delivers features the fitness industry has never seen before. Our dashboard connects directly to top-tier health ecosystems (Apple Health, Google Health Connect, Oura, Whoop) and incorporates advanced machine learning tools to speed up your results.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-base mb-1">AI Meal Plate Scanner</h4>
                  <p className="text-silver-slate text-xs leading-relaxed font-light">
                    Snap a photo of your plate to auto-calculate ingredient volumes and log macros instantly.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-base mb-1">AI Body Composition Analyser</h4>
                  <p className="text-silver-slate text-xs leading-relaxed font-light">
                    Upload body profiles for skeletal mesh waist-to-hip mapping and body fat estimations.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-base mb-1">HealthKit &amp; Wearable Sync</h4>
                  <p className="text-silver-slate text-xs leading-relaxed font-light">
                    Sync Steps, Active Energy, HRV, Sleep Quality, and Strain levels in real-time.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-base mb-1">Adaptive GHL Triggers</h4>
                  <p className="text-silver-slate text-xs leading-relaxed font-light">
                    GHL webhooks trigger direct SMS support if sleep drops or recovery scores indicate high stress.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-10">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-accent-lime font-display font-bold uppercase tracking-wider text-xs hover:translate-x-1 transition-all"
              >
                Launch Client Dashboard Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimateIn>

          <AnimateIn from="right" delay={200} className="lg:w-1/2 w-full flex justify-center">
            {/* Holographic Mockup Phone */}
            <div className="relative w-full max-w-[340px] aspect-[9/18] rounded-[48px] bg-cyber-slate border-4 border-white/10 shadow-2xl shadow-accent-lime/5 p-4 flex flex-col justify-between overflow-hidden">
              {/* Camera Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20" />
              {/* Header */}
              <div className="flex justify-between items-center text-[10px] text-silver-slate mt-2 px-2">
                <span>09:41</span>
                <div className="flex gap-1.5 items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-lime"></span>
                  <span>Synced</span>
                </div>
              </div>
              {/* Content mock */}
              <div className="flex-1 mt-6 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-silver-slate mb-1">Daily Summary</div>
                  <h3 className="font-display font-bold text-xl text-ice-white mb-4">Bio-Telemetry</h3>
                  {/* HRV card */}
                  <div className="glass-panel rounded-2xl p-3 mb-3 border-white/5">
                    <div className="flex justify-between items-center text-[10px] text-silver-slate mb-2">
                      <span>Oura HRV (Average)</span>
                      <span className="text-accent-lime font-bold">+8%</span>
                    </div>
                    <div className="text-2xl font-display font-bold text-ice-white">82 ms</div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                      <div className="w-[82%] h-full bg-accent-lime" />
                    </div>
                  </div>
                  {/* Calorie Card */}
                  <div className="glass-panel rounded-2xl p-3 border-white/5">
                    <div className="flex justify-between items-center text-[10px] text-silver-slate mb-2">
                      <span>Macro Budget</span>
                      <span className="text-accent-lime">640 kcal left</span>
                    </div>
                    <div className="text-2xl font-display font-bold text-ice-white">1,620 <span className="text-xs text-silver-slate">/ 2,260 kcal</span></div>
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5 text-[9px]">
                      <div>
                        <div className="text-silver-slate">Pro</div>
                        <div className="text-accent-lime font-bold">145g / 160g</div>
                      </div>
                      <div>
                        <div className="text-silver-slate">Carb</div>
                        <div className="text-accent-violet font-bold">160g / 220g</div>
                      </div>
                      <div>
                        <div className="text-silver-slate">Fat</div>
                        <div className="text-ice-white font-bold">42g / 62g</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Scanner Prompt */}
                <div className="glass-panel-lime rounded-2xl p-3 mb-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-lime/10 flex items-center justify-center text-accent-lime shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-ice-white">AI Plate Scanner</div>
                    <p className="text-[8px] text-silver-slate">Snap your meal to estimate macros</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-accent-lime" />
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Interactive FAQ */}
      <section className="py-24 px-4 sm:px-6 md:px-8 lg:px-12 max-w-5xl mx-auto">
        <AnimateIn from="bottom">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-5xl mb-4">Frequently Asked Questions</h2>
            <p className="text-silver-slate font-light">
              Everything you need to know about the Bodied by Esh training and nutrition programs.
            </p>
          </div>
        </AnimateIn>
        <AnimateIn from="bottom" delay={150}>
          <FaqAccordion items={faqItems} />
        </AnimateIn>
      </section>

      <Footer />
    </div>
  );
}
