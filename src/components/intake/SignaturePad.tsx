"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PenTool, Type, RotateCcw, Check, ShieldCheck } from "lucide-react";

export interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  helperText?: string;
}

export function SignaturePad({
  value = "",
  onChange,
  label = "Digital Legal Signature",
  required = true,
  disabled = false,
  id = "signature-pad",
  helperText = "Draw your legal signature with touch/mouse or switch to typed attestation.",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Determine initial mode based on value (if value starts with data:image -> draw, otherwise if string -> type)
  const isDataUrl = value?.startsWith("data:image/");
  const [mode, setMode] = useState<"draw" | "type">(isDataUrl || !value ? "draw" : "type");
  const [typedValue, setTypedValue] = useState<string>(!isDataUrl ? value : "");
  const [hasDrawnStroke, setHasDrawnStroke] = useState(Boolean(isDataUrl));

  // Initialize and resize canvas with DPI scaling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    // Set display size (css pixels)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#D4B87E"; // Obsidian Gold accent
    ctx.lineWidth = 2.5;

    // If an existing data URL is present, redraw it
    if (value && value.startsWith("data:image/")) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawnStroke(true);
      };
      img.src = value;
    }
  }, [value]);

  useEffect(() => {
    if (mode === "draw") {
      setupCanvas();
    }
  }, [mode, setupCanvas]);

  // Handle window resize
  useEffect(() => {
    if (mode !== "draw") return;
    const handleResize = () => {
      setupCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mode, setupCanvas]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if ("touches" in e) {
      // Prevent scrolling on touch
      e.preventDefault();
    }
    isDrawingRef.current = true;
    const { x, y } = getCanvasCoordinates(e);
    lastPointRef.current = { x, y };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return;
    if ("touches" in e) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    const lastPoint = lastPointRef.current;

    if (lastPoint) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      // Midpoint quadratic curve for smoother strokes
      const midX = (lastPoint.x + x) / 2;
      const midY = (lastPoint.y + y) / 2;
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    lastPointRef.current = { x, y };
    setHasDrawnStroke(true);
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onChange(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    }
    setHasDrawnStroke(false);
    setTypedValue("");
    onChange("");
  };

  const handleTypedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedValue(val);
    onChange(val);
  };

  const handleModeToggle = (newMode: "draw" | "type") => {
    setMode(newMode);
    handleClear();
  };

  return (
    <div className="w-full space-y-3" id={id}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label className="text-sm font-semibold text-ice-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent-lime" />
          <span>{label}</span>
          {required && <span className="text-accent-violet">*</span>}
        </label>

        {/* Mode Switcher */}
        <div className="inline-flex rounded-lg p-1 bg-[#0E0E14] border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleModeToggle("draw")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              mode === "draw"
                ? "bg-accent-lime text-cyber-slate font-bold shadow-sm"
                : "text-silver-slate hover:text-ice-white"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeToggle("type")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              mode === "type"
                ? "bg-accent-lime text-cyber-slate font-bold shadow-sm"
                : "text-silver-slate hover:text-ice-white"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Name</span>
          </button>
        </div>
      </div>

      {mode === "draw" ? (
        <div className="relative group">
          <div className="w-full h-44 rounded-xl border border-white/10 bg-[#0E0E14] overflow-hidden focus-within:border-accent-lime/60 transition-colors relative">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair touch-none select-none block"
              style={{ touchAction: "none" }}
            />

            {/* Signature guideline */}
            <div className="absolute left-6 right-6 bottom-10 border-b border-dashed border-white/15 pointer-events-none flex justify-between items-center text-[10px] text-silver-slate/50 font-mono select-none">
              <span>Sign Above Line</span>
              <span>X</span>
            </div>

            {!hasDrawnStroke && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-silver-slate/40 text-xs font-mono select-none">
                Draw digital signature with mouse or touch screen
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <p className="text-silver-slate text-[11px]">{helperText}</p>
            {hasDrawnStroke && (
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="inline-flex items-center gap-1 text-silver-slate hover:text-accent-violet transition-colors text-xs py-0.5 px-2 rounded hover:bg-white/5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={typedValue}
              onChange={handleTypedChange}
              disabled={disabled}
              placeholder="Type your full legal name (e.g., Jonathan E. Doe)"
              className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white font-serif italic text-lg tracking-wide focus:outline-none transition-all placeholder:text-silver-slate/40"
            />
            {typedValue.trim().length >= 2 && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-accent-lime">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
          <p className="text-silver-slate text-[11px]">
            By typing your full legal name, you declare this digital input serves as your binding legal signature.
          </p>
        </div>
      )}
    </div>
  );
}
