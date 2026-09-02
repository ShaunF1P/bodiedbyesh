import { z } from "zod";

// ==========================================
// Shared Enums & Sub-schemas
// ==========================================

export const ProgramChoiceEnum = z.enum([
  "track_a",
  "track_a_hybrid",
  "track_a_park",
  "track_b",
  "track_b_hybrid",
  "intro_assessment",
  "portal_access",
  "Portal Access Request",
]);

export const HealthProviderEnum = z.enum([
  "apple_health",
  "google_health",
  "google_fit",
  "fitbit",
  "garmin",
  "strava",
  "whoop",
  "device_motion",
]);

export const MacroBudgetSchema = z.object({
  calories: z.number().min(0).max(10000).default(400),
  protein: z.number().min(0).max(500).default(35),
  carbs: z.number().min(0).max(1000).default(30),
  fat: z.number().min(0).max(500).default(10),
});

export const FoodItemSchema = z.object({
  name: z.string().min(1).max(200),
  grams: z.number().min(0).max(5000).optional(),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  confidence: z.number().min(0).max(1).optional(),
});

// ==========================================
// 1. /api/admin/client-profile
// ==========================================

export const AdminClientProfileQuerySchema = z.object({
  clientId: z.string().uuid().optional().or(z.string().min(1).optional()),
  userId: z.string().uuid().optional().or(z.string().min(1).optional()),
  email: z.string().email().optional(),
  roster: z.string().optional(),
  all: z.string().optional(),
});

export const AdminClientProfileCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").toLowerCase(),
  weight_lbs: z.union([z.number(), z.string()]).optional().nullable(),
  target_weight_lbs: z.union([z.number(), z.string()]).optional().nullable(),
  target_calories: z.union([z.number().int(), z.string()]).optional().nullable(),
  target_protein: z.union([z.number().int(), z.string()]).optional().nullable(),
  target_carbs: z.union([z.number().int(), z.string()]).optional().nullable(),
  target_fat: z.union([z.number().int(), z.string()]).optional().nullable(),
});

export const AdminClientProfileUpdateSchema = z.object({
  clientId: z.string().optional(),
  email: z.string().email().optional().or(z.string().min(1).optional()),
  weight_lbs: z.union([z.number(), z.string()]).optional().nullable(),
  target_weight_lbs: z.union([z.number(), z.string()]).optional().nullable(),
  target_calories: z.union([z.number().int(), z.string()]).optional().nullable(),
  target_protein: z.union([z.number().int(), z.string()]).optional().nullable(),
  target_carbs: z.union([z.number().int(), z.string()]).optional().nullable(),
  target_fat: z.union([z.number().int(), z.string()]).optional().nullable(),
}).refine((data) => data.clientId || data.email, {
  message: "Missing clientId or email",
});

// ==========================================
// 2. /api/admin/leads
// ==========================================

export const AdminLeadsPatchSchema = z.object({
  id: z.string().min(1, "Lead ID is required"),
  status: z.enum(["new", "contacted", "enrolled", "archived"]),
});

// ==========================================
// 3. /api/admin/workouts
// ==========================================

export const AdminWorkoutGetQuerySchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
});

export const AdminWorkoutExerciseSchema = z.object({
  exerciseName: z.string().min(1, "Exercise name is required").max(100),
  targetSets: z.number().int().min(1).max(50).default(3).optional(),
  targetReps: z.string().max(50).default("10").optional(),
  targetWeight: z.union([z.number(), z.string()]).optional().nullable(),
});

export const AdminWorkoutCreateSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  workoutName: z.string().min(1, "workoutName is required").max(200),
  notes: z.string().max(2000).optional().nullable(),
  exercises: z.array(AdminWorkoutExerciseSchema).default([]),
});

export const AdminWorkoutDeleteQuerySchema = z.object({
  id: z.string().min(1, "Workout ID (id) is required"),
});

// ==========================================
// 4. /api/book-appointment
// ==========================================

export const BookAppointmentSchema = z.object({
  name: z.string().trim().min(1).max(100).default("Athlete").optional(),
  email: z.string().trim().email().toLowerCase().default("client@bodiedbyesh.com").optional(),
  programName: z.string().trim().max(100).default("Coaching Program").optional(),
  slot: z.string().trim().min(1, "Appointment slot is required").max(100),
});

