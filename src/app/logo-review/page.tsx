"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { Lock, Eye, EyeOff, CheckCircle, ChevronLeft, ChevronRight, MessageSquare, Filter, Moon, Sun, Star, Heart, Shirt, X, BookOpen } from "lucide-react";
import { LOGO_OPTIONS, type LogoOption } from "@/lib/logos";

export default function LogoReview() {
  const [selectedId, setSelectedId] = useState(36);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark");
  const [clientName, setClientName] = useState("");
  const [feedback, setFeedback] = useState("");

  // Preference Banks State
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedHearts, setSelectedHearts] = useState<number[]>([]);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);

  // Visualizer State
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [visualizerTheme, setVisualizerTheme] = useState<"dark" | "light">("dark");

  // Drawer / UI State
  const [showHiddenList, setShowHiddenList] = useState(false);
  const [particles, setParticles] = useState<{ id: number; type: "star" | "heart"; x: number; y: number }[]>([]);
  const [bankBounceType, setBankBounceType] = useState<"star" | "heart" | null>(null);

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("logo_client_name");
    if (savedName) {
      setClientName(savedName);
    }

    // Load saved preferences if they exist
    try {
      const savedStars = JSON.parse(localStorage.getItem("logo_pref_stars") || "[]");
      const savedHearts = JSON.parse(localStorage.getItem("logo_pref_hearts") || "[]");
      const savedHidden = JSON.parse(localStorage.getItem("logo_pref_hidden") || "[]");
      setSelectedStars(savedStars);
      setSelectedHearts(savedHearts);
      setHiddenIds(savedHidden);
    } catch (e) {
      console.warn("Failed to parse saved logo preferences:", e);
    }

    // Auto-sync unsynced local feedback to database
    const syncLocalFeedback = async () => {
      const submissions = JSON.parse(localStorage.getItem("logo_feedback") || "[]");
      let updated = false;

      for (let i = 0; i < submissions.length; i++) {
        const sub = submissions[i];
        if (!sub.synced) {
          try {
            const res = await fetch("/api/logo-feedback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientName: sub.clientName || savedName || "Guest Client (Recovered)",
                favorites: sub.favorites || [],
                hearts: sub.hearts || [],
                eliminated: sub.eliminated || [],
                notes: sub.notes || ""
              })
            });
            if (res.ok) {
              sub.synced = true;
              updated = true;
            }
          } catch (err) {
            console.error("Auto-sync error for entry:", sub, err);
          }
        }
      }

      if (updated) {
        localStorage.setItem("logo_feedback", JSON.stringify(submissions));
      }
    };

    syncLocalFeedback();
  }, []);

  // Sync state changes to local storage
  useEffect(() => {
    localStorage.setItem("logo_pref_stars", JSON.stringify(selectedStars));
  }, [selectedStars]);

  useEffect(() => {
    localStorage.setItem("logo_pref_hearts", JSON.stringify(selectedHearts));
  }, [selectedHearts]);

  useEffect(() => {
    localStorage.setItem("logo_pref_hidden", JSON.stringify(hiddenIds));
  }, [hiddenIds]);

  const filteredLogos = LOGO_OPTIONS.filter((logo) => {
    if (!logo.isFinalist) return false;
    if (hiddenIds.includes(logo.id)) return false;
    if (categoryFilter === "all") return true;
    if (categoryFilter === "base") return logo.id === 36;
    if (categoryFilter === "refined") return [72, 73, 74, 75].includes(logo.id);
    return false;
  });

  const selectedLogo = LOGO_OPTIONS.find((logo) => logo.id === selectedId) || LOGO_OPTIONS[0];

  const handlePrev = () => {
    const currentIndex = filteredLogos.findIndex((logo) => logo.id === selectedId);
    if (currentIndex > 0) {
      setSelectedId(filteredLogos[currentIndex - 1].id);
    } else {
      setSelectedId(filteredLogos[filteredLogos.length - 1].id);
    }
  };

  const handleNext = () => {
    const currentIndex = filteredLogos.findIndex((logo) => logo.id === selectedId);
    if (currentIndex < filteredLogos.length - 1) {
      setSelectedId(filteredLogos[currentIndex + 1].id);
    } else {
      setSelectedId(filteredLogos[0].id);
    }
  };

  // Preference Toggle Logic
  const handleStarToggle = (id: number, e: React.MouseEvent) => {
    if (selectedStars.includes(id)) {
      setSelectedStars(selectedStars.filter((sId) => sId !== id));
    } else {
      if (selectedStars.length >= 5) {
        alert("Your Star Bank is full! You can only mark up to 5 Favorites. Un-star another option first.");
        return;
      }
      // Remove from hearts if it was there
      setSelectedHearts(selectedHearts.filter((hId) => hId !== id));
      setSelectedStars([...selectedStars, id]);
      triggerBankAnimation("star", e);
    }
  };

  const handleHeartToggle = (id: number, e: React.MouseEvent) => {
    if (selectedHearts.includes(id)) {
      setSelectedHearts(selectedHearts.filter((hId) => hId !== id));
    } else {
      if (selectedHearts.length >= 3) {
        alert("Your Heart Bank is full! You can only mark up to 3 Top Picks. Un-heart another option first.");
        return;
      }
      // Remove from stars if it was there
      setSelectedStars(selectedStars.filter((sId) => sId !== id));
      setSelectedHearts([...selectedHearts, id]);
      triggerBankAnimation("heart", e);
    }
  };

  const triggerBankAnimation = (type: "star" | "heart", e: React.MouseEvent) => {
    // Spawn floating particle elements at click position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + window.scrollY;

    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      type,
      x: x + (Math.random() - 0.5) * 40,
      y: y - 10 - Math.random() * 20
    }));

    setParticles((prev) => [...prev, ...newParticles]);
    setBankBounceType(type);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 850);

    setTimeout(() => {
      setBankBounceType(null);
    }, 400);
  };

  const handleHideLogo = (id: number) => {
    // Remove from star/heart banks first
    setSelectedStars(selectedStars.filter((sId) => sId !== id));
    setSelectedHearts(selectedHearts.filter((hId) => hId !== id));
    
    // Add to hidden list
    setHiddenIds([...hiddenIds, id]);

    // Find next logo to select
    const currentIndex = filteredLogos.findIndex((logo) => logo.id === id);
    if (filteredLogos.length > 1) {
      let nextId = filteredLogos[0].id;
      const remaining = filteredLogos.filter((logo) => logo.id !== id);
      if (currentIndex < remaining.length) {
        nextId = remaining[currentIndex].id;
      } else {
        nextId = remaining[remaining.length - 1].id;
      }
      setSelectedId(nextId);
    }
  };

  const handleUnhideLogo = (id: number) => {
    setHiddenIds(hiddenIds.filter((hId) => hId !== id));
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setIsSubmittingFeedback(true);

    localStorage.setItem("logo_client_name", clientName.trim());

    let wasSynced = false;
    try {
      const response = await fetch("/api/logo-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          favorites: selectedStars,
          hearts: selectedHearts,
          eliminated: hiddenIds,
          notes: feedback
        })
      });

      if (response.ok) {
        wasSynced = true;
      } else {
        const errData = await response.json();
        console.warn("Backend save failed, using local storage backup:", errData);
      }
    } catch (err) {
      console.warn("Network error during feedback submit, using local storage backup:", err);
    }

    // Always save locally as backup
    const submissions = JSON.parse(localStorage.getItem("logo_feedback") || "[]");
    submissions.push({
      timestamp: new Date().toISOString(),
      clientName: clientName.trim(),
      favorites: selectedStars,
      hearts: selectedHearts,
      eliminated: hiddenIds,
      notes: feedback,
      synced: wasSynced
    });
    localStorage.setItem("logo_feedback", JSON.stringify(submissions));

    setIsSubmittingFeedback(false);
    setFeedbackSubmitted(true);
  };

  const getCopyText = () => {
    const starNames = selectedStars
      .map((id) => {
        const option = LOGO_OPTIONS.find((l) => l.id === id);
        return `- Option ${id} (Star): ${option ? option.name : ""}`;
      })
      .join("\n");

    const heartNames = selectedHearts
      .map((id) => {
        const option = LOGO_OPTIONS.find((l) => l.id === id);
        return `- Option ${id} (Heart): ${option ? option.name : ""}`;
      })
      .join("\n");

    const eliminatedText = hiddenIds.length > 0 ? `Eliminated Options: ${hiddenIds.join(", ")}` : "";

    return `Hey Esh! Just finished reviewing the logo concepts. Here is my feedback:

Top Picks (Hearts - Max 3):
${heartNames || "None marked yet"}

Favorites (Stars - Max 5):
${starNames || "None marked yet"}

${eliminatedText ? `\n${eliminatedText}` : ""}

Feedback Notes:
${feedback || "No specific notes"}

— ${clientName}`;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getCopyText());
    alert("Selections and feedback copied to clipboard! You can now paste and send them directly to Esh.");
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col pb-28 relative">
      {/* Dynamic particles renderer */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute z-50 text-xl font-bold animate-particle-float"
          style={{
            left: p.x,
            top: p.y - window.scrollY,
            color: p.type === "star" ? "#B4F461" : "#F43F5E",
            position: "fixed"
          }}
        >
          {p.type === "star" ? <Star className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4 fill-current" />}
        </div>
      ))}

      {/* Embedded CSS animations */}
      <style jsx global>{`
        @keyframes particle-float {
          0% {
            transform: translateY(0) scale(0.8) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-90px) scale(1.4) rotate(35deg);
            opacity: 0;
          }
        }
        .animate-particle-float {
          animation: particle-float 0.85s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>

      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#B84D72] filter blur-[120px] rounded-full opacity-10 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] bg-[#E0659A] filter blur-[120px] rounded-full opacity-10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/80 backdrop-blur-md sticky top-0 z-40 py-4 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-lime animate-pulse" />
            <span className="font-display font-bold tracking-wider text-sm uppercase">
              BODIED BY <span className="text-accent-lime">ESH</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/brand-guide"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent-lime/10 border border-accent-lime/20 text-accent-lime hover:bg-accent-lime/20 hover:border-accent-lime/40 transition-all"
            >
              <BookOpen className="w-3 h-3" />
              Brand Guide
            </Link>
            <span className="text-[10px] uppercase tracking-widest text-silver-slate bg-white/5 border border-white/10 px-3 py-1 rounded-full font-medium">
              Logo Review Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 grid lg:grid-cols-12 gap-8">
        {/* Left Side: Controls & List */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-accent-lime" />
              <h3 className="font-display font-bold text-lg">Filter Categories</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { val: "all", label: "All Variations" },
                { val: "base", label: "Base Design" },
                { val: "refined", label: "Refined Finishes" }
              ].map((cat) => (
                <button
                  key={cat.val}
                  onClick={() => {
                    setCategoryFilter(cat.val);
                    const available = LOGO_OPTIONS.filter((logo) => {
                      if (!logo.isFinalist) return false;
                      if (hiddenIds.includes(logo.id)) return false;
                      if (cat.val === "all") return true;
                      if (cat.val === "base") return logo.id === 36;
                      if (cat.val === "refined") return [72, 73, 74, 75].includes(logo.id);
                      return false;
                    });
                    if (available.length > 0 && !available.some((l) => l.id === selectedId)) {
                      setSelectedId(available[0].id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                    categoryFilter === cat.val
                      ? "bg-accent-lime border-accent-lime text-cyber-slate"
                      : "bg-white/5 border-white/10 text-silver-slate hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Options Grid List */}
          <div className="glass-panel border-white/5 rounded-3xl p-6 flex-1 flex flex-col min-h-[400px]">
            <h3 className="font-display font-bold text-lg mb-4">Logo Options ({filteredLogos.length})</h3>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] scrollbar-hide pr-1">
              {filteredLogos.map((logo) => {
                const isStar = selectedStars.includes(logo.id);
                const isHeart = selectedHearts.includes(logo.id);
                return (
                  <div
                    key={logo.id}
                    onClick={() => setSelectedId(logo.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedId === logo.id
                        ? "bg-accent-lime/10 border-accent-lime/30 text-accent-lime"
                        : "bg-white/5 border-transparent text-silver-slate hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center font-display font-bold text-[10px]">
                        {logo.id}
                      </span>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{logo.name}</p>
                        <p className="text-[10px] opacity-60 capitalize mt-0.5">{logo.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isHeart && (
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                      )}
                      {isStar && (
                        <Star className="w-4 h-4 fill-accent-lime text-accent-lime shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Eliminated Logos Drawer */}
          {hiddenIds.length > 0 && (
            <div className="glass-panel border-white/5 rounded-3xl p-5">
              <button
                type="button"
                onClick={() => setShowHiddenList(!showHiddenList)}
                className="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-all cursor-pointer"
              >
                <span>Hidden/Eliminated Logos ({hiddenIds.length})</span>
                <span className="text-silver-slate/60">{showHiddenList ? "▼" : "▶"}</span>
              </button>
              
              {showHiddenList && (
                <div className="mt-4 space-y-2 max-h-[160px] overflow-y-auto scrollbar-hide pr-1">
                  {hiddenIds.map((hId) => {
                    const logo = LOGO_OPTIONS.find((l) => l.id === hId);
                    return (
                      <div
                        key={hId}
                        className="flex items-center justify-between p-2 rounded-xl bg-red-950/10 border border-red-500/10 text-xs text-silver-slate"
                      >
                        <span className="truncate">Option {hId}: {logo?.name}</span>
                        <button
                          type="button"
                          onClick={() => handleUnhideLogo(hId)}
                          className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] text-white transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Restore
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Interactive Preview */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Main Preview Board */}
          <div className="glass-panel border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center relative overflow-hidden">
            {/* Header controls inside preview */}
            <div className="w-full flex justify-between items-center mb-6 z-10">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-accent-lime font-bold">
                  Option {selectedLogo.id} of {LOGO_OPTIONS.filter(l => l.isFinalist).length} Finalists
                </span>
                <h2 className="font-display font-bold text-2xl mt-0.5">{selectedLogo.name}</h2>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center gap-2 bg-[#0A0A10] border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setPreviewTheme("dark")}
                  className={`p-2 rounded-lg transition-all ${
                    previewTheme === "dark" ? "bg-white/10 text-white" : "text-silver-slate hover:text-white"
                  }`}
                  title="Preview on Dark Background"
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewTheme("light")}
                  className={`p-2 rounded-lg transition-all ${
                    previewTheme === "light" ? "bg-white/10 text-cyber-slate" : "text-silver-slate hover:text-white"
                  }`}
                  title="Preview on Light Background"
                >
                  <Sun className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Display Board */}
            <div
              className={`w-full aspect-[16/9] rounded-2xl flex items-center justify-center p-10 sm:p-12 md:p-14 transition-all duration-300 relative border border-white/5 overflow-hidden ${
                previewTheme === "dark" ? "bg-[#030305]" : "bg-[#F8F7FA]"
              }`}
            >
              {/* Grid Background in Dark Mode */}
              {previewTheme === "dark" && (
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40 pointer-events-none rounded-2xl" />
              )}
              
              {/* Logo Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedLogo.image}
                alt={selectedLogo.name}
                style={{
                  filter: previewTheme === "light" ? "invert(1) brightness(0.2) opacity(0.85)" : undefined,
                  maxWidth: "85%",
                  maxHeight: "80%",
                  margin: "auto"
                }}
                className="object-contain relative z-10 rounded-lg transition-all duration-300"
              />
            </div>

            {/* Bottom Info & Navigation */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 z-10 pt-4 border-t border-white/5">
              <p className="text-silver-slate text-sm font-light text-center sm:text-left max-w-md">
                {selectedLogo.desc}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-2 justify-center sm:justify-end">
                {/* Visualizer Trigger */}
                <button
                  type="button"
                  onClick={() => setIsVisualizerOpen(true)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-silver-slate hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Visualize on apparel & merchandise"
                >
                  <Shirt className="w-4 h-4 text-accent-lime" />
                  <span>Visualize</span>
                </button>

                {/* Star Button */}
                <button
                  type="button"
                  onClick={(e) => handleStarToggle(selectedLogo.id, e)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedStars.includes(selectedLogo.id)
                      ? "bg-accent-lime border-accent-lime text-cyber-slate"
                      : "bg-white/5 border-white/10 text-silver-slate hover:text-white"
                  }`}
                >
                  <Star className={`w-4 h-4 ${selectedStars.includes(selectedLogo.id) ? "fill-cyber-slate" : ""}`} />
                  <span>{selectedStars.includes(selectedLogo.id) ? "Starred" : "Star"}</span>
                </button>

                {/* Heart Button */}
                <button
                  type="button"
                  onClick={(e) => handleHeartToggle(selectedLogo.id, e)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedHearts.includes(selectedLogo.id)
                      ? "bg-rose-500 border-rose-500 text-white"
                      : "bg-white/5 border-white/10 text-silver-slate hover:text-white"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${selectedHearts.includes(selectedLogo.id) ? "fill-white" : ""}`} />
                  <span>{selectedHearts.includes(selectedLogo.id) ? "Hearted" : "Heart"}</span>
                </button>

                {/* Hide Button */}
                <button
                  type="button"
                  onClick={() => handleHideLogo(selectedLogo.id)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Hide logo from view"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>Hide</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrev}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="glass-panel border-white/5 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-accent-lime" />
              <h3 className="font-display font-bold text-xl">Feedback &amp; Selection</h3>
            </div>

            {feedbackSubmitted ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-accent-lime/10 text-accent-lime flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-lg mb-1">Feedback Saved!</h4>
                <p className="text-silver-slate text-sm font-light mb-6">
                  Thank you for submitting your preferences. Esh will review your selections. You can also copy a formatted summary below to send via text or WhatsApp!
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={handleCopyToClipboard}
                    className="px-5 py-2.5 bg-accent-lime text-cyber-slate font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-accent-lime/90 transition-all cursor-pointer shadow-lg shadow-accent-lime/10"
                  >
                    Copy Summary to Clipboard
                  </button>
                  <button
                    onClick={() => setFeedbackSubmitted(false)}
                    className="px-5 py-2.5 border border-white/10 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-white/5 transition-all text-white cursor-pointer"
                  >
                    Edit Selections
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-2">
                    Your Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:text-silver-slate/40"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-2">
                    Your Selection Summary:
                  </label>
                  <div className="space-y-2">
                    {/* Stars List */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] text-accent-lime uppercase font-bold tracking-wider shrink-0 min-w-[70px] flex items-center gap-1">
                        <Star className="w-3 h-3 fill-accent-lime" /> Favorites:
                      </span>
                      {selectedStars.length > 0 ? (
                        selectedStars.map((favId) => {
                          const fav = LOGO_OPTIONS.find((l) => l.id === favId);
                          return (
                            <span
                              key={favId}
                              onClick={(e) => handleStarToggle(favId, e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-lime/10 border border-accent-lime/25 text-accent-lime text-xs font-semibold cursor-pointer hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400 transition-all"
                            >
                              Option {favId}: {fav?.name} &times;
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-silver-slate/50 text-xs italic">No stars assigned yet (Max 5)</span>
                      )}
                    </div>

                    {/* Hearts List */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider shrink-0 min-w-[70px] flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-rose-400" /> Top Picks:
                      </span>
                      {selectedHearts.length > 0 ? (
                        selectedHearts.map((favId) => {
                          const fav = LOGO_OPTIONS.find((l) => l.id === favId);
                          return (
                            <span
                              key={favId}
                              onClick={(e) => handleHeartToggle(favId, e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold cursor-pointer hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400 transition-all"
                            >
                              Option {favId}: {fav?.name} &times;
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-silver-slate/50 text-xs italic">No hearts assigned yet (Max 3)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-silver-slate font-medium mb-2">
                    Feedback or Custom Adjustments Notes:
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell Esh what you like about your selections, or if there are specific tweaks you'd like to see..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-white/10 focus:border-accent-lime rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:text-silver-slate/40"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="px-6 py-3 bg-accent-lime text-cyber-slate font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-accent-lime/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingFeedback ? "Saving..." : "Submit Selection"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Brand Style Guide CTA Card */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 mb-8">
        <Link href="/brand-guide" className="block">
          <div className="glass-panel border border-accent-lime/10 rounded-3xl p-6 sm:p-8 hover:border-accent-lime/30 transition-all group cursor-pointer">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-lime/10 border border-accent-lime/20 flex items-center justify-center text-accent-lime shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg group-hover:text-accent-lime transition-colors">Brand Style Guide</h3>
                  <p className="text-silver-slate text-sm font-light mt-1 max-w-lg">
                    Access the complete brand management manual — color codes, typography specs, logo usage rules, voice guidelines, and competitive positioning.
                  </p>
                </div>
              </div>
              <span className="px-4 py-2 rounded-xl bg-accent-lime/10 border border-accent-lime/20 text-accent-lime text-xs font-bold uppercase tracking-wider group-hover:bg-accent-lime group-hover:text-[#050508] transition-all shrink-0">
                Open Guide →
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Floating Preference Bank */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#06060c]/90 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3.5 flex items-center justify-between gap-6 shadow-2xl shadow-black/85 w-[90vw] sm:w-[480px]">
        {/* Star Bank */}
        <div className={`flex flex-col gap-1 items-start transition-all duration-300 ${bankBounceType === "star" ? "scale-105" : ""}`}>
          <div className="flex items-center gap-1.5">
            <Star className={`w-4 h-4 ${selectedStars.length > 0 ? "fill-accent-lime text-accent-lime animate-pulse" : "text-silver-slate/50"}`} />
            <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold">Stars Used</span>
            <span className="text-xs font-display font-bold text-accent-lime">({selectedStars.length}/5)</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 flex items-center justify-center transition-all ${
                  i < selectedStars.length ? "text-accent-lime scale-110 drop-shadow-[0_0_8px_rgba(180,244,97,0.5)]" : "text-white/10"
                }`}
              >
                <Star className="w-2.5 h-2.5 fill-current" />
              </span>
            ))}
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="w-px h-8 bg-white/10 shrink-0" />

        {/* Heart Bank */}
        <div className={`flex flex-col gap-1 items-start transition-all duration-300 ${bankBounceType === "heart" ? "scale-105" : ""}`}>
          <div className="flex items-center gap-1.5">
            <Heart className={`w-4 h-4 ${selectedHearts.length > 0 ? "fill-rose-500 text-rose-500 animate-pulse" : "text-silver-slate/50"}`} />
            <span className="text-[10px] uppercase tracking-wider text-silver-slate font-bold">Hearts Used</span>
            <span className="text-xs font-display font-bold text-rose-400">({selectedHearts.length}/3)</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 flex items-center justify-center transition-all ${
                  i < selectedHearts.length ? "text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-white/10"
                }`}
              >
                <Heart className="w-2.5 h-2.5 fill-current" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Merch Visualizer Modal */}
      {isVisualizerOpen && (
        <div className="fixed inset-0 z-50 bg-[#030305]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D0D15] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setIsVisualizerOpen(false)}
              className="absolute top-4 right-4 text-silver-slate hover:text-white p-2 rounded-full hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-accent-lime font-bold">
                  Dynamic Visualizer
                </span>
                <h3 className="font-display font-bold text-2xl text-white mt-1">
                  Mockup: {selectedLogo.name}
                </h3>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center gap-2 bg-[#0A0A10] border border-white/10 rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setVisualizerTheme("dark")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    visualizerTheme === "dark" ? "bg-white/10 text-white" : "text-silver-slate hover:text-white"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark Apparel
                </button>
                <button
                  onClick={() => setVisualizerTheme("light")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    visualizerTheme === "light" ? "bg-white/10 text-cyber-slate" : "text-silver-slate hover:text-white"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light Apparel
                </button>
              </div>
            </div>

            {/* Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hoodie Card */}
              <div className="bg-[#050508] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden group">
                <span className="text-[10px] uppercase tracking-wider text-silver-slate/50 font-bold self-start">
                  Athletic Hoodie
                </span>
                <div className="w-full aspect-[4/3] rounded-xl relative overflow-hidden bg-[#0A0A10] flex items-center justify-center border border-white/5">
                  {/* Blank black hoodie template */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mockups/hoodie.png"
                    alt="Hoodie template"
                    className={`w-full h-full object-cover select-none transition-all duration-500 ${
                      visualizerTheme === "light" ? "invert hue-rotate-180 brightness-[1.05]" : ""
                    }`}
                  />
                  {/* Logo Overlay */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedLogo.image}
                    alt="Logo overlay"
                    style={{
                      position: "absolute",
                      top: "45%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "24%",
                      filter: visualizerTheme === "light" ? "invert(1) brightness(0.2) opacity(0.85)" : undefined
                    }}
                    className="object-contain pointer-events-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* T-Shirt Card */}
              <div className="bg-[#050508] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden group">
                <span className="text-[10px] uppercase tracking-wider text-silver-slate/50 font-bold self-start">
                  Athletic T-Shirt
                </span>
                <div className={`w-full aspect-[4/3] rounded-xl relative overflow-hidden flex items-center justify-center border border-white/5 transition-all duration-500 ${
                  visualizerTheme === "dark" ? "bg-[#1E1E28]" : "bg-[#0A0A10]"
                }`}>
                  {/* Blank white t-shirt template */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mockups/tshirt.png"
                    alt="T-shirt template"
                    className={`w-full h-full object-cover select-none transition-all duration-500 ${
                      visualizerTheme === "dark" ? "brightness-[0.20] contrast-[1.15]" : ""
                    }`}
                  />
                  {/* Logo Overlay */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedLogo.image}
                    alt="Logo overlay"
                    style={{
                      position: "absolute",
                      top: "43%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "24%",
                      filter: visualizerTheme === "light" ? "invert(1) brightness(0.2) opacity(0.85)" : undefined
                    }}
                    className="object-contain pointer-events-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Gym Towel Card */}
              <div className="bg-[#050508] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden group">
                <span className="text-[10px] uppercase tracking-wider text-silver-slate/50 font-bold self-start">
                  Fitness Towel
                </span>
                <div className="w-full aspect-[4/3] rounded-xl relative overflow-hidden bg-[#0A0A10] flex items-center justify-center border border-white/5">
                  {/* Blank fitness towel template */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mockups/towel.png"
                    alt="Towel template"
                    className={`w-full h-full object-cover select-none transition-all duration-500 ${
                      visualizerTheme === "light"
                        ? "invert hue-rotate-180 brightness-[1.05]"
                        : "invert hue-rotate-180 brightness-[0.52] contrast-[0.9]"
                    }`}
                  />
                  {/* Logo Overlay (Dynamically matches towel shade) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedLogo.image}
                    alt="Logo overlay"
                    style={{
                      position: "absolute",
                      top: "35%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "28%",
                      filter: visualizerTheme === "light" ? "invert(1) brightness(0.2) opacity(0.85)" : undefined
                    }}
                    className="object-contain pointer-events-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Billboard Card */}
              <div className="bg-[#050508] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden group">
                <span className="text-[10px] uppercase tracking-wider text-silver-slate/50 font-bold self-start">
                  City Outdoor Billboard
                </span>
                <div className="w-full aspect-[4/3] rounded-xl relative overflow-hidden bg-[#0A0A10] flex items-center justify-center border border-white/5">
                  {/* Blank billboard template */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mockups/billboard.png"
                    alt="Billboard template"
                    className="w-full h-full object-cover select-none"
                  />
                  {/* High-Contrast Poster Panel for the Billboard */}
                  <div
                    style={{
                      position: "absolute",
                      top: "43%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "55%",
                      height: "33%",
                      backgroundColor: visualizerTheme === "dark" ? "#09090E" : "#F3F2F5",
                      border: "2px solid rgba(255,255,255,0.08)",
                      boxShadow: "inset 0 4px 12px rgba(0,0,0,0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {/* Logo Overlay */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedLogo.image}
                      alt="Logo overlay"
                      style={{
                        maxWidth: "80%",
                        maxHeight: "80%",
                        objectFit: "contain",
                        filter: visualizerTheme === "light" ? "invert(1) brightness(0.2) opacity(0.85)" : undefined
                      }}
                      className="transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hint */}
            <p className="text-[10px] text-silver-slate/60 font-light italic mt-6 text-center">
              * Note: The visualizer renders transparent versions of each logo using CSS blending overlays to project colors onto fabrics.
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
