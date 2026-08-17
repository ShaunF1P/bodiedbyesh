"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAdminPin } from "../layout";
import {
  Save,
  MapPin,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Clipboard,
  Eye,
  Calendar,
  FileText,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Package,
} from "lucide-react";
import Link from "next/link";

interface ScheduleSlot {
  day: string;
  time: string;
  duration: string;
}

interface ParkConfig {
  activePark: {
    name: string;
    city: string;
    address: string;
    meetingSpot: string;
    googleMapsUrl: string;
  };
  schedule: ScheduleSlot[];
  whatToBring: string[];
  coachNotes: string;
  isAcceptingNewClients: boolean;
  lastUpdated: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AdminParkPage() {
  const { pin } = useAdminPin();
  // Auth state — handled by admin layout, always authenticated here
  const [authenticated] = useState(true);

  // Config state
  const [config, setConfig] = useState<ParkConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // New item inputs
  const [newBringItem, setNewBringItem] = useState("");

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/park-config", { cache: "no-store" });
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error("Failed to load config:", err);
    }
    setLoading(false);
  }, []);

  // After auth, load config
  useEffect(() => {
    if (authenticated) fetchConfig();
  }, [authenticated, fetchConfig]);

  // Auth is handled by the shared admin layout

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const res = await fetch("/api/park-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, pin }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      const result = await res.json();
      setConfig((prev) => (prev ? { ...prev, lastUpdated: result.lastUpdated } : prev));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    }
    setSaving(false);
  };

  // Park field updaters
  const updatePark = (field: string, value: string) => {
    setConfig((prev) =>
      prev ? { ...prev, activePark: { ...prev.activePark, [field]: value } } : prev
    );
  };

  // Schedule updaters
  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const updated = [...prev.schedule];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, schedule: updated };
    });
  };

  const addScheduleSlot = () => {
    setConfig((prev) =>
      prev
        ? { ...prev, schedule: [...prev.schedule, { day: "Monday", time: "5:00 PM", duration: "60 min" }] }
        : prev
    );
  };

  const removeScheduleSlot = (index: number) => {
    setConfig((prev) =>
      prev ? { ...prev, schedule: prev.schedule.filter((_, i) => i !== index) } : prev
    );
  };

  // What to bring updaters
  const addBringItem = () => {
    if (!newBringItem.trim()) return;
    setConfig((prev) =>
      prev ? { ...prev, whatToBring: [...prev.whatToBring, newBringItem.trim()] } : prev
    );
    setNewBringItem("");
  };

  const removeBringItem = (index: number) => {
    setConfig((prev) =>
      prev ? { ...prev, whatToBring: prev.whatToBring.filter((_, i) => i !== index) } : prev
    );
  };


  // ── Loading ──
  if (loading || !config) {
    return (
      <div className="min-h-screen bg-cyber-slate flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
      </div>
    );
  }

  // ── Admin Dashboard ──
  return (
    <div className="min-h-screen bg-cyber-slate text-ice-white">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-3 px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-silver-slate hover:text-accent-lime transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-sm uppercase tracking-wider">
              Park Admin
            </h1>
            <p className="text-[10px] text-silver-slate">
              Last saved: {new Date(config.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/park"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-white/10 hover:border-accent-lime px-4 py-2 rounded-full text-xs font-semibold text-silver-slate hover:text-accent-lime transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Live Page
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all focus-ring ${
              saveSuccess
                ? "bg-green-500 text-white"
                : "bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate"
            }`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save & Publish"}
          </button>
        </div>
      </header>

      {saveError && (
        <div className="mx-6 md:mx-12 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* ─── Section 1: Active Park ─── */}
        <section className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Active Park Location</h2>
              <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                This is what clients see on the website
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="parkName" className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1.5">
                Park Name
              </label>
              <input
                id="parkName"
                type="text"
                value={config.activePark.name}
                onChange={(e) => updatePark("name", e.target.value)}
                className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="parkCity" className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1.5">
                City / Area
              </label>
              <input
                id="parkCity"
                type="text"
                value={config.activePark.city}
                onChange={(e) => updatePark("city", e.target.value)}
                className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="parkAddress" className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1.5">
                Full Address
              </label>
              <input
                id="parkAddress"
                type="text"
                value={config.activePark.address}
                onChange={(e) => updatePark("address", e.target.value)}
                className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="parkMeetingSpot" className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1.5">
                Meeting Spot Description
              </label>
              <input
                id="parkMeetingSpot"
                type="text"
                value={config.activePark.meetingSpot}
                onChange={(e) => updatePark("meetingSpot", e.target.value)}
                placeholder="e.g. Grassy area near the east pavilion"
                className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="parkMapsUrl" className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-1.5">
                Google Maps Link
              </label>
              <input
                id="parkMapsUrl"
                type="url"
                value={config.activePark.googleMapsUrl}
                onChange={(e) => updatePark("googleMapsUrl", e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* ─── Section 2: Schedule ─── */}
        <section className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">Schedule</h2>
                <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                  Session days, times, and durations
                </p>
              </div>
            </div>
            <button
              onClick={addScheduleSlot}
              className="inline-flex items-center gap-1.5 border border-white/10 hover:border-accent-lime px-3 py-1.5 rounded-full text-xs font-semibold text-silver-slate hover:text-accent-lime transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Slot
            </button>
          </div>

          <div className="space-y-3">
            {config.schedule.map((slot, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-cyber-slate border border-white/5"
              >
                <select
                  value={slot.day}
                  onChange={(e) => updateScheduleSlot(i, "day", e.target.value)}
                  className="flex-1 bg-onyx-card border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 flex-1">
                  <Clock className="w-4 h-4 text-silver-slate shrink-0" />
                  <input
                    type="text"
                    value={slot.time}
                    onChange={(e) => updateScheduleSlot(i, "time", e.target.value)}
                    placeholder="5:30 PM"
                    className="flex-1 bg-onyx-card border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>
                <input
                  type="text"
                  value={slot.duration}
                  onChange={(e) => updateScheduleSlot(i, "duration", e.target.value)}
                  placeholder="60 min"
                  className="w-24 bg-onyx-card border border-white/10 focus:border-accent-lime rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                />
                <button
                  onClick={() => removeScheduleSlot(i)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 hover:border-red-500/50 text-silver-slate hover:text-red-400 transition-all shrink-0"
                  aria-label="Remove slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {config.schedule.length === 0 && (
              <p className="text-silver-slate text-sm text-center py-8">
                No schedule slots configured. Click &quot;Add Slot&quot; to start.
              </p>
            )}
          </div>
        </section>

        {/* ─── Section 3: What to Bring ─── */}
        <section className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">What to Bring</h2>
              <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                Items clients should bring to the session
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {config.whatToBring.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-cyber-slate border border-white/5"
              >
                <Clipboard className="w-4 h-4 text-accent-lime shrink-0" />
                <span className="flex-1 text-sm">{item}</span>
                <button
                  onClick={() => removeBringItem(i)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:border-red-500/50 text-silver-slate hover:text-red-400 transition-all shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newBringItem}
              onChange={(e) => setNewBringItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBringItem()}
              placeholder="Add item (e.g., Resistance band)"
              className="flex-1 bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
            />
            <button
              onClick={addBringItem}
              className="px-4 py-3 rounded-xl bg-accent-lime/10 border border-accent-lime/20 text-accent-lime hover:bg-accent-lime/20 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* ─── Section 4: Coaching Notes ─── */}
        <section className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Coaching Notes</h2>
              <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                Visible to clients — rain policy, arrival tips, etc.
              </p>
            </div>
          </div>
          <textarea
            id="coachNotes"
            value={config.coachNotes}
            onChange={(e) => setConfig((prev) => (prev ? { ...prev, coachNotes: e.target.value } : prev))}
            rows={4}
            className="w-full bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-y"
            placeholder="Any notes you want clients to see..."
          />
        </section>

        {/* ─── Section 5: Toggle ─── */}
        <section className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                {config.isAcceptingNewClients ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">Accepting New Clients</h2>
                <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                  {config.isAcceptingNewClients
                    ? "Trial booking form is visible"
                    : "Trial booking form is hidden — waitlist mode"}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setConfig((prev) =>
                  prev ? { ...prev, isAcceptingNewClients: !prev.isAcceptingNewClients } : prev
                )
              }
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                config.isAcceptingNewClients ? "bg-accent-lime" : "bg-white/10"
              }`}
              aria-label="Toggle accepting new clients"
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  config.isAcceptingNewClients ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Bottom save bar on mobile */}
        <div className="sm:hidden sticky bottom-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent-lime text-cyber-slate px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-xl shadow-accent-lime/20 transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save & Publish"}
          </button>
        </div>
      </main>
    </div>
  );
}
