"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import SeatMap from "@/components/SeatMap";
import AddaLogo from "@/components/AddaLogo";
import type { Employee } from "@/lib/booking";

type LoadState = "loading" | "ready" | "error";

export default function EmployeeSeatFlow() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reservedSeats, setReservedSeats] = useState<Set<string>>(new Set());
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [activeShowtime, setActiveShowtime] = useState("02:45 PM");

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
      <main className="cinema-ambient-bg flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" />
            <div className="h-12 w-12 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <span className="absolute text-xs font-bold text-amber-400">247</span>
          </div>
          <p className="text-sm font-medium tracking-wider text-slate-400 uppercase">
            Loading VIP Cinema Experience…
          </p>
        </div>
      </main>
    );
  }

  if (loadState === "error" || !employee) {
    return (
      <main className="cinema-ambient-bg flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center border-red-500/30 shadow-glow">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            ⚠️
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">Access Error</h2>
          <p className="mt-2 text-sm text-slate-300">{error}</p>
          <button
            onClick={() => loadAll()}
            className="mt-6 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-105"
          >
            Retry Loading
          </button>
        </div>
      </main>
    );
  }

  const isConfirmed = !!employee.seat;
  const isRecliner = selectedSeat?.startsWith("A") || selectedSeat?.startsWith("B");
  const seatPrice = isRecliner ? "₹300" : "₹200";
  const seatTier = isRecliner ? "Premium Recliner" : "Gold Tier";

  return (
    <main className="cinema-ambient-bg min-h-screen pb-24 text-slate-100">
      
      {/* TOP FESTIVE BANNER: TEACHER'S DAY CELEBRATION */}
      <div className="relative overflow-hidden border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-red-950/40 to-amber-950/40 py-2 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,184,0,0.15),transparent_70%)]" />
        <div className="relative flex items-center justify-center gap-2 px-4 text-xs font-semibold tracking-wide text-amber-300">
          <span className="text-amber-400">✨ 🎓</span>
          <span>
            <strong className="font-bold text-white">TEACHER&apos;S DAY SPECIAL SCREENING</strong> · Honoring the Torchbearers of Knowledge at Adda247
          </span>
          <span className="text-amber-400">🎓 ✨</span>
        </div>
      </div>

      {/* TOP NAVIGATION / BRAND HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0A0D14]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <AddaLogo size="md" showTagline tagline="Teacher's Day Premiere" variant="light" />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-white">{employee.name || employee.email.split("@")[0]}</p>
              <p className="text-[10px] text-slate-400 font-mono">{employee.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border border-slate-700/80 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        
        {/* MOVIE TITLE & THEATRE METADATA CARD */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#121824] via-[#161F2E] to-[#121824] p-6 shadow-2xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="rounded-md bg-red-600/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-400 border border-red-500/30">
                  Exclusive Premiere
                </span>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                  Teacher&apos;s Day 2026
                </span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700">
                  Hindi · 2D · Dolby Atmos
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl font-serif">
                Mirzapur: The Movie
              </h1>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-300 md:justify-start">
                <svg className="w-4 h-4 text-red-400 inline shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  <strong>5 Sep, 02:45 PM</strong> at 1 Cinema Powered by Mukta A2, Star Mall, Sector 31, Gurugram
                </span>
              </p>
            </div>

            {/* DATE & SHOWTIME CHIPS SELECTOR */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Auditorium Showtimes
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-center shadow-sm">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Sat</span>
                  <span className="text-xs font-bold text-amber-400">05 Sep</span>
                </div>

                {["11:15 AM", "02:45 PM", "06:30 PM", "10:15 PM"].map((time) => {
                  const isCurrent = time === activeShowtime;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setActiveShowtime(time)}
                      className={`flex flex-col items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                        isCurrent
                          ? "border border-red-500 bg-gradient-to-b from-red-600 to-red-700 text-white shadow-glow"
                          : "border border-slate-700/80 bg-slate-800/40 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <span>{time}</span>
                      <span className="text-[9px] font-normal opacity-75">CC · Laser</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN BODY: EITHER CONFIRMED TICKET OR SEAT SELECTION */}
        {isConfirmed ? (
          /* VIP CONFIRMED GOLD TICKET PASS */
          <div className="mx-auto max-w-2xl">
            <div className="glass-panel-gold relative overflow-hidden rounded-3xl p-8 shadow-2xl border border-amber-500/40">
              
              {/* Gold Shimmer Bar */}
              <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-amber-400/20 blur-2xl" />
              
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-3xl shadow-glow-gold">
                  🎓
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-400">
                    ✓ SEAT RESERVATION CONFIRMED
                  </span>
                </div>

                <h2 className="mt-3 text-3xl font-black text-white font-serif tracking-tight">
                  VIP Teacher&apos;s Day Premiere Pass
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Presented to <strong className="text-amber-300">{employee.name || employee.email}</strong> in honor of Teacher&apos;s Day
                </p>

                {/* THEATER TICKET BOARDING PASS */}
                <div className="mt-6 w-full rounded-2xl border-2 border-dashed border-amber-500/40 bg-gradient-to-b from-[#151D2C] to-[#0D121C] p-6 text-left shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                    <div>
                      <AddaLogo size="sm" showTagline={false} />
                      <p className="mt-1 text-xs font-bold text-slate-200">Mirzapur: The Movie</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">Auditorium</span>
                      <p className="text-sm font-bold text-white">Audi 1 · Dolby 7.1</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Date</span>
                      <p className="text-sm font-bold text-amber-400">05 Sep 2026</p>
                    </div>
                    <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Showtime</span>
                      <p className="text-sm font-bold text-white">02:45 PM</p>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-red-600/30 to-red-800/40 p-3 border border-red-500/50 sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-red-300">Your Reserved Seat</span>
                      <p className="text-2xl font-black text-white tracking-wider font-mono">
                        {employee.seat}
                      </p>
                    </div>
                  </div>

                  {/* Venue & Barcode */}
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-700/60 pt-4">
                    <div className="text-xs text-slate-400 text-center sm:text-left">
                      <p className="font-semibold text-slate-200">📍 1 Cinema Powered by Mukta A2</p>
                      <p className="text-[11px] text-slate-400">Star Mall, Sector 31, Gurugram, Haryana</p>
                    </div>

                    {/* Simulated Barcode */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 gap-0.5 items-end">
                        {[4, 8, 2, 7, 3, 9, 5, 8, 2, 6, 9, 3, 7, 4, 8, 3, 5, 9, 2, 7, 4, 8, 3].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-amber-400/80"
                            style={{ height: `${h * 10}%` }}
                          />
                        ))}
                      </div>
                      <span className="mt-1 font-mono text-[9px] text-slate-500">ADDA-TCH-2026-MUKTA</span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow-gold transition hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Save VIP Pass
                  </button>

                  <a
                    href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Adda247+Teacher%27s+Day+Movie+Screening+-+Mirzapur&dates=20260905T091500Z/20260905T121500Z&details=Adda247+Teacher%27s+Day+Special+Movie+Screening+at+Mukta+A2+Star+Mall+Gurugram&location=Star+Mall+Gurgaon"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
                  >
                    📅 Add to Google Calendar
                  </a>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* SEAT SELECTION EXPERIENCE */
          <>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl font-serif">
                Select Your Seat in the Auditorium
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Choose one preferred seat for the Adda247 Teacher&apos;s Day screening experience.
              </p>
            </div>

            {error && (
              <div className="mx-auto mb-6 max-w-lg rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-center text-xs font-semibold text-red-300 shadow-glow">
                ⚠️ {error}
              </div>
            )}

            {/* SEAT MAP */}
            <div className="w-full">
              <SeatMap
                reservedSeats={reservedSeats}
                selectedSeat={selectedSeat}
                onSeatClick={(seatId) => setSelectedSeat((prev) => (prev === seatId ? null : seatId))}
              />
            </div>

            {/* FLOATING ACTION BOTTOM BAR */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0B0F19]/95 p-4 shadow-2xl backdrop-blur-2xl">
              <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  {selectedSeat ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-lg font-black text-white shadow-glow">
                        {selectedSeat}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">Seat {selectedSeat}</span>
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                            {seatTier}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Teacher&apos;s Day VIP Pass · Complimentary for Adda247 Team ({seatPrice})
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-xl text-slate-500">
                        🎟️
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300">No seat selected</p>
                        <p className="text-xs text-slate-500">Click any available seat above to reserve</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={!selectedSeat || confirming}
                    onClick={handleConfirm}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-red-700 px-8 py-3 text-sm font-bold text-white shadow-glow transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {confirming ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Reserving VIP Seat…</span>
                      </>
                    ) : selectedSeat ? (
                      <>
                        <span>Confirm Seat {selectedSeat}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    ) : (
                      "Select a Seat Above"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
