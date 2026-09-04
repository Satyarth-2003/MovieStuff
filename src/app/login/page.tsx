"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AddaLogo from "@/components/AddaLogo";

function LoginCard() {
  const params = useSearchParams();
  const denied = params.get("error") === "AccessDenied";

  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0E1015]/80 p-8 text-center backdrop-blur-2xl shadow-2xl">
      {/* Official Adda247 Brand Logo */}
      <div className="flex justify-center mb-8">
        <AddaLogo height={26} variant="white" />
      </div>

      {/* Movie Details - Minimal & Classy */}
      <div className="space-y-1">
        <span className="text-[11px] font-medium tracking-widest text-red-500 uppercase">
          Teacher&apos;s Day Private Screening
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Mirzapur: The Movie
        </h1>
        <p className="text-xs text-zinc-400">
          5 Sep · 02:45 PM · 1 Cinema, Star Mall
        </p>
      </div>

      <div className="my-8 h-px w-full bg-white/[0.06]" />

      <p className="text-xs leading-relaxed text-zinc-400">
        Sign in with your official Adda247 or StudyIQ Google account to select your seat.
      </p>

      {denied && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          This account is not on the guest list. Please use your official @adda247.com or @studyiq.com ID.
        </div>
      )}

      {/* Google Sign In Button - CRED / District minimal aesthetic */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
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
        <span>Continue with Google</span>
      </button>

      <p className="mt-6 text-[11px] text-zinc-500">
        Exclusively for Adda247 team members & educators
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07080A] px-4 py-12">
      <Suspense fallback={null}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
