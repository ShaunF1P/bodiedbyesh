"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl } from "@/lib/auth-url";
import { ShieldCheck, Shield, Mail, Lock, User, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import Logo from "@/components/Logo";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [adminLoginType, setAdminLoginType] = useState<"code" | "email">("code");
  const [adminCode, setAdminCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Detect unverified redirects from middleware
  useEffect(() => {
    if (searchParams.get("verified") === "false") {
      setErrorMsg("Please verify your email before entering the client portal.");
    }
  }, [searchParams]);

  const handleAdminCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminCode.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const res = await fetch("/api/admin/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Invalid code. Please enter 0498.");
        setLoading(false);
        return;
      }

      await supabase.auth.signInWithPassword({
        email: "bodiedbyesh@gmail.com",
        password: "Thor101122",
      }).catch(() => {});

      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_pin", trimmed);
      }

      router.push("/admin");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify admin code.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setErrorMsg("Name is required.");
          setLoading(false);
          return;
        }

        // 1. Sign Up in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl("/dashboard"),
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) throw error;

        // 2. Register them in coaching_leads (notifies Coach Esh and lists them in admin dashboard)
        if (data.user) {
          try {
            await fetch("/api/ghl-contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: name.trim(),
                email: email.trim(),
                phone: "",
                programChoice: "Portal Access Request",
                trackGoal: "Portal Signup",
                source: "portal_signup",
              }),
            });
          } catch (apiErr) {
            console.error("Failed to push portal signup to leads:", apiErr);
          }

          // If email confirmation is required (default)
          if (!data.user.email_confirmed_at) {
            setInfoMsg("Registration successful! Please check your email inbox to verify your account.");
            setEmail("");
            setPassword("");
            setName("");
          } else {
            // If auto-verified
            router.push("/dashboard");
          }
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user && !data.user.email_confirmed_at) {
          setErrorMsg("Please verify your email before entering the client portal.");
          await supabase.auth.signOut();
        } else {
          const redirectTo = searchParams.get("redirectTo");
          const ADMIN_EMAILS = [
            "bodiedbyesh@gmail.com",
            "nieshaedwards314@gmail.com",
            "niesha0314@gmail.com",
            "kashaunmuhammad@gmail.com",
          ];
          const userRole = data.user?.app_metadata?.role;
          const isEmailAdmin = data.user?.email && ADMIN_EMAILS.includes(data.user.email.toLowerCase());
          const isAdmin = userRole === "admin" || isEmailAdmin;

          if (redirectTo && (isAdmin || !redirectTo.startsWith("/admin"))) {
            router.push(redirectTo);
          } else if (isAdmin) {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during authentication.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cyber-slate flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-accent-lime/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent-lime/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        {/* Auth Box */}
        <div className="glass-panel rounded-3xl p-8 border border-white/5 bg-[#080A0E]/80 backdrop-blur-md relative">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
              {searchParams.get("redirectTo")?.startsWith("/admin") ? (
                <Shield className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-ice-white">
                {searchParams.get("redirectTo")?.startsWith("/admin")
                  ? "Coach Admin Portal"
                  : "Client Portal"}
              </h2>
              <p className="text-[10px] text-silver-slate uppercase tracking-wider">
                {searchParams.get("redirectTo")?.startsWith("/admin")
                  ? "Administrator Access & Management"
                  : "High-Performance Training Hub"}
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          {searchParams.get("redirectTo")?.startsWith("/admin") ? (
            <div className="space-y-4 mb-6">
              <div className="flex p-1 bg-white/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAdminLoginType("code");
                    setErrorMsg("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    adminLoginType === "code"
                      ? "bg-accent-lime text-cyber-slate"
                      : "text-silver-slate hover:text-ice-white"
                  }`}
                >
                  Admin Code (0408)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminLoginType("email");
                    setErrorMsg("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    adminLoginType === "email"
                      ? "bg-accent-lime text-cyber-slate"
                      : "text-silver-slate hover:text-ice-white"
                  }`}
                >
                  Email Login
                </button>
              </div>
            </div>
          ) : (
            <div className="flex p-1 bg-white/5 rounded-xl mb-6">
              <button
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                  setInfoMsg("");
                }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  mode === "signin" ? "bg-accent-lime text-cyber-slate" : "text-silver-slate hover:text-ice-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setInfoMsg("");
                }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  mode === "signup" ? "bg-accent-lime text-cyber-slate" : "text-silver-slate hover:text-ice-white"
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Messages */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-6 p-4 rounded-xl bg-accent-lime/10 border border-accent-lime/20 text-accent-lime text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Form */}
          {searchParams.get("redirectTo")?.startsWith("/admin") && adminLoginType === "code" ? (
            <form onSubmit={handleAdminCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-silver-slate font-semibold mb-1.5 text-center">
                  Enter 4-Digit Admin Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-slate" />
                  <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={10}
                    value={adminCode}
                    onChange={(e) => {
                      setAdminCode(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="Enter code (0408)"
                    className="w-full bg-white/5 border border-white/10 focus:border-accent-lime/50 rounded-xl pl-11 pr-4 py-3.5 text-center text-xl font-mono tracking-widest text-ice-white placeholder:text-silver-slate/30 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate font-display font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 shadow-lg shadow-accent-lime/10"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Unlock Admin Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-silver-slate font-semibold mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-slate" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Esha Johnson"
                    className="w-full bg-white/5 border border-white/10 focus:border-accent-lime/50 rounded-xl pl-11 pr-4 py-3 text-sm text-ice-white placeholder:text-silver-slate/30 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-silver-slate font-semibold mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-slate" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-accent-lime/50 rounded-xl pl-11 pr-4 py-3 text-sm text-ice-white placeholder:text-silver-slate/30 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-silver-slate font-semibold mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-slate" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 focus:border-accent-lime/50 rounded-xl pl-11 pr-4 py-3 text-sm text-ice-white placeholder:text-silver-slate/30 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate font-display font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : searchParams.get("redirectTo")?.startsWith("/admin") ? (
                "Sign In to Admin Portal"
              ) : mode === "signin" ? (
                "Access Dashboard"
              ) : (
                "Create Verified Account"
              )}
            </button>
          </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-silver-slate text-xs hover:text-accent-lime transition-colors">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cyber-slate flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-lime animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
