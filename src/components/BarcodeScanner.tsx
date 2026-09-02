"use client";
import React, { useState, useRef, useEffect } from "react";
import { ScanBarcode, Loader2, CheckCircle, Plus, X, AlertCircle } from "lucide-react";
import { fetchWithTimeout } from "@/lib/http/safe-fetch";

interface NutritionData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  brand?: string;
  image?: string;
}

interface BarcodeScannerProps {
  onFoodLogged?: (food: NutritionData) => void;
}

export default function BarcodeScanner({ onFoodLogged }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<NutritionData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startScanner = async () => {
    setError("");
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // Check if BarcodeDetector is available
      if ("BarcodeDetector" in window) {
        startNativeDetection();
      } else {
        // Fallback: manual barcode entry
        setError("Barcode detection not supported in this browser. Enter UPC manually below.");
      }
    } catch {
      setError("Camera access denied. Enter UPC code manually below.");
    }
  };

  const startNativeDetection = () => {
    // @ts-expect-error BarcodeDetector is not yet in TypeScript lib
    const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          stopScanner();
          await lookupBarcode(code);
        }
      } catch {
        // Detection frame failed, continue scanning
      }
    }, 500);
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookupBarcode = async (code: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetchWithTimeout(
        `https://world.openfoodfacts.org/api/v2/product/${code}?fields=product_name,nutriments,brands,image_front_small_url,serving_size`,
        undefined,
        8000
      );
      const data = await res.json();

      if (data.status === 0 || !data.product) {
        setError(`Product not found for barcode: ${code}`);
        setLoading(false);
        return;
      }

      const p = data.product;
      const n = p.nutriments || {};

      setResult({
        name: p.product_name || "Unknown Product",
        calories: Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0),
        protein: Math.round((n.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
        fat: Math.round((n.fat_100g || 0) * 10) / 10,
        servingSize: p.serving_size || "per 100g",
        brand: p.brands || undefined,
        image: p.image_front_small_url || undefined,
      });
    } catch {
      setError("Failed to lookup product. Please try again.");
    }
    setLoading(false);
  };

  const [manualCode, setManualCode] = useState("");

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      lookupBarcode(manualCode.trim());
    }
  };

  const reset = () => {
    setResult(null);
    setError("");
    setManualCode("");
    stopScanner();
  };

  return (
    <div className="space-y-4">
      {/* Scanner UI */}
      {!result && !scanning && !loading && (
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-accent-lime/30 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
            <ScanBarcode className="w-8 h-8" />
          </div>
          <p className="text-silver-slate text-sm text-center">
            Scan a barcode to instantly look up nutrition facts
          </p>
          <button
            onClick={startScanner}
            className="inline-flex items-center gap-2 bg-accent-lime text-cyber-slate px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-ring"
          >
            <ScanBarcode className="w-4 h-4" />
            Start Scanner
          </button>

          {/* Manual entry fallback */}
          <div className="w-full pt-4 border-t border-white/5">
            <form onSubmit={handleManualLookup} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Or enter UPC code..."
                className="flex-1 bg-cyber-slate border border-white/10 focus:border-accent-lime rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-accent-lime/10 border border-accent-lime/20 text-accent-lime hover:bg-accent-lime/20 transition-all text-xs font-bold"
              >
                Lookup
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Camera Feed */}
      {scanning && (
        <div className="relative rounded-2xl overflow-hidden">
          <video ref={videoRef} className="w-full rounded-2xl" playsInline muted />
          <div className="absolute inset-0 pointer-events-none">
            {/* Scan target area */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-accent-lime/50 rounded-xl">
              <div className="animate-scan-line" />
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <button
              onClick={stopScanner}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold text-ice-white"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4 p-12 rounded-2xl glass-panel">
          <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
          <p className="text-silver-slate text-sm">Looking up product...</p>
        </div>
      )}

      {/* Error */}
      {error && !scanning && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fadeIn">
          <div className="glass-panel-lime rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-accent-lime" />
              <span className="text-accent-lime text-[10px] font-bold uppercase tracking-widest">
                Product Found
              </span>
            </div>
            <div className="flex gap-4">
              {result.image && (
                <img
                  src={result.image}
                  alt={result.name}
                  className="w-16 h-16 rounded-xl object-cover bg-white/5"
                />
              )}
              <div className="flex-1">
                <h4 className="font-display font-bold text-lg text-ice-white">{result.name}</h4>
                {result.brand && (
                  <p className="text-silver-slate text-xs">{result.brand}</p>
                )}
                <p className="text-silver-slate text-[10px] mt-1">
                  Nutrition {result.servingSize}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="text-center p-2 rounded-lg bg-cyber-slate/60">
                <div className="font-display font-bold text-lg text-ice-white">
                  {result.calories}
                </div>
                <div className="text-[9px] text-silver-slate uppercase">kcal</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-cyber-slate/60">
                <div className="font-display font-bold text-lg text-accent-lime">
                  {result.protein}g
                </div>
                <div className="text-[9px] text-silver-slate uppercase">protein</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-cyber-slate/60">
                <div className="font-display font-bold text-lg text-accent-violet">
                  {result.carbs}g
                </div>
                <div className="text-[9px] text-silver-slate uppercase">carbs</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-cyber-slate/60">
                <div className="font-display font-bold text-lg text-ice-white">
                  {result.fat}g
                </div>
                <div className="text-[9px] text-silver-slate uppercase">fat</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (onFoodLogged) onFoodLogged(result);
                reset();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-accent-lime text-cyber-slate px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Plus className="w-4 h-4" />
              Log This Food
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-xl border border-white/10 text-silver-slate hover:text-ice-white transition-all text-xs font-semibold uppercase tracking-wider"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
