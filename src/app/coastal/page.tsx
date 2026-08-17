"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Footprints,
  BookOpen,
  Trophy,
  Users,
  MessageSquare,
  Award,
  Sparkles,
  ShieldCheck,
  Flame,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  HeartHandshake,
  X,
} from "lucide-react";
import {
  GroupStats,
  GroupMember,
  StepLog,
  UserStreak,
  IndividualMilestone,
  GroupMilestone,
  DevotionalReflection,
  CommunityEncouragement,
} from "@/types/coastal";
import {
  getGroupStats,
  getStepLogs,
  getUserStreak,
  getGroupLeaderboard,
  getCommunityFeed,
  joinGroup,
} from "@/lib/coastal/db";
import { evaluateIndividualMilestones } from "@/lib/coastal/milestones-data";
import {
  CoastalHero,
  CoastalAuthModal,
  StepTracker,
  ScriptureCard,
  GroupProgress,
  Leaderboard,
  EncouragementFeed,
  MilestoneModal,
} from "@/components/coastal";

function getToastIcon(iconName?: string) {
  switch (iconName?.toLowerCase()) {
    case "footprints":
      return <Footprints className="w-4 h-4" />;
    case "bookopen":
      return <BookOpen className="w-4 h-4" />;
    case "hearthandshake":
      return <HeartHandshake className="w-4 h-4" />;
    case "award":
      return <Award className="w-4 h-4" />;
    case "trophy":
      return <Trophy className="w-4 h-4" />;
    case "flame":
      return <Flame className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
}

function CoastalPortalContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const joinedParam = searchParams.get("joined");

  // Navigation state
  const [activeTab, setActiveTab] = useState<"tracker" | "devotional" | "journey" | "leaderboard" | "feed">(
    tabParam === "devotional"
      ? "devotional"
      : tabParam === "journey"
      ? "journey"
      : tabParam === "leaderboard"
      ? "leaderboard"
      : tabParam === "feed"
      ? "feed"
      : "tracker"
  );

  // Auth & Member state
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [member, setMember] = useState<GroupMember | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"magiclink" | "signin" | "signup">("magiclink");

  // Milestone modal state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [celebrateMilestone, setCelebrateMilestone] = useState<IndividualMilestone | GroupMilestone | null>(null);

  // Group & Step data state
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [stepLogs, setStepLogs] = useState<StepLog[]>([]);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string; iconName?: string } | null>(null);

  // Synchronize tab parameter if URL changes
  useEffect(() => {
    if (tabParam && ["tracker", "devotional", "journey", "leaderboard", "feed"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Detect Supabase user on client mount
  useEffect(() => {
    async function checkAuthAndLoadData() {
      setIsLoading(true);
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        let currentUserId = "guest-user";
        let authenticatedUser: any = null;

        if (url && key) {
          try {
            const { createBrowserClient } = await import("@supabase/ssr");
            const supabase = createBrowserClient(url, key);
            const { data: { user: sbUser } } = await supabase.auth.getUser();

            if (sbUser) {
              authenticatedUser = {
                id: sbUser.id,
                email: sbUser.email,
                name: sbUser.user_metadata?.full_name || sbUser.email?.split("@")[0],
              };
              currentUserId = sbUser.id;
              setUser(authenticatedUser);

              // Auto-join group #3266 if coming from join redirect or new session
              const joinRes = await joinGroup(sbUser.id, "coastal", authenticatedUser.name, false, supabase);
              if (joinRes.success && joinRes.member) {
                setMember(joinRes.member);
              }
            }
          } catch (authErr) {
            console.warn("Supabase auth resolution notice:", authErr);
          }
        }

        // Fetch stats, step logs, and streak
        const [statsData, logsData, streakData] = await Promise.all([
          getGroupStats("3266-coastal-church"),
          getStepLogs(currentUserId, "3266-coastal-church"),
          getUserStreak(currentUserId, "3266-coastal-church"),
        ]);

        setGroupStats(statsData);
        setStepLogs(logsData);
        setUserStreak(streakData);
      } catch (err) {
        console.warn("Data loading notice:", err);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthAndLoadData();
  }, [joinedParam]);

  // Handle successful login
  const handleAuthSuccess = (authUser: any, memberRecord?: GroupMember) => {
    setUser({
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
    });
    if (memberRecord) {
      setMember(memberRecord);
    }
    setToastMessage({
      title: "Welcome to Coastal Community Church!",
      subtitle: "Successfully linked to Group #3266.",
      iconName: "ShieldCheck",
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Step log added callback with automatic milestone evaluation and celebratory modal
  const handleStepLogAdded = (newLog: StepLog, updatedStreak?: UserStreak) => {
    const prevUnlockedKeys = evaluateIndividualMilestones(
      stepLogs,
      userStreak?.current_streak || 0
    ).unlocked.map((m) => m.key);

    const updatedLogs = [
      newLog,
      ...stepLogs.filter((l) => l.log_date !== newLog.log_date && l.id !== newLog.id),
    ].sort((a, b) => b.log_date.localeCompare(a.log_date));

    setStepLogs(updatedLogs);

    const effectiveStreak = updatedStreak || userStreak;
    if (updatedStreak) {
      setUserStreak(updatedStreak);
    }

    // Refresh collective group stats
    getGroupStats("3266-coastal-church").then((updated) => setGroupStats(updated));

    // Evaluate for new individual milestone unlock
    const newEvaluation = evaluateIndividualMilestones(
      updatedLogs,
      effectiveStreak?.current_streak || 0
    );
    const newlyUnlocked = newEvaluation.unlocked.find(
      (m) => !prevUnlockedKeys.includes(m.key)
    );

    if (newlyUnlocked) {
      setCelebrateMilestone(newlyUnlocked);
      setIsMilestoneModalOpen(true);
      setToastMessage({
        title: `Faith Milestone Unlocked: ${newlyUnlocked.title}`,
        subtitle: newlyUnlocked.description,
        iconName: newlyUnlocked.icon_name,
      });
    } else {
      setToastMessage({
        title: `Logged ${newLog.steps.toLocaleString()} steps!`,
        subtitle: `${newLog.distance_miles} miles added to Coastal church journey.`,
        iconName: "Footprints",
      });
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Reflection saved callback
  const handleReflectionSaved = (reflection: DevotionalReflection) => {
    setToastMessage({
      title: "Devotional Journal Saved!",
      subtitle: `Day ${reflection.day_number || "walk"} reflection recorded securely.`,
      iconName: "BookOpen",
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Post created callback
  const handlePostCreated = (post: CommunityEncouragement) => {
    setToastMessage({
      title: "Encouragement Note Shared!",
      subtitle: "Your message is visible to the church community.",
      iconName: "HeartHandshake",
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="relative min-h-screen bg-cyber-slate text-ice-white selection:bg-accent-lime selection:text-cyber-slate flex flex-col justify-between overflow-x-hidden safe-x">
      <div>
        {/* Global Navigation Header */}
        <Header />

        {/* Floating Toast Notification Banner */}
        {toastMessage && (
          <aside
            aria-label="Notification"
            className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] sm:w-auto p-4 rounded-2xl glass-panel-lime border border-accent-lime/40 bg-[#0E0E14]/95 shadow-2xl shadow-black/80 flex items-start gap-3 animate-slideInRight"
          >
            <div className="p-2 rounded-xl bg-accent-lime/15 text-accent-lime shrink-0">
              {getToastIcon(toastMessage.iconName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-ice-white font-display truncate">
                {toastMessage.title}
              </div>
              {toastMessage.subtitle && (
                <div className="text-xs text-silver-slate mt-0.5 line-clamp-2">
                  {toastMessage.subtitle}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-silver-slate hover:text-ice-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </aside>
        )}

        {/* Hero Section */}
        <CoastalHero
          stats={groupStats}
          user={user}
          member={member}
          isGuest={!user || user.id === "guest-user"}
          onJoinClick={() => {
            setAuthModalMode("magiclink");
            setIsAuthModalOpen(true);
          }}
          onAuthClick={() => {
            setAuthModalMode("signin");
            setIsAuthModalOpen(true);
          }}
          onLogStepsClick={() => setActiveTab("tracker")}
          onDevotionalClick={() => setActiveTab("devotional")}
        />

        {/* Main Interactive Portal Navigation Bar */}
        <div className="sticky top-0 z-30 bg-cyber-slate/90 backdrop-blur-md border-y border-white/10">
          <div className="page-container py-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              <button
                type="button"
                onClick={() => setActiveTab("tracker")}
                className={`touch-target whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "tracker"
                    ? "bg-accent-lime text-cyber-slate shadow-sm"
                    : "glass-panel text-silver-slate hover:text-ice-white hover:border-white/20"
                }`}
              >
                <Footprints className="w-4 h-4" />
                <span>Step & Streak Tracker</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("devotional")}
                className={`touch-target whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "devotional"
                    ? "bg-accent-lime text-cyber-slate shadow-sm"
                    : "glass-panel text-silver-slate hover:text-ice-white hover:border-white/20"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Walking by Faith Devotional</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("journey")}
                className={`touch-target whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "journey"
                    ? "bg-accent-lime text-cyber-slate shadow-sm"
                    : "glass-panel text-silver-slate hover:text-ice-white hover:border-white/20"
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Church Journey & Milestones</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("leaderboard")}
                className={`touch-target whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "leaderboard"
                    ? "bg-accent-lime text-cyber-slate shadow-sm"
                    : "glass-panel text-silver-slate hover:text-ice-white hover:border-white/20"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("feed")}
                className={`touch-target whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "feed"
                    ? "bg-accent-lime text-cyber-slate shadow-sm"
                    : "glass-panel text-silver-slate hover:text-ice-white hover:border-white/20"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Encouragement Wall</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCelebrateMilestone(null);
                  setIsMilestoneModalOpen(true);
                }}
                className="touch-target ml-auto whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold glass-panel border border-accent-lime/30 text-accent-lime hover:bg-accent-lime/10 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>View Faith Badges</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Panels */}
        <div className="page-container py-8 sm:py-12">
          {activeTab === "tracker" && (
            <div className="space-y-8">
              <StepTracker
                userId={user?.id || "guest-user"}
                groupId="3266-coastal-church"
                isAuthenticated={Boolean(user && user.id !== "guest-user")}
                initialLogs={stepLogs}
                initialStreak={userStreak}
                onLogAdded={handleStepLogAdded}
                onOpenAuthModal={() => {
                  setAuthModalMode("signin");
                  setIsAuthModalOpen(true);
                }}
              />
            </div>
          )}

          {activeTab === "devotional" && (
            <div className="space-y-8">
              <ScriptureCard
                userId={user?.id || "guest-user"}
                groupId="3266-coastal-church"
                onReflectionSaved={handleReflectionSaved}
              />
            </div>
          )}

          {activeTab === "journey" && (
            <div className="space-y-8">
              <GroupProgress
                stats={groupStats}
                onRefresh={() => getGroupStats("3266-coastal-church").then(setGroupStats)}
                onContributeClick={() => setActiveTab("tracker")}
                onViewMilestonesClick={() => {
                  setCelebrateMilestone(null);
                  setIsMilestoneModalOpen(true);
                }}
              />
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="space-y-8">
              <Leaderboard
                currentUserId={user?.id}
                isCurrentUserAnonymous={Boolean(member?.is_anonymous)}
                onToggleAnonymous={(isAnon) => {
                  if (member) setMember({ ...member, is_anonymous: isAnon });
                }}
              />
            </div>
          )}

          {activeTab === "feed" && (
            <div className="space-y-8">
              <EncouragementFeed
                userId={user?.id || "guest-user"}
                userDisplayName={member?.display_name || user?.name || "Faithful Walker"}
                groupId="3266-coastal-church"
                onPostCreated={handlePostCreated}
              />
            </div>
          )}
        </div>
      </div>

      {/* Global Footer */}
      <Footer />

      {/* Authentication & Onboarding Modal */}
      <CoastalAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />

      {/* Milestone & Badges Modal */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        celebrateMilestone={celebrateMilestone}
        stepLogs={stepLogs}
        userStreak={userStreak || undefined}
        totalGroupSteps={groupStats?.total_steps}
      />
    </div>
  );
}

export default function CoastalPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cyber-slate flex items-center justify-center p-8 text-ice-white">
          <div className="text-center space-y-3">
            <div className="inline-block p-3 rounded-2xl bg-accent-lime/10 text-accent-lime animate-pulse">
              <Footprints className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-silver-slate">Loading Coastal Community Church Portal...</p>
          </div>
        </div>
      }
    >
      <CoastalPortalContent />
    </Suspense>
  );
}
