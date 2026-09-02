"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AddaLogo from "@/components/AddaLogo";

function AdminLoginCard() {
  const params = useSearchParams();
  const denied = params.get("error") === "AccessDenied";

  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0E1015]/80 p-8 text-center backdrop-blur-2xl shadow-2xl">
      <div className="flex justify-center mb-8">
        <AddaLogo height={26} variant="white" />
      </div>

      <div className="space-y-1">
        <span className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
          Admin Portal
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Screening Control
        </h1>
        <p className="text-xs text-zinc-400">
          Mirzapur: The Movie · Teacher&apos;s Day 2026
        </p>
      </div>

      <div className="my-8 h-px w-full bg-white/[0.06]" />

      {denied && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          Unauthorized account. Please sign in with an admin Google account.
        </div>
      )}

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/admin" })}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98]"
      >
        <span>Sign in with Google</span>
      </button>

      <p className="mt-6 text-[11px] text-zinc-500">
        Restricted to Adda247 Event Administrators
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07080A] px-4 py-12">
      <Suspense fallback={null}>
        <AdminLoginCard />
      </Suspense>
    </main>
  );
}
