"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  Loader2,
  LogOut,
  Shield,
  ShieldAlert,
  ClipboardCheck,
} from "lucide-react";

/* ─── Auth Context ─── */
const AuthContext = createContext<{ pin: string }>({ pin: "" });
export function useAdminPin() {
  return useContext(AuthContext);
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/intakes", label: "Client Intakes", icon: ClipboardCheck },
  { href: "/dashboard?admin=true", label: "Member View & Assist", icon: Eye },
  { href: "/admin/leads", label: "All Leads", icon: Users },
  { href: "/admin/park", label: "Park Settings", icon: MapPin },
  { href: "/coastal", label: "Coastal Walking Group", icon: Footprints },
  { href: "/brand-guide", label: "Brand Guide", icon: Palette },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [authMode, setAuthMode] = useState<"code" | "email">("code");
  const [adminCode, setAdminCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ADMIN_EMAILS = [
    "bodiedbyesh@gmail.com",
    "nieshaedwards314@gmail.com",
    "niesha0314@gmail.com",
    "kashaunmuhammad@gmail.com",
  ];

  useEffect(() => {
    async function checkAdmin() {
      try {
        const savedPin = typeof window !== "undefined" ? sessionStorage.getItem("admin_pin") : null;
        const hasPinCookie = typeof document !== "undefined" && (document.cookie.includes("admin_pin_session=0498") || document.cookie.includes("admin_pin_session=0408"));
        if (savedPin === "0498" || savedPin === "0408" || hasPinCookie) {
          setIsAdmin(true);
        }

        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (!error && currentUser) {
          setUser(currentUser);
          const isEmailAdmin = Boolean(currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase()));
          if (currentUser.app_metadata?.role === "admin" || isEmailAdmin) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Admin auth check error:", err);
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, []);

  const handleCodeUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminCode.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Invalid code. Please enter 0498.");
        return;
      }

      // Also sign in client-side Supabase for complete session parity
      await supabase.auth.signInWithPassword({
        email: "bodiedbyesh@gmail.com",
        password: "Thor101122",
      }).catch(() => {});

      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_pin", trimmed);
      }
      setIsAdmin(true);
      setUser(data.user || { email: "bodiedbyesh@gmail.com", role: "admin" });
    } catch (err: any) {
      setAuthError(err.message || "Failed to verify code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setAuthError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setAuthError(error?.message || "Invalid credentials. Please verify your email and password.");
        return;
      }

      setUser(data.user);
      const role = data.user.app_metadata?.role;
      const isEmailAdmin = data.user.email && ADMIN_EMAILS.includes(data.user.email.toLowerCase());
      if (role === "admin" || isEmailAdmin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setAuthError("Access Denied: Your account does not have administrator privileges.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_pin");
      document.cookie = "admin_pin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setAdminCode("");
    setEmail("");
    setPassword("");
    setAuthError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-slate flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
      </div>
    );
  }

  /* ─── Sign In / Access Gate ─── */
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-cyber-slate flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime mx-auto mb-6">
              {user && !isAdmin ? (
                <ShieldAlert className="w-7 h-7 text-red-400" />
              ) : (
                <Shield className="w-7 h-7 text-accent-lime" />
              )}
            </div>

            <h1 className="font-display font-bold text-2xl text-center text-ice-white mb-1">
              Admin Portal
            </h1>
            <p className="text-silver-slate text-xs text-center mb-6">
              {user && !isAdmin
                ? "Signed in as a standard member account."
                : "Sign in with your verified administrator credentials."}
            </p>

            {user && !isAdmin ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Access Denied</span>
                    Your account ({user.email}) is not assigned an administrator role.
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-ice-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Switch Account</span>
                  </button>
                  <Link
                    href="/dashboard"
                    className="flex-1 py-3 px-4 rounded-xl bg-accent-lime text-cyber-slate text-xs font-bold text-center hover:bg-accent-lime/90 transition-all flex items-center justify-center"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mode Selector: Code vs Email */}
                <div className="flex p-1 bg-white/5 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => { setAuthMode("code"); setAuthError(""); }}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      authMode === "code" ? "bg-accent-lime text-cyber-slate" : "text-silver-slate hover:text-ice-white"
                    }`}
                  >
                    Admin Code (0408)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("email"); setAuthError(""); }}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      authMode === "email" ? "bg-accent-lime text-cyber-slate" : "text-silver-slate hover:text-ice-white"
                    }`}
                  >
                    Email Login
                  </button>
                </div>

                {authMode === "code" ? (
                  <form onSubmit={handleCodeUnlock} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-silver-slate uppercase tracking-wider block mb-1.5 text-center">
                        Enter 4-Digit Admin Code
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        autoFocus
                        required
                        maxLength={10}
                        value={adminCode}
                        onChange={(e) => {
                          setAdminCode(e.target.value);
                          setAuthError("");
                        }}
                        placeholder="Enter code (0408)"
                        className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3.5 text-center text-xl font-mono tracking-widest text-ice-white focus:outline-none transition-all"
                        disabled={isSubmitting}
                      />
                    </div>

                    {authError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Unlocking...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Unlock Admin Portal</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-silver-slate uppercase tracking-wider block mb-1.5">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setAuthError("");
                        }}
                        placeholder="coach@bodiedbyesh.com"
                        className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-silver-slate uppercase tracking-wider block mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setAuthError("");
                        }}
                        placeholder="••••••••"
                        className="w-full bg-[#0E0E14] border border-white/10 focus:border-accent-lime rounded-xl px-4 py-3 text-sm text-ice-white focus:outline-none transition-all"
                        disabled={isSubmitting}
                      />
                    </div>

                    {authError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Sign In as Admin</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
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
    <AuthContext.Provider value={{ pin: "" }}>
      <div className="min-h-screen bg-cyber-slate text-ice-white flex">
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden md:flex md:w-64 flex-col border-r border-white/5 bg-[#080A0E] sticky top-0 h-screen">
          <div className="p-6 border-b border-white/5">
            <Link href="/" className="flex items-center gap-2 text-silver-slate hover:text-accent-lime transition-colors text-xs mb-4">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Site
            </Link>
            <h1 className="font-display font-bold text-lg text-ice-white">Admin Panel</h1>
            <p className="text-[10px] text-silver-slate uppercase tracking-wider mt-0.5 truncate">{user?.email}</p>
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
          <div className="p-4 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
                <span className="text-[10px] text-silver-slate uppercase tracking-wider font-semibold">Admin Active</span>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="text-silver-slate hover:text-red-400 transition-colors p-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Mobile Header ── */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <h1 className="font-display font-bold text-sm">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl border border-white/10 text-silver-slate hover:text-red-400 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-white/10 text-silver-slate hover:text-ice-white transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
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
