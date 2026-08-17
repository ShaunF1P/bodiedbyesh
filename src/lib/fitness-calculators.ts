/**
 * Fitness Calculator Engine
 *
 * Production-grade formulas used by clinical exercise physiologists.
 * Every function is pure, typed, and unit-tested.
 */

// ── Types ──

export type Gender = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active"
  | "athlete";

export interface UserProfile {
  weightLbs: number;
  heightIn: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  bodyFatPercent?: number;
  restingHR?: number;
  waistIn?: number;
  hipIn?: number;
  neckIn?: number;
}

// ── Unit Conversions ──

export const lbsToKg = (lbs: number) => lbs * 0.453592;
export const inToCm = (inches: number) => inches * 2.54;
export const cmToM = (cm: number) => cm / 100;

// ── Activity Multipliers ──

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
  athlete: 2.1,
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Light (1-3 days/week)",
  moderate: "Moderate (3-5 days/week)",
  active: "Active (6-7 days/week)",
  very_active: "Very Active (2x/day training)",
  athlete: "Athlete (competitive level)",
};

export { ACTIVITY_LABELS };

// ═══════════════════════════════════════════════════
// 1. BMR — Basal Metabolic Rate
// ═══════════════════════════════════════════════════

/** Mifflin-St Jeor (most accurate for most people) */
export function bmrMifflin(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

/** Katch-McArdle (best when body fat % is known) */
export function bmrKatchMcArdle(weightKg: number, bodyFatPercent: number): number {
  const leanMass = weightKg * (1 - bodyFatPercent / 100);
  return 370 + 21.6 * leanMass;
}

/** Harris-Benedict (classic formula) */
export function bmrHarrisBenedict(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  if (gender === "male") {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age;
}

export function calculateBMR(profile: UserProfile): { mifflin: number; harris: number; katch: number | null } {
  const kg = lbsToKg(profile.weightLbs);
  const cm = inToCm(profile.heightIn);
  return {
    mifflin: Math.round(bmrMifflin(kg, cm, profile.age, profile.gender)),
    harris: Math.round(bmrHarrisBenedict(kg, cm, profile.age, profile.gender)),
    katch: profile.bodyFatPercent ? Math.round(bmrKatchMcArdle(kg, profile.bodyFatPercent)) : null,
  };
}

// ═══════════════════════════════════════════════════
// 2. TDEE — Total Daily Energy Expenditure
// ═══════════════════════════════════════════════════

export function calculateTDEE(profile: UserProfile): number {
  const kg = lbsToKg(profile.weightLbs);
  const cm = inToCm(profile.heightIn);
  const bmr = profile.bodyFatPercent
    ? bmrKatchMcArdle(kg, profile.bodyFatPercent)
    : bmrMifflin(kg, cm, profile.age, profile.gender);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

/** TDEE breakdown: BMR + TEF + NEAT + EAT */
export function tdeeBrakedown(profile: UserProfile) {
  const tdee = calculateTDEE(profile);
  const kg = lbsToKg(profile.weightLbs);
  const cm = inToCm(profile.heightIn);
  const bmr = profile.bodyFatPercent
    ? bmrKatchMcArdle(kg, profile.bodyFatPercent)
    : bmrMifflin(kg, cm, profile.age, profile.gender);

  const tef = tdee * 0.10; // Thermic Effect of Food ≈ 10%
  const eat = calculateEAT(profile); // Exercise Activity Thermogenesis
  const neat = tdee - bmr - tef - eat; // Non-Exercise Activity Thermogenesis

  return {
    tdee: Math.round(tdee),
    bmr: Math.round(bmr),
    tef: Math.round(tef),
    eat: Math.round(eat),
    neat: Math.round(Math.max(0, neat)),
  };
}

// ═══════════════════════════════════════════════════
// 3. BMI — Body Mass Index
// ═══════════════════════════════════════════════════

export function calculateBMI(weightKg: number, heightCm: number): number {
  const m = cmToM(heightCm);
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): { label: string; color: string; risk: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400", risk: "Increased health risk" };
  if (bmi < 25) return { label: "Normal", color: "text-accent-lime", risk: "Low risk" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-400", risk: "Moderate risk" };
  if (bmi < 35) return { label: "Obese I", color: "text-orange-400", risk: "High risk" };
  if (bmi < 40) return { label: "Obese II", color: "text-red-400", risk: "Very high risk" };
  return { label: "Obese III", color: "text-red-500", risk: "Extremely high risk" };
}

// ═══════════════════════════════════════════════════
// 4. VO2 Max — Estimated from Resting HR
// ═══════════════════════════════════════════════════

/** Max heart rate (Tanaka formula — more accurate than 220-age) */
export function maxHeartRate(age: number): number {
  return Math.round(208 - 0.7 * age);
}

/** VO2 Max from resting HR (Uth et al. 2004) */
export function vo2MaxFromRHR(age: number, restingHR: number): number {
  const mhr = maxHeartRate(age);
  return Math.round((15.3 * mhr) / restingHR * 10) / 10;
}

export function vo2Category(vo2: number, age: number, gender: Gender): { label: string; color: string } {
  // Simplified percentile ranges
  const thresholds = gender === "male"
    ? age < 30
      ? [35, 40, 45, 50, 56]
      : age < 40
        ? [33, 38, 43, 48, 53]
        : age < 50
          ? [31, 36, 41, 45, 50]
          : [28, 33, 38, 42, 47]
    : age < 30
      ? [28, 33, 37, 41, 46]
      : age < 40
        ? [26, 31, 35, 39, 44]
        : age < 50
          ? [24, 29, 33, 37, 41]
          : [22, 27, 31, 35, 39];

  if (vo2 < thresholds[0]) return { label: "Poor", color: "text-red-400" };
  if (vo2 < thresholds[1]) return { label: "Below Average", color: "text-orange-400" };
  if (vo2 < thresholds[2]) return { label: "Average", color: "text-yellow-400" };
  if (vo2 < thresholds[3]) return { label: "Good", color: "text-blue-400" };
  if (vo2 < thresholds[4]) return { label: "Excellent", color: "text-accent-lime" };
  return { label: "Elite", color: "text-accent-lime" };
}

// ═══════════════════════════════════════════════════
// 5. NEAT — Non-Exercise Activity Thermogenesis
// ═══════════════════════════════════════════════════

export type OccupationType = "desk" | "standing" | "walking" | "labor";

export function calculateNEAT(
  weightKg: number,
  occupation: OccupationType,
  dailySteps: number
): number {
  const occupationBase: Record<OccupationType, number> = {
    desk: 200,
    standing: 400,
    walking: 600,
    labor: 900,
  };

  // Steps contribution: ~0.04 kcal per step per kg
  const stepsCalories = dailySteps * 0.04 * (weightKg / 70);
  return Math.round(occupationBase[occupation] + stepsCalories);
}

// ═══════════════════════════════════════════════════
// 6. EAT — Exercise Activity Thermogenesis
// ═══════════════════════════════════════════════════

export function calculateEAT(profile: UserProfile): number {
  const kg = lbsToKg(profile.weightLbs);
  const eatMap: Record<ActivityLevel, number> = {
    sedentary: 0,
    light: kg * 3, // ~3 kcal/kg for light exercise
    moderate: kg * 5,
    active: kg * 7,
    very_active: kg * 10,
    athlete: kg * 14,
  };
  return Math.round(eatMap[profile.activityLevel]);
}

// ═══════════════════════════════════════════════════
// 7. Body Fat % — Navy Method from Circumferences
// ═══════════════════════════════════════════════════

export function bodyFatNavy(
  waistCm: number,
  neckCm: number,
  heightCm: number,
  gender: Gender,
  hipCm?: number
): number | null {
  if (gender === "male") {
    if (waistCm <= neckCm) return null;
    const bf = 86.010 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
    return Math.round(bf * 10) / 10;
  }
  if (!hipCm) return null;
  if (waistCm + hipCm <= neckCm) return null;
  const bf = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
  return Math.round(bf * 10) / 10;
}

// ═══════════════════════════════════════════════════
// 8. 1RM — One Rep Max
// ═══════════════════════════════════════════════════

export function oneRepMax(weight: number, reps: number): { epley: number; brzycki: number; avg: number } {
  if (reps <= 0) return { epley: weight, brzycki: weight, avg: weight };
  if (reps === 1) return { epley: weight, brzycki: weight, avg: weight };
  const epley = Math.round(weight * (1 + reps / 30));
  const brzycki = Math.round(weight * (36 / (37 - reps)));
  return { epley, brzycki, avg: Math.round((epley + brzycki) / 2) };
}

/** Percentage chart for training loads */
export function percentageChart(oneRM: number): { percent: number; weight: number; reps: string }[] {
  return [
    { percent: 100, weight: Math.round(oneRM), reps: "1" },
    { percent: 95, weight: Math.round(oneRM * 0.95), reps: "2" },
    { percent: 90, weight: Math.round(oneRM * 0.90), reps: "3-4" },
    { percent: 85, weight: Math.round(oneRM * 0.85), reps: "5-6" },
    { percent: 80, weight: Math.round(oneRM * 0.80), reps: "7-8" },
    { percent: 75, weight: Math.round(oneRM * 0.75), reps: "9-10" },
    { percent: 70, weight: Math.round(oneRM * 0.70), reps: "11-12" },
    { percent: 65, weight: Math.round(oneRM * 0.65), reps: "13-15" },
    { percent: 60, weight: Math.round(oneRM * 0.60), reps: "16-20" },
  ];
}

// ═══════════════════════════════════════════════════
// 9. FFMI — Fat-Free Mass Index
// ═══════════════════════════════════════════════════

export function calculateFFMI(weightKg: number, heightCm: number, bodyFatPercent: number) {
  const m = cmToM(heightCm);
  const leanMass = weightKg * (1 - bodyFatPercent / 100);
  const ffmi = leanMass / (m * m);
  const adjustedFFMI = ffmi + 6.1 * (1.8 - m);
  return {
    ffmi: Math.round(ffmi * 10) / 10,
    adjusted: Math.round(adjustedFFMI * 10) / 10,
    leanMassKg: Math.round(leanMass * 10) / 10,
  };
}

export function ffmiCategory(adjusted: number, gender: Gender): { label: string; color: string } {
  if (gender === "male") {
    if (adjusted < 18) return { label: "Below Average", color: "text-silver-slate" };
    if (adjusted < 20) return { label: "Average", color: "text-yellow-400" };
    if (adjusted < 22) return { label: "Above Average", color: "text-blue-400" };
    if (adjusted < 23) return { label: "Excellent", color: "text-accent-lime" };
    if (adjusted < 26) return { label: "Superior", color: "text-accent-lime" };
    return { label: "Suspicious (natural limit ~25)", color: "text-red-400" };
  }
  if (adjusted < 14) return { label: "Below Average", color: "text-silver-slate" };
  if (adjusted < 16.5) return { label: "Average", color: "text-yellow-400" };
  if (adjusted < 18) return { label: "Above Average", color: "text-blue-400" };
  if (adjusted < 19) return { label: "Excellent", color: "text-accent-lime" };
  if (adjusted < 22) return { label: "Superior", color: "text-accent-lime" };
  return { label: "Suspicious (natural limit ~21)", color: "text-red-400" };
}

// ═══════════════════════════════════════════════════
// 10. Waist-to-Hip Ratio
// ═══════════════════════════════════════════════════

export function waistToHipRatio(waist: number, hip: number): number {
  return Math.round((waist / hip) * 100) / 100;
}

export function whrRisk(whr: number, gender: Gender): { label: string; color: string } {
  if (gender === "male") {
    if (whr < 0.90) return { label: "Low Risk", color: "text-accent-lime" };
    if (whr < 0.95) return { label: "Moderate Risk", color: "text-yellow-400" };
    return { label: "High Risk", color: "text-red-400" };
  }
  if (whr < 0.80) return { label: "Low Risk", color: "text-accent-lime" };
  if (whr < 0.85) return { label: "Moderate Risk", color: "text-yellow-400" };
  return { label: "High Risk", color: "text-red-400" };
}

// ═══════════════════════════════════════════════════
// 11. Water Intake
// ═══════════════════════════════════════════════════

export function dailyWaterOz(weightLbs: number, exerciseMinutes: number): number {
  const base = weightLbs * 0.5; // Half bodyweight in oz
  const exerciseBonus = Math.floor(exerciseMinutes / 30) * 12; // 12oz per 30min
  return Math.round(base + exerciseBonus);
}

export function dailyWaterLiters(weightLbs: number, exerciseMinutes: number): number {
  return Math.round((dailyWaterOz(weightLbs, exerciseMinutes) * 0.0295735) * 10) / 10;
}

// ═══════════════════════════════════════════════════
// 12. Heart Rate Zones (Karvonen Method)
// ═══════════════════════════════════════════════════

export interface HRZone {
  zone: number;
  name: string;
  lowPct: number;
  highPct: number;
  lowBpm: number;
  highBpm: number;
  benefit: string;
  color: string;
}

export function heartRateZones(age: number, restingHR: number): HRZone[] {
  const mhr = maxHeartRate(age);
  const hrr = mhr - restingHR;

  const zone = (lowPct: number, highPct: number) => ({
    lowBpm: Math.round(restingHR + hrr * lowPct),
    highBpm: Math.round(restingHR + hrr * highPct),
  });

  return [
    { zone: 1, name: "Recovery", lowPct: 0.50, highPct: 0.60, ...zone(0.50, 0.60), benefit: "Active recovery, warm-up", color: "bg-blue-400" },
    { zone: 2, name: "Fat Burn", lowPct: 0.60, highPct: 0.70, ...zone(0.60, 0.70), benefit: "Fat oxidation, endurance base", color: "bg-green-400" },
    { zone: 3, name: "Aerobic", lowPct: 0.70, highPct: 0.80, ...zone(0.70, 0.80), benefit: "Cardiovascular fitness", color: "bg-yellow-400" },
    { zone: 4, name: "Threshold", lowPct: 0.80, highPct: 0.90, ...zone(0.80, 0.90), benefit: "Lactate threshold, speed", color: "bg-orange-400" },
    { zone: 5, name: "Max Effort", lowPct: 0.90, highPct: 1.00, ...zone(0.90, 1.00), benefit: "VO2 Max, peak performance", color: "bg-red-500" },
  ];
}

// ═══════════════════════════════════════════════════
// 13. Macro Targets
// ═══════════════════════════════════════════════════

export type FitnessGoal = "cut" | "maintain" | "lean_bulk" | "bulk";

export function macroTargets(tdee: number, weightLbs: number, goal: FitnessGoal) {
  const adjustments: Record<FitnessGoal, number> = {
    cut: -500,
    maintain: 0,
    lean_bulk: 250,
    bulk: 500,
  };

  const targetCalories = tdee + adjustments[goal];
  const weightKg = lbsToKg(weightLbs);

  // Protein: 1g/lb bodyweight for cutting, 0.8g for maintenance/bulking
  const proteinG = goal === "cut" ? weightLbs : Math.round(weightLbs * 0.82);
  const proteinCal = proteinG * 4;

  // Fat: 25% of calories for cut, 30% for bulk
  const fatPct = goal === "cut" ? 0.25 : 0.30;
  const fatCal = targetCalories * fatPct;
  const fatG = Math.round(fatCal / 9);

  // Carbs: remainder
  const carbCal = targetCalories - proteinCal - fatCal;
  const carbG = Math.round(Math.max(0, carbCal / 4));

  return {
    calories: Math.round(targetCalories),
    protein: proteinG,
    carbs: carbG,
    fat: fatG,
    proteinPerKg: Math.round((proteinG / weightKg) * 10) / 10,
    deficit: adjustments[goal],
  };
}

// ═══════════════════════════════════════════════════
// 14. Ideal Body Weight (Devine Formula)
// ═══════════════════════════════════════════════════

export function idealBodyWeight(heightIn: number, gender: Gender): { lbs: number; kg: number } {
  const inchesOver5ft = Math.max(0, heightIn - 60);
  let lbs: number;
  if (gender === "male") {
    lbs = 110 + 5.06 * inchesOver5ft;
  } else {
    lbs = 100 + 5.06 * inchesOver5ft;
  }
  return { lbs: Math.round(lbs), kg: Math.round(lbsToKg(lbs)) };
}

// ═══════════════════════════════════════════════════
// 15. Calorie Cycling (Zig-Zag)
// ═══════════════════════════════════════════════════

export function calorieCycling(tdee: number, goal: FitnessGoal) {
  const target = tdee + (goal === "cut" ? -500 : goal === "lean_bulk" ? 250 : goal === "bulk" ? 500 : 0);

  return {
    weeklyTotal: target * 7,
    highDay: Math.round(target * 1.15),
    mediumDay: Math.round(target),
    lowDay: Math.round(target * 0.85),
    schedule: [
      { day: "Monday", type: "medium" as const, calories: Math.round(target) },
      { day: "Tuesday", type: "low" as const, calories: Math.round(target * 0.85) },
      { day: "Wednesday", type: "high" as const, calories: Math.round(target * 1.15) },
      { day: "Thursday", type: "low" as const, calories: Math.round(target * 0.85) },
      { day: "Friday", type: "medium" as const, calories: Math.round(target) },
      { day: "Saturday", type: "high" as const, calories: Math.round(target * 1.15) },
      { day: "Sunday", type: "low" as const, calories: Math.round(target * 0.85) },
    ],
  };
}
