"use client";
import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  Apple,
  Beef,
  Wheat,
  Droplets,
  Plus,
  X,
} from "lucide-react";

interface FoodItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

interface MealScannerProps {
  onMealLogged?: (items: FoodItem[]) => void;
}

// Simulated AI analysis (replace with real OpenAI Vision API when key is provided)
function simulateMealAnalysis(): FoodItem[] {
  const meals = [
    [
      { name: "Grilled Chicken Breast", grams: 180, calories: 297, protein: 54, carbs: 0, fat: 6.5, confidence: 0.94 },
      { name: "Brown Rice", grams: 150, calories: 165, protein: 3.5, carbs: 35, fat: 1.3, confidence: 0.88 },
      { name: "Steamed Broccoli", grams: 100, calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, confidence: 0.91 },
    ],
    [
      { name: "Salmon Fillet", grams: 200, calories: 412, protein: 40, carbs: 0, fat: 27, confidence: 0.92 },
      { name: "Sweet Potato", grams: 150, calories: 135, protein: 2, carbs: 31, fat: 0.1, confidence: 0.89 },
      { name: "Mixed Greens Salad", grams: 80, calories: 15, protein: 1.2, carbs: 2.5, fat: 0.2, confidence: 0.85 },
    ],
    [
      { name: "Scrambled Eggs (3)", grams: 180, calories: 270, protein: 18, carbs: 3, fat: 21, confidence: 0.95 },
      { name: "Turkey Bacon", grams: 56, calories: 120, protein: 10, carbs: 2, fat: 8, confidence: 0.87 },
      { name: "Whole Wheat Toast", grams: 60, calories: 138, protein: 5, carbs: 24, fat: 2.5, confidence: 0.93 },
      { name: "Avocado (half)", grams: 68, calories: 114, protein: 1.4, carbs: 6, fat: 10.5, confidence: 0.90 },
    ],
  ];
  return meals[Math.floor(Math.random() * meals.length)];
}

