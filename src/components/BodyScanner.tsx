"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  RefreshCw,
  User,
  Loader2,
  CheckCircle,
} from "lucide-react";
import {
  analyzeBodyImage,
  drawAnnotatedResults,
  loadPoseLandmarker,
} from "@/lib/body-ai";
import type { BodyMetrics } from "@/lib/body-ai";

/* ────────────────────────────────────────────────── */
/*  Types                                              */
/* ────────────────────────────────────────────────── */

interface BodyScannerProps {
  onMetricsReady?: (metrics: BodyMetrics) => void;
}

type Phase =
  | "idle"       // initial — choose camera or upload
  | "camera"     // live viewfinder
  | "preview"    // captured / uploaded image preview
  | "scanning"   // MediaPipe loading + running
  | "results"    // done
  | "error";     // something went wrong

type Gender = "male" | "female";

/* ────────────────────────────────────────────────── */
/*  Component                                          */
/* ────────────────────────────────────────────────── */

export default function BodyScanner({ onMetricsReady }: BodyScannerProps) {
  /* ── state ── */
  const [phase, setPhase] = useState<Phase>("idle");
  const [gender, setGender] = useState<Gender>("female");
  const [metrics, setMetrics] = useState<BodyMetrics | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  /* ── refs ── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const hiddenImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── helpers ── */

  /** Stop any active camera stream. */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /** Full reset back to idle. */
  const reset = useCallback(() => {
    stopCamera();
    setPhase("idle");
    setMetrics(null);
    setErrorMsg("");
    setImageSrc(null);
    setIsDragging(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [stopCamera]);

  /* Clean up camera on unmount */
  useEffect(() => () => stopCamera(), [stopCamera]);

  /* ────────────────────────────────────────────── */
  /*  Camera                                         */
  /* ────────────────────────────────────────────── */

  const openCamera = useCallback(async () => {
    setErrorMsg("");
    try {
      let stream;
      try {
        // Try mobile back camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
      } catch (e) {
        // Fallback to default user camera (for desktop/laptops)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("camera");
    } catch {
      setErrorMsg("Camera access was denied. Please check permissions or upload a photo instead.");
      setPhase("idle");
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    offscreen.getContext("2d")!.drawImage(video, 0, 0);

    const dataUrl = offscreen.toDataURL("image/jpeg", 0.92);
    stopCamera();
    setImageSrc(dataUrl);
    setPhase("preview");
  }, [stopCamera]);

  /* ────────────────────────────────────────────── */
  /*  File Upload                                    */
  /* ────────────────────────────────────────────── */

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (JPG, PNG, etc.).");
      return;
    }
    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setPhase("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  /* ────────────────────────────────────────────── */
  /*  Scan / Analysis                                */
  /* ────────────────────────────────────────────── */

  const runScan = useCallback(async () => {
    const img = hiddenImgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    setPhase("scanning");
    setErrorMsg("");

    try {
      // Pre-load model in parallel with image decode
      await loadPoseLandmarker();

      const analysis = await analyzeBodyImage(img, gender);

      if (!analysis) {
        setErrorMsg(
          "No body detected. Please use a full front-facing photo with your shoulders, waist, and hips visible."
        );
        setPhase("error");
        return;
      }

      const { result, metrics: m } = analysis;
      drawAnnotatedResults(canvas, img, result, m);

      setMetrics(m);
      setPhase("results");
      onMetricsReady?.(m);
    } catch (err) {
      console.error("[BodyScanner]", err);
      setErrorMsg("Analysis failed. Please try again with a different photo.");
      setPhase("error");
    }
  }, [gender, onMetricsReady]);

  /* ────────────────────────────────────────────── */
  /*  Confidence badge helper                        */
  /* ────────────────────────────────────────────── */

  const confidenceMeta: Record<
    BodyMetrics["confidence"],
    { label: string; color: string; bg: string }
  > = {
    high: {
      label: "High Confidence",
      color: "text-accent-lime",
      bg: "bg-accent-lime/10",
    },
    medium: {
      label: "Medium Confidence",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    low: {
      label: "Low Confidence",
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
  };

  /* ────────────────────────────────────────────── */
  /*  Render                                         */
  /* ────────────────────────────────────────────── */

  return (
    <section className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      {/* ─── Gender Selector ─── */}
      <div className="flex items-center gap-3">
        <User className="h-4 w-4 text-silver-slate" aria-hidden="true" />
        <div className="glass-panel rounded-full flex overflow-hidden">
          {(["female", "male"] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-label={`Select ${g}`}
              aria-pressed={gender === g}
              onClick={() => setGender(g)}
              className={`
                px-5 py-2 text-sm font-medium capitalize transition-colors focus-ring
                ${
                  gender === g
                    ? "bg-accent-lime/15 text-accent-lime"
                    : "text-silver-slate hover:text-ice-white"
                }
              `}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Idle: Camera / Upload picker ─── */}
      {phase === "idle" && (
        <div className="w-full flex flex-col gap-4">
          {/* Camera button */}
          <button
            type="button"
            onClick={openCamera}
            className="glass-panel-lime rounded-2xl py-10 flex flex-col items-center gap-3 transition-all hover:border-accent-lime/40 focus-ring"
            aria-label="Open camera to capture photo"
          >
            <Camera className="h-10 w-10 text-accent-lime" />
            <span className="font-display text-ice-white text-lg">
              Take a Photo
            </span>
            <span className="text-silver-slate text-sm">
              Use your camera to capture a front-facing pose
            </span>
          </button>

          {/* Upload dropzone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload a photo from your device"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`
              glass-panel rounded-2xl py-10 flex flex-col items-center gap-3
              cursor-pointer transition-all focus-ring
              ${
                isDragging
                  ? "border-accent-lime/50 bg-accent-lime/5"
                  : "hover:border-white/15"
              }
            `}
          >
            <Upload className="h-10 w-10 text-silver-slate" />
            <span className="font-display text-ice-white text-lg">
              Upload a Photo
            </span>
            <span className="text-silver-slate text-sm text-center px-4">
              Drag and drop or click to browse — JPG, PNG supported
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileInput}
            className="hidden"
            aria-hidden="true"
          />

          {errorMsg && (
            <p className="text-red-400 text-sm text-center" role="alert">
              {errorMsg}
            </p>
          )}
        </div>
      )}

      {/* ─── Camera viewfinder ─── */}
      {phase === "camera" && (
        <div className="w-full flex flex-col gap-4 items-center">
          <div className="relative w-full rounded-2xl overflow-hidden glass-panel-lime">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-2xl"
              aria-label="Live camera viewfinder"
            />
            {/* Grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none animate-grid-glow"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(204,255,0,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,.06) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={captureFrame}
              className="flex items-center gap-2 rounded-xl bg-accent-lime px-6 py-3 text-cyber-slate font-display font-bold transition-transform hover:scale-[1.03] active:scale-95 focus-ring"
              aria-label="Take photo"
            >
              <Camera className="h-5 w-5" />
              Take Photo
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-xl glass-panel px-5 py-3 text-silver-slate hover:text-ice-white transition-colors focus-ring"
              aria-label="Cancel camera"
            >
              <RefreshCw className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Preview (before scan) ─── */}
      {phase === "preview" && imageSrc && (
        <div className="w-full flex flex-col gap-4 items-center">
          <div className="relative w-full rounded-2xl overflow-hidden glass-panel-lime">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Captured body photo preview"
              className="w-full rounded-2xl"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={runScan}
              className="flex items-center gap-2 rounded-xl bg-accent-lime px-6 py-3 text-cyber-slate font-display font-bold transition-transform hover:scale-[1.03] active:scale-95 focus-ring"
              aria-label="Start body scan analysis"
            >
              <Camera className="h-5 w-5" />
              Scan
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-xl glass-panel px-5 py-3 text-silver-slate hover:text-ice-white transition-colors focus-ring"
              aria-label="Retake photo"
            >
              <RefreshCw className="h-4 w-4" />
              Retake
            </button>
          </div>
        </div>
      )}

      {/* ─── Scanning overlay ─── */}
      {phase === "scanning" && (
        <div className="w-full flex flex-col gap-4 items-center">
          <div className="relative w-full rounded-2xl overflow-hidden glass-panel-lime aspect-[3/4] flex items-center justify-center">
            {imageSrc && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageSrc}
                alt=""
                className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-40"
              />
            )}

            {/* Scan line */}
            <div className="animate-scan-line" />

            {/* Centered spinner */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <Loader2
                className="h-10 w-10 text-accent-lime animate-spin"
                aria-hidden="true"
              />
              <span className="font-display text-ice-white text-lg">
                Analyzing body composition…
              </span>
              <span className="text-silver-slate text-sm">
                Loading AI model and detecting landmarks
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Error state ─── */}
      {phase === "error" && (
        <div className="w-full flex flex-col gap-4 items-center">
          <div className="glass-panel rounded-2xl p-8 w-full text-center">
            <p className="text-red-400 text-base mb-1" role="alert">
              {errorMsg}
            </p>
            <p className="text-silver-slate text-sm">
              Make sure you are standing upright in front of the camera in a
              well-lit area.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-xl glass-panel px-6 py-3 text-silver-slate hover:text-ice-white transition-colors focus-ring"
            aria-label="Try again"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      )}

      {/* ─── Hidden image for MediaPipe input ─── */}
      {imageSrc && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={hiddenImgRef}
          src={imageSrc}
          alt=""
          className="hidden"
          crossOrigin="anonymous"
        />
      )}

      {/* ─── Results canvas + metrics ─── */}
      {phase === "results" && metrics && (
        <div className="w-full flex flex-col gap-5 items-center animate-fadeIn">
          {/* Annotated canvas */}
          <div className="w-full rounded-2xl overflow-hidden glass-panel-lime">
            <canvas
              ref={canvasRef}
              className="w-full h-auto rounded-2xl"
              aria-label="Annotated body scan results with landmarks and measurement lines"
            />
          </div>

          {/* Metrics card */}
          <div className="glass-panel rounded-2xl p-6 w-full space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-display text-ice-white text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent-lime" />
                Scan Complete
              </h3>
              {(() => {
                const meta = confidenceMeta[metrics.confidence];
                return (
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${meta.color} ${meta.bg}`}
                  >
                    {meta.label}
                  </span>
                );
              })()}
            </div>

            {/* Primary metric */}
            <div className="text-center py-2">
              <p className="font-display text-5xl font-bold text-accent-lime tracking-tight">
                {metrics.estimatedBodyFatPercent}
                <span className="text-2xl text-silver-slate ml-1">%</span>
              </p>
              <p className="text-silver-slate text-sm mt-1">
                Estimated Body Fat
              </p>
            </div>

            {/* Ratio grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-xl p-4 text-center">
                <p className="font-display text-2xl font-bold text-ice-white">
                  {metrics.shoulderToWaistRatio}
                </p>
                <p className="text-silver-slate text-xs mt-1">
                  Shoulder-to-Waist
                </p>
              </div>
              <div className="glass-panel rounded-xl p-4 text-center">
                <p className="font-display text-2xl font-bold text-ice-white">
                  {metrics.waistToHipRatio}
                </p>
                <p className="text-silver-slate text-xs mt-1">
                  Waist-to-Hip
                </p>
              </div>
            </div>

            {/* Retake */}
            <button
              type="button"
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 rounded-xl glass-panel-lime py-3 text-accent-lime font-display font-medium transition-all hover:bg-accent-lime/10 focus-ring"
              aria-label="Retake body scan"
            >
              <RefreshCw className="h-4 w-4" />
              Retake
            </button>
          </div>
        </div>
      )}

      {/* Canvas ref for drawing — rendered but invisible until results phase */}
      {phase !== "results" && (
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      )}
    </section>
  );
}