// ==========================================
// 5. /api/chat
// ==========================================

export const ChatGetQuerySchema = z.object({
  clientId: z.string().optional(),
});

export const ChatSendMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(5000, "Message is too long"),
  clientId: z.string().optional(),
});

// ==========================================
// 6. /api/checkout-session
// ==========================================

export const CheckoutSessionGetQuerySchema = z.object({
  id: z.string().min(1, "Missing session id query parameter"),
});

// ==========================================
// 7. /api/client/logged-sets
// ==========================================

export const ClientLoggedSetSchema = z.object({
  exerciseId: z.string().min(1, "exerciseId is required"),
  setIndex: z.number().int().min(0, "setIndex must be non-negative"),
  repsCompleted: z.union([z.number().int().min(0).max(1000), z.string()]).optional().nullable(),
  weightLiftedLbs: z.union([z.number().min(0).max(2000), z.string()]).optional().nullable(),
  isCompleted: z.boolean().optional(),
});

// ==========================================
// 8. /api/coastal/community
// ==========================================

export const CoastalCommunityQuerySchema = z.object({
  type: z.enum(["stats", "leaderboard", "feed", "all"]).optional(),
  timeframe: z.enum(["all_time", "month", "week", "today"]).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).optional(),
  groupId: z.string().max(100).optional(),
});

export const CoastalCommunityPostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("react"),
    encouragementId: z.string().min(1, "encouragementId is required"),
    reactionType: z.enum(["prayer", "heart", "fire", "crown"]),
  }),
  z.object({
    action: z.literal("post").default("post"),
    message: z.string().trim().min(1, "Encouragement message cannot be empty").max(1000, "Message cannot exceed 1,000 characters"),
    displayName: z.string().trim().max(100).optional(),
    prayerTag: z.string().trim().max(100).optional(),
    groupId: z.string().max(100).optional(),
  }),
]);

// Relaxed fallback object schema for polymorphic post/react body
export const CoastalCommunityBodySchema = z.object({
  action: z.enum(["post", "react"]).optional().default("post"),
  encouragementId: z.string().optional(),
  reactionType: z.string().optional(),
  message: z.string().optional(),
  displayName: z.string().optional(),
  prayerTag: z.string().optional(),
  groupId: z.string().optional(),
});

// ==========================================
// 9. /api/coastal/devotionals
// ==========================================

export const CoastalDevotionalQuerySchema = z.object({
  day: z.string().regex(/^\d+$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  all: z.string().optional(),
  groupId: z.string().optional(),
});

export const CoastalDevotionalReflectionSchema = z.object({
  devotionalId: z.string().min(1, "devotionalId is required"),
  dayNumber: z.union([z.number().int().min(1).max(366), z.string()]).optional(),
  reflectionText: z.string().trim().min(1, "Reflection text cannot be empty").max(4000, "Reflection cannot exceed 4,000 characters"),
  isShared: z.boolean().optional().default(false),
  groupId: z.string().optional(),
});

// ==========================================
// 10. /api/coastal/join
// ==========================================

export const CoastalJoinGroupSchema = z.object({
  groupSlug: z.string().max(100).default("coastal").optional(),
  displayName: z.string().trim().max(100).optional(),
  isAnonymous: z.boolean().optional().default(false),
});

// ==========================================
// 11. /api/coastal/steps
// ==========================================

export const CoastalStepsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD").optional(),
  groupId: z.string().optional(),
});

export const CoastalStepsLogSchema = z.object({
  steps: z.number().int().min(0, "Steps cannot be negative").max(200000, "Maximum daily steps is 200,000"),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  distanceMiles: z.number().min(0).max(100).optional(),
  activeMinutes: z.number().int().min(0).max(1440).optional(),
  notes: z.string().max(500).optional(),
  groupId: z.string().default("3266-coastal-church").optional(),
  userId: z.string().optional(),
});

export const CoastalStepsDeleteQuerySchema = z.object({
  id: z.string().min(1, "Step log ID is required"),
});

// ==========================================
// 12. /api/create-checkout-session
// ==========================================

