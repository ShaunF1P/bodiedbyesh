"use client";

import React, { useState, useEffect } from "react";
import { Lock, Database, Trash2, Clipboard, AlertCircle, RefreshCw, MessageSquare, Star, Heart, Sun, Moon, Users, Phone, Mail, X } from "lucide-react";
import { LOGO_OPTIONS } from "@/lib/logos";

interface FeedbackEntry {
  id: string;
  client_name: string;
  favorites: number[];
  notes: string;
  created_at: string;
}

interface LeadEntry {
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

function LogoThumbnailCard({ logo, type = "star" }: { logo: typeof LOGO_OPTIONS[0]; type?: "star" | "heart" }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  return (
    <div className="flex items-center gap-3 bg-[#0A0A10]/50 border border-white/5 rounded-2xl p-3 hover:border-white/10 transition-all">
      <div
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`w-24 h-16 rounded-xl flex items-center justify-center p-2 cursor-pointer transition-all duration-300 relative group overflow-hidden border border-white/10 shrink-0 ${
          theme === "dark" ? "bg-[#030305]" : "bg-[#F8F7FA]"
        }`}
        title="Click to toggle background theme"
      >
        {theme === "dark" && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30 pointer-events-none" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.image}
          alt={logo.name}
          className={`max-w-full max-h-full object-contain relative z-10 transition-all duration-300 ${
            theme === "dark"
              ? "mix-blend-screen"
              : "invert hue-rotate-180 contrast-[1.10] mix-blend-multiply"
          }`}
        />
        <div className="absolute bottom-1 right-1 bg-black/60 rounded-md p-1 text-silver-slate opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {theme === "dark" ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5 text-cyber-slate" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          {type === "heart" ? (
            <Heart className="w-3 h-3 fill-rose-500 text-rose-500 shrink-0" />
          ) : (
            <Star className="w-3 h-3 fill-accent-lime text-accent-lime shrink-0" />
          )}
          <span className="text-xs font-semibold text-white truncate">Option {logo.id}</span>
          {logo.isFinalist && (
            <span className="text-[8px] uppercase font-bold text-accent-lime bg-accent-lime/10 px-1 py-0.5 rounded border border-accent-lime/20 shrink-0 ml-1">
              Finalist
            </span>
          )}
        </div>
        <p className="text-[11px] font-medium text-silver-slate truncate mt-0.5">{logo.name}</p>
        <p className="text-[9px] text-silver-slate/60 font-light mt-0.5 line-clamp-1 leading-snug">{logo.desc}</p>
      </div>
    </div>
  );
}

function parseHeartsAndHidden(entry: any) {
  let hearts: number[] = entry.hearts || [];
  let eliminated: number[] = [];
  let cleanedNotes = entry.notes || "";

  // Check if hearts are stored in notes fallback
  const heartMatch = cleanedNotes.match(/\[Top Picks \(Hearts\): (.*?)\]/);
  if (heartMatch) {
    const ids = heartMatch[1].split(",").map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
    if (ids.length > 0) {
      hearts = [...hearts, ...ids];
    }
    cleanedNotes = cleanedNotes.replace(/\[Top Picks \(Hearts\): (.*?)\]/, "").trim();
  }

  // Check if eliminated logos are stored in notes
  const eliminatedMatch = cleanedNotes.match(/\[Eliminated Logos: (.*?)\]/);
  if (eliminatedMatch) {
    const ids = eliminatedMatch[1].split(",").map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
    if (ids.length > 0) {
      eliminated = ids;
    }
    cleanedNotes = cleanedNotes.replace(/\[Eliminated Logos: (.*?)\]/, "").trim();
  }

  return { hearts, eliminated, cleanedNotes };
}


export default function LogoAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [sqlInstructions, setSqlInstructions] = useState<string | null>(null);
  const [showOnlyFinalists, setShowOnlyFinalists] = useState(false);

