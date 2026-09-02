"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Users,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertCircle,
  Loader2,
  Sparkles,
  Dumbbell,
  Briefcase,
  Apple,
  Clock,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { ClientIntakeRecord, IntakeStatus, IntakeTrack } from "@/types/intake";
import IntakeTable, { formatTrackName } from "@/components/admin/intakes/IntakeTable";
import IntakeDetailModal from "@/components/admin/intakes/IntakeDetailModal";

const TRACK_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Coaching Tracks" },
  { value: "park-to-peak", label: "Track A (Park-to-Peak)" },
  { value: "executive-concierge", label: "Track B (Executive Concierge)" },
  { value: "nutrition-metabolic", label: "Track C (Nutrition & Metabolic)" },
];

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Review Statuses" },
  { value: "new", label: "New (Pending Review)" },
  { value: "reviewed", label: "Reviewed" },
  { value: "enrolled", label: "Enrolled" },
  { value: "archived", label: "Archived" },
];

interface ToastState {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export default function AdminIntakesPage() {
  const [intakes, setIntakes] = useState<ClientIntakeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [trackFilter, setTrackFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal inspection state
  const [selectedIntake, setSelectedIntake] = useState<ClientIntakeRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Intakes from GET /api/intake
  const fetchIntakes = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/intake?limit=100", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}: Failed to fetch clinical intakes`);
      }