export const CreateCheckoutSessionSchema = z.object({
  programChoice: z.string().min(1, "Program choice is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(30).optional(),
});

// ==========================================
// 13. /api/ghl-contact
// ==========================================

export const GHLContactLeadSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(100),
  email: z.string().trim().email("email is required and must be valid").toLowerCase(),
  phone: z.string().trim().max(30).optional().nullable(),
  programChoice: z.string().trim().max(100).optional().nullable(),
  trackGoal: z.string().trim().max(200).optional().nullable(),
  source: z.string().trim().max(50).default("website").optional(),
});

// ==========================================
// 14. /api/log-meal
// ==========================================

export const LogMealQuerySchema = z.object({
  email: z.string().email().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const LogMealCreateSchema = z.object({
  mealType: z.string().max(50).default("snack").optional(),
  items: z.array(FoodItemSchema).min(1, "No items provided"),
  imageUrl: z.string().url().optional().or(z.string().min(1).optional()).nullable(),
});

// ==========================================
// 15. /api/logo-feedback
// ==========================================

export const LogoFeedbackPostSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required").max(100),
  favorites: z.array(z.number().int()).optional().default([]),
  hearts: z.array(z.number().int()).optional().default([]),
  eliminated: z.array(z.union([z.number().int(), z.string()])).optional().default([]),
  notes: z.string().max(5000).optional().nullable(),
});

// ==========================================
// 16. /api/park-config
// ==========================================

export const ParkScheduleItemSchema = z.object({
  day: z.string().min(1).max(50),
  time: z.string().min(1).max(50),
  duration: z.string().min(1).max(50),
});

export const ParkActiveParkSchema = z.object({
  name: z.string().min(1, "Park name is required").max(150),
  city: z.string().max(100).optional(),
  address: z.string().max(250).optional(),
  meetingSpot: z.string().max(250).optional(),
  googleMapsUrl: z.string().max(500).optional(),
});

export const ParkConfigUpdateSchema = z.object({
  activePark: ParkActiveParkSchema,
  schedule: z.array(ParkScheduleItemSchema).min(1, "Schedule array is required"),
  whatToBring: z.array(z.string()).optional(),
  coachNotes: z.string().max(2000).optional(),
  isAcceptingNewClients: z.boolean().optional(),
  lastUpdated: z.string().optional(),
});

// ==========================================
// 17. /api/recommend-recipe
// ==========================================

export const RecommendRecipeSchema = z.object({
  remainingMacros: MacroBudgetSchema.optional(),
  pantryIngredients: z.string().max(500).optional().default(""),
  dietaryPreference: z.string().max(100).optional().default(""),
});

// ==========================================
// 18. /api/scan-meal
// ==========================================

export const ScanMealSchema = z.object({
  imageBase64: z.string().min(1, "Missing imageBase64 field"),
  mimeType: z.string().max(50).default("image/jpeg").optional(),
});

// ==========================================
// 19. /api/scan-menu
// ==========================================

export const ScanMenuSchema = z.object({
  imageBase64: z.string().min(1, "Missing imageBase64 field"),
  mimeType: z.string().max(50).default("image/jpeg").optional(),
  remainingBudget: MacroBudgetSchema.optional(),
});

// ==========================================
// 20. /api/sync/health
// ==========================================