  // Coaching Leads specific states
  const [activeTab, setActiveTab] = useState<"logos" | "leads">("logos");
  const [leadsList, setLeadsList] = useState<LeadEntry[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState("");
  const [leadsSqlInstructions, setLeadsSqlInstructions] = useState<string | null>(null);

  useEffect(() => {
    const savedPin = sessionStorage.getItem("logo_admin_pin");
    if (savedPin) {
      setPin(savedPin);
      fetchFeedback(savedPin);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeedback(pin);
  };

  const fetchLeads = async (enteredPin: string) => {
    setLeadsLoading(true);
    setLeadsError("");
    setLeadsSqlInstructions(null);

    try {
      const response = await fetch("/api/admin/leads", {
        headers: {
          "x-admin-pin": enteredPin
        }
      });

      const result = await response.json();

      if (response.ok) {
        setLeadsList(result.data || []);
      } else {
        if (response.status === 501 && result.sql) {
          setLeadsSqlInstructions(result.sql);
        } else {
          setLeadsError(result.error || "Failed to fetch coaching leads");
        }
      }
    } catch (err) {
      setLeadsError("Failed to connect to the server for leads.");
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchFeedback = async (enteredPin: string) => {
    setLoading(true);
    setError("");
    setSqlInstructions(null);

    try {
      const response = await fetch("/api/logo-feedback", {
        headers: {
          "x-admin-pin": enteredPin
        }
      });

      const result = await response.json();

      if (response.ok) {
        setFeedbackList(result.data || []);
        setIsAuthenticated(true);
        sessionStorage.setItem("logo_admin_pin", enteredPin);
        fetchLeads(enteredPin);
      } else {
        if (response.status === 501 && result.sql) {
          // Table doesn't exist error
          setSqlInstructions(result.sql);
          setIsAuthenticated(true);
          sessionStorage.setItem("logo_admin_pin", enteredPin);
          fetchLeads(enteredPin);
        } else {
          setError(result.error || "Invalid PIN or Passcode");
        }
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPin("");
    sessionStorage.removeItem("logo_admin_pin");
    setFeedbackList([]);
    setLeadsList([]);
    setSqlInstructions(null);
    setLeadsSqlInstructions(null);
    setActiveTab("logos");
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030305] text-white flex items-center justify-center p-4">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#B84D72] filter blur-[120px] rounded-full opacity-20 pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[300px] h-[300px] bg-[#E0659A] filter blur-[120px] rounded-full opacity-15 pointer-events-none" />

        <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime mx-auto mb-6 border border-accent-lime/20 animate-pulse">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="font-display font-bold text-2xl tracking-tight mb-2">Admin Dashboard</h1>
            <p className="text-silver-slate text-sm font-light">
              Enter your Admin PIN or Page Passcode to view client brand feedback.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                required
                placeholder="Enter Admin PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-[#0A0A10] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all text-center"
              />
              {error && (
                <p className="text-red-400 text-xs text-center mt-2 font-medium">
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center bg-accent-lime text-cyber-slate font-bold uppercase tracking-wider text-xs py-3 rounded-xl hover:bg-accent-lime/90 transition-all cursor-pointer shadow-lg shadow-accent-lime/10 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Access Portal"}
            </button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col">
      <header className="border-b border-white/5 bg-[#030305]/80 backdrop-blur-md sticky top-0 z-50 py-4 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-lime animate-pulse" />
            <span className="font-display font-bold tracking-wider text-sm uppercase">
              BODIED BY <span className="text-accent-lime">ESH</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchFeedback(pin);
              }}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading || leadsLoading ? "animate-spin text-accent-lime" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="text-xs uppercase tracking-widest text-silver-slate hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 mb-8 gap-6">
          <button
            onClick={() => setActiveTab("logos")}
            className={`pb-3 text-sm font-semibold tracking-wider uppercase transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "logos"
                ? "text-accent-lime border-accent-lime"
                : "text-silver-slate border-transparent hover:text-white"
            }`}
          >
            <Clipboard className="w-4 h-4" />
            Client Logo Choices
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 text-sm font-semibold tracking-wider uppercase transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "leads"
                ? "text-accent-lime border-accent-lime"
                : "text-silver-slate border-transparent hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Coaching Applications
          </button>
        </div>

        {activeTab === "logos" ? (
          <>
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-display font-bold text-3xl tracking-tight">Client Logo Choices</h1>
                <p className="text-silver-slate text-sm font-light mt-1">
                  Real-time feed of favorites and adjustment notes left by clients reviewing the branding options.
                </p>
              </div>
              {/* Finalist Filter Toggle */}
              <div className="flex items-center gap-2 bg-[#0A0A10] border border-white/10 rounded-xl px-4 py-2 shrink-0">
                <input
                  type="checkbox"
                  id="finalist-toggle"
                  checked={showOnlyFinalists}
                  onChange={(e) => setShowOnlyFinalists(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 text-accent-lime bg-black focus:ring-accent-lime focus:ring-offset-black cursor-pointer"
                />
                <label htmlFor="finalist-toggle" className="text-xs font-semibold text-silver-slate cursor-pointer select-none">
                  Show Finalist Selections Only
                </label>
              </div>
            </div>

            {/* Missing Table Warning */}
            {sqlInstructions && (
              <div className="glass-panel border-yellow-500/20 bg-yellow-500/5 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-6">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 border border-yellow-500/25">
                  <Database className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg text-yellow-500 flex items-center gap-2">
                    Database Table Missing
                  </h3>
                  <p className="text-silver-slate text-sm font-light mt-1 mb-4 leading-relaxed">
                    Supabase database credentials are set up, but the <code className="bg-white/5 px-1.5 py-0.5 rounded text-white text-xs font-semibold">logo_feedback</code> table has not been created in the database schema yet. Run the SQL script below in the Supabase SQL editor to create it:
                  </p>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={sqlInstructions}
                      rows={8}
                      className="w-full bg-[#050508] border border-white/10 rounded-2xl p-4 text-xs font-mono focus:outline-none text-silver-slate"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sqlInstructions);
                        alert("SQL copied to clipboard!");
                      }}
                      className="absolute right-3 top-3 px-3 py-1.5 bg-accent-lime text-cyber-slate font-bold uppercase tracking-wider text-[10px] rounded-lg hover:bg-accent-lime/90 transition-all cursor-pointer"
                    >
                      Copy SQL
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments Feed List */}
            {feedbackList.length === 0 ? (
              <div className="glass-panel border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-silver-slate mb-4">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg">No Comments Left Yet</h3>
                <p className="text-silver-slate text-sm font-light mt-1 max-w-sm">
                  When clients submit their favorite logos and feedback notes, they will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {feedbackList
                  .filter((entry) => {
                    if (!showOnlyFinalists) return true;
                    const { hearts } = parseHeartsAndHidden(entry);
                    const hasFinalistHeart = hearts.some((id) => LOGO_OPTIONS.find((l) => l.id === id)?.isFinalist);
                    const hasFinalistFavorite = entry.favorites.some((id) => LOGO_OPTIONS.find((l) => l.id === id)?.isFinalist);
                    return hasFinalistHeart || hasFinalistFavorite;
                  })
                  .map((entry) => {
                    const { hearts, eliminated, cleanedNotes } = parseHeartsAndHidden(entry);
                    const filteredHearts = hearts.filter((id) => LOGO_OPTIONS.find((l) => l.id === id)?.isFinalist || !showOnlyFinalists);
                    const filteredFavorites = entry.favorites.filter((id) => LOGO_OPTIONS.find((l) => l.id === id)?.isFinalist || !showOnlyFinalists);
                    const filteredEliminated = eliminated.filter((id) => LOGO_OPTIONS.find((l) => l.id === id)?.isFinalist || !showOnlyFinalists);
                    return (
                      <div
                        key={entry.id}
                        className="glass-panel border-white/5 hover:border-white/10 rounded-3xl p-6 sm:p-8 transition-all flex flex-col gap-6 relative overflow-hidden"
                      >
                        {/* Time Indicator */}
                        <div className="absolute top-0 right-0 h-1 bg-accent-lime w-1/4 opacity-30" />

                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <h3 className="font-display font-bold text-xl text-white">{entry.client_name}</h3>
                            <p className="text-[11px] text-silver-slate font-light mt-0.5">
                              Submitted on: {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Top Picks List (Hearts - Max 3) */}
                        {filteredHearts && filteredHearts.length > 0 && (
                          <div>
                            <h4 className="text-[11px] uppercase tracking-wider text-rose-500 font-bold mb-3 flex items-center gap-1.5">
                              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                              Top Picks (Hearts - Max 3)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {filteredHearts.map((favId) => {
                                const logo = LOGO_OPTIONS.find((l) => l.id === favId);
                                if (!logo) return null;
                                return <LogoThumbnailCard key={favId} logo={logo} type="heart" />;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Favorites List (Stars - Max 5) */}
                        <div>
                          <h4 className="text-[11px] uppercase tracking-wider text-accent-lime font-bold mb-3 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-accent-lime text-accent-lime" />
                            Favorite Selections (Stars - Max 5)
                          </h4>
                          {filteredFavorites && filteredFavorites.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {filteredFavorites.map((favId) => {
                                const logo = LOGO_OPTIONS.find((l) => l.id === favId);
                                if (!logo) {
                                  return (
                                    <div
                                      key={favId}
                                      className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-3 rounded-2xl text-xs text-white"
                                    >
                                      <Star className="w-3.5 h-3.5 fill-accent-lime text-accent-lime shrink-0" />
                                      <span>Option {favId} (Details unavailable)</span>
                                    </div>
                                  );
                                }
                                return <LogoThumbnailCard key={favId} logo={logo} type="star" />;
                              })}
                            </div>
                          ) : (
                            <span className="text-silver-slate text-xs italic">No favorites marked</span>
                          )}
                        </div>

                        {/* Eliminated Logos List */}
                        {filteredEliminated && filteredEliminated.length > 0 && (
                          <div>
                            <h4 className="text-[11px] uppercase tracking-wider text-red-400 font-bold mb-2">
                              Eliminated Logos (Process of Elimination)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {filteredEliminated.map((favId) => {
                                const logo = LOGO_OPTIONS.find((l) => l.id === favId);
                                return (
                                  <span
                                    key={favId}
                                    className="inline-flex items-center gap-1.5 bg-red-950/20 border border-red-500/20 px-2.5 py-1 rounded-xl text-[10px] text-red-300"
                                    title={logo ? logo.name : `Option ${favId}`}
                                  >
                                    <X className="w-3 h-3 text-red-400" /> Option {favId} {logo ? `: ${logo.name}` : ""}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <h4 className="text-[11px] uppercase tracking-wider text-silver-slate font-medium mb-1.5">
                            Feedback Notes / Adjustments
                          </h4>
                          <div className="bg-[#0A0A10] border border-white/5 rounded-2xl p-4 sm:p-5 text-sm font-light leading-relaxed text-ice-white italic">
                            &ldquo;{cleanedNotes || "No notes provided."}&rdquo;
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-display font-bold text-3xl tracking-tight">Coaching Applications</h1>
              <p className="text-silver-slate text-sm font-light mt-1">
                Internal backup pipeline capturing client applications and program selections.
              </p>
            </div>

            {/* Missing Table Warning for Leads */}
            {leadsSqlInstructions && (
              <div className="glass-panel border-yellow-500/20 bg-yellow-500/5 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-6 animate-in fade-in">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 border border-yellow-500/25">
                  <Database className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg text-yellow-500 flex items-center gap-2">
                    Database Table Missing
                  </h3>
                  <p className="text-silver-slate text-sm font-light mt-1 mb-4 leading-relaxed">
                    Supabase credentials are set up, but the <code className="bg-white/5 px-1.5 py-0.5 rounded text-white text-xs font-semibold">coaching_leads</code> table has not been created yet. Run this SQL script in the Supabase SQL editor:
                  </p>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={leadsSqlInstructions}
                      rows={12}
                      className="w-full bg-[#050508] border border-white/10 rounded-2xl p-4 text-xs font-mono focus:outline-none text-silver-slate font-light leading-relaxed"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(leadsSqlInstructions);
                        alert("SQL copied to clipboard!");
                      }}
                      className="absolute right-3 top-3 px-3 py-1.5 bg-accent-lime text-cyber-slate font-bold uppercase tracking-wider text-[10px] rounded-lg hover:bg-accent-lime/90 transition-all cursor-pointer"
                    >
                      Copy SQL
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Leads list */}
            {leadsLoading ? (
              <div className="text-center py-12 text-silver-slate text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-accent-lime" />
                Loading leads...
              </div>
            ) : leadsError ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{leadsError}</span>
              </div>
            ) : leadsList.length === 0 ? (
              <div className="glass-panel border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-silver-slate mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg">No Applications Found</h3>
                <p className="text-silver-slate text-sm font-light mt-1 max-w-sm">
                  Coaching applications submitted on the website will be collected in Supabase and displayed here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {leadsList.map((lead) => {
                  const dateStr = new Date(lead.created_at).toLocaleString();
                  const isStripeActive = lead.status === "active";
                  
                  return (
                    <div
                      key={lead.id}
                      className="glass-panel border-white/5 hover:border-white/10 rounded-3xl p-6 sm:p-8 transition-all flex flex-col gap-4 relative overflow-hidden"
                    >
                      {/* Status indicator bar */}
                      <div className={`absolute top-0 right-0 h-1 w-1/4 opacity-40 ${isStripeActive ? 'bg-accent-lime' : 'bg-amber-500'}`} />

                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                          <h3 className="font-display font-bold text-xl text-white">{lead.name}</h3>
                          <p className="text-[11px] text-silver-slate font-light mt-0.5">
                            Applied: {dateStr}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isStripeActive 
                              ? 'bg-accent-lime/10 border border-accent-lime/20 text-accent-lime' 
                              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          }`}>
                            {isStripeActive ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
                                Active (Paid)
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Unpaid Lead
                              </>
                            )}
                          </span>
                          
                          {lead.source && (
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-white/5 border border-white/15 text-silver-slate px-2.5 py-1 rounded-xl">
                              {lead.source.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 mt-2 border-t border-white/5 pt-4">
                        <div className="space-y-2 flex flex-col justify-center">
                          <div className="flex items-center gap-2 text-sm text-silver-slate font-light">
                            <Mail className="w-4 h-4 text-accent-lime shrink-0" />
                            <a href={`mailto:${lead.email}`} className="hover:text-white transition-colors truncate">
                              {lead.email}
                            </a>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-sm text-silver-slate font-light">
                              <Phone className="w-4 h-4 text-accent-lime shrink-0" />
                              <a href={`tel:${lead.phone}`} className="hover:text-white transition-colors">
                                {lead.phone}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5 sm:border-l sm:border-white/5 sm:pl-4">
                          <p className="text-xs uppercase tracking-wider text-silver-slate font-medium">Program Selection</p>
                          <p className="text-sm font-semibold text-white">
                            {lead.program_choice ? (
                              lead.program_choice.toUpperCase().replace("_", " ")
                            ) : (
                              <span className="italic font-normal text-silver-slate/60">Not specified</span>
                            )}
                          </p>
                          {lead.track_goal && (
                            <p className="text-xs text-silver-slate font-light">
                              Goal: <span className="text-white font-medium">{lead.track_goal}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
