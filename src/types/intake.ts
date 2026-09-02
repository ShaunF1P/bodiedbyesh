export type IntakeTrack = "park-to-peak" | "executive-concierge" | "nutrition-metabolic" | string;
export type IntakeStatus = "new" | "reviewed" | "enrolled" | "archived";

export interface ParkToPeakClinicalData {
  practiceCohort?: "mon_wed" | "tue_thu" | "flexible" | string;
  preferredLocation?: string;
  parqJointIssues?: boolean;
  parqChestPain?: boolean;
  parqDizziness?: boolean;
  parqBloodPressure?: boolean;
  parqDetails?: string;
  orthopedicAudit?: {
    knees?: "none" | "mild" | "moderate" | "severe" | string;
    lowerBack?: "none" | "mild" | "moderate" | "severe" | string;
    shoulders?: "none" | "mild" | "moderate" | "severe" | string;
    anklesFeet?: "none" | "mild" | "moderate" | "severe" | string;
    grassTurfTolerance?: "excellent" | "moderate" | "limited" | string;
  };
  heatHumidityTolerance?: "high" | "moderate" | "low" | "heat_sensitive" | string;
  hydrationHabits?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  weatherPolicyAcknowledged?: boolean;
  medicalConditions?: string;
  currentMedications?: string;
  [key: string]: unknown;
}

export interface ExecutiveConciergeClinicalData {
  wearableDevices?: string[];
  restingHeartRate?: number | string;
  baselineHrv?: number | string;
  averageSleepHours?: number | string;
  averageSleepScore?: number | string;
  dailyStrainTarget?: number | string;
  deskErgonomics?: {
    cervicalSpineTension?: "none" | "mild" | "moderate" | "severe" | string;
    anteriorPelvicTilt?: "none" | "mild" | "moderate" | "severe" | string;
    hipFlexorTightness?: "none" | "mild" | "moderate" | "severe" | string;
    dailySittingHours?: number | string;
  };
  travelCadence?: "rarely" | "monthly" | "biweekly" | "weekly" | string;
  businessDinnersPerWeek?: number | string;
  diningOutVsCooking?: string;
  executiveStressLevel?: "low" | "moderate" | "high" | "extreme" | string;
  dynamicRecoveryConsent?: boolean;
  [key: string]: unknown;
}

export interface NutritionMetabolicClinicalData {
  age?: number | string;
  biologicalSex?: "male" | "female" | "prefer_not_to_say" | string;
  currentWeightLbs?: number | string;
  targetWeightLbs?: number | string;
  heightInches?: number | string;
  estimatedBodyFatPercent?: number | string;
  activityMultiplier?: "sedentary" | "light" | "moderate" | "heavy" | "athlete" | string;
  dailyProteinTargetGrams?: number | string;
  dietaryRestrictions?: string[];
  foodAllergies?: string;
  giBehavioralTriggers?: {
    bloatingFrequency?: "never" | "occasional" | "frequent" | "daily" | string;
    acidReflux?: boolean;
    emotionalEating?: boolean;
    lateNightSnacking?: boolean;
    caffeineDailyIntake?: string;
  };
  mealPrepHabits?: "cooks_daily" | "meal_preps_weekly" | "meal_service" | "dining_out" | string;
  aiMealPlateScannerConsent?: boolean;
  aiMeshConsent?: boolean;
  [key: string]: unknown;
}

export interface ClientIntakeRecord {
  id: string;
  track: IntakeTrack;
  client_name: string;
  client_email: string;
  client_phone?: string | null;
  intake_data: ParkToPeakClinicalData | ExecutiveConciergeClinicalData | NutritionMetabolicClinicalData | Record<string, unknown>;
  waiver_signed: boolean;
  waiver_signature?: string | null;
  waiver_signed_at?: string | null;
  status: IntakeStatus;
  coach_notes?: string | null;
  created_at: string;
  updated_at?: string;
}