export const SyncHealthPostSchema = z.object({
  provider: HealthProviderEnum,
  steps: z.number().int().min(0, "Step count cannot be negative").max(200000, "Step count must be between 0 and 200,000 steps."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  distanceMiles: z.number().min(0).max(100).optional(),
  activeMinutes: z.number().int().min(0).max(1440).optional(),
  caloriesBurned: z.number().min(0).max(20000).optional(),
  groupId: z.string().max(100).default("3266-coastal-church").optional(),
  deviceModel: z.string().max(100).optional(),
  sourceApp: z.string().max(100).optional(),
  rawPayload: z.any().optional(),
});

// ==========================================
// 21. /api/webhook/stripe
// ==========================================

export const StripeWebhookHeaderSchema = z.object({
  stripeSignature: z.string().min(1, "Missing stripe-signature"),
});

// ==========================================
// 22. /api/intake & Clinical Intake Forms
// ==========================================

export const ClientIntakeTrackEnum = z.enum([
  "park-to-peak",
  "executive-concierge",
  "nutrition-metabolic",
  "track_a",
  "track_b",
  "track_c",
]);

export const ClientIntakeStatusEnum = z.enum([
  "new",
  "reviewed",
  "enrolled",
  "archived",
]);

// ── Track A: Park-to-Peak Clinical Fields ──
export const ParkToPeakIntakeDataSchema = z.object({
  practiceCohort: z.enum(["mon_wed", "tue_thu", "flexible"]).default("mon_wed"),
  preferredLocation: z.string().default("Merrit Park (Delray Beach, FL)"),
  parqJointIssues: z.boolean().default(false),
  parqChestPain: z.boolean().default(false),
  parqDizziness: z.boolean().default(false),
  parqBloodPressure: z.boolean().default(false),
  parqDetails: z.string().max(1000).optional().nullable(),
  orthopedicAudit: z
    .object({
      knees: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      lowerBack: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      shoulders: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      anklesFeet: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      grassTurfTolerance: z.enum(["excellent", "moderate", "limited"]).default("excellent"),
    })
    .optional(),
  heatHumidityTolerance: z.enum(["high", "moderate", "low", "heat_sensitive"]).default("moderate"),
  hydrationHabits: z.string().max(500).optional().nullable(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required").max(100),
  emergencyContactPhone: z.string().min(7, "Emergency contact phone is required").max(30),
  emergencyContactRelation: z.string().max(50).optional().nullable(),
  weatherPolicyAcknowledged: z.boolean().refine((val) => val === true, "Must acknowledge 24-hr/weather policy"),
  medicalConditions: z.string().max(1000).optional().nullable(),
  currentMedications: z.string().max(1000).optional().nullable(),
});

export const ParkToPeakIntakeSchema = z.object({
  clientName: z.string().trim().min(1, "Full name is required").max(100),
  clientEmail: z.string().trim().email("Valid email address is required").toLowerCase(),
  clientPhone: z.string().trim().min(7, "Phone number is required").max(30),
  practiceCohort: z.enum(["mon_wed", "tue_thu", "flexible"]).default("mon_wed"),
  preferredLocation: z.string().default("Merrit Park (Delray Beach, FL)"),
  parqJointIssues: z.boolean().default(false),
  parqChestPain: z.boolean().default(false),
  parqDizziness: z.boolean().default(false),
  parqBloodPressure: z.boolean().default(false),
  parqDetails: z.string().max(1000).optional().nullable(),
  orthopedicAudit: z
    .object({
      knees: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      lowerBack: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      shoulders: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      anklesFeet: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      grassTurfTolerance: z.enum(["excellent", "moderate", "limited"]).default("excellent"),
    })
    .optional(),
  heatHumidityTolerance: z.enum(["high", "moderate", "low", "heat_sensitive"]).default("moderate"),
  hydrationHabits: z.string().max(500).optional().nullable(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required").max(100),
  emergencyContactPhone: z.string().min(7, "Emergency contact phone is required").max(30),
  emergencyContactRelation: z.string().max(50).optional().nullable(),
  weatherPolicyAcknowledged: z.boolean().refine((val) => val === true, "Must acknowledge 24-hr/weather policy"),
  medicalConditions: z.string().max(1000).optional().nullable(),
  currentMedications: z.string().max(1000).optional().nullable(),
  waiverSigned: z.boolean().refine((val) => val === true, "Liability waiver must be accepted"),
  waiverSignature: z.string().trim().min(2, "Typed digital signature is required").max(100),
  waiverSignedAt: z.string().optional(),
});

// ── Track B: Executive Concierge Clinical Fields ──
export const ExecutiveConciergeIntakeDataSchema = z.object({
  wearableDevices: z.array(z.string()).default([]),
  restingHeartRate: z.union([z.number().int().min(30).max(200), z.string()]).optional().nullable(),
  baselineHrv: z.union([z.number().min(0).max(300), z.string()]).optional().nullable(),
  averageSleepHours: z.union([z.number().min(1).max(24), z.string()]).optional().nullable(),
  averageSleepScore: z.union([z.number().int().min(0).max(100), z.string()]).optional().nullable(),
  dailyStrainTarget: z.union([z.number().min(0).max(25), z.string()]).optional().nullable(),
  deskErgonomics: z
    .object({
      cervicalSpineTension: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      anteriorPelvicTilt: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      hipFlexorTightness: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      dailySittingHours: z.union([z.number().min(0).max(24), z.string()]).default(8),
    })
    .optional(),
  travelCadence: z.enum(["rarely", "monthly", "biweekly", "weekly"]).default("monthly"),
  businessDinnersPerWeek: z.union([z.number().int().min(0).max(21), z.string()]).default(2),
  diningOutVsCooking: z.string().max(500).optional().nullable(),
  executiveStressLevel: z.enum(["low", "moderate", "high", "extreme"]).default("moderate"),
  dynamicRecoveryConsent: z.boolean().default(true),
});

export const ExecutiveConciergeIntakeSchema = z.object({
  clientName: z.string().trim().min(1, "Full name is required").max(100),
  clientEmail: z.string().trim().email("Valid email address is required").toLowerCase(),
  clientPhone: z.string().trim().min(7, "Phone number is required").max(30),
  wearableDevices: z.array(z.string()).default([]),
  restingHeartRate: z.union([z.number().int().min(30).max(200), z.string()]).optional().nullable(),
  baselineHrv: z.union([z.number().min(0).max(300), z.string()]).optional().nullable(),
  averageSleepHours: z.union([z.number().min(1).max(24), z.string()]).optional().nullable(),
  averageSleepScore: z.union([z.number().int().min(0).max(100), z.string()]).optional().nullable(),
  dailyStrainTarget: z.union([z.number().min(0).max(25), z.string()]).optional().nullable(),
  deskErgonomics: z
    .object({
      cervicalSpineTension: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      anteriorPelvicTilt: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      hipFlexorTightness: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
      dailySittingHours: z.union([z.number().min(0).max(24), z.string()]).default(8),
    })
    .optional(),
  travelCadence: z.enum(["rarely", "monthly", "biweekly", "weekly"]).default("monthly"),
  businessDinnersPerWeek: z.union([z.number().int().min(0).max(21), z.string()]).default(2),
  diningOutVsCooking: z.string().max(500).optional().nullable(),
  executiveStressLevel: z.enum(["low", "moderate", "high", "extreme"]).default("moderate"),
  dynamicRecoveryConsent: z.boolean().default(true),
  waiverSigned: z.boolean().refine((val) => val === true, "Liability waiver must be accepted"),
  waiverSignature: z.string().trim().min(2, "Typed digital signature is required").max(100),
  waiverSignedAt: z.string().optional(),
});

// ── Track C: Nutrition & Metabolic Health Clinical Fields ──
export const NutritionMetabolicIntakeDataSchema = z.object({
  age: z.union([z.number().int().min(16).max(120), z.string()]).optional().nullable(),
  biologicalSex: z.enum(["male", "female", "prefer_not_to_say"]).default("female"),
  currentWeightLbs: z.union([z.number().min(50).max(800), z.string()]),
  targetWeightLbs: z.union([z.number().min(50).max(800), z.string()]).optional().nullable(),
  heightInches: z.union([z.number().min(36).max(96), z.string()]),
  estimatedBodyFatPercent: z.union([z.number().min(3).max(70), z.string()]).optional().nullable(),
  activityMultiplier: z.enum(["sedentary", "light", "moderate", "heavy", "athlete"]).default("moderate"),
  dailyProteinTargetGrams: z.union([z.number().min(0).max(500), z.string()]).optional().nullable(),
  dietaryRestrictions: z.array(z.string()).default([]),
  foodAllergies: z.string().max(1000).optional().nullable(),
  giBehavioralTriggers: z
    .object({
      bloatingFrequency: z.enum(["never", "occasional", "frequent", "daily"]).default("occasional"),
      acidReflux: z.boolean().default(false),
      emotionalEating: z.boolean().default(false),
      lateNightSnacking: z.boolean().default(false),
      caffeineDailyIntake: z.string().max(100).optional().nullable(),
    })
    .optional(),
  mealPrepHabits: z.enum(["cooks_daily", "meal_preps_weekly", "meal_service", "dining_out"]).default("cooks_daily"),
  aiMealPlateScannerConsent: z.boolean().default(true),
  aiMeshConsent: z.boolean().default(true),
});

export const NutritionMetabolicIntakeSchema = z.object({
  clientName: z.string().trim().min(1, "Full name is required").max(100),
  clientEmail: z.string().trim().email("Valid email address is required").toLowerCase(),
  clientPhone: z.string().trim().min(7, "Phone number is required").max(30),
  age: z.union([z.number().int().min(16).max(120), z.string()]).optional().nullable(),
  biologicalSex: z.enum(["male", "female", "prefer_not_to_say"]).default("female"),
  currentWeightLbs: z.union([z.number().min(50).max(800), z.string()]),
  targetWeightLbs: z.union([z.number().min(50).max(800), z.string()]).optional().nullable(),
  heightInches: z.union([z.number().min(36).max(96), z.string()]),
  estimatedBodyFatPercent: z.union([z.number().min(3).max(70), z.string()]).optional().nullable(),
  activityMultiplier: z.enum(["sedentary", "light", "moderate", "heavy", "athlete"]).default("moderate"),
  dailyProteinTargetGrams: z.union([z.number().min(0).max(500), z.string()]).optional().nullable(),
  dietaryRestrictions: z.array(z.string()).default([]),
  foodAllergies: z.string().max(1000).optional().nullable(),
  giBehavioralTriggers: z
    .object({
      bloatingFrequency: z.enum(["never", "occasional", "frequent", "daily"]).default("occasional"),
      acidReflux: z.boolean().default(false),
      emotionalEating: z.boolean().default(false),
      lateNightSnacking: z.boolean().default(false),
      caffeineDailyIntake: z.string().max(100).optional().nullable(),
    })
    .optional(),
  mealPrepHabits: z.enum(["cooks_daily", "meal_preps_weekly", "meal_service", "dining_out"]).default("cooks_daily"),
  aiMealPlateScannerConsent: z.boolean().default(true),
  aiMeshConsent: z.boolean().default(true),
  waiverSigned: z.boolean().refine((val) => val === true, "Liability waiver must be accepted"),
  waiverSignature: z.string().trim().min(2, "Typed digital signature is required").max(100),
  waiverSignedAt: z.string().optional(),
});

// ── Universal Client Intake Submission Schema (POST /api/intake) ──
export const ClientIntakeSubmissionSchema = z.object({
  track: ClientIntakeTrackEnum,
  clientName: z.string().trim().min(1, "Full name is required").max(100),
  clientEmail: z.string().trim().email("Valid email address is required").toLowerCase(),
  clientPhone: z.string().trim().min(7, "Phone number is required").max(30),
  intakeData: z.record(z.string(), z.unknown()).default({}),
  waiverSigned: z.boolean().refine((val) => val === true, "Liability waiver must be accepted"),
  waiverSignature: z.string().trim().min(2, "Typed digital signature is required").max(100),
  waiverSignedAt: z.string().optional(),
});

// ── Admin Query Schema (GET /api/intake) ──
export const AdminIntakeQuerySchema = z.object({
  track: z.string().optional(),
  status: z.enum(["all", "new", "reviewed", "enrolled", "archived"]).optional().default("all"),
  search: z.string().optional(),
  limit: z
    .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default(50),
  offset: z
    .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
    .pipe(z.number().int().min(0))
    .optional()
    .default(0),
});

// ── Admin Patch Schema (PATCH /api/intake) ──
export const AdminIntakePatchSchema = z.object({
  id: z.string().uuid("Valid UUID is required"),
  status: ClientIntakeStatusEnum.optional(),
  coachNotes: z.string().max(2000).optional().nullable(),
});

// ── Inferred Types ──
export type ClientIntakeTrack = z.infer<typeof ClientIntakeTrackEnum>;
export type ClientIntakeStatus = z.infer<typeof ClientIntakeStatusEnum>;
export type ParkToPeakIntakeData = z.infer<typeof ParkToPeakIntakeDataSchema>;
export type ParkToPeakIntake = z.infer<typeof ParkToPeakIntakeSchema>;
export type ExecutiveConciergeIntakeData = z.infer<typeof ExecutiveConciergeIntakeDataSchema>;
export type ExecutiveConciergeIntake = z.infer<typeof ExecutiveConciergeIntakeSchema>;
export type NutritionMetabolicIntakeData = z.infer<typeof NutritionMetabolicIntakeDataSchema>;
export type NutritionMetabolicIntake = z.infer<typeof NutritionMetabolicIntakeSchema>;
export type ClientIntakeSubmission = z.infer<typeof ClientIntakeSubmissionSchema>;
export type AdminIntakeQuery = z.infer<typeof AdminIntakeQuerySchema>;
export type AdminIntakePatch = z.infer<typeof AdminIntakePatchSchema>;