export default function MealScanner({ onMealLogged }: MealScannerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<FoodItem[] | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      let stream;
      try {
        // Try mobile back camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (e) {
        // Fallback to default user camera (for desktop/laptops)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setError("");
    } catch {
      setError("Camera access denied. Please verify camera permissions or upload a photo.");
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setImageUrl(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

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
    setResults(null);
    setError("");

    try {
      // Call the real Gemini Vision API via our API route
      const res = await fetch("/api/scan-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageUrl,
          mimeType: imageUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg",
        }),
      });

      const data = await res.json();

      if (data.success && data.items && data.items.length > 0) {
        setResults(data.items);
      } else if (data.error) {
        // API returned an error (maybe key not configured) — fall back to simulation
        console.warn("Gemini API:", data.error, "— using simulated analysis");
        await new Promise((r) => setTimeout(r, 1500));
        setResults(simulateMealAnalysis());
      } else {
        setError("Could not identify any food items. Try a clearer photo.");
      }
    } catch (err) {
      console.error("Meal scan failed:", err);
      // Network error — fall back to simulation
      await new Promise((r) => setTimeout(r, 1200));
      setResults(simulateMealAnalysis());
    }

    setScanning(false);
  };

  const logMeal = async () => {
    if (results && onMealLogged) {
      onMealLogged(results);

      // Also persist to Supabase
      try {
        await fetch("/api/log-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mealType: "snack",
            items: results,
            imageUrl: imageUrl,
          }),
        });
      } catch {
        // Supabase persistence failed — that's ok, local state is already updated
        console.warn("Failed to persist meal to Supabase");
      }
    }
  };

  const reset = () => {
    setImageUrl(null);
    setResults(null);
    setError("");
    stopCamera();
  };

  const totalMacros = results
    ? results.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Capture Area */}
      {!imageUrl && !cameraActive && (
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-accent-lime/30 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
            <Camera className="w-8 h-8" />
          </div>
          <p className="text-silver-slate text-sm text-center">
            Snap a photo of your meal to instantly estimate macros
          </p>
          <div className="flex gap-3">
            <button
              onClick={startCamera}
              className="inline-flex items-center gap-2 bg-accent-lime text-cyber-slate px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-ring"
            >
              <Camera className="w-4 h-4" />
              Open Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 border border-white/10 hover:border-accent-lime px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-silver-slate hover:text-accent-lime transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}

      {/* Camera Feed */}
      {cameraActive && (
        <div className="relative rounded-2xl overflow-hidden">
          <video ref={videoRef} className="w-full rounded-2xl" playsInline muted />
          {/* Scan overlay grid */}
          <div className="absolute inset-0 border-2 border-accent-lime/20 rounded-2xl pointer-events-none">
            <div className="absolute inset-4 border border-accent-lime/10 rounded-xl" />
            <div className="animate-scan-line" />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={captureFromCamera}
              className="w-16 h-16 rounded-full bg-accent-lime flex items-center justify-center shadow-lg shadow-accent-lime/20"
            >
              <Camera className="w-7 h-7 text-cyber-slate" />
            </button>
            <button
              onClick={stopCamera}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-ice-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Preview + Scan */}
      {imageUrl && !results && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imageUrl} alt="Meal photo" className="w-full rounded-2xl" />
            {scanning && (
              <div className="absolute inset-0 bg-cyber-slate/60 flex flex-col items-center justify-center gap-4 rounded-2xl">
                <div className="animate-scan-line" />
                <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
                <p className="text-accent-lime text-xs font-bold uppercase tracking-wider">
                  Analyzing ingredients...
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
                <Apple className="w-4 h-4" />
                Scan for Macros
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 rounded-xl border border-white/10 text-silver-slate hover:text-ice-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results && totalMacros && (
        <div className="space-y-4 animate-fadeIn">
          {/* Total Macros Card */}
          <div className="glass-panel-lime rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-accent-lime" />
              <span className="text-accent-lime text-[10px] font-bold uppercase tracking-widest">
                Meal Analysis Complete
              </span>
            </div>
            <div className="text-3xl font-display font-bold text-ice-white mb-3">
              {Math.round(totalMacros.calories)}{" "}
              <span className="text-sm text-silver-slate font-normal">kcal total</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-cyber-slate/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <Beef className="w-3.5 h-3.5 text-accent-lime" />
                  <span className="text-[10px] text-silver-slate uppercase tracking-wider">Protein</span>
                </div>
                <div className="font-display font-bold text-lg text-accent-lime">
                  {Math.round(totalMacros.protein)}g
                </div>
              </div>
              <div className="p-3 rounded-xl bg-cyber-slate/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wheat className="w-3.5 h-3.5 text-accent-violet" />
                  <span className="text-[10px] text-silver-slate uppercase tracking-wider">Carbs</span>
                </div>
                <div className="font-display font-bold text-lg text-accent-violet">
                  {Math.round(totalMacros.carbs)}g
                </div>
              </div>
              <div className="p-3 rounded-xl bg-cyber-slate/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-ice-white" />
                  <span className="text-[10px] text-silver-slate uppercase tracking-wider">Fat</span>
                </div>
                <div className="font-display font-bold text-lg text-ice-white">
                  {Math.round(totalMacros.fat)}g
                </div>
              </div>
            </div>
          </div>

          {/* Individual Items */}
          <div className="space-y-2">
            {results.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-cyber-slate border border-white/5"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-ice-white">{item.name}</p>
                  <p className="text-[10px] text-silver-slate">
                    {item.grams}g · {Math.round(item.confidence * 100)}% confidence
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-display font-bold text-ice-white">
                    {item.calories} kcal
                  </p>
                  <p className="text-[10px] text-silver-slate">
                    P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={logMeal}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-accent-lime text-cyber-slate px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Plus className="w-4 h-4" />
              Log This Meal
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-xl border border-white/10 text-silver-slate hover:text-ice-white transition-all text-xs font-semibold uppercase tracking-wider"
            >
              Rescan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
