"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Lock,
  LayoutDashboard,
  Users,
  MapPin,
  Palette,
  ArrowLeft,
  AlertTriangle,
  Menu,
  X,
  Footprints,
  Eye,
} from "lucide-react";

/* ─── Auth Context ─── */
const AuthContext = createContext<{ pin: string }>({ pin: "" });
export function useAdminPin() {
  return useContext(AuthContext);
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard?admin=true", label: "Member View & Assist", icon: Eye },
  { href: "/admin/leads", label: "All Leads", icon: Users },
  { href: "/admin/park", label: "Park Settings", icon: MapPin },
  { href: "/coastal", label: "Coastal Walking Group", icon: Footprints },
  { href: "/brand-guide", label: "Brand Guide", icon: Palette },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-verify saved pin on mount
  useEffect(() => {
    const savedPin = sessionStorage.getItem("admin_pin");
    if (savedPin) {
      setPin(savedPin);
      fetch("/api/admin/leads", {
        headers: { "x-admin-pin": savedPin },
        cache: "no-store",
      }).then((res) => {
        if (res.status === 200) {
          setAuthenticated(true);
        } else {
          sessionStorage.removeItem("admin_pin");
        }
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setIsVerifying(true);
    setAuthError(false);

    try {
      const res = await fetch("/api/admin/leads", {
        headers: { "x-admin-pin": pin },
        cache: "no-store",
      });
      if (res.status === 200) {
        setAuthenticated(true);
        sessionStorage.setItem("admin_pin", pin);
      } else {
        setAuthError(true);
      }
    } catch {
      setAuthError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  /* ─── PIN Gate ─── */
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-cyber-slate flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="glass-panel rounded-3xl p-8 border border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime mx-auto mb-6">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-display font-bold text-2xl text-center text-ice-white mb-1">
              Admin Dashboard
            </h1>
            <p className="text-silver-slate text-xs text-center mb-8">
              Enter your PIN to access the admin panel.
            </p>
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setAuthError(false);
                }}
                placeholder="• • • •"
                className={`w-full text-center text-2xl tracking-[0.5em] bg-cyber-slate border rounded-xl px-4 py-4 focus:outline-none transition-all ${
                  authError
                    ? "border-red-500 text-red-400"
                    : "border-white/10 focus:border-accent-lime text-ice-white"
                }`}
                autoFocus
                disabled={isVerifying}
              />
              {authError && (
                <p className="text-red-400 text-xs text-center flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Incorrect PIN. Try again.
                </p>
              )}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Unlock"}
              </button>
            </form>
          </div>
          <div className="text-center mt-6">
            <Link href="/" className="text-silver-slate text-xs hover:text-accent-lime transition-colors">
              ← Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Authenticated Layout ─── */
  return (
    <AuthContext.Provider value={{ pin }}>
      <div className="min-h-screen bg-cyber-slate text-ice-white flex">
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden md:flex md:w-64 flex-col border-r border-white/5 bg-[#080A0E] sticky top-0 h-screen">
          <div className="p-6 border-b border-white/5">
            <Link href="/" className="flex items-center gap-2 text-silver-slate hover:text-accent-lime transition-colors text-xs mb-4">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Site
            </Link>
            <h1 className="font-display font-bold text-lg text-ice-white">Admin Panel</h1>
            <p className="text-[10px] text-silver-slate uppercase tracking-wider mt-0.5">Bodied by Esh</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent-lime/10 text-accent-lime border border-accent-lime/20"
                      : "text-silver-slate hover:text-ice-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
              <span className="text-[10px] text-silver-slate uppercase tracking-wider">Authenticated</span>
            </div>
          </div>
        </aside>

        {/* ── Mobile Header ── */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <h1 className="font-display font-bold text-sm">Admin Panel</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-white/10 text-silver-slate hover:text-ice-white transition-all"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Mobile Nav Overlay ── */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-cyber-slate/95 backdrop-blur-sm pt-16">
            <nav className="p-6 space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-accent-lime/10 text-accent-lime border border-accent-lime/20"
                        : "text-silver-slate hover:text-ice-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/"
                className="flex items-center gap-3 px-5 py-4 rounded-xl text-sm text-silver-slate hover:text-ice-white hover:bg-white/5 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Site
              </Link>
            </nav>
          </div>
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 min-h-screen md:pt-0 pt-14">
          {children}
        </main>
      </div>
    </AuthContext.Provider>
  );
}
