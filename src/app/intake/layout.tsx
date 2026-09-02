import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Clinical Client Intake | Bodied by Esh",
  description:
    "Comprehensive clinical onboarding suite for Bodied by Esh athletes and executive clients. Secure, HIPAA-compliant digital intake.",
};

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cyber-slate text-ice-white selection:bg-accent-lime selection:text-cyber-slate relative overflow-x-hidden flex flex-col justify-between">
      {/* Ambient background glow effects */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-accent-lime/5 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-[450px] h-[450px] bg-accent-violet/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 backdrop-blur-xl bg-cyber-slate/85">
        <div className="page-container flex items-center justify-between py-3.5">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-90 transition-opacity" aria-label="Bodied by Esh Home">
              <Logo className="h-10 sm:h-12 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent-lime">
                Clinical Ingress
              </span>
              <span className="text-xs text-silver-slate/60">•</span>
              <span className="text-xs text-silver-slate">Athlete & Executive Onboarding</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-silver-slate font-mono">
              <Lock className="w-3 h-3 text-accent-lime" />
              <span>256-Bit Encrypted</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-silver-slate hover:text-ice-white transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Main Site</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 py-8 sm:py-12 relative z-10">{children}</main>

      {/* Global Clinical Ingress Footer */}
      <footer className="border-t border-white/5 glass-panel py-6 text-center text-xs text-silver-slate/70">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent-lime" />
            <span>Bodied by Esh • Private Clinical Intake & Biotelemetry Architecture</span>
          </div>
          <p className="font-mono text-silver-slate/50">
            Delray Beach, FL • Parkland • Boca Raton • Remote Global
          </p>
        </div>
      </footer>
    </div>
  );
}