      if (json.success && Array.isArray(json.data)) {
        setIntakes(json.data);
        if (isRefresh) {
          addToast("Client intake registry refreshed successfully", "info");
        }
      } else {
        setIntakes([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to intake API";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchIntakes();
  }, [fetchIntakes]);

  // Handle open modal
  const handleSelectIntake = (intake: ClientIntakeRecord) => {
    setSelectedIntake(intake);
    setIsModalOpen(true);
  };

  // Handle updates from modal (status change or notes save)
  const handleUpdateIntake = (updated: ClientIntakeRecord) => {
    setIntakes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedIntake(updated);
    addToast(`Updated record for ${updated.client_name}`, "success");
  };

  // KPI Calculations
  const totalSubmissions = intakes.length;
  const trackACount = useMemo(
    () => intakes.filter((i) => i.track === "park-to-peak" || i.track === "track_a" || i.track.includes("park")).length,
    [intakes]
  );
  const trackBCount = useMemo(
    () => intakes.filter((i) => i.track === "executive-concierge" || i.track === "track_b" || i.track.includes("executive")).length,
    [intakes]
  );
  const trackCCount = useMemo(
    () => intakes.filter((i) => i.track === "nutrition-metabolic" || i.track === "track_c" || i.track.includes("nutrition")).length,
    [intakes]
  );
  const pendingReviewCount = useMemo(
    () => intakes.filter((i) => i.status === "new").length,
    [intakes]
  );

  // Filtered Intakes
  const filteredIntakes = useMemo(() => {
    return intakes.filter((item) => {
      // 1. Search Query Filter (name, email, phone)
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.client_name.toLowerCase().includes(q) ||
        item.client_email.toLowerCase().includes(q) ||
        (item.client_phone && item.client_phone.toLowerCase().includes(q));

      // 2. Track Filter
      let matchesTrack = true;
      if (trackFilter !== "all") {
        if (trackFilter === "park-to-peak") {
          matchesTrack = item.track === "park-to-peak" || item.track === "track_a" || item.track.includes("park");
        } else if (trackFilter === "executive-concierge") {
          matchesTrack = item.track === "executive-concierge" || item.track === "track_b" || item.track.includes("executive");
        } else if (trackFilter === "nutrition-metabolic") {
          matchesTrack = item.track === "nutrition-metabolic" || item.track === "track_c" || item.track.includes("nutrition");
        } else {
          matchesTrack = item.track === trackFilter;
        }
      }

      // 3. Status Filter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesTrack && matchesStatus;
    });
  }, [intakes, searchQuery, trackFilter, statusFilter]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredIntakes.length === 0) {
      addToast("No intakes available to export", "info");
      return;
    }

    const headers = [
      "Intake ID",
      "Client Name",
      "Email",
      "Phone",
      "Track",
      "Status",
      "Waiver Signed",
      "Waiver Signature",
      "Waiver Signed Date",
      "Coach Notes",
      "Submitted Date",
    ];

    const rows = filteredIntakes.map((i) => [
      i.id,
      i.client_name,
      i.client_email,
      i.client_phone || "",
      formatTrackName(i.track),
      i.status,
      i.waiver_signed ? "Yes" : "No",
      i.waiver_signature || "",
      i.waiver_signed_at || "",
      (i.coach_notes || "").replace(/"/g, '""'),
      new Date(i.created_at).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `bodied-by-esh-intakes-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`Exported ${filteredIntakes.length} intakes to CSV`, "success");
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ── Toast Container ── */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-md pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 text-xs backdrop-blur-md transition-all ${
              toast.type === "error"
                ? "bg-red-500/15 border-red-500/30 text-red-300"
                : toast.type === "info"
                ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                : "bg-accent-lime/15 border-accent-lime/30 text-accent-lime"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent-lime text-xs font-bold uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Clinical Onboarding Ingress</span>
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-ice-white">
            Client Intakes
          </h1>
          <p className="text-silver-slate text-xs md:text-sm mt-1">
            Review clinical intake questionnaires, PAR-Q+ health screenings, bio-telemetry, and verified digital signatures.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchIntakes(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-accent-lime/30 bg-white/5 hover:bg-white/10 text-silver-slate hover:text-accent-lime text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Refresh intake submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent-lime" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-accent-lime/30 bg-white/5 hover:bg-white/10 text-silver-slate hover:text-accent-lime text-xs font-semibold transition-all cursor-pointer"
            title="Export filtered submissions to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/intake"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-accent-lime/10"
          >
            <span>Open Coach Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiCard
          icon={ClipboardCheck}
          label="Total Intakes"
          value={totalSubmissions}
          color="gold"
        />
        <KpiCard
          icon={Dumbbell}
          label="Track A (On-Site)"
          value={trackACount}
          color="lime"
          subtitle="Park-to-Peak"
        />
        <KpiCard
          icon={Briefcase}
          label="Track B (Concierge)"
          value={trackBCount}
          color="purple"
          subtitle="Remote High-Perf"
        />
        <KpiCard
          icon={Apple}
          label="Track C (Nutrition)"
          value={trackCCount}
          color="amber"
          subtitle="Metabolic Recomp"
        />
        <KpiCard
          icon={Clock}
          label="Pending Review"
          value={pendingReviewCount}
          color="blue"
          highlight={pendingReviewCount > 0}
        />
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchIntakes(true)}
            className="px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Real-Time Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-slate/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, email, or phone..."
              className="w-full bg-[#080A0E] border border-white/10 focus:border-accent-lime/50 rounded-xl pl-11 pr-10 py-2.5 text-xs md:text-sm text-ice-white placeholder:text-silver-slate/40 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-slate/60 hover:text-ice-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Track Filter Dropdown */}
          <div className="relative min-w-[200px]">
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="w-full bg-[#080A0E] border border-white/10 focus:border-accent-lime/50 rounded-xl px-4 py-2.5 text-xs md:text-sm text-silver-slate focus:text-ice-white focus:outline-none transition-all appearance-none cursor-pointer pr-10"
            >
              {TRACK_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0E0E14] text-ice-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver-slate/50 pointer-events-none" />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative min-w-[180px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#080A0E] border border-white/10 focus:border-accent-lime/50 rounded-xl px-4 py-2.5 text-xs md:text-sm text-silver-slate focus:text-ice-white focus:outline-none transition-all appearance-none cursor-pointer pr-10"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0E0E14] text-ice-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver-slate/50 pointer-events-none" />
          </div>
        </div>

        {/* Results Counter & Active Filter Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-silver-slate">
          <span>
            Showing <strong className="text-ice-white">{filteredIntakes.length}</strong> of{" "}
            <strong className="text-ice-white">{intakes.length}</strong> total clinical submissions
          </span>
          {(searchQuery || trackFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setTrackFilter("all");
                setStatusFilter("all");
              }}
              className="text-accent-lime hover:underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Main Intake Table ── */}
      <IntakeTable
        intakes={filteredIntakes}
        onSelectIntake={handleSelectIntake}
        selectedIntakeId={selectedIntake?.id}
        loading={loading}
      />

      {/* ── Clinical Detail & Inspection Modal ── */}
      <IntakeDetailModal
        intake={selectedIntake}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateIntake}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * KPI Card Subcomponent
 * ───────────────────────────────────────────────────────────────────────────── */
function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subtitle?: string;
  color: "gold" | "lime" | "purple" | "amber" | "blue";
  highlight?: boolean;
}) {
  const styles = {
    gold: {
      bg: "bg-[#0E0E14] border-white/10",
      iconBg: "bg-amber-500/10 text-amber-400",
      numText: "text-ice-white",
    },
    lime: {
      bg: "bg-[#0E0E14] border-accent-lime/20",
      iconBg: "bg-accent-lime/10 text-accent-lime",
      numText: "text-accent-lime",
    },
    purple: {
      bg: "bg-[#0E0E14] border-purple-500/20",
      iconBg: "bg-purple-500/10 text-purple-400",
      numText: "text-purple-300",
    },
    amber: {
      bg: "bg-[#0E0E14] border-amber-500/20",
      iconBg: "bg-amber-500/10 text-amber-400",
      numText: "text-amber-300",
    },
    blue: {
      bg: highlight ? "bg-blue-500/10 border-blue-500/40" : "bg-[#0E0E14] border-blue-500/20",
      iconBg: "bg-blue-500/10 text-blue-400",
      numText: highlight ? "text-blue-400" : "text-ice-white",
    },
  };

  const current = styles[color];

  return (
    <div className={`glass-panel rounded-2xl p-4 border transition-all ${current.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${current.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        {highlight && (
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        )}
      </div>
      <div className={`font-display font-bold text-2xl ${current.numText}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-silver-slate font-semibold mt-0.5">
        {label}
      </div>
      {subtitle && (
        <div className="text-[10px] text-silver-slate/60 mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}
