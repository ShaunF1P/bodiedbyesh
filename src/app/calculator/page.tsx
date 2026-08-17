"use client";
import React, { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RollingCounter from "@/components/RollingCounter";
import {
  Calculator,
  Flame,
  Heart,
  Dumbbell,
  Droplets,
  Activity,
  Scale,
  Target,
  Zap,
  TrendingUp,
  BarChart3,
  Ruler,
  Footprints,
  Brain,
  ChevronRight,
} from "lucide-react";
import {
  type Gender,
  type ActivityLevel,
  type FitnessGoal,
  type OccupationType,
  ACTIVITY_LABELS,
  lbsToKg,
  inToCm,
  calculateBMR,
  calculateTDEE,
  tdeeBrakedown,
  calculateBMI,
  bmiCategory,
  maxHeartRate,
  vo2MaxFromRHR,
  vo2Category,
  calculateNEAT,
  bodyFatNavy,
  oneRepMax,
  percentageChart,
  calculateFFMI,
  ffmiCategory,
  waistToHipRatio,
  whrRisk,
  dailyWaterOz,
  dailyWaterLiters,
  heartRateZones,
  macroTargets,
  idealBodyWeight,
  calorieCycling,
} from "@/lib/fitness-calculators";

// ── Tool definitions ──
const TOOLS = [
  { id: "tdee", label: "TDEE", icon: Flame, desc: "Total Daily Energy" },
  { id: "bmi", label: "BMI", icon: Scale, desc: "Body Mass Index" },
  { id: "vo2", label: "VO2 Max", icon: Heart, desc: "Cardio Fitness" },
  { id: "neat", label: "NEAT/EAT", icon: Footprints, desc: "Energy Breakdown" },
  { id: "bodyfat", label: "Body Fat", icon: Ruler, desc: "Navy Method" },
  { id: "1rm", label: "1RM", icon: Dumbbell, desc: "Strength Max" },
  { id: "ffmi", label: "FFMI", icon: TrendingUp, desc: "Muscular Potential" },
  { id: "macros", label: "Macros", icon: Target, desc: "Nutrient Targets" },
  { id: "water", label: "Water", icon: Droplets, desc: "Daily Hydration" },
  { id: "hrzones", label: "HR Zones", icon: Activity, desc: "Training Zones" },
  { id: "cycling", label: "Cal Cycle", icon: BarChart3, desc: "Zig-Zag Diet" },
  { id: "ibw", label: "Ideal Weight", icon: Zap, desc: "Devine Formula" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

// ── Shared Input Component ──
function NumInput({ label, value, onChange, unit, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void;
  unit?: string; min?: number; max?: number; step?: number;
}) {
  const [raw, setRaw] = React.useState(String(value));

  // Sync external value changes (e.g. from shared profile)
  React.useEffect(() => {
    setRaw(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setRaw(str);
    const n = parseFloat(str);
    if (!isNaN(n)) onChange(n);
  };

  const handleBlur = () => {
    // On blur, snap to valid number
    const n = parseFloat(raw);
    if (isNaN(n)) {
      setRaw(String(min ?? 0));
      onChange(min ?? 0);
    } else {
      const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
      setRaw(String(clamped));
      onChange(clamped);
    }
  };

  return (
    <div>
      <label className="block text-[10px] text-silver-slate uppercase tracking-wider mb-1.5 font-semibold">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={raw}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-ice-white font-display font-bold text-lg focus:outline-none focus:border-accent-lime/50 focus:ring-1 focus:ring-accent-lime/20 transition-all"
        />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-silver-slate text-xs">{unit}</span>}
      </div>
    </div>
  );
}

function HeightInput({ value, onChange }: { value: number; onChange: (totalIn: number) => void }) {
  const [ft, setFt] = React.useState(String(Math.floor(value / 12)));
  const [inch, setInch] = React.useState(String(value % 12));

  React.useEffect(() => {
    setFt(String(Math.floor(value / 12)));
    setInch(String(value % 12));
  }, [value]);

  const sync = (newFt: string, newIn: string) => {
    const f = parseInt(newFt) || 0;
    const i = parseInt(newIn) || 0;
    onChange(f * 12 + i);
  };

  return (
    <div>
      <label className="block text-[10px] text-silver-slate uppercase tracking-wider mb-1.5 font-semibold">Height</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={ft}
            onChange={(e) => { setFt(e.target.value); sync(e.target.value, inch); }}
            onBlur={() => { const v = Math.max(3, Math.min(7, parseInt(ft) || 5)); setFt(String(v)); sync(String(v), inch); }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-ice-white font-display font-bold text-lg focus:outline-none focus:border-accent-lime/50 focus:ring-1 focus:ring-accent-lime/20 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-slate text-xs">ft</span>
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={inch}
            onChange={(e) => { setInch(e.target.value); sync(ft, e.target.value); }}
            onBlur={() => { const v = Math.max(0, Math.min(11, parseInt(inch) || 0)); setInch(String(v)); sync(ft, String(v)); }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-ice-white font-display font-bold text-lg focus:outline-none focus:border-accent-lime/50 focus:ring-1 focus:ring-accent-lime/20 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-slate text-xs">in</span>
        </div>
      </div>
    </div>
  );
}
function SelectInput({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] text-silver-slate uppercase tracking-wider mb-1.5 font-semibold">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-ice-white font-medium focus:outline-none focus:border-accent-lime/50 transition-all appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-onyx-card text-ice-white">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function ResultCard({ label, value, unit, color = "text-accent-lime", sub }: {
  label: string; value: number | string; unit?: string; color?: string; sub?: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 border-white/5">
      <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-1">{label}</p>
      <div className={`font-display font-bold text-2xl ${color}`}>
        {typeof value === "number" ? <RollingCounter value={value} /> : value}
        {unit && <span className="text-sm text-silver-slate font-normal ml-1">{unit}</span>}
      </div>
      {sub && <p className="text-[10px] text-silver-slate mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="font-display font-bold text-lg">{title}</h2>
        <p className="text-[10px] text-silver-slate uppercase tracking-wider">{sub}</p>
      </div>
    </div>
  );
}

// ═══ PAGE COMPONENT ═══

export default function CalculatorPage() {
  const [activeTool, setActiveTool] = useState<ToolId>("tdee");

  // ── Shared profile state ──
  const [gender, setGender] = useState<Gender>("female");
  const [age, setAge] = useState(32);
  const [weightLbs, setWeightLbs] = useState(155);
  const [heightIn, setHeightIn] = useState(65);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [bodyFatPct, setBodyFatPct] = useState(28);
  const [restingHR, setRestingHR] = useState(68);
  const [waistIn, setWaistIn] = useState(32);
  const [hipIn, setHipIn] = useState(40);
  const [neckIn, setNeckIn] = useState(14);
  const [goal, setGoal] = useState<FitnessGoal>("cut");
  const [occupation, setOccupation] = useState<OccupationType>("desk");
  const [dailySteps, setDailySteps] = useState(6000);
  const [exerciseMin, setExerciseMin] = useState(45);

  // 1RM specific
  const [liftWeight, setLiftWeight] = useState(135);
  const [liftReps, setLiftReps] = useState(8);

  // Macro protein multiplier (g per lb bodyweight)
  const [proteinPerLb, setProteinPerLb] = useState(1.0);
  const [fatPct, setFatPct] = useState(25);

  // ── Computed values ──
  const profile = useMemo(() => ({
    weightLbs, heightIn, age, gender, activityLevel,
    bodyFatPercent: bodyFatPct, restingHR, waistIn, hipIn, neckIn,
  }), [weightLbs, heightIn, age, gender, activityLevel, bodyFatPct, restingHR, waistIn, hipIn, neckIn]);

  const genderOptions = [{ value: "female", label: "Female" }, { value: "male", label: "Male" }];
  const activityOptions = Object.entries(ACTIVITY_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const goalOptions = [
    { value: "cut", label: "Fat Loss (-500 kcal)" },
    { value: "maintain", label: "Maintain" },
    { value: "lean_bulk", label: "Lean Bulk (+250 kcal)" },
    { value: "bulk", label: "Mass Gain (+500 kcal)" },
  ];
  const occupationOptions = [
    { value: "desk", label: "Desk Job" },
    { value: "standing", label: "Standing/Retail" },
    { value: "walking", label: "Walking (nurse, teacher)" },
    { value: "labor", label: "Manual Labor" },
  ];

  // ── Shared input panel (used across tools) ──
  const sharedInputs = (
    <div className="grid grid-cols-2 gap-4">
      <SelectInput label="Gender" value={gender} onChange={(v) => setGender(v as Gender)} options={genderOptions} />
      <NumInput label="Age" value={age} onChange={setAge} unit="yrs" min={13} max={99} />
      <NumInput label="Weight" value={weightLbs} onChange={setWeightLbs} unit="lbs" min={60} max={600} />
      <HeightInput value={heightIn} onChange={setHeightIn} />
    </div>
  );

  const heightFeet = Math.floor(heightIn / 12);
  const heightRemIn = heightIn % 12;

  // ═══ RENDER TOOL PANELS ═══

  const renderTool = () => {
    switch (activeTool) {
      // ── TDEE ──
      case "tdee": {
        const bmr = calculateBMR(profile);
        const tdee = calculateTDEE(profile);
        const breakdown = tdeeBrakedown(profile);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Flame} title="TDEE Calculator" sub="Total Daily Energy Expenditure · 3 methods" />
            {sharedInputs}
            <SelectInput label="Activity Level" value={activityLevel} onChange={(v) => setActivityLevel(v as ActivityLevel)} options={activityOptions} />
            <NumInput label="Body Fat % (optional, improves accuracy)" value={bodyFatPct} onChange={setBodyFatPct} unit="%" min={3} max={60} step={0.5} />

            <div className="grid grid-cols-2 gap-4">
              <ResultCard label="TDEE" value={tdee} unit="kcal/day" />
              <ResultCard label="BMR (Mifflin)" value={bmr.mifflin} unit="kcal" color="text-ice-white" />
              {bmr.katch && <ResultCard label="BMR (Katch-McArdle)" value={bmr.katch} unit="kcal" color="text-accent-violet" sub="Uses your body fat %" />}
              <ResultCard label="BMR (Harris-Benedict)" value={bmr.harris} unit="kcal" color="text-ice-white" />
            </div>

            {/* Energy Breakdown Bar */}
            <div className="glass-panel rounded-2xl p-5 border-white/5">
              <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-3 font-semibold">Energy Breakdown</p>
              <div className="flex rounded-xl overflow-hidden h-10">
                <div className="bg-[#E0659A] flex items-center justify-center" style={{ width: `${(breakdown.bmr / breakdown.tdee) * 100}%` }}>
                  <span className="text-[10px] font-bold text-black drop-shadow-none">{Math.round((breakdown.bmr / breakdown.tdee) * 100)}%</span>
                </div>
                <div className="bg-[#B84D72] flex items-center justify-center" style={{ width: `${(breakdown.neat / breakdown.tdee) * 100}%` }}>
                  <span className="text-[10px] font-bold text-white">{Math.round((breakdown.neat / breakdown.tdee) * 100)}%</span>
                </div>
                <div className="bg-[#5E3048] flex items-center justify-center" style={{ width: `${(breakdown.eat / breakdown.tdee) * 100}%` }}>
                  <span className="text-[10px] font-bold text-white">{breakdown.eat > 0 ? `${Math.round((breakdown.eat / breakdown.tdee) * 100)}%` : ""}</span>
                </div>
                <div className="bg-[#3A2538] flex items-center justify-center" style={{ width: `${(breakdown.tef / breakdown.tdee) * 100}%` }}>
                  <span className="text-[10px] font-bold text-white">{Math.round((breakdown.tef / breakdown.tdee) * 100)}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#E0659A] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-ice-white">{breakdown.bmr}</p>
                    <p className="text-[9px] text-silver-slate">BMR</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#B84D72] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-ice-white">{breakdown.neat}</p>
                    <p className="text-[9px] text-silver-slate">NEAT</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#5E3048] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-ice-white">{breakdown.eat}</p>
                    <p className="text-[9px] text-silver-slate">EAT</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#3A2538] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-ice-white">{breakdown.tef}</p>
                    <p className="text-[9px] text-silver-slate">TEF</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // ── BMI ──
      case "bmi": {
        const bmi = calculateBMI(lbsToKg(weightLbs), inToCm(heightIn));
        const cat = bmiCategory(bmi);
        const ibw = idealBodyWeight(heightIn, gender);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Scale} title="BMI Calculator" sub="Body Mass Index · WHO Classification" />
            {sharedInputs}
            <div className="grid grid-cols-2 gap-4">
              <ResultCard label="Your BMI" value={Math.round(bmi * 10) / 10} color={cat.color} sub={cat.label} />
              <ResultCard label="Health Risk" value={cat.risk} color={cat.color} />
              <ResultCard label="Ideal Weight (Devine)" value={ibw.lbs} unit="lbs" color="text-ice-white" sub={`${ibw.kg} kg`} />
              <ResultCard label="Your Height" value={`${heightFeet}'${heightRemIn}"`} color="text-ice-white" />
            </div>
            {/* BMI Scale */}
            <div className="glass-panel rounded-2xl p-5 border-white/5">
              <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-3 font-semibold">BMI Scale</p>
              <div className="relative h-6 rounded-full overflow-hidden flex">
                <div className="bg-blue-400/60 flex-1" />
                <div className="bg-green-400/60 flex-[1.3]" />
                <div className="bg-yellow-400/60 flex-1" />
                <div className="bg-orange-400/60 flex-1" />
                <div className="bg-red-500/60 flex-1" />
              </div>
              <div className="relative mt-1">
                <div
                  className="absolute top-0 w-0.5 h-4 bg-ice-white"
                  style={{ left: `${Math.min(100, Math.max(0, ((bmi - 15) / 30) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-silver-slate mt-3">
                <span>Under ({"<"}18.5)</span>
                <span>Normal</span>
                <span>Over (25+)</span>
                <span>Obese (30+)</span>
                <span>Severe (40+)</span>
              </div>
            </div>
          </div>
        );
      }

      // ── VO2 Max ──
      case "vo2": {
        const mhr = maxHeartRate(age);
        const vo2 = vo2MaxFromRHR(age, restingHR);
        const cat = vo2Category(vo2, age, gender);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Heart} title="VO2 Max Estimator" sub="Uth et al. 2004 · Resting HR Method" />
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label="Gender" value={gender} onChange={(v) => setGender(v as Gender)} options={genderOptions} />
              <NumInput label="Age" value={age} onChange={setAge} unit="yrs" min={13} max={99} />
              <NumInput label="Resting Heart Rate" value={restingHR} onChange={setRestingHR} unit="bpm" min={35} max={120} />
              <div className="flex items-end">
                <ResultCard label="Max Heart Rate" value={mhr} unit="bpm" color="text-red-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ResultCard label="Estimated VO2 Max" value={vo2} unit="mL/kg/min" color={cat.color} sub={cat.label} />
              <ResultCard label="Fitness Level" value={cat.label} color={cat.color} />
            </div>
            <div className="glass-panel rounded-2xl p-5 border-white/5 text-xs text-silver-slate">
              <p className="font-semibold text-ice-white mb-2">What is VO2 Max?</p>
              <p>VO2 Max measures your body&apos;s maximum oxygen uptake during intense exercise. It&apos;s the gold standard for cardiovascular fitness. Elite athletes score 60+ mL/kg/min. Improving VO2 Max reduces all-cause mortality risk by up to 13% per unit increase.</p>
            </div>
          </div>
        );
      }

      // ── NEAT / EAT ──
      case "neat": {
        const kg = lbsToKg(weightLbs);
        const neat = calculateNEAT(kg, occupation, dailySteps);
        const breakdown = tdeeBrakedown(profile);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Footprints} title="NEAT & EAT Calculator" sub="Non-Exercise & Exercise Activity Thermogenesis" />
            {sharedInputs}
            <SelectInput label="Activity Level" value={activityLevel} onChange={(v) => setActivityLevel(v as ActivityLevel)} options={activityOptions} />
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label="Occupation Type" value={occupation} onChange={(v) => setOccupation(v as OccupationType)} options={occupationOptions} />
              <NumInput label="Daily Steps" value={dailySteps} onChange={setDailySteps} unit="steps" min={0} max={50000} step={500} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ResultCard label="Your NEAT" value={neat} unit="kcal/day" color="text-accent-violet" sub="Activity outside of exercise" />
              <ResultCard label="Your EAT" value={breakdown.eat} unit="kcal/day" color="text-blue-400" sub="Exercise activity" />
              <ResultCard label="TEF (10%)" value={breakdown.tef} unit="kcal" color="text-orange-400" sub="Thermic effect of food" />
              <ResultCard label="Total TDEE" value={breakdown.tdee} unit="kcal" />
            </div>
            <div className="glass-panel rounded-2xl p-5 border-white/5 text-xs text-silver-slate">
              <p className="font-semibold text-ice-white mb-2">Why NEAT matters more than you think</p>
              <p>NEAT accounts for 15-50% of your daily calorie burn. Simply standing more, taking stairs, and fidgeting can burn 350-500 extra kcal/day. This is why some people &ldquo;eat whatever they want&rdquo; and stay lean.</p>
            </div>
          </div>
        );
      }

      // ── Body Fat ──
      case "bodyfat": {
        const cm = inToCm(heightIn);
        const bf = bodyFatNavy(waistIn * 2.54, neckIn * 2.54, cm, gender, hipIn * 2.54);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Ruler} title="Body Fat Estimator" sub="U.S. Navy Method · Circumference-based" />
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label="Gender" value={gender} onChange={(v) => setGender(v as Gender)} options={genderOptions} />
              <HeightInput value={heightIn} onChange={setHeightIn} />
              <NumInput label="Waist (at navel)" value={waistIn} onChange={setWaistIn} unit="in" min={20} max={65} step={0.5} />
              <NumInput label="Neck" value={neckIn} onChange={setNeckIn} unit="in" min={10} max={25} step={0.5} />
              {gender === "female" && (
                <NumInput label="Hip (widest)" value={hipIn} onChange={setHipIn} unit="in" min={25} max={65} step={0.5} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ResultCard label="Body Fat %" value={bf !== null ? bf : "N/A"} unit="%" color={bf !== null && bf < 25 ? "text-accent-lime" : "text-yellow-400"} />
              {bf !== null && (
                <ResultCard label="Lean Mass" value={Math.round(weightLbs * (1 - bf / 100))} unit="lbs" color="text-ice-white" sub={`Fat mass: ${Math.round(weightLbs * bf / 100)} lbs`} />
              )}
            </div>
          </div>
        );
      }

      // ── 1RM ──
      case "1rm": {
        const result = oneRepMax(liftWeight, liftReps);
        const chart = percentageChart(result.avg);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Dumbbell} title="1RM Calculator" sub="One-Rep Max · Epley & Brzycki formulas" />
            <div className="grid grid-cols-2 gap-4">
              <NumInput label="Weight Lifted" value={liftWeight} onChange={setLiftWeight} unit="lbs" min={1} max={1500} />
              <NumInput label="Reps Performed" value={liftReps} onChange={setLiftReps} unit="reps" min={1} max={30} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <ResultCard label="Epley" value={result.epley} unit="lbs" />
              <ResultCard label="Brzycki" value={result.brzycki} unit="lbs" color="text-accent-violet" />
              <ResultCard label="Average 1RM" value={result.avg} unit="lbs" />
            </div>
            {/* Percentage Chart */}
            <div className="glass-panel rounded-2xl p-5 border-white/5">
              <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-3 font-semibold">Training Load Chart</p>
              <div className="space-y-1.5">
                {chart.map((row) => (
                  <div key={row.percent} className="flex items-center gap-3 text-xs">
                    <span className="w-10 text-right text-silver-slate font-mono">{row.percent}%</span>
                    <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-lime/40 flex items-center px-2 text-[10px] font-bold text-ice-white"
                        style={{ width: `${row.percent}%` }}
                      >
                        {row.weight} lbs
                      </div>
                    </div>
                    <span className="w-14 text-silver-slate text-right">{row.reps} reps</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // ── FFMI ──
      case "ffmi": {
        const ffmi = calculateFFMI(lbsToKg(weightLbs), inToCm(heightIn), bodyFatPct);
        const cat = ffmiCategory(ffmi.adjusted, gender);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={TrendingUp} title="FFMI Calculator" sub="Fat-Free Mass Index · Natural Potential" />
            {sharedInputs}
            <NumInput label="Body Fat %" value={bodyFatPct} onChange={setBodyFatPct} unit="%" min={3} max={60} step={0.5} />
            <div className="grid grid-cols-2 gap-4">
              <ResultCard label="FFMI" value={ffmi.ffmi} color={cat.color} />
              <ResultCard label="Adjusted FFMI" value={ffmi.adjusted} color={cat.color} sub={cat.label} />
              <ResultCard label="Lean Mass" value={Math.round(ffmi.leanMassKg * 2.205)} unit="lbs" color="text-ice-white" sub={`${ffmi.leanMassKg} kg`} />
              <ResultCard label="Natural Limit" value={gender === "male" ? "~25" : "~21"} color="text-silver-slate" sub="Adjusted FFMI cap" />
            </div>
          </div>
        );
      }

      // ── Macros ──
      case "macros": {
        const tdee = calculateTDEE(profile);
        const goalAdj: Record<FitnessGoal, number> = { cut: -500, maintain: 0, lean_bulk: 250, bulk: 500 };
        const targetCals = Math.round(tdee + goalAdj[goal]);
        const proteinG = Math.round(weightLbs * proteinPerLb);
        const proteinCal = proteinG * 4;
        const fatCal = targetCals * (fatPct / 100);
        const fatG = Math.round(fatCal / 9);
        const carbCal = targetCals - proteinCal - fatCal;
        const carbG = Math.round(Math.max(0, carbCal / 4));
        const proteinPctOfCals = Math.round((proteinCal / targetCals) * 100);
        const carbPctOfCals = Math.round((carbCal / targetCals) * 100);
        const fatPctOfCals = fatPct;
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Target} title="Macro Calculator" sub="Fully adjustable protein · fat · carb targets" />
            {sharedInputs}
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label="Activity Level" value={activityLevel} onChange={(v) => setActivityLevel(v as ActivityLevel)} options={activityOptions} />
              <SelectInput label="Goal" value={goal} onChange={(v) => setGoal(v as FitnessGoal)} options={goalOptions} />
            </div>

            {/* Protein Slider */}
            <div className="glass-panel rounded-2xl p-5 border-white/5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-silver-slate uppercase tracking-wider font-semibold">Protein per lb bodyweight</label>
                <span className="font-display font-bold text-accent-lime text-lg">{proteinPerLb.toFixed(1)}g<span className="text-silver-slate text-xs font-normal">/lb</span></span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={proteinPerLb}
                onChange={(e) => setProteinPerLb(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#E0659A] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E0659A] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#E0659A]/30"
              />
              <div className="flex justify-between text-[9px] text-silver-slate mt-1">
                <span>0.5g (minimum)</span>
                <span>0.8g (maintain)</span>
                <span>1.0g (recomp)</span>
                <span>1.5g+</span>
                <span>2.0g (max)</span>
              </div>
            </div>

            {/* Fat % Slider */}
            <div className="glass-panel rounded-2xl p-5 border-white/5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-silver-slate uppercase tracking-wider font-semibold">Fat % of calories</label>
                <span className="font-display font-bold text-yellow-400 text-lg">{fatPct}%</span>
              </div>
              <input
                type="range"
                min={15}
                max={45}
                step={1}
                value={fatPct}
                onChange={(e) => setFatPct(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#8A3D5E] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#8A3D5E] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#8A3D5E]/30"
              />
              <div className="flex justify-between text-[9px] text-silver-slate mt-1">
                <span>15% (low fat)</span>
                <span>25% (standard)</span>
                <span>35% (keto-leaning)</span>
                <span>45%</span>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-4">
              <ResultCard label="Daily Calories" value={targetCals} unit="kcal" sub={`${goalAdj[goal] > 0 ? "+" : ""}${goalAdj[goal]} from TDEE`} />
              <ResultCard label="Protein" value={proteinG} unit="g" color="text-accent-lime" sub={`${proteinPctOfCals}% of calories · ${Math.round(proteinPerLb * lbsToKg(1) * 10) / 10}g/kg`} />
              <ResultCard label="Carbs" value={carbG} unit="g" color="text-accent-violet" sub={`${carbPctOfCals}% of calories`} />
              <ResultCard label="Fat" value={fatG} unit="g" color="text-yellow-400" sub={`${fatPctOfCals}% of calories`} />
            </div>

            {/* Macro Pie Visual */}
            <div className="glass-panel rounded-2xl p-5 border-white/5">
              <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-3 font-semibold">Calorie Split</p>
              <div className="flex rounded-xl overflow-hidden h-10">
                <div className="bg-[#E0659A] flex items-center justify-center" style={{ width: `${proteinPctOfCals}%` }}>
                  <span className="text-[10px] font-bold text-black">P {proteinPctOfCals}%</span>
                </div>
                <div className="bg-[#B84D72] flex items-center justify-center" style={{ width: `${carbPctOfCals}%` }}>
                  <span className="text-[10px] font-bold text-white">C {carbPctOfCals}%</span>
                </div>
                <div className="bg-[#8A3D5E] flex items-center justify-center" style={{ width: `${fatPctOfCals}%` }}>
                  <span className="text-[10px] font-bold text-black">F {fatPctOfCals}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // ── Water ──
      case "water": {
        const oz = dailyWaterOz(weightLbs, exerciseMin);
        const liters = dailyWaterLiters(weightLbs, exerciseMin);
        const glasses = Math.ceil(oz / 8);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Droplets} title="Water Intake Calculator" sub="Personalized hydration targets" />
            <div className="grid grid-cols-2 gap-4">
              <NumInput label="Weight" value={weightLbs} onChange={setWeightLbs} unit="lbs" min={60} max={600} />
              <NumInput label="Daily Exercise" value={exerciseMin} onChange={setExerciseMin} unit="min" min={0} max={300} step={5} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <ResultCard label="Daily Target" value={oz} unit="oz" />
              <ResultCard label="In Liters" value={liters} unit="L" color="text-blue-400" />
              <ResultCard label="Glasses (8oz)" value={glasses} unit="glasses" color="text-ice-white" />
            </div>
            {/* Visual water bottles */}
            <div className="glass-panel rounded-2xl p-5 border-white/5">
              <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-3 font-semibold">Bottles (16oz each)</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: Math.ceil(oz / 16) }).map((_, i) => (
                  <div key={i} className="w-8 h-12 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-end overflow-hidden">
                    <div className="w-full bg-blue-400/60 rounded-b-md" style={{ height: i < Math.floor(oz / 16) ? "100%" : `${((oz % 16) / 16) * 100}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // ── HR Zones ──
      case "hrzones": {
        const zones = heartRateZones(age, restingHR);
        const mhr = maxHeartRate(age);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Activity} title="Heart Rate Zones" sub="Karvonen Method · Training targets" />
            <div className="grid grid-cols-2 gap-4">
              <NumInput label="Age" value={age} onChange={setAge} unit="yrs" min={13} max={99} />
              <NumInput label="Resting Heart Rate" value={restingHR} onChange={setRestingHR} unit="bpm" min={35} max={120} />
            </div>
            <ResultCard label="Max Heart Rate (Tanaka)" value={mhr} unit="bpm" color="text-red-400" />
            <div className="space-y-2">
              {zones.map((z) => (
                <div key={z.zone} className="glass-panel rounded-xl p-4 border-white/5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${z.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    Z{z.zone}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-bold text-sm text-ice-white">{z.name}</span>
                      <span className="text-[10px] text-silver-slate">{Math.round(z.lowPct * 100)}-{Math.round(z.highPct * 100)}%</span>
                    </div>
                    <p className="text-[10px] text-silver-slate truncate">{z.benefit}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-display font-bold text-accent-lime text-sm">{z.lowBpm}-{z.highBpm}</span>
                    <span className="text-[10px] text-silver-slate ml-1">bpm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ── Calorie Cycling ──
      case "cycling": {
        const tdee = calculateTDEE(profile);
        const cycle = calorieCycling(tdee, goal);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={BarChart3} title="Calorie Cycling" sub="Zig-Zag Method · Weekly periodization" />
            {sharedInputs}
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label="Activity Level" value={activityLevel} onChange={(v) => setActivityLevel(v as ActivityLevel)} options={activityOptions} />
              <SelectInput label="Goal" value={goal} onChange={(v) => setGoal(v as FitnessGoal)} options={goalOptions} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <ResultCard label="High Day" value={cycle.highDay} unit="kcal" color="text-accent-lime" />
              <ResultCard label="Medium Day" value={cycle.mediumDay} unit="kcal" color="text-yellow-400" />
              <ResultCard label="Low Day" value={cycle.lowDay} unit="kcal" color="text-blue-400" />
            </div>
            <div className="glass-panel rounded-2xl p-5 border-white/5">
              <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-3 font-semibold">Weekly Schedule</p>
              <div className="grid grid-cols-7 gap-2">
                {cycle.schedule.map((d) => (
                  <div key={d.day} className="text-center">
                    <p className="text-[9px] text-silver-slate mb-1">{d.day.slice(0, 3)}</p>
                    <div className={`rounded-lg py-2 px-1 text-[10px] font-bold ${d.type === "high" ? "bg-accent-lime/15 text-accent-lime" : d.type === "medium" ? "bg-yellow-500/15 text-yellow-400" : "bg-blue-500/15 text-blue-400"}`}>
                      {d.calories}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-silver-slate mt-3 text-center">
                Weekly total: <strong className="text-ice-white"><RollingCounter value={cycle.weeklyTotal} /></strong> kcal
              </p>
            </div>
          </div>
        );
      }

      // ── Ideal Body Weight ──
      case "ibw": {
        const ibw = idealBodyWeight(heightIn, gender);
        const diff = weightLbs - ibw.lbs;
        const whr = waistToHipRatio(waistIn, hipIn);
        const risk = whrRisk(whr, gender);
        return (
          <div className="space-y-6 animate-fadeIn">
            <SectionTitle icon={Zap} title="Ideal Weight & WHR" sub="Devine Formula · Waist-to-Hip Ratio" />
            {sharedInputs}
            <div className="grid grid-cols-2 gap-4">
              <NumInput label="Waist" value={waistIn} onChange={setWaistIn} unit="in" min={20} max={65} step={0.5} />
              <NumInput label="Hip" value={hipIn} onChange={setHipIn} unit="in" min={25} max={65} step={0.5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ResultCard label="Ideal Weight (Devine)" value={ibw.lbs} unit="lbs" color="text-accent-lime" />
              <ResultCard label="Difference" value={`${diff > 0 ? "+" : ""}${diff}`} unit="lbs" color={Math.abs(diff) < 15 ? "text-accent-lime" : "text-yellow-400"} />
              <ResultCard label="Waist:Hip Ratio" value={whr} color={risk.color} sub={risk.label} />
              <ResultCard label="Health Risk" value={risk.label} color={risk.color} />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cyber-slate text-ice-white">
      <Header />

      {/* Hero */}
      <div className="border-b border-white/5 bg-onyx-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="w-4 h-4 text-accent-lime" />
              <span className="text-accent-lime text-[10px] font-bold uppercase tracking-widest">
                Fitness Intelligence Suite
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
              Pro Calculators
            </h1>
            <p className="text-silver-slate text-sm mt-1">
              12 clinical-grade tools most trainers don&apos;t offer
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-silver-slate">
            <Brain className="w-4 h-4 text-accent-lime" />
            <span>Science-backed formulas</span>
          </div>
        </div>
      </div>

      {/* Tool Grid + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">

          {/* Tool Selector — Sidebar on desktop, horizontal scroll on mobile */}
          <div className="lg:block">
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
              <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`touch-target flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all shrink-0 lg:w-full ${
                        isActive
                          ? "bg-accent-lime/10 border border-accent-lime/20 text-accent-lime"
                          : "border border-transparent hover:bg-white/5 text-silver-slate hover:text-ice-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="hidden sm:block">
                        <p className={`text-xs font-bold ${isActive ? "text-accent-lime" : ""}`}>{tool.label}</p>
                        <p className="text-[9px] text-silver-slate">{tool.desc}</p>
                      </div>
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto hidden lg:block" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Calculator Content */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5 min-h-[500px]">
            {renderTool()}
          </div>
        </div>
      </div>

      {/* Conversion CTA Banner */}
      {activeTool && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pb-8">
          <div
            className="glass-panel rounded-3xl p-8 md:p-10 border border-[#E0659A]/30 text-center animate-fadeIn"
            style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
          >
            <h2 className="font-display font-bold text-2xl md:text-3xl text-ice-white mb-2">
              Ready to put these numbers to work?
            </h2>
            <p className="text-silver-slate text-sm md:text-base mb-8 max-w-md mx-auto">
              Get a personalized program built around <span className="text-ice-white font-semibold">YOUR</span> macros
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/apply?track=a"
                className="inline-flex items-center justify-center bg-accent-lime text-white px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-accent-lime/85 hover:shadow-lg hover:shadow-accent-lime/20 hover:scale-105 transition-all duration-200"
              >
                Join Park-to-Peak
              </a>
              <a
                href="/apply?track=b"
                className="inline-flex items-center justify-center bg-accent-violet text-white px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-accent-violet/85 hover:shadow-lg hover:shadow-accent-violet/20 hover:scale-105 transition-all duration-200"
              >
                Apply for Executive 1-on-1
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
