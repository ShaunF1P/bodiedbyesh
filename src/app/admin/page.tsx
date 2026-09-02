"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  TrendingUp,
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Target,
  Dumbbell,
  Activity,
  Eye,
  Layers,
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

const STATUS_COLORS: Record<string, string> = {
  new: "bg-accent-lime/10 text-accent-lime border-accent-lime/20",
  contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  enrolled: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  archived: "bg-white/5 text-silver-slate border-white/10",
};

const PROGRAM_LABELS: Record<string, string> = {
  track_a: "Park-to-Peak",
  track_b: "Executive Concierge",
};

const GOAL_LABELS: Record<string, string> = {
  recomp: "Body Recomposition",
  fat_loss: "Fat Loss",
  muscle_gain: "Muscle Gain",
  energy: "Energy & Performance",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isThisWeek(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo;
}

export default function AdminDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
    fetchLeads();
  }, []);

  const totalLeads = leads.length;
  const newThisWeek = leads.filter((l) => isThisWeek(l.created_at)).length;
  const newToday = leads.filter((l) => isToday(l.created_at)).length;
  const enrolledCount = leads.filter((l) => l.status === "enrolled").length;
  const recentLeads = leads.slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-ice-white">Dashboard</h1>
        <p className="text-silver-slate text-sm mt-1">Welcome back, Coach Esh</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={totalLeads} color="lime" />
        <StatCard icon={UserPlus} label="New This Week" value={newThisWeek} color="blue" />
        <StatCard icon={TrendingUp} label="New Today" value={newToday} color="gold" />
        <StatCard icon={Target} label="Enrolled" value={enrolledCount} color="purple" />
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Recent Leads ── */}
      <section className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Recent Leads</h2>
              <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                Latest form submissions
              </p>
            </div>
          </div>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1.5 text-xs text-accent-lime hover:text-accent-lime/80 font-semibold transition-colors"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-silver-slate/30 mx-auto mb-4" />
            <p className="text-silver-slate text-sm">No leads yet. They&apos;ll appear here when someone fills out the Apply form.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-silver-slate">
                  <th className="text-left px-6 py-3 font-semibold">Name</th>
                  <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Contact</th>
                  <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Program</th>
                  <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Goal</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Date</th>
                  <th className="text-right px-6 py-3 font-semibold">Assist</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-ice-white">{lead.name}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-silver-slate">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1.5 text-silver-slate">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-silver-slate">
                        <Dumbbell className="w-3 h-3" />
                        {PROGRAM_LABELS[lead.program_choice || ""] || lead.program_choice || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-silver-slate">
                        <Activity className="w-3 h-3" />
                        {GOAL_LABELS[lead.track_goal || ""] || lead.track_goal || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-silver-slate">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(lead.created_at)}
                      </div>
                      <div className="text-[10px] text-silver-slate/60 mt-0.5">
                        {formatTime(lead.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard?viewAs=${lead.id}&admin=true`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-lime/10 border border-accent-lime/30 text-accent-lime hover:bg-accent-lime/20 text-xs font-semibold transition-all cursor-pointer"
                        title="Open live client dashboard in assist mode"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Assist</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Quick Actions ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          href="/dashboard?admin=true"
          icon={<Eye className="w-5 h-5 text-accent-lime" />}
          label="Client Assist & Dashboard"
          desc="Impersonate & assist active members"
        />
        <QuickAction
          href="/dashboard?admin=true"
          icon={<Layers className="w-5 h-5 text-purple-400" />}
          label="Transformation Studio"
          desc="Inspect before/after photos & deltas"
        />
        <QuickAction
          href="/coastal-walk"
          icon={<Activity className="w-5 h-5 text-amber-400" />}
          label="Coastal Walking Portal"
          desc="Group #3266 steps & devotionals"
        />
        <QuickAction
          href="/admin/park"
          icon={<svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}
          label="Park Settings"
          desc="Manage park location & schedule"
        />
        <QuickAction
          href="/admin/leads"
          icon={<Users className="w-5 h-5 text-accent-lime" />}
          label="Lead Pipeline"
          desc="Audit inbound strategy applications"
        />
        <QuickAction
          href="/brand-guide"
          icon={<svg className="w-5 h-5 text-silver-slate" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>}
          label="Brand Guide"
          desc="View brand assets & style guide"
        />
      </section>
    </div>
  );
}

/* ── Stat Card Component ── */
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number;
  color: "lime" | "blue" | "gold" | "purple";
}) {
  const colors = {
    lime: "bg-accent-lime/10 text-accent-lime border-accent-lime/10",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/10",
    gold: "bg-amber-500/10 text-amber-400 border-amber-500/10",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/10",
  };
  const iconColors = {
    lime: "text-accent-lime",
    blue: "text-blue-400",
    gold: "text-amber-400",
    purple: "text-purple-400",
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
      </div>
      <div className="font-display font-bold text-3xl text-ice-white">{value}</div>
      <div className="text-[10px] text-silver-slate uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

/* ── Quick Action Component ── */
function QuickAction({ href, icon, label, desc, external }: {
  href: string; icon: React.ReactNode; label: string; desc: string; external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-accent-lime/20 transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-silver-slate group-hover:text-accent-lime transition-colors mb-3">
        {icon}
      </div>
      <h3 className="font-display font-bold text-sm text-ice-white group-hover:text-accent-lime transition-colors">
        {label}
      </h3>
      <p className="text-[10px] text-silver-slate mt-0.5">{desc}</p>
    </Link>
  );
}
