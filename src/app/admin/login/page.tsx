"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function AdminLoginCard() {
  const params = useSearchParams();
  const denied = params.get("error") === "AccessDenied";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Admin Login</h1>
      <p className="mt-1 text-sm text-slate-500">Adda247 Screening Dashboard</p>
      {denied && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          This Google account is not authorized for admin access.
        </p>
      )}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/admin" })}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Continue with Google
      </button>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={null}>
        <AdminLoginCard />
      </Suspense>
    </main>
  );
}
