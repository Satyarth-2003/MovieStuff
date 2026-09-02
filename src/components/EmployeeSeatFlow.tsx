"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import SeatMap from "@/components/SeatMap";
import type { Employee } from "@/lib/booking";

type LoadState = "loading" | "ready" | "error";

export default function EmployeeSeatFlow() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reservedSeats, setReservedSeats] = useState<Set<string>>(new Set());
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function loadAll() {
    setLoadState("loading");
    try {
      const meRes = await fetch("/api/employee/me");
      if (!meRes.ok) throw new Error("Failed to load your profile.");
      const meData = await meRes.json();
      setEmployee(meData.employee);

      if (!meData.employee.seat) {
        const seatsRes = await fetch("/api/seats");
        if (!seatsRes.ok) throw new Error("Failed to load the seat map.");
        const seatsData = await seatsRes.json();
        setReservedSeats(new Set<string>(seatsData.reservedSeats));
      }
      setLoadState("ready");
    } catch {
      setError("Something went wrong loading your seat information. Please refresh.");
      setLoadState("error");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleConfirm() {
    if (!selectedSeat) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch("/api/seats/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatId: selectedSeat }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not confirm your seat.");
        setSelectedSeat(null);
        const seatsRes = await fetch("/api/seats");
        const seatsData = await seatsRes.json();
        setReservedSeats(new Set<string>(seatsData.reservedSeats));
        return;
      }
      setEmployee((prev) => (prev ? { ...prev, seat: data.seat, status: "reserved" } : prev));
    } finally {
      setConfirming(false);
    }
  }

  if (loadState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  if (loadState === "error" || !employee) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="max-w-sm text-center text-sm text-red-600">{error}</p>
      </main>
    );
  }

  const isConfirmed = !!employee.seat;

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold text-slate-900">Mirzapur: The Movie</h1>
            <p className="mt-0.5 text-sm text-slate-500">05 Sep · 02:45 PM</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 pt-8">
        {isConfirmed ? (
          <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <p className="text-base font-semibold text-emerald-700">Seat Confirmed</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Your seat: {employee.seat}</p>
            <p className="mt-2 text-sm text-slate-600">You're all set for the screening.</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-base font-semibold text-slate-900">Choose your seat</h2>
              <p className="mt-1 text-sm text-slate-500">Select one seat for the screening.</p>
            </div>

            {error && (
              <p className="mx-auto mt-4 max-w-md rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-8">
              <SeatMap
                reservedSeats={reservedSeats}
                selectedSeat={selectedSeat}
                onSeatClick={(seatId) => setSelectedSeat((prev) => (prev === seatId ? null : seatId))}
              />
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                disabled={!selectedSeat || confirming}
                onClick={handleConfirm}
                className="rounded-lg bg-adda-purple px-8 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {confirming ? "Confirming…" : selectedSeat ? `Confirm Seat ${selectedSeat}` : "Select a seat"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
