"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAdminPin } from "../layout";
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Calendar,
  Dumbbell,
  Activity,
  Loader2,
  ChevronDown,
  X,
  CheckCircle,
  Clock,
  UserCheck,
  Archive,
  Eye,
  Shield,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  program_choice: string | null;
  track_goal: string | null;
  source: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", icon: Clock, color: "bg-accent-lime/10 text-accent-lime border-accent-lime/20" },
  { value: "contacted", label: "Contacted", icon: Mail, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { value: "enrolled", label: "Enrolled", icon: CheckCircle, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { value: "archived", label: "Archived", icon: Clock, color: "bg-white/5 text-silver-slate border-white/10" },
];

const PROGRAM_LABELS: Record<string, string> = {
  track_a: "Track A — Park-to-Peak",
  track_a_hybrid: "Track A — Hybrid",
  track_a_park: "Track A — Park Only",
  track_b: "Track B — Executive Concierge",
  track_b_hybrid: "Track B — Hybrid",
  intro_assessment: "Intro Strategy Assessment",
};

const GOAL_LABELS: Record<string, string> = {
  recomp: "Body Recomposition",
  fat_loss: "Fat Loss",
  muscle_gain: "Muscle Gain",
  energy: "Energy & Performance",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  new: { label: "New Lead", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  contacted: { label: "Contacted", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
  enrolled: { label: "Enrolled", bg: "bg-accent-lime/10", text: "text-accent-lime", border: "border-accent-lime/30" },
  archived: { label: "Archived", bg: "bg-white/5", text: "text-silver-slate", border: "border-white/10" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Client stats state for Esha to track progress
  const [expandedStats, setExpandedStats] = useState<any>(null);

  // Phase 2 states
  const [activeDetailTab, setActiveDetailTab] = useState<"biometrics" | "workouts" | "chat">("biometrics");
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutExercises, setWorkoutExercises] = useState<{ exerciseName: string; targetSets: number; targetReps: string; targetWeight: string }[]>([
    { exerciseName: "", targetSets: 3, targetReps: "10", targetWeight: "" }
  ]);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [workoutsHistory, setWorkoutsHistory] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const supabase = createClient();

  // Edit states for coaching plans
  const [editingPlan, setEditingPlan] = useState(false);
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editTargetWeight, setEditTargetWeight] = useState("");
  const [savingStats, setSavingStats] = useState(false);

  const handleSavePlan = async (clientId: string) => {
    setSavingStats(true);
    try {
      const res = await fetch("/api/admin/client-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          weight_lbs: editWeight,
          target_weight_lbs: editTargetWeight,
          target_calories: editCalories,
          target_protein: editProtein,
          target_carbs: editCarbs,
          target_fat: editFat,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExpandedStats((prev: any) => ({
          ...prev,
          profile: data.profile,
        }));
        setEditingPlan(false);
      }
    } catch (e) {
      console.error(e);
    }
    setSavingStats(false);
  };

  const [creatingProfileId, setCreatingProfileId] = useState<string | null>(null);

  const handleCreateProfile = async (lead: Lead) => {
    setCreatingProfileId(lead.id);
    try {
      const res = await fetch("/api/admin/client-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const { data: profile } = await supabase
          .from("client_profiles")
          .select("*")
          .eq("email", lead.email)
          .single();

        if (profile) {
          setExpandedStats({
            profile,
            meals: [],
            scans: [],
          });
          setEditCalories("1850");
          setEditProtein("160");
          setEditCarbs("185");
          setEditFat("52");
          setEditWeight("140");
          setEditTargetWeight("130");
        }
      }
    } catch (e) {
      console.error(e);
    }
    setCreatingProfileId(null);
  };

  // ─── Phase 2 Workout & Chat Helpers ───
  const fetchClientWorkouts = async (clientId: string) => {
    try {
      const res = await fetch(`/api/admin/workouts?clientId=${clientId}`);
      const data = await res.json();
      if (data.success) {
        setWorkoutsHistory(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch workouts:", err);
    }
  };

  const handleSaveWorkout = async (clientId: string) => {
    if (!workoutName.trim()) return;
    setSavingWorkout(true);
    try {
      const filteredExercises = workoutExercises.filter(ex => ex.exerciseName.trim());
      const res = await fetch("/api/admin/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          date: workoutDate,
          workoutName,
          notes: workoutNotes,
          exercises: filteredExercises
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchClientWorkouts(clientId);
        setWorkoutName("");
        setWorkoutNotes("");
        setWorkoutExercises([{ exerciseName: "", targetSets: 3, targetReps: "10", targetWeight: "" }]);
      }
    } catch (err) {
      console.error("Failed to save workout:", err);
    }
    setSavingWorkout(false);
  };

  const handleDeleteWorkout = async (workoutId: string, clientId: string) => {
    try {
      const res = await fetch(`/api/admin/workouts?id=${workoutId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchClientWorkouts(clientId);
      }
    } catch (err) {
      console.error("Failed to delete workout:", err);
    }
  };

  const fetchClientChat = async (clientId: string) => {
    try {
      const res = await fetch(`/api/chat?clientId=${clientId}`);
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch chat:", err);
    }
  };

  const handleSendChatMessage = async (clientId: string) => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    setSendingMessage(true);

    const tempId = Math.random().toString();
    const tempMsg = {
      id: tempId,
      client_id: clientId,
      sender: "coach",
      message: text,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          clientId
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => prev.map(m => m.id === tempId ? data.data : m));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
    setSendingMessage(false);
  };

  const handleTabChange = (tab: "biometrics" | "workouts" | "chat", clientId: string) => {
    setActiveDetailTab(tab);
    if (tab === "workouts") {
      fetchClientWorkouts(clientId);
    } else if (tab === "chat") {
      fetchClientChat(clientId);
    }
  };

  // Real-time Chat Subscription
  useEffect(() => {
    if (activeDetailTab !== "chat" || !expandedStats?.profile?.id) return;
    
    const clientId = expandedStats.profile.id;
    const channel = supabase
      .channel(`chat_messages:client_id=eq.${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `client_id=eq.${clientId}`,
        },
        (payload: any) => {
          const newMsg = payload.new;
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeDetailTab, expandedStats?.profile?.id, supabase]);

  const handleRowToggle = async (lead: Lead) => {
    if (expandedLead === lead.id) {
      setExpandedLead(null);
      setExpandedStats(null);
      return;
    }

    setExpandedLead(lead.id);
    setExpandedStats(null);
    setActiveDetailTab("biometrics");
    setStatsLoading(true);

    try {
      // Find client profile by email
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("email", lead.email)
        .single();

      if (profile) {
        // Fetch meal log counts
        const { data: meals } = await supabase
          .from("logged_meals")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        // Fetch body scans
        const { data: scans } = await supabase
          .from("body_scans")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        setExpandedStats({
          profile,
          meals: meals || [],
          scans: scans || [],
        });
        
        // Populate edit form states
        setEditCalories(profile.target_calories?.toString() || "1850");
        setEditProtein(profile.target_protein?.toString() || "160");
        setEditCarbs(profile.target_carbs?.toString() || "185");
        setEditFat(profile.target_fat?.toString() || "52");
        setEditWeight(profile.weight_lbs?.toString() || "140");
        setEditTargetWeight(profile.target_weight_lbs?.toString() || "130");
        setEditingPlan(false);
      }
    } catch (e) {
      console.error("Failed to load client profile metrics:", e);
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/admin/leads", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.data || []);
      } else {
        setError(data.error || "Failed to load leads");
      }
    } catch {
      setError("Failed to connect to server");
    }
    setLoading(false);
  }

  async function updateStatus(leadId: string, newStatus: string) {
    setUpdatingId(leadId);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
    setUpdatingId(null);
  }

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchSearch = search === "" ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        (l.phone && l.phone.includes(search));
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      const matchProgram = programFilter === "all" || l.program_choice === programFilter;
      return matchSearch && matchStatus && matchProgram;
    });
  }, [leads, search, statusFilter, programFilter]);

  function exportCSV() {
    const headers = ["Name", "Email", "Phone", "Program", "Goal", "Status", "Source", "Date"];
    const rows = filtered.map((l) => [
      l.name,
      l.email,
      l.phone || "",
      PROGRAM_LABELS[l.program_choice || ""] || l.program_choice || "",
      GOAL_LABELS[l.track_goal || ""] || l.track_goal || "",
      l.status,
      l.source || "",
      formatDateTime(l.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bodied-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-ice-white">All Leads</h1>
          <p className="text-silver-slate text-sm mt-1">
            {filtered.length} of {leads.length} leads
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-accent-lime/30 text-silver-slate hover:text-accent-lime text-xs font-semibold transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-slate" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-white/5 border border-white/10 focus:border-accent-lime/50 rounded-xl pl-11 pr-4 py-3 text-sm text-ice-white placeholder:text-silver-slate/50 focus:outline-none transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-slate hover:text-ice-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 focus:border-accent-lime/50 rounded-xl px-4 py-3 text-sm text-silver-slate focus:outline-none transition-all appearance-none cursor-pointer min-w-[130px]"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="bg-white/5 border border-white/10 focus:border-accent-lime/50 rounded-xl px-4 py-3 text-sm text-silver-slate focus:outline-none transition-all appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="all">All Programs</option>
            <option value="track_a">Park-to-Peak</option>
            <option value="track_b">Executive Concierge</option>
          </select>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* ── Leads Table ── */}
      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-silver-slate/30 mx-auto mb-4" />
            <p className="text-silver-slate text-sm">
              {leads.length === 0 ? "No leads yet." : "No leads match your filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((lead) => {
              const isExpanded = expandedLead === lead.id;
              const statusOpt = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];

              return (
                <div key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                  {/* ── Row ── */}
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer"
                    onClick={() => handleRowToggle(lead)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-lime/20 to-accent-lime/5 flex items-center justify-center text-accent-lime font-display font-bold text-sm shrink-0">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name & Email */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ice-white text-sm truncate">{lead.name}</div>
                      <div className="text-silver-slate text-xs truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" /> {lead.email}
                      </div>
                    </div>

                    {/* Program (hidden on mobile) */}
                    <div className="hidden md:block text-xs text-silver-slate min-w-[130px]">
                      <span className="flex items-center gap-1.5">
                        <Dumbbell className="w-3 h-3" />
                        {PROGRAM_LABELS[lead.program_choice || ""] || "—"}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusOpt.color} shrink-0`}>
                      {lead.status}
                    </span>

                    {/* Quick Assist Member Button */}
                    <Link
                      href={`/dashboard?viewAs=${lead.id}&admin=true`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1.5 rounded-xl bg-accent-lime/10 border border-accent-lime/30 text-accent-lime hover:bg-accent-lime/20 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                      title="View & Assist Member in Dashboard"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Assist</span>
                    </Link>

                    {/* Date */}
                    <div className="hidden sm:block text-xs text-silver-slate min-w-[90px] text-right">
                      {formatDate(lead.created_at)}
                    </div>

                    {/* Expand */}
                    <ChevronDown className={`w-4 h-4 text-silver-slate transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                  </div>

                  {/* ── Expanded Detail ── */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-white/[0.01]">
                      {/* Live Member View Action Banner */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-4 rounded-2xl bg-accent-lime/5 border border-accent-lime/20">
                        <div>
                          <div className="text-xs font-bold text-accent-lime flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Live Member Dashboard Impersonation</span>
                          </div>
                          <p className="text-[11px] text-silver-slate mt-0.5">
                            Switch into {lead.name}&apos;s live member view to review their logged meals, workouts, custom macros, and body scans.
                          </p>
                        </div>
                        <Link
                          href={`/dashboard?viewAs=${lead.id}&admin=true`}
                          className="px-4 py-2 rounded-xl bg-accent-lime text-cyber-slate font-bold text-xs hover:bg-accent-lime/90 transition-all flex items-center gap-1.5 shadow-lg shadow-accent-lime/10 shrink-0 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open {lead.name}&apos;s Dashboard</span>
                        </Link>
                      </div>

                      {/* Basic details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <DetailItem icon={Mail} label="Email" value={lead.email} />
                        <DetailItem icon={Phone} label="Phone" value={lead.phone || "Not provided"} />
                        <DetailItem icon={Dumbbell} label="Program" value={PROGRAM_LABELS[lead.program_choice || ""] || lead.program_choice || "Not specified"} />
                        <DetailItem icon={Activity} label="Goal" value={GOAL_LABELS[lead.track_goal || ""] || lead.track_goal || "Not specified"} />
                      </div>

                      {/* Biometrics and Stats from Supabase Client Profile */}
                      <div className="mb-6 border-t border-white/5 pt-4">
                        <h4 className="text-[10px] text-accent-lime uppercase tracking-wider font-semibold mb-3">Client Biometrics & Activity Logs</h4>
                        {statsLoading ? (
                          <div className="flex items-center gap-2 text-xs text-silver-slate py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-lime" />
                            Loading stats...
                          </div>
                        ) : expandedStats ? (
                          <div>
                            {/* Sub Tabs Header */}
                            <div className="flex gap-2 border-b border-white/5 pb-3 mb-5">
                              {[
                                { id: "biometrics", label: "Biometrics & Logs" },
                                { id: "workouts", label: "Workout Builder" },
                                { id: "chat", label: "Client Chat" }
                              ].map(tab => (
                                <button
                                  key={tab.id}
                                  onClick={() => handleTabChange(tab.id as any, expandedStats.profile.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                    activeDetailTab === tab.id
                                      ? "bg-accent-lime/10 text-accent-lime border border-accent-lime/20"
                                      : "text-silver-slate hover:text-ice-white hover:bg-white/5 border border-transparent"
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            {/* Tab 1: Biometrics & Logs */}
                            {activeDetailTab === "biometrics" && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                                {/* Profile card */}
                                <div className="p-4 rounded-2xl bg-cyber-slate border border-white/5 flex flex-col justify-between">
                                  <div>
                                    <p className="text-[9px] uppercase tracking-wider text-silver-slate font-medium mb-2">Profile Targets</p>
                                    
                                    {editingPlan ? (
                                      <div className="space-y-2 mt-2">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-[9px] text-silver-slate block">Current (lbs)</label>
                                            <input
                                              type="number"
                                              value={editWeight}
                                              onChange={(e) => setEditWeight(e.target.value)}
                                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[9px] text-silver-slate block">Target (lbs)</label>
                                            <input
                                              type="number"
                                              value={editTargetWeight}
                                              onChange={(e) => setEditTargetWeight(e.target.value)}
                                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-[9px] text-silver-slate block">Calories (kcal)</label>
                                            <input
                                              type="number"
                                              value={editCalories}
                                              onChange={(e) => setEditCalories(e.target.value)}
                                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[9px] text-silver-slate block">Protein (g)</label>
                                            <input
                                              type="number"
                                              value={editProtein}
                                              onChange={(e) => setEditProtein(e.target.value)}
                                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-[9px] text-silver-slate block">Carbs (g)</label>
                                            <input
                                              type="number"
                                              value={editCarbs}
                                              onChange={(e) => setEditCarbs(e.target.value)}
                                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[9px] text-silver-slate block">Fat (g)</label>
                                            <input
                                              type="number"
                                              value={editFat}
                                              onChange={(e) => setEditFat(e.target.value)}
                                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                          <button
                                            onClick={() => handleSavePlan(expandedStats.profile.id)}
                                            disabled={savingStats}
                                            className="flex-1 bg-accent-lime text-cyber-slate py-1 rounded text-[10px] font-bold uppercase cursor-pointer text-center"
                                          >
                                            {savingStats ? "Saving..." : "Save"}
                                          </button>
                                          <button
                                            onClick={() => setEditingPlan(false)}
                                            className="flex-1 bg-white/5 text-silver-slate py-1 rounded text-[10px] font-bold uppercase cursor-pointer text-center"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                          <p className="text-[10px] text-silver-slate">Current Weight</p>
                                          <p className="text-sm font-bold text-ice-white">{expandedStats.profile.weight_lbs} lbs</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-silver-slate">Target Weight</p>
                                          <p className="text-sm font-bold text-accent-lime">{expandedStats.profile.target_weight_lbs} lbs</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-silver-slate">Height</p>
                                          <p className="text-sm font-bold text-ice-white">{Math.floor(expandedStats.profile.height_in / 12)}&apos;{Math.round(expandedStats.profile.height_in % 12)}&quot;</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-silver-slate">Daily Calories</p>
                                          <p className="text-sm font-bold text-ice-white">{expandedStats.profile.target_calories} kcal</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {!editingPlan && (
                                    <button
                                      onClick={() => setEditingPlan(true)}
                                      className="w-full mt-4 bg-white/5 hover:bg-white/10 text-silver-slate hover:text-ice-white py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer text-center"
                                    >
                                      Edit Plan targets
                                    </button>
                                  )}
                                </div>

                                {/* Scans stats */}
                                <div className="p-4 rounded-2xl bg-cyber-slate border border-white/5">
                                  <p className="text-[9px] uppercase tracking-wider text-silver-slate font-medium">Body Scans History</p>
                                  {expandedStats.scans.length === 0 ? (
                                    <p className="text-xs text-silver-slate/50 mt-4">No scans logged yet</p>
                                  ) : (
                                    <div className="mt-3 space-y-2 max-h-[100px] overflow-y-auto pr-1">
                                      {expandedStats.scans.slice(0, 3).map((scan: any) => (
                                        <div key={scan.id} className="flex justify-between text-xs border-b border-white/5 pb-1">
                                          <span className="text-ice-white font-medium">{scan.body_fat_percent}% Body Fat</span>
                                          <span className="text-silver-slate text-[10px]">{new Date(scan.created_at).toLocaleDateString()}</span>
                                        </div>
                                      ))}
                                      {expandedStats.scans.length > 3 && (
                                        <p className="text-[9px] text-silver-slate">+{expandedStats.scans.length - 3} more scans</p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Food stats */}
                                <div className="p-4 rounded-2xl bg-cyber-slate border border-white/5">
                                  <p className="text-[9px] uppercase tracking-wider text-silver-slate font-medium">Logged Meals</p>
                                  {expandedStats.meals.length === 0 ? (
                                    <p className="text-xs text-silver-slate/50 mt-4">No meals logged yet</p>
                                  ) : (
                                    <div className="mt-3 space-y-2 max-h-[100px] overflow-y-auto pr-1">
                                      {expandedStats.meals.slice(0, 3).map((meal: any) => (
                                        <div key={meal.id} className="flex justify-between text-xs border-b border-white/5 pb-1">
                                          <span className="text-ice-white truncate max-w-[120px]">{meal.items[0]?.name || "Meal"}</span>
                                          <span className="text-accent-lime font-bold">{meal.calories} kcal</span>
                                        </div>
                                      ))}
                                      {expandedStats.meals.length > 3 && (
                                        <p className="text-[9px] text-silver-slate">+{expandedStats.meals.length - 3} more logs</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Tab 2: Workout Builder */}
                            {activeDetailTab === "workouts" && (
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                                {/* Left: Builder Form (Span 7) */}
                                <div className="lg:col-span-7 space-y-4 bg-cyber-slate p-5 rounded-2xl border border-white/5">
                                  <h5 className="text-xs font-bold font-display uppercase tracking-wider text-ice-white">Assign Workout Plan</h5>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[9px] text-silver-slate uppercase block mb-1">Date</label>
                                      <input
                                        type="date"
                                        value={workoutDate}
                                        onChange={(e) => setWorkoutDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-silver-slate uppercase block mb-1">Workout Title</label>
                                      <input
                                        type="text"
                                        value={workoutName}
                                        onChange={(e) => setWorkoutName(e.target.value)}
                                        placeholder="e.g. Legs & Core Focus"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-silver-slate uppercase block mb-1">Notes / Instructions</label>
                                    <textarea
                                      value={workoutNotes}
                                      onChange={(e) => setWorkoutNotes(e.target.value)}
                                      placeholder="e.g. Focus on progressive overload. Warm up 5m..."
                                      rows={2}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none focus:border-accent-lime resize-none"
                                    />
                                  </div>

                                  {/* Exercises Builder */}
                                  <div className="space-y-2.5">
                                    <label className="text-[9px] text-silver-slate uppercase block font-semibold border-b border-white/5 pb-1">Exercises</label>
                                    {workoutExercises.map((ex, idx) => (
                                      <div key={idx} className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          value={ex.exerciseName}
                                          onChange={(e) => {
                                            const next = [...workoutExercises];
                                            next[idx].exerciseName = e.target.value;
                                            setWorkoutExercises(next);
                                          }}
                                          placeholder="Exercise Name"
                                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                        />
                                        <input
                                          type="number"
                                          value={ex.targetSets}
                                          onChange={(e) => {
                                            const next = [...workoutExercises];
                                            next[idx].targetSets = parseInt(e.target.value) || 3;
                                            setWorkoutExercises(next);
                                          }}
                                          placeholder="Sets"
                                          className="w-14 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none text-center focus:border-accent-lime"
                                        />
                                        <input
                                          type="text"
                                          value={ex.targetReps}
                                          onChange={(e) => {
                                            const next = [...workoutExercises];
                                            next[idx].targetReps = e.target.value;
                                            setWorkoutExercises(next);
                                          }}
                                          placeholder="Reps"
                                          className="w-16 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none text-center focus:border-accent-lime"
                                        />
                                        <input
                                          type="text"
                                          value={ex.targetWeight}
                                          onChange={(e) => {
                                            const next = [...workoutExercises];
                                            next[idx].targetWeight = e.target.value;
                                            setWorkoutExercises(next);
                                          }}
                                          placeholder="lbs"
                                          className="w-16 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none text-center focus:border-accent-lime"
                                        />
                                        <button
                                          onClick={() => {
                                            if (workoutExercises.length > 1) {
                                              setWorkoutExercises(workoutExercises.filter((_, i) => i !== idx));
                                            }
                                          }}
                                          className="text-silver-slate hover:text-red-400 p-1 cursor-pointer transition-colors text-lg"
                                        >
                                          &times;
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => setWorkoutExercises([...workoutExercises, { exerciseName: "", targetSets: 3, targetReps: "10", targetWeight: "" }])}
                                      className="text-[10px] text-accent-lime font-bold uppercase hover:underline cursor-pointer"
                                    >
                                      + Add Exercise
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => handleSaveWorkout(expandedStats.profile.id)}
                                    disabled={savingWorkout || !workoutName.trim()}
                                    className="w-full bg-accent-lime text-cyber-slate font-bold uppercase text-[10px] py-3 rounded-xl hover:bg-accent-lime/90 disabled:opacity-30 transition-all cursor-pointer text-center"
                                  >
                                    {savingWorkout ? "Saving Workout Plan..." : "Publish Workout Plan"}
                                  </button>
                                </div>

                                {/* Right: Workout History List (Span 5) */}
                                <div className="lg:col-span-5 space-y-4 max-h-[380px] overflow-y-auto pr-1">
                                  <h5 className="text-xs font-bold font-display uppercase tracking-wider text-ice-white">Scheduled Workouts</h5>
                                  {workoutsHistory.length === 0 ? (
                                    <p className="text-xs text-silver-slate/55 italic">No workouts scheduled yet for this client.</p>
                                  ) : (
                                    workoutsHistory.map((wk) => (
                                      <div key={wk.id} className="p-4 bg-cyber-slate/50 border border-white/5 rounded-2xl space-y-3 relative group">
                                        <button
                                          onClick={() => handleDeleteWorkout(wk.id, expandedStats.profile.id)}
                                          className="absolute top-3 right-3 text-silver-slate hover:text-red-400 text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          Delete
                                        </button>
                                        <div>
                                          <span className="text-[9px] font-mono text-accent-lime bg-accent-lime/5 px-2 py-0.5 rounded uppercase font-semibold">
                                            {formatDate(wk.date)}
                                          </span>
                                          <h6 className="font-display font-bold text-sm text-ice-white mt-1.5">{wk.name}</h6>
                                          {wk.notes && <p className="text-[10px] text-silver-slate mt-1 font-light italic">{wk.notes}</p>}
                                        </div>
                                        <div className="border-t border-white/5 pt-2.5 space-y-1.5">
                                          {wk.exercises?.map((ex: any) => (
                                            <div key={ex.id} className="flex justify-between text-[11px] text-silver-slate">
                                              <span className="font-medium text-ice-white">{ex.exercise_name}</span>
                                              <span>{ex.target_sets} sets &times; {ex.target_reps} reps {ex.target_weight_lbs ? `@ ${ex.target_weight_lbs} lbs` : ""}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Tab 3: Client Chat */}
                            {activeDetailTab === "chat" && (
                              <div className="bg-cyber-slate rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[350px] animate-fadeIn">
                                {/* History */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                  {chatMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-silver-slate/50">
                                      <p className="text-xs">No message history.</p>
                                      <p className="text-[10px]">Send a greeting message to start the real-time client chat.</p>
                                    </div>
                                  ) : (
                                    chatMessages.map(msg => {
                                      const isCoach = msg.sender === "coach";
                                      return (
                                        <div key={msg.id} className={`flex flex-col ${isCoach ? "items-end" : "items-start"}`}>
                                          <div className={`max-w-[70%] px-3 py-2 rounded-xl text-xs ${
                                            isCoach ? "bg-accent-lime text-cyber-slate font-medium" : "bg-white/5 text-ice-white"
                                          }`}>
                                            <p className="m-0 break-words">{msg.message}</p>
                                          </div>
                                          <span className="text-[8px] text-silver-slate/30 mt-0.5">
                                            {formatDate(msg.created_at)} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                {/* Send Input Form */}
                                <div className="p-3 bg-[#080A0E]/50 border-t border-white/5 flex gap-2">
                                  <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type message to client..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSendChatMessage(expandedStats.profile.id);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSendChatMessage(expandedStats.profile.id)}
                                    disabled={!chatInput.trim() || sendingMessage}
                                    className="bg-accent-lime text-cyber-slate px-4 py-2 rounded-xl text-xs font-bold uppercase disabled:opacity-40 cursor-pointer"
                                  >
                                    Send
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center bg-cyber-slate/50">
                            <p className="text-xs text-silver-slate mb-4">
                              Client has not registered a verified account in the portal yet.
                            </p>
                            <button
                              onClick={() => handleCreateProfile(lead)}
                              disabled={creatingProfileId === lead.id}
                              className="inline-flex items-center gap-1.5 bg-accent-lime text-cyber-slate px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              {creatingProfileId === lead.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                "Create Coaching Targets"
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* ── Status Update ── */}
                      <div className="border-t border-white/5 pt-4">
                        <p className="text-[10px] text-silver-slate uppercase tracking-wider font-semibold mb-2">Update Status</p>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map((opt) => {
                            const isActive = lead.status === opt.value;
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => updateStatus(lead.id, opt.value)}
                                disabled={updatingId === lead.id}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                  isActive
                                    ? opt.color
                                    : "border-white/10 text-silver-slate hover:border-white/20 hover:text-ice-white"
                                }`}
                              >
                                {updatingId === lead.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isActive ? (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <Icon className="w-3.5 h-3.5" />
                                )}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Detail Item ── */
function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-silver-slate mt-0.5 shrink-0" />
      <div>
        <div className="text-[10px] text-silver-slate uppercase tracking-wider">{label}</div>
        <div className="text-sm text-ice-white mt-0.5">{value}</div>
      </div>
    </div>
  );
}
