"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AddaLogo from "@/components/AddaLogo";

function AdminLoginCard() {
  const params = useSearchParams();
  const denied = params.get("error") === "AccessDenied";

  return (
    <div className="glass-panel relative w-full max-w-md overflow-hidden rounded-3xl p-8 sm:p-10 text-center shadow-2xl border border-amber-500/30">
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      <div className="flex justify-center mb-6">
        <AddaLogo size="lg" showTagline tagline="Admin Operations Portal" variant="gold" />
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
        🛡️ Screening Admin Console
      </div>

      <h1 className="mt-4 text-2xl font-black text-white font-serif">
        Auditorium & Guest Control
      </h1>
      <p className="mt-1 text-xs text-slate-300">
        Mirzapur: The Movie · Teacher&apos;s Day 2026 Special
      </p>

      {denied && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs font-semibold text-red-300 shadow-glow">
          ⚠️ This Google account does not have Admin authorization. Please sign in with an authorized admin account.
        </div>
      )}

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/admin" })}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white px-5 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-95"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign In with Admin Google</span>
      </button>

      <p className="mt-4 text-[11px] text-slate-400">
        Restricted to Adda247 Event Operations & HR administrators.
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="cinema-ambient-bg flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-sm font-semibold text-slate-400">Loading Admin Console…</div>
        }
      >
        <AdminLoginCard />
      </Suspense>
    </main>
  );
}
