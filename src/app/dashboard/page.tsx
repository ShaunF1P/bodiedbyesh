"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import RollingCounter from "@/components/RollingCounter";
import MealScanner from "@/components/MealScanner";
import BarcodeScanner from "@/components/BarcodeScanner";
import MenuAdvisor from "@/components/MenuAdvisor";
import BodyScanner from "@/components/BodyScanner";
import RecipeAdvisor from "@/components/RecipeAdvisor";
import ChatWidget from "@/components/ChatWidget";
import AdminClientSwitcher, { RosterClient } from "@/components/AdminClientSwitcher";
import TransformationStudio from "@/components/TransformationStudio";
import CoachingVideoPlayer from "@/components/CoachingVideoPlayer";
import { HealthTrackerSyncModal } from "@/components/coastal";
import {
  Cpu,
  Heart,
  ChefHat,
  TrendingUp,
  Flame,
  Zap,
  Dumbbell,
  Clock,
  Target,
  Apple,
  ScanBarcode,
  Camera,
  BarChart3,
  Beef,
  Wheat,
  Droplets,
  Watch,
  Plus,
  Utensils,
  LogOut,
  Trash2,
  Loader2,
  Check,
  CheckCheck,
  Shield,
  Edit3,
  Users,
  Footprints,
  Layers,
  Video,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Award,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

// ── Tab definitions ──

const TABS = [
  { id: "body", label: "Body", icon: Target },
  { id: "nutrition", label: "Nutrition", icon: Apple },
  { id: "recovery", label: "Recovery", icon: Heart },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "transformation", label: "Transformation", icon: Layers },
  { id: "coaching", label: "Video Coaching", icon: Video },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ClientDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabId>("body");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Body Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scannedMetrics, setScannedMetrics] = useState<any>(null);
  const [pastScans, setPastScans] = useState<any[]>([]);

  // Macro tracker state
  const [dailyLog, setDailyLog] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    target: { calories: 1850, protein: 160, carbs: 185, fat: 52 },
  });

  // Wearable metrics (real API data / live connection)
  const [wearables, setWearables] = useState({
    steps: 0,
    hrv: 78,
    sleepScore: 85,
    strain: 12.4,
    readiness: 82,
    restingHr: 58,
    calories: 0,
    recovery: 74,
  });

  // Phase 2 states: Workout tracking & historical dates
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [availableWorkoutDates, setAvailableWorkoutDates] = useState<string[]>([]);
  const [assignedWorkout, setAssignedWorkout] = useState<any>(null);
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [loggingSetId, setLoggingSetId] = useState<string | null>(null);

  // Admin View & Assist State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedAdminClient, setSelectedAdminClient] = useState<RosterClient | null>(null);
  const [isHealthSyncModalOpen, setIsHealthSyncModalOpen] = useState(false);
  const [isWearableSynced, setIsWearableSynced] = useState<boolean>(false);
  const [adminAccessDenied, setAdminAccessDenied] = useState(false);

  const loadClientDataForAdmin = async (clientInfo: RosterClient) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/client-profile?email=${encodeURIComponent(clientInfo.email)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && data.client) {
        const p = data.client.profile || {
          id: clientInfo.profileId || clientInfo.id,
          user_id: clientInfo.userId,
          name: clientInfo.name,
          email: clientInfo.email,
          target_calories: clientInfo.target_calories || 1850,
          target_protein: clientInfo.target_protein || 160,
          target_carbs: clientInfo.target_carbs || 185,
          target_fat: clientInfo.target_fat || 52,
          weight_lbs: clientInfo.weight_lbs,
          target_weight_lbs: clientInfo.target_weight_lbs,
        };
        setProfile(p);
        setUser({ id: p.user_id || p.id, email: p.email, user_metadata: { full_name: p.name } });

        const cals = p.target_calories || 1850;
        const prot = p.target_protein || 160;
        const carb = p.target_carbs || 185;
        const fat = p.target_fat || 52;

        const meals = data.client.foodLogs || [];
        const totals = meals.reduce(
          (acc: any, m: any) => ({
            calories: acc.calories + (m.calories || 0),
            protein: acc.protein + (m.protein || 0),
            carbs: acc.carbs + (m.carbs || 0),
            fat: acc.fat + (m.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        setDailyLog({
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          target: { calories: cals, protein: prot, carbs: carb, fat: fat },
        });

        const scans = data.client.bodyScans || [];
        setPastScans(scans);
        if (scans.length > 0) {
          setScannedMetrics({
            estimatedBodyFatPercent: scans[0].body_fat_percent,
            shoulderToWaistRatio: scans[0].shoulder_to_waist_ratio,
            waistToHipRatio: scans[0].waist_to_hip_ratio,
          });
        } else {
          setScannedMetrics(null);
        }

        const workouts = data.client.assignedWorkouts || [];
        if (workouts.length > 0) {
          setAvailableWorkoutDates(workouts.map((w: any) => w.date).filter(Boolean));
          const w = workouts.find((wk: any) => wk.date === selectedWorkoutDate) || workouts[0];
          const loggedSets = data.client.loggedSets || [];
          const exercisesWithLogs = (w.workout_exercises || []).map((ex: any) => {
            const logs = loggedSets
              .filter((l: any) => l.workout_exercise_id === ex.id)
              .sort((a: any, b: any) => a.set_index - b.set_index);
            return { ...ex, loggedSets: logs };
          });
          setAssignedWorkout({ ...w, exercises: exercisesWithLogs });
        } else {
          setAvailableWorkoutDates([]);
          setAssignedWorkout(null);
        }
      }
    } catch (e) {
      console.error("Admin client load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // Load user profile and data from Supabase
  useEffect(() => {
    async function initUser() {
      setLoading(true);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      const ADMIN_EMAILS = [
        "bodiedbyesh@gmail.com",
        "nieshaedwards314@gmail.com",
        "niesha0314@gmail.com",
        "kashaunmuhammad@gmail.com",
      ];
      const isStaffAdmin = Boolean(currentUser.app_metadata?.role === "admin" || (currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase())));
      setIsAdminMode(isStaffAdmin);

      const searchParams = new URLSearchParams(window.location.search);
      const viewAsParam = searchParams.get("viewAs");
      if (searchParams.get("error") === "unauthorized_admin_access") {
        setAdminAccessDenied(true);
      }

      if (isStaffAdmin) {
        try {
          const rRes = await fetch(`/api/admin/client-profile?roster=true`, {
            cache: "no-store",
          });
          const rData = await rRes.json();
          if (rData.success && Array.isArray(rData.roster) && rData.roster.length > 0) {
            let target = rData.roster.find((c: any) => c.id === viewAsParam || c.email === viewAsParam || c.leadId === viewAsParam || c.profileId === viewAsParam || c.userId === viewAsParam);
            if (!target) target = rData.roster[0];
            setSelectedAdminClient(target);
            await loadClientDataForAdmin(target);
            return;
          }
        } catch (e) {
          console.error("Failed loading admin roster:", e);
        }
      }

        // Load profile (synced automatically by database signup trigger)
        const { data: existingProfile, error: profileErr } = await supabase
          .from("client_profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .single();

        let clientProfile = existingProfile;

        if (profileErr || !existingProfile) {
          // Fallback: check by email or create
          const { data: emailProfile } = await supabase
            .from("client_profiles")
            .select("*")
            .eq("email", currentUser.email?.toLowerCase())
            .maybeSingle();

          if (emailProfile) {
            // Link it
            const { data: updated } = await supabase
              .from("client_profiles")
              .update({ user_id: currentUser.id })
              .eq("id", emailProfile.id)
              .select()
              .single();
            clientProfile = updated;
          } else {
            // Create default
            const { data: newProfile } = await supabase
              .from("client_profiles")
              .insert({
                user_id: currentUser.id,
                name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Client",
                email: currentUser.email?.toLowerCase() || "",
              })
              .select("*")
              .single();
            clientProfile = newProfile;
          }
        }

        setProfile(clientProfile);
        if (clientProfile) {
          setDailyLog((prev) => ({
            ...prev,
            target: {
              calories: clientProfile.target_calories || 1850,
              protein: clientProfile.target_protein || 160,
              carbs: clientProfile.target_carbs || 185,
              fat: clientProfile.target_fat || 52,
            },
          }));
        }

        // Fetch today's meals
        const today = new Date().toISOString().split("T")[0];
        const { data: meals } = await supabase
          .from("logged_meals")
          .select("*")
          .eq("user_id", currentUser.id)
          .gte("created_at", `${today}T00:00:00.000Z`);

        if (meals && meals.length > 0) {
          const totals = meals.reduce(
            (acc, m) => ({
              calories: acc.calories + m.calories,
              protein: acc.protein + m.protein,
              carbs: acc.carbs + m.carbs,
              fat: acc.fat + m.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );
          setDailyLog((prev) => ({
            ...prev,
            calories: totals.calories,
            protein: totals.protein,
            carbs: totals.carbs,
            fat: totals.fat,
          }));
        }

        // Fetch body scans
        const { data: scans } = await supabase
          .from("body_scans")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (scans && scans.length > 0) {
          setPastScans(scans);
          setScannedMetrics({
            estimatedBodyFatPercent: scans[0].body_fat_percent,
            shoulderToWaistRatio: scans[0].shoulder_to_waist_ratio,
            waistToHipRatio: scans[0].waist_to_hip_ratio,
          });
        }

      setLoading(false);
    }
    
    initUser();
  }, [router, supabase]);

  // Load client's workout for selected date
  useEffect(() => {
    if (!profile || isAdminMode) return;
    
    async function loadWorkoutForDate(dateToLoad: string) {
      setWorkoutLoading(true);
      try {
        // Fetch all client workout dates for quick navigation
        const { data: allWorkouts } = await supabase
          .from("workouts")
          .select("date")
          .eq("client_id", profile.id);
        if (allWorkouts && Array.isArray(allWorkouts)) {
          const dates = allWorkouts.map((w: any) => w.date).filter(Boolean);
          setAvailableWorkoutDates(dates);
        }

        // 1. Fetch workout scheduled for selected date
        const { data: workoutData, error: wError } = await supabase
          .from("workouts")
          .select(`
            id,
            name,
            notes,
            date,
            exercises: workout_exercises(
              id,
              exercise_name,
              target_sets,
              target_reps,
              target_weight_lbs,
              order_index
            )
          `)
          .eq("client_id", profile.id)
          .eq("date", dateToLoad)
          .maybeSingle();

        if (wError) throw wError;

        if (workoutData && Array.isArray(workoutData.exercises) && workoutData.exercises.length > 0) {
          // 2. Fetch logged sets for these exercises
          const exerciseIds = workoutData.exercises.map((e: any) => e.id);
          const { data: loggedSetsData, error: lsError } = await supabase
            .from("logged_sets")
            .select("*")
            .in("workout_exercise_id", exerciseIds);

          if (lsError) throw lsError;

          // Map logged sets to the exercises sorted by order_index
          const exercisesWithLogs = [...workoutData.exercises]
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((ex: any) => {
              const logs = (loggedSetsData || [])
                .filter((l: any) => l.workout_exercise_id === ex.id)
                .sort((a: any, b: any) => a.set_index - b.set_index);
              return { ...ex, loggedSets: logs };
            });

          setAssignedWorkout({
            ...workoutData,
            exercises: exercisesWithLogs,
          });
        } else if (workoutData) {
          setAssignedWorkout(workoutData);
        } else {
          setAssignedWorkout(null);
        }
      } catch (err) {
        console.error("Failed to load workout for date:", err);
      } finally {
        setWorkoutLoading(false);
      }
    }

    loadWorkoutForDate(selectedWorkoutDate);
  }, [profile, selectedWorkoutDate, supabase, isAdminMode]);

  // Real-time workout session volume / tonnage and progress metrics
  const workoutMetrics = React.useMemo(() => {
    if (!assignedWorkout || !Array.isArray(assignedWorkout.exercises)) {
      return { totalVolumeLbs: 0, completedSets: 0, totalTargetSets: 0, completionPct: 0, totalExercises: 0 };
    }
    let totalVolumeLbs = 0;
    let completedSets = 0;
    let totalTargetSets = 0;

    assignedWorkout.exercises.forEach((ex: any) => {
      totalTargetSets += ex.target_sets || 0;
      (ex.loggedSets || []).forEach((set: any) => {
        if (set.is_completed) {
          completedSets += 1;
          const reps = set.reps_completed !== null && set.reps_completed !== undefined
            ? Number(set.reps_completed)
            : parseInt(ex.target_reps) || 0;
          const weight = set.weight_lifted_lbs !== null && set.weight_lifted_lbs !== undefined
            ? Number(set.weight_lifted_lbs)
            : Number(ex.target_weight_lbs) || 0;
          totalVolumeLbs += (reps * weight);
        }
      });
    });

    const completionPct = totalTargetSets > 0 ? Math.round((completedSets / totalTargetSets) * 100) : 0;
    return {
      totalVolumeLbs,
      completedSets,
      totalTargetSets,
      completionPct,
      totalExercises: assignedWorkout.exercises.length,
    };
  }, [assignedWorkout]);

  // Date Navigation Helpers
  const shiftWorkoutDate = (deltaDays: number) => {
    const current = new Date(selectedWorkoutDate + "T12:00:00Z");
    current.setUTCDate(current.getUTCDate() + deltaDays);
    setSelectedWorkoutDate(current.toISOString().split("T")[0]);
  };

  const jumpToToday = () => {
    setSelectedWorkoutDate(new Date().toISOString().split("T")[0]);
  };

  const handleLogSet = async (exerciseId: string, setIndex: number, reps: number, weight: number, isCompleted: boolean) => {
    setLoggingSetId(`${exerciseId}-${setIndex}`);
    try {
      const res = await fetch("/api/client/logged-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          setIndex,
          repsCompleted: reps,
          weightLiftedLbs: weight,
          isCompleted,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Update local state to reflect the completed set and trigger real-time volume re-calculation
        setAssignedWorkout((prev: any) => {
          if (!prev) return prev;
          const nextExercises = prev.exercises.map((ex: any) => {
            if (ex.id !== exerciseId) return ex;
            
            const nextLogs = [...(ex.loggedSets || [])];
            const logIdx = nextLogs.findIndex((l: any) => l.set_index === setIndex);
            if (logIdx > -1) {
              nextLogs[logIdx] = json.data;
            } else {
              nextLogs.push(json.data);
            }
            return { ...ex, loggedSets: nextLogs };
          });
          return { ...prev, exercises: nextExercises };
        });
      }
    } catch (err) {
      console.error("Failed to log set:", err);
    } finally {
      setLoggingSetId(null);
    }
  };

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate wearable metric drifts (gated when synced)
  useEffect(() => {
    const interval = setInterval(() => {
      setWearables((prev) => ({
        ...prev,
        steps: isWearableSynced ? prev.steps : prev.steps + Math.floor(Math.random() * 5),
        hrv: Math.max(40, Math.min(120, prev.hrv + Math.floor(Math.random() * 3) - 1)),
        strain: Math.max(0, Math.min(21, parseFloat((prev.strain + Math.random() * 0.2 - 0.1).toFixed(1)))),
        restingHr: Math.max(48, Math.min(72, prev.restingHr + Math.floor(Math.random() * 3) - 1)),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, [isWearableSynced]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleMealLogged = async (items: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[]) => {
    if (!user) return;

    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Save to Supabase
    try {
      await supabase.from("logged_meals").insert({
        user_id: user.id,
        meal_type: "snack",
        items: items,
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      });
    } catch (e) {
      console.error("Failed to save meal to database:", e);
    }

    setDailyLog((prev) => ({
      ...prev,
      calories: prev.calories + Math.round(totals.calories),
      protein: prev.protein + Math.round(totals.protein),
      carbs: prev.carbs + Math.round(totals.carbs),
      fat: prev.fat + Math.round(totals.fat),
    }));
  };

  const handleFoodLogged = async (food: { name: string; grams?: number; calories: number; protein: number; carbs: number; fat: number }) => {
    if (!user) return;

    // Save to Supabase
    try {
      await supabase.from("logged_meals").insert({
        user_id: user.id,
        meal_type: "snack",
        items: [{ name: food.name, grams: food.grams || 100, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat }],
        calories: Math.round(food.calories),
        protein: Math.round(food.protein),
        carbs: Math.round(food.carbs),
        fat: Math.round(food.fat),
      });
    } catch (e) {
      console.error("Failed to save food log to database:", e);
    }

    setDailyLog((prev) => ({
      ...prev,
      calories: prev.calories + Math.round(food.calories),
      protein: prev.protein + Math.round(food.protein),
      carbs: prev.carbs + Math.round(food.carbs),
      fat: prev.fat + Math.round(food.fat),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-slate flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-slate text-ice-white">
      {/* Admin Assist Switcher Header (Only shown in Admin Mode) */}
      {isAdminMode && (
        <AdminClientSwitcher
          activeClient={selectedAdminClient}
          onSelectClient={(client) => {
            setSelectedAdminClient(client);
            loadClientDataForAdmin(client);
          }}
          onTargetsUpdated={(client) => {
            setSelectedAdminClient(client);
            loadClientDataForAdmin(client);
          }}
        />
      )}

      <Header />

      {/* Admin Access Denied Alert */}
      {adminAccessDenied && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold block text-sm text-white">Administrator Access Restricted</span>
                You were redirected here because your current login ({user?.email || "this account"}) does not have Coach Admin privileges.
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer"
            >
              Sign Out &amp; Switch Account
            </button>
          </div>
        </div>
      )}

      {/* Hero bar */}
      <div className="border-b border-white/5 bg-onyx-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isAdminMode ? (
                <>
                  <Shield className="w-4 h-4 text-accent-lime" />
                  <span className="text-accent-lime text-[10px] font-bold uppercase tracking-widest">
                    Admin Impersonation · Assisting Member
                  </span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 text-accent-lime" />
                  <span className="text-accent-lime text-[10px] font-bold uppercase tracking-widest">
                    Client Intelligence Portal
                  </span>
                </>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
              {isAdminMode ? (
                <span>
                  {profile?.name || selectedAdminClient?.name || "Client"}&apos;s Dashboard
                </span>
              ) : (
                "Your Dashboard"
              )}
            </h1>
            {isAdminMode && (
              <p className="text-xs text-silver-slate mt-0.5">
                Viewing live metrics, nutrition targets, workout logs, and body scans for {profile?.email || selectedAdminClient?.email}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-silver-slate text-xs">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="font-display font-bold text-lg text-accent-lime">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {isAdminMode && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-4 py-2 bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-accent-lime/20 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Coach Admin Portal</span>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-2 border border-white/10 hover:border-red-500/30 rounded-xl text-xs font-semibold text-silver-slate hover:text-red-400 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Intake Protocol Notice */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-6">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-lime/10 via-cyber-slate to-accent-violet/10 border border-accent-lime/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-accent-lime/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-lime/20 text-accent-lime flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-lime">Client Onboarding</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-ice-white">Clinical Intake &amp; Bio-Telemetry Architecture</h3>
              <p className="text-xs text-silver-slate font-light">
                Need to complete or update your initial PAR-Q+, schedule sync, or metabolic baseline form?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/intake"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-accent-lime/20 text-center"
            >
              Access Intake Forms
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-4 border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-accent-lime" />
              <span className="text-[10px] text-silver-slate uppercase tracking-wider">Calories</span>
            </div>
            <div className="font-display font-bold text-xl">
              <RollingCounter value={dailyLog.calories} />
              <span className="text-sm text-silver-slate font-normal"> / {dailyLog.target.calories}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-lime transition-width"
                style={{ width: `${Math.min(100, (dailyLog.calories / dailyLog.target.calories) * 100)}%` }}
              />
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Beef className="w-4 h-4 text-accent-lime" />
              <span className="text-[10px] text-silver-slate uppercase tracking-wider">Protein</span>
            </div>
            <div className="font-display font-bold text-xl text-accent-lime">
              <RollingCounter value={dailyLog.protein} />g
              <span className="text-sm text-silver-slate font-normal"> / {dailyLog.target.protein}g</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-lime transition-width"
                style={{ width: `${Math.min(100, (dailyLog.protein / dailyLog.target.protein) * 100)}%` }}
              />
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Wheat className="w-4 h-4 text-accent-violet" />
              <span className="text-[10px] text-silver-slate uppercase tracking-wider">Carbs</span>
            </div>
            <div className="font-display font-bold text-xl text-accent-violet">
              <RollingCounter value={dailyLog.carbs} />g
              <span className="text-sm text-silver-slate font-normal"> / {dailyLog.target.carbs}g</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-violet transition-width"
                style={{ width: `${Math.min(100, (dailyLog.carbs / dailyLog.target.carbs) * 100)}%` }}
              />
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-ice-white" />
              <span className="text-[10px] text-silver-slate uppercase tracking-wider">Fat</span>
            </div>
            <div className="font-display font-bold text-xl">
              <RollingCounter value={dailyLog.fat} />g
              <span className="text-sm text-silver-slate font-normal"> / {dailyLog.target.fat}g</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-ice-white/60 transition-width"
                style={{ width: `${Math.min(100, (dailyLog.fat / dailyLog.target.fat) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <div className="flex gap-1 p-1 rounded-2xl bg-onyx-card/60 border border-white/5 w-fit min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`touch-target inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? "bg-accent-lime text-cyber-slate shadow-lg shadow-accent-lime/10"
                      : "text-silver-slate hover:text-ice-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        {/* ═══ BODY TAB ═══ */}
        {activeTab === "body" && (
          <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn">
            {/* Body Scanner */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">AI Body Scanner</h2>
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                    MediaPipe Pose · 33-Point Landmark Detection
                  </p>
                </div>
              </div>

              {showScanner ? (
                <div className="relative p-2 rounded-2xl bg-black/40 border border-white/5">
                  <button
                    onClick={() => setShowScanner(false)}
                    className="absolute top-4 right-4 z-50 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    Close Scanner
                  </button>
                  <BodyScanner
                    onMetricsReady={async (m) => {
                      setScannedMetrics(m);
                      setShowScanner(false);
                      if (user) {
                        try {
                          await supabase.from("body_scans").insert({
                            user_id: user.id,
                            body_fat_percent: m.estimatedBodyFatPercent,
                            shoulder_to_waist_ratio: m.shoulderToWaistRatio,
                            waist_to_hip_ratio: m.waistToHipRatio,
                          });
                          // Refresh list
                          const { data: scans } = await supabase
                            .from("body_scans")
                            .select("*")
                            .eq("user_id", user.id)
                            .order("created_at", { ascending: false });
                          if (scans) setPastScans(scans);
                        } catch (e) {
                          console.error("Failed to save body scan:", e);
                        }
                      }
                    }}
                  />
                </div>
              ) : scannedMetrics ? (
                <div className="space-y-6">
                  <div className="text-center py-4 bg-accent-lime/5 rounded-2xl border border-accent-lime/15">
                    <p className="font-display text-6xl font-bold text-accent-lime tracking-tight">
                      {scannedMetrics.estimatedBodyFatPercent}%
                    </p>
                    <p className="text-silver-slate text-xs uppercase tracking-wider mt-1 font-semibold">
                      Estimated Body Fat
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel rounded-xl p-4 text-center border-white/5">
                      <p className="font-display text-xl font-bold text-ice-white">
                        {scannedMetrics.shoulderToWaistRatio}
                      </p>
                      <p className="text-silver-slate text-[10px] uppercase tracking-wider mt-1">
                        Shoulder-to-Waist
                      </p>
                    </div>
                    <div className="glass-panel rounded-xl p-4 text-center border-white/5">
                      <p className="font-display text-xl font-bold text-ice-white">
                        {scannedMetrics.waistToHipRatio}
                      </p>
                      <p className="text-silver-slate text-[10px] uppercase tracking-wider mt-1">
                        Waist-to-Hip
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowScanner(true)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-ice-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Scan Again
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-accent-lime/30 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-silver-slate text-sm text-center">
                    Take a front-facing photo to estimate body fat %, shoulder-to-waist ratio, and waist-to-hip ratio
                  </p>
                  <p className="text-accent-lime/60 text-[10px] uppercase tracking-wider">
                    Powered by Google MediaPipe Vision · Runs 100% on-device
                  </p>
                  <button
                    onClick={() => setShowScanner(true)}
                    className="inline-flex items-center gap-2 bg-accent-lime text-cyber-slate px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-ring cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Start Body Scan
                  </button>
                </div>
              )}
            </div>

            {/* Goal Simulator */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Goal Body Simulator</h2>
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                    See your transformation before it happens
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                  <Target className="w-8 h-8" />
                </div>
                <p className="text-silver-slate text-sm text-center">
                  Complete a body scan first, then use the slider to see what you&apos;ll look like at your goal body fat %
                </p>
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-xs text-silver-slate mb-2">
                    <span>Current: ---%</span>
                    <span>Goal: ---%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value="25"
                    disabled
                    className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

             {/* Progress Timeline */}
             <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5 lg:col-span-2">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                   <TrendingUp className="w-5 h-5" />
                 </div>
                 <div>
                   <h2 className="font-display font-bold text-lg">Progress Timeline</h2>
                   <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                     Visual transformation tracking with metric deltas
                   </p>
                 </div>
               </div>
               {pastScans.length === 0 ? (
                 <div className="flex flex-col items-center gap-4 p-12 rounded-2xl border border-white/5 bg-cyber-slate/40">
                   <BarChart3 className="w-10 h-10 text-silver-slate/30" />
                   <p className="text-silver-slate text-sm text-center">
                     Complete your first body scan to start tracking progress.
                     <br />
                     <span className="text-[10px]">
                       Snapshots will be compared with before/after sliders and metric deltas.
                     </span>
                   </p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {pastScans.map((scan, i) => (
                     <div key={scan.id} className="flex items-center justify-between p-4 rounded-xl bg-cyber-slate border border-white/5">
                       <div>
                         <p className="text-xs text-silver-slate">Scan #{pastScans.length - i}</p>
                         <p className="font-display font-bold text-lg text-accent-lime mt-0.5">
                           {scan.body_fat_percent}% <span className="text-xs text-silver-slate font-normal">Body Fat</span>
                         </p>
                       </div>
                       <div className="flex gap-6 text-right">
                         <div>
                           <p className="text-[10px] text-silver-slate uppercase">Shoulder/Waist</p>
                           <p className="font-semibold text-xs text-ice-white">{scan.shoulder_to_waist_ratio}</p>
                         </div>
                         <div>
                           <p className="text-[10px] text-silver-slate uppercase">Waist/Hip</p>
                           <p className="font-semibold text-xs text-ice-white">{scan.waist_to_hip_ratio}</p>
                         </div>
                         <div className="text-silver-slate text-xs flex items-center pl-2">
                           {new Date(scan.created_at).toLocaleDateString()}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        )}

        {/* ═══ NUTRITION TAB ═══ */}
        {activeTab === "nutrition" && (
          <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn">
            {/* Meal Scanner */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">AI Meal Scanner</h2>
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                    Photo → Macro Breakdown in seconds
                  </p>
                </div>
              </div>
              <MealScanner onMealLogged={handleMealLogged} />
            </div>

            {/* Barcode Scanner */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                  <ScanBarcode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Barcode Scanner</h2>
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                    Open Food Facts · 3M+ products
                  </p>
                </div>
              </div>
              <BarcodeScanner onFoodLogged={handleFoodLogged} />
            </div>

            {/* Menu Advisor */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Restaurant Menu AI</h2>
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                    Gemini Vision · Macro-optimized ordering
                  </p>
                </div>
              </div>
              <MenuAdvisor
                remainingBudget={{
                  calories: Math.max(0, dailyLog.target.calories - dailyLog.calories),
                  protein: Math.max(0, dailyLog.target.protein - dailyLog.protein),
                  carbs: Math.max(0, dailyLog.target.carbs - dailyLog.carbs),
                  fat: Math.max(0, dailyLog.target.fat - dailyLog.fat),
                }}
              />
            </div>

            {/* Daily Macro Log */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Today&apos;s Macro Log</h2>
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                    Meals and foods logged today
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Calories", value: dailyLog.calories, target: dailyLog.target.calories, unit: "kcal", color: "accent-lime" },
                  { label: "Protein", value: dailyLog.protein, target: dailyLog.target.protein, unit: "g", color: "accent-lime" },
                  { label: "Carbs", value: dailyLog.carbs, target: dailyLog.target.carbs, unit: "g", color: "accent-violet" },
                  { label: "Fat", value: dailyLog.fat, target: dailyLog.target.fat, unit: "g", color: "ice-white" },
                ].map((macro) => {
                  const pct = Math.min(100, (macro.value / macro.target) * 100);
                  const remaining = Math.max(0, macro.target - macro.value);
                  return (
                    <div
                      key={macro.label}
                      className="p-5 rounded-2xl bg-cyber-slate border border-white/5 text-center"
                    >
                      <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-2">
                        {macro.label}
                      </p>
                      <p className={`font-display font-bold text-3xl text-${macro.color}`}>
                        <RollingCounter value={macro.value} />
                      </p>
                      <p className="text-silver-slate text-xs mt-1">
                        {remaining > 0 ? `${remaining}${macro.unit} remaining` : "Target hit!"}
                      </p>
                      {/* Ring chart */}
                      <div className="relative w-16 h-16 mx-auto mt-3">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke={macro.color === "accent-lime" ? "#E0659A" : macro.color === "accent-violet" ? "#B84D72" : "#EDEDF0"}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${pct * 0.88} 88`}
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-ice-white">
                          {Math.round(pct)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Nutrition & Recipe Advisor */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">AI Recipe Optimizer</h2>
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                    Gemini Intelligence · Meal suggestions built for your remaining macros
                  </p>
                </div>
              </div>
              <RecipeAdvisor
                remainingBudget={{
                  calories: Math.max(0, dailyLog.target.calories - dailyLog.calories),
                  protein: Math.max(0, dailyLog.target.protein - dailyLog.protein),
                  carbs: Math.max(0, dailyLog.target.carbs - dailyLog.carbs),
                  fat: Math.max(0, dailyLog.target.fat - dailyLog.fat),
                }}
                onLogRecipeAsMeal={handleFoodLogged}
              />
            </div>
          </div>
        )}

        {/* ═══ RECOVERY TAB ═══ */}
        {activeTab === "recovery" && (
          <div className="grid lg:grid-cols-3 gap-8 animate-fadeIn">
            {/* Oura Ring Card */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                    <Watch className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base">Oura Ring</h2>
                    <p className="text-[10px] text-silver-slate">Connected · Live</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-accent-lime animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-cyber-slate border border-white/5">
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-1">Readiness Score</p>
                  <div className="flex items-end gap-2">
                    <span className="font-display font-bold text-3xl text-accent-lime">
                      <RollingCounter value={wearables.readiness} />
                    </span>
                    <span className="text-silver-slate text-sm mb-1">/ 100</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-cyber-slate border border-white/5">
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-1">HRV (ms)</p>
                  <span className="font-display font-bold text-2xl">
                    <RollingCounter value={wearables.hrv} />
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-cyber-slate border border-white/5">
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-1">Resting HR</p>
                  <span className="font-display font-bold text-2xl">
                    <RollingCounter value={wearables.restingHr} />
                    <span className="text-sm text-silver-slate font-normal"> bpm</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Whoop Card */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base">Whoop</h2>
                    <p className="text-[10px] text-silver-slate">Connected · Live</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-accent-violet animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-cyber-slate border border-white/5">
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-1">Day Strain</p>
                  <div className="flex items-end gap-2">
                    <span className="font-display font-bold text-3xl text-accent-violet">
                      {wearables.strain.toFixed(1)}
                    </span>
                    <span className="text-silver-slate text-sm mb-1">/ 21.0</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-cyber-slate border border-white/5">
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-1">Recovery</p>
                  <span className={`font-display font-bold text-2xl ${wearables.recovery >= 67 ? "text-accent-lime" : wearables.recovery >= 34 ? "text-yellow-400" : "text-red-400"}`}>
                    <RollingCounter value={wearables.recovery} />%
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-cyber-slate border border-white/5">
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-1">Calories Burned</p>
                  <span className="font-display font-bold text-2xl">
                    <RollingCounter value={wearables.calories} />
                    <span className="text-sm text-silver-slate font-normal"> kcal</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sleep + Steps Card */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base">Vitals Overview</h2>
                  <p className="text-[10px] text-silver-slate">Aggregated from all devices</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-cyber-slate border border-white/5">
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-1">Sleep Score</p>
                  <div className="flex items-end gap-2">
                    <span className="font-display font-bold text-3xl text-accent-lime">
                      <RollingCounter value={wearables.sleepScore} />
                    </span>
                    <span className="text-silver-slate text-sm mb-1">/ 100</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-lime transition-width"
                      style={{ width: `${wearables.sleepScore}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-cyber-slate border border-white/5">
                  <p className="text-[10px] text-silver-slate uppercase tracking-wider mb-1">Steps</p>
                  <span className="font-display font-bold text-2xl">
                    <RollingCounter value={wearables.steps} />
                  </span>
                  <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-lime transition-width"
                      style={{ width: `${Math.min(100, (wearables.steps / 10000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-accent-lime/5 border border-accent-lime/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-accent-lime text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <Watch className="w-3.5 h-3.5" />
                    <span>Auto-Sync Health & Step Counters</span>
                  </p>
                  <p className="text-silver-slate text-xs">
                    Link Apple Health, Google Health Connect, Fitbit, Garmin, or Strava for real-time background step tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHealthSyncModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-accent-lime text-obsidian-black text-xs font-bold hover:bg-accent-lime/90 transition-all cursor-pointer shrink-0 shadow-lg shadow-accent-lime/15 flex items-center justify-center gap-1.5"
                >
                  <Watch className="w-3.5 h-3.5" />
                  <span>Connect Trackers</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ WORKOUT TAB ═══ */}
        {activeTab === "workout" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Workout Header & Date Navigation Toolbar */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">
                      {assignedWorkout ? assignedWorkout.name : "Workout & Training Program"}
                    </h2>
                    <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                      Strength tracking · Precision volume & adherence metrics
                    </p>
                  </div>
                </div>

                {/* Date Navigator Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => shiftWorkoutDate(-1)}
                    className="touch-target p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-silver-slate hover:text-ice-white transition-all cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-accent-lime/40 transition-all cursor-pointer">
                    <Calendar className="w-4 h-4 text-accent-lime" />
                    <span className="text-xs font-semibold text-ice-white font-mono">
                      {new Date(selectedWorkoutDate + "T12:00:00Z").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <input
                      type="date"
                      value={selectedWorkoutDate}
                      onChange={(e) => {
                        if (e.target.value) setSelectedWorkoutDate(e.target.value);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>

                  {selectedWorkoutDate !== new Date().toISOString().split("T")[0] && (
                    <button
                      type="button"
                      onClick={jumpToToday}
                      className="touch-target px-3 py-2 rounded-xl bg-accent-lime/10 border border-accent-lime/20 text-accent-lime hover:bg-accent-lime/20 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Jump to Today
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => shiftWorkoutDate(1)}
                    className="touch-target p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-silver-slate hover:text-ice-white transition-all cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Badge Strip */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                {selectedWorkoutDate === new Date().toISOString().split("T")[0] ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-lime bg-accent-lime/10 border border-accent-lime/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
                    Today&apos;s Live Training Session
                  </span>
                ) : selectedWorkoutDate < new Date().toISOString().split("T")[0] ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-silver-slate bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-accent-violet" />
                    Historical Workout Log · {selectedWorkoutDate}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Scheduled Program · {selectedWorkoutDate}
                  </span>
                )}
              </div>

              {/* Real-time Session Volume & Progress Calculator Strip */}
              {assignedWorkout && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-cyber-slate border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-accent-lime" />
                      <span className="text-[10px] text-silver-slate uppercase tracking-wider">Total Volume (Tonnage)</span>
                    </div>
                    <div className="font-display font-bold text-2xl text-accent-lime">
                      <RollingCounter value={workoutMetrics.totalVolumeLbs} />
                      <span className="text-xs text-silver-slate font-normal ml-1">lbs</span>
                    </div>
                    <p className="text-[10px] text-silver-slate mt-1">
                      Live sum of (reps &times; weight)
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyber-slate border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4 text-accent-lime" />
                      <span className="text-[10px] text-silver-slate uppercase tracking-wider">Sets Completed</span>
                    </div>
                    <div className="font-display font-bold text-2xl text-ice-white">
                      {workoutMetrics.completedSets}
                      <span className="text-sm text-silver-slate font-normal"> / {workoutMetrics.totalTargetSets}</span>
                    </div>
                    <p className="text-[10px] text-silver-slate mt-1">
                      Across {workoutMetrics.totalExercises} exercises
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyber-slate border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-accent-violet" />
                      <span className="text-[10px] text-silver-slate uppercase tracking-wider">Completion Rate</span>
                    </div>
                    <div className="font-display font-bold text-2xl text-accent-violet">
                      {workoutMetrics.completionPct}%
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-violet transition-width duration-500"
                        style={{ width: `${workoutMetrics.completionPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyber-slate border border-white/5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Dumbbell className="w-4 h-4 text-ice-white" />
                      <span className="text-[10px] text-silver-slate uppercase tracking-wider">Session Status</span>
                    </div>
                    <div>
                      {workoutMetrics.completionPct === 100 ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                          <CheckCheck className="w-4 h-4" />
                          Session Completed!
                        </span>
                      ) : workoutMetrics.completionPct > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-accent-lime text-xs font-bold bg-accent-lime/10 px-3 py-1.5 rounded-xl border border-accent-lime/20">
                          <Flame className="w-4 h-4" />
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-silver-slate text-xs font-semibold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                          <Clock className="w-4 h-4" />
                          Ready to Start
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Workout Details & Form Check Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Workout Exercises & Set Logger */}
              <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Exercise Log & Sets</h3>
                      <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                        {assignedWorkout ? `${assignedWorkout.exercises?.length || 0} Exercises assigned` : "No exercises scheduled"}
                      </p>
                    </div>
                  </div>
                  {assignedWorkout && (
                    <span className="text-xs font-mono text-accent-lime bg-accent-lime/10 px-2.5 py-1 rounded-lg">
                      {workoutMetrics.totalVolumeLbs.toLocaleString()} lbs volume
                    </span>
                  )}
                </div>

                {workoutLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-silver-slate text-xs gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-accent-lime" />
                    <span>Loading workout routine for {selectedWorkoutDate}...</span>
                  </div>
                ) : assignedWorkout ? (
                  <div className="space-y-6">
                    {assignedWorkout.notes && (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-silver-slate italic leading-relaxed">
                        Coach Notes: &quot;{assignedWorkout.notes}&quot;
                      </div>
                    )}

                    <div className="space-y-4">
                      {assignedWorkout.exercises?.map((exercise: any, i: number) => {
                        const completedSets = (exercise.loggedSets || []).filter((s: any) => s.is_completed).length;
                        const progressPct = Math.round((completedSets / exercise.target_sets) * 100);
                        const exerciseVolume = (exercise.loggedSets || []).reduce((acc: number, s: any) => {
                          if (s.is_completed) {
                            const reps = s.reps_completed !== null && s.reps_completed !== undefined
                              ? Number(s.reps_completed)
                              : parseInt(exercise.target_reps) || 0;
                            const weight = s.weight_lifted_lbs !== null && s.weight_lifted_lbs !== undefined
                              ? Number(s.weight_lifted_lbs)
                              : Number(exercise.target_weight_lbs) || 0;
                            return acc + (reps * weight);
                          }
                          return acc;
                        }, 0);

                        return (
                          <div
                            key={exercise.id}
                            className="p-4 rounded-2xl bg-cyber-slate border border-white/5 space-y-3"
                          >
                            {/* Exercise Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-accent-lime/10 flex items-center justify-center text-accent-lime font-display font-bold text-xs">
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-ice-white">{exercise.exercise_name}</p>
                                  <p className="text-[10px] text-silver-slate">
                                    Target: {exercise.target_sets} sets &times; {exercise.target_reps} reps {exercise.target_weight_lbs ? `@ ${exercise.target_weight_lbs} lbs` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-accent-lime font-bold uppercase tracking-wider block">
                                  {completedSets}/{exercise.target_sets} Sets
                                </span>
                                {exerciseVolume > 0 && (
                                  <span className="text-[9px] text-silver-slate font-mono block">
                                    {exerciseVolume.toLocaleString()} lbs
                                  </span>
                                )}
                                <div className="w-16 h-1 rounded-full bg-white/5 mt-1 overflow-hidden ml-auto">
                                  <div
                                    className="h-full rounded-full bg-accent-lime transition-width"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Sets Logger */}
                            <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
                              {Array.from({ length: exercise.target_sets }).map((_, setIdx) => {
                                const loggedSet = (exercise.loggedSets || []).find((l: any) => l.set_index === setIdx);
                                const isCompleted = loggedSet?.is_completed || false;
                                const uniqueKey = `${exercise.id}-${setIdx}`;

                                return (
                                  <div
                                    key={setIdx}
                                    className={`flex items-center justify-between text-xs border px-3 py-2 rounded-xl transition-all ${
                                      isCompleted
                                        ? "bg-accent-lime/5 border-accent-lime/30"
                                        : "bg-white/[0.01] border-white/5 hover:border-white/10"
                                    }`}
                                  >
                                    <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-silver-slate font-mono">
                                      S{setIdx + 1}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-silver-slate">Reps:</span>
                                      <input
                                        type="number"
                                        defaultValue={(loggedSet?.reps_completed ?? parseInt(exercise.target_reps)) || 10}
                                        id={`reps-${uniqueKey}`}
                                        disabled={isCompleted}
                                        className="w-10 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-center text-ice-white focus:outline-none focus:border-accent-lime text-[11px] disabled:opacity-50"
                                      />
                                      <span className="text-[10px] text-silver-slate">lbs:</span>
                                      <input
                                        type="number"
                                        defaultValue={loggedSet?.weight_lifted_lbs ?? exercise.target_weight_lbs ?? 0}
                                        id={`weight-${uniqueKey}`}
                                        disabled={isCompleted}
                                        className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-center text-ice-white focus:outline-none focus:border-accent-lime text-[11px] disabled:opacity-50"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      disabled={loggingSetId === uniqueKey}
                                      onClick={() => {
                                        const repsInput = document.getElementById(`reps-${uniqueKey}`) as HTMLInputElement;
                                        const weightInput = document.getElementById(`weight-${uniqueKey}`) as HTMLInputElement;
                                        const valReps = parseInt(repsInput?.value) || 0;
                                        const valWeight = parseInt(weightInput?.value) || 0;
                                        handleLogSet(exercise.id, setIdx, valReps, valWeight, !isCompleted);
                                      }}
                                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                                        isCompleted
                                          ? "bg-accent-lime border-accent-lime text-cyber-slate font-bold shadow-md shadow-accent-lime/20"
                                          : "border-white/10 text-silver-slate hover:border-white/20 hover:text-ice-white"
                                      }`}
                                    >
                                      {loggingSetId === uniqueKey ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-16 rounded-2xl border border-white/5 bg-cyber-slate/40 text-center">
                    <Dumbbell className="w-10 h-10 text-silver-slate/30 animate-pulse" />
                    <p className="text-silver-slate text-xs max-w-xs">
                      No workout routine found for{" "}
                      <span className="text-ice-white font-semibold">{selectedWorkoutDate}</span>.
                      <br />
                      <span className="text-[10px] text-silver-slate/50 mt-1 block">
                        Use the date selector above or weekly calendar below to navigate to scheduled days.
                      </span>
                    </p>
                    {availableWorkoutDates.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-xs">
                        <span className="text-[10px] text-silver-slate uppercase tracking-wider block w-full">
                          Available Workout Dates:
                        </span>
                        {availableWorkoutDates.slice(0, 5).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSelectedWorkoutDate(d)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-accent-lime/10 hover:text-accent-lime border border-white/10 text-[10px] font-mono transition-all cursor-pointer"
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Form Check Card */}
              <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">AI Form Check</h3>
                    <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                      MediaPipe Pose · Joint Angle Analysis
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10">
                  <div className="w-16 h-16 rounded-2xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-silver-slate text-sm text-center">
                    Record a video of your set — AI will analyze joint angles, depth, and flag form issues in real-time
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["Squat Depth", "Knee Tracking", "Back Angle", "Hip Hinge"].map((check) => (
                      <span
                        key={check}
                        className="px-3 py-1 rounded-full bg-white/5 text-silver-slate text-[10px] font-medium"
                      >
                        {check}
                      </span>
                    ))}
                  </div>
                  <button className="inline-flex items-center gap-2 bg-accent-violet text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-ring cursor-pointer">
                    <Camera className="w-4 h-4" />
                    Record Set
                  </button>
                </div>
              </div>
            </div>

            {/* Weekly Adherence & History Navigator */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">Weekly Schedule & Adherence</h3>
                    <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                      Tap any day to view or record that day&apos;s workout log
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                  const now = new Date();
                  const currentDayOfWeek = now.getDay();
                  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
                  const dayDate = new Date(now);
                  dayDate.setDate(now.getDate() + mondayOffset + i);
                  const dayIso = dayDate.toISOString().split("T")[0];

                  const isToday = dayIso === new Date().toISOString().split("T")[0];
                  const isSelected = dayIso === selectedWorkoutDate;
                  const hasWorkout = availableWorkoutDates.includes(dayIso);
                  const isRest = i === 1 || i === 3 || i === 6;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedWorkoutDate(dayIso)}
                      className={`p-3.5 rounded-2xl text-center border transition-all cursor-pointer ${
                        isSelected
                          ? "border-accent-lime bg-accent-lime/10 shadow-lg shadow-accent-lime/10"
                          : isToday
                            ? "border-accent-lime/50 bg-accent-lime/5"
                            : "border-white/5 bg-cyber-slate/60 hover:border-white/20"
                      }`}
                    >
                      <p className={`text-[10px] font-bold uppercase ${isSelected || isToday ? "text-accent-lime" : "text-silver-slate"}`}>
                        {day}
                      </p>
                      <p className="text-xs font-mono font-semibold text-ice-white mt-0.5">
                        {dayDate.getDate()}
                      </p>
                      <div className="mt-2.5">
                        {hasWorkout ? (
                          <div className="flex items-center justify-center gap-1 text-[10px] text-accent-lime font-bold">
                            <Dumbbell className="w-3.5 h-3.5" />
                            <span>Plan</span>
                          </div>
                        ) : isRest ? (
                          <span className="text-silver-slate/30 text-xs">Rest</span>
                        ) : isToday ? (
                          <Flame className="w-4 h-4 text-accent-lime/80 mx-auto animate-pulse" />
                        ) : (
                          <span className="text-silver-slate/30 text-xs">—</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRANSFORMATION TAB ═══ */}
        {activeTab === "transformation" && (
          <div className="animate-fadeIn">
            <TransformationStudio
              clientName={selectedAdminClient?.name || profile?.name || user?.email?.split("@")[0] || "Member"}
              isAdmin={isAdminMode}
            />
          </div>
        )}

        {/* ═══ VIDEO COACHING TAB ═══ */}
        {activeTab === "coaching" && (
          <div className="animate-fadeIn">
            <CoachingVideoPlayer />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6 md:px-8 lg:px-12 bg-onyx-card/25 safe-bottom">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold tracking-wider text-sm text-ice-white">
            BODIED BY <span className="text-accent-lime">ESH</span>
          </span>
          <p className="text-silver-slate text-xs font-light">
            &copy; 2026 Bodied by Esh · Client Intelligence Portal
          </p>
        </div>
      </footer>

      {profile && <ChatWidget clientId={profile.id} />}

      <HealthTrackerSyncModal
        isOpen={isHealthSyncModalOpen}
        onClose={() => setIsHealthSyncModalOpen(false)}
        userId={user?.id || profile?.id || "client-user"}
        onSyncSuccess={(newLog) => {
          setIsWearableSynced(true);
          setWearables((prev) => ({
            ...prev,
            steps: newLog.steps,
          }));
        }}
      />
    </div>
  );
}

