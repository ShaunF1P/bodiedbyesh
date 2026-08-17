"use client";
import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Utensils,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

interface MenuItem {
  name: string;
  category: "best_choice" | "acceptable" | "avoid";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  swap: string | null;
}

interface MenuAdvisorProps {
  remainingBudget?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function MenuAdvisor({ remainingBudget }: MenuAdvisorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [restaurant, setRestaurant] = useState<string>("");
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const runScan = async () => {
    if (!imageUrl) return;
    setScanning(true);
    setItems(null);
    setError("");

    try {
      const res = await fetch("/api/scan-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageUrl,
          mimeType: imageUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg",
          remainingBudget,
        }),
      });

      const data = await res.json();

      if (data.success && data.items) {
        setRestaurant(data.restaurant || "Unknown");
        setItems(data.items);
      } else {
        setError(data.error || "Could not analyze this menu. Try a clearer photo.");
      }
    } catch {
      setError("Menu analysis failed. Check your connection and try again.");
    }

    setScanning(false);
  };

  const reset = () => {
    setImageUrl(null);
    setItems(null);
    setError("");
    setRestaurant("");
  };

  const categoryConfig = {
    best_choice: {
      label: "Best Choice",
      icon: ThumbsUp,
      bg: "bg-accent-lime/10",
      border: "border-accent-lime/20",
      text: "text-accent-lime",
      badge: "bg-accent-lime text-cyber-slate",
    },
    acceptable: {
      label: "Acceptable",
      icon: ArrowRight,
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      text: "text-yellow-400",
      badge: "bg-yellow-500/20 text-yellow-400",
    },
    avoid: {
      label: "Avoid",
      icon: ThumbsDown,
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-400",
      badge: "bg-red-500/20 text-red-400",
    },
  };

  return (
    <div className="space-y-4">
      {/* Upload State */}
      {!imageUrl && (
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-accent-lime/30 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
            <Utensils className="w-8 h-8" />
          </div>
          <p className="text-silver-slate text-sm text-center">
            Snap a photo of a restaurant menu — AI will highlight the best macro-friendly options
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-accent-lime text-cyber-slate px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-ring"
          >
            <Camera className="w-4 h-4" />
            Photograph Menu
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          {remainingBudget && (
            <div className="w-full p-3 rounded-xl bg-accent-lime/5 border border-accent-lime/15 text-[10px] text-silver-slate">
              <span className="text-accent-lime font-bold">Your remaining budget: </span>
              {remainingBudget.calories} kcal · P:{remainingBudget.protein}g · C:{remainingBudget.carbs}g · F:{remainingBudget.fat}g
            </div>
          )}
        </div>
      )}

      {/* Preview + Scan */}
      {imageUrl && !items && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imageUrl} alt="Menu photo" className="w-full rounded-2xl" />
            {scanning && (
              <div className="absolute inset-0 bg-cyber-slate/60 flex flex-col items-center justify-center gap-4 rounded-2xl">
                <div className="animate-scan-line" />
                <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
                <p className="text-accent-lime text-xs font-bold uppercase tracking-wider">
                  Analyzing menu items...
                </p>
              </div>
            )}
          </div>
          {!scanning && (
            <div className="flex gap-3">
              <button
                onClick={runScan}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-accent-lime text-cyber-slate px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                <Utensils className="w-4 h-4" />
                Analyze Menu
              </button>
              <button onClick={reset} className="px-4 py-3 rounded-xl border border-white/10 text-silver-slate hover:text-ice-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {items && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-accent-lime" />
            <span className="text-accent-lime text-[10px] font-bold uppercase tracking-widest">
              Menu Analyzed — {restaurant}
            </span>
          </div>

          {/* Grouped by category */}
          {(["best_choice", "acceptable", "avoid"] as const).map((cat) => {
            const catItems = items.filter((item) => item.category === cat);
            if (catItems.length === 0) return null;
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;

            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>
                    {cfg.label} ({catItems.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {catItems.map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-ice-white">{item.name}</p>
                          <p className="text-[10px] text-silver-slate mt-0.5">
                            {item.calories} kcal · P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {item.swap && (
                        <div className="mt-2 p-2 rounded-lg bg-cyber-slate/60 text-[11px] text-silver-slate flex items-center gap-2">
                          <span className="text-accent-lime font-bold shrink-0 flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Swap:</span>
                          </span>
                          <span>{item.swap}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <button
            onClick={reset}
            className="w-full px-4 py-3 rounded-xl border border-white/10 text-silver-slate hover:text-ice-white transition-all text-xs font-semibold uppercase tracking-wider"
          >
            Scan Another Menu
          </button>
        </div>
      )}
    </div>
  );
}
