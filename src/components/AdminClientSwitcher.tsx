"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Search,
  ChevronDown,
  Edit3,
  LogOut,
  ExternalLink,
  Loader2,
  Check,
  X,
  Target,
  Dumbbell,
  Activity,
  Flame,
  Footprints,
} from "lucide-react";

export interface RosterClient {
  id: string;
  leadId?: string;
  profileId?: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  program: string;
  goal: string;
  status: string;
  weight_lbs?: number | null;
  target_weight_lbs?: number | null;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  is_registered: boolean;
  created_at: string;
}

interface AdminClientSwitcherProps {
  activeClient: RosterClient | null;
  onSelectClient: (client: RosterClient) => void;
  onTargetsUpdated?: (updatedClient: RosterClient) => void;
}

export default function AdminClientSwitcher({
  activeClient,
  onSelectClient,
  onTargetsUpdated,
}: AdminClientSwitcherProps) {
  const router = useRouter();
  const [roster, setRoster] = useState<RosterClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Edit targets modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCalories, setEditCalories] = useState(1850);
  const [editProtein, setEditProtein] = useState(160);
  const [editCarbs, setEditCarbs] = useState(185);
  const [editFat, setEditFat] = useState(52);
  const [editWeight, setEditWeight] = useState("");
  const [editTargetWeight, setEditTargetWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchRoster();
  }, []);

  useEffect(() => {
    if (activeClient) {
      setEditCalories(activeClient.target_calories || 1850);
      setEditProtein(activeClient.target_protein || 160);
      setEditCarbs(activeClient.target_carbs || 185);
      setEditFat(activeClient.target_fat || 52);
      setEditWeight(activeClient.weight_lbs ? activeClient.weight_lbs.toString() : "");
      setEditTargetWeight(activeClient.target_weight_lbs ? activeClient.target_weight_lbs.toString() : "");
    }
  }, [activeClient]);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/client-profile?roster=true`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.roster)) {
        setRoster(data.roster);
        if (!activeClient && data.roster.length > 0) {
          // Check if there was a saved client or URL param
          const params = new URLSearchParams(window.location.search);
          const viewAs = params.get("viewAs");
          let match = data.roster.find((c: RosterClient) => c.id === viewAs || c.email === viewAs || c.userId === viewAs);
          if (!match) match = data.roster[0];
          onSelectClient(match);
        }
      }
    } catch (err) {
      console.error("Failed to load client roster:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/client-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: activeClient.profileId || activeClient.id,
          email: activeClient.email,
          weight_lbs: editWeight ? parseFloat(editWeight) : null,
          target_weight_lbs: editTargetWeight ? parseFloat(editTargetWeight) : null,
          target_calories: editCalories,
          target_protein: editProtein,
          target_carbs: editCarbs,
          target_fat: editFat,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        const updated: RosterClient = {
          ...activeClient,
          weight_lbs: editWeight ? parseFloat(editWeight) : null,
          target_weight_lbs: editTargetWeight ? parseFloat(editTargetWeight) : null,
          target_calories: editCalories,
          target_protein: editProtein,
          target_carbs: editCarbs,
          target_fat: editFat,
        };
        onSelectClient(updated);
        if (onTargetsUpdated) onTargetsUpdated(updated);
        setTimeout(() => {
          setIsEditModalOpen(false);
          setSaveSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to update targets:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRoster = roster.filter((c) => {
    const q = search.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      c.program.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full bg-[#08080E] border-b border-accent-lime/20 shadow-2xl relative z-40">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Admin Tag & Active Client Dropdown Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-accent-lime" />
            <span>Admin Assist Mode</span>
          </div>

          {/* Member Switcher Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-accent-lime/40 text-ice-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-accent-lime" />
              <span>Viewing:</span>
              <span className="font-display font-bold text-accent-lime">
                {activeClient ? activeClient.name : "Select Client..."}
              </span>
              <span className="text-silver-slate text-[11px] hidden sm:inline">
                ({activeClient ? activeClient.email : "Loading"})
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-silver-slate transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-[#0E0E14] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn">
                {/* Search Bar */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-silver-slate" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search client by name or email..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-ice-white focus:outline-none focus:border-accent-lime"
                    autoFocus
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-silver-slate hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Client List */}
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {loading ? (
                    <div className="flex items-center justify-center py-6 text-xs text-silver-slate gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent-lime" />
                      Loading member roster...
                    </div>
                  ) : filteredRoster.length === 0 ? (
                    <div className="text-center py-6 text-xs text-silver-slate">
                      No matching clients found.
                    </div>
                  ) : (
                    filteredRoster.map((client) => {
                      const isSelected = activeClient?.id === client.id || activeClient?.email === client.email;
                      return (
                        <button
                          key={client.email}
                          onClick={() => {
                            onSelectClient(client);
                            setIsOpen(false);
                            // Update query param
                            const url = new URL(window.location.href);
                            url.searchParams.set("viewAs", client.id || client.email);
                            window.history.replaceState({}, "", url.toString());
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-accent-lime/10 border border-accent-lime/30 text-ice-white"
                              : "hover:bg-white/5 text-silver-slate hover:text-ice-white border border-transparent"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-ice-white flex items-center gap-1.5 truncate">
                              <span>{client.name}</span>
                              {client.is_registered && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                  App User
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-silver-slate/70 truncate">{client.email}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-accent-lime font-bold">{client.target_calories} kcal</div>
                            <div className="text-[9px] text-silver-slate">{client.program}</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Quick Edit Targets Button */}
          {activeClient && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-lime/10 border border-accent-lime/30 text-accent-lime font-semibold hover:bg-accent-lime/20 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Plan Targets</span>
            </button>
          )}

          {/* Quick Nav Links */}
          <Link
            href="/admin/leads"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-silver-slate hover:text-ice-white transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Leads Roster</span>
          </Link>

          <Link
            href="/coastal-walk"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-silver-slate hover:text-ice-white transition-all"
          >
            <Footprints className="w-3.5 h-3.5 text-accent-lime" />
            <span className="hidden md:inline">Coastal Walking</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Admin Hub</span>
          </Link>
        </div>
      </div>

      {/* Quick Target Editor Modal */}
      {isEditModalOpen && activeClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E0E14] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-silver-slate hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ice-white">Edit Client Targets</h3>
                <p className="text-xs text-silver-slate">
                  {activeClient.name} • {activeClient.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTargets} className="space-y-4">
              {/* Daily Calories */}
              <div>
                <label className="text-xs font-semibold text-silver-slate uppercase tracking-wider block mb-1">
                  Daily Calorie Target (kcal)
                </label>
                <input
                  type="number"
                  value={editCalories}
                  onChange={(e) => setEditCalories(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 focus:border-accent-lime rounded-xl px-4 py-2.5 text-sm text-ice-white focus:outline-none"
                  required
                />
              </div>

              {/* Macros Breakdown (Protein, Carbs, Fat) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-accent-lime uppercase tracking-wider block mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={editProtein}
                    onChange={(e) => setEditProtein(parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2 text-sm text-ice-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={editCarbs}
                    onChange={(e) => setEditCarbs(parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl px-3 py-2 text-sm text-ice-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    value={editFat}
                    onChange={(e) => setEditFat(parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-ice-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Weight & Target Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-silver-slate uppercase tracking-wider block mb-1">
                    Current Weight (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    placeholder="e.g. 185"
                    className="w-full bg-white/5 border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2 text-sm text-ice-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-silver-slate uppercase tracking-wider block mb-1">
                    Goal Weight (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editTargetWeight}
                    onChange={(e) => setEditTargetWeight(e.target.value)}
                    placeholder="e.g. 165"
                    className="w-full bg-white/5 border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2 text-sm text-ice-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit / Feedback */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-silver-slate hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-accent-lime text-cyber-slate font-bold text-xs hover:bg-accent-lime/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
