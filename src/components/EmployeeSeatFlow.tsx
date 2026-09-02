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
  const [isAdmin, setIsAdmin] = useState(false);
  const [reservedSeats, setReservedSeats] = useState<Set<string>>(new Set());
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [activeShowtime, setActiveShowtime] = useState("02:45 PM");

  // Admin Slide-over Drawer state
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [whitelistText, setWhitelistText] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  async function loadAll() {
    setLoadState("loading");
    try {
      const meRes = await fetch("/api/employee/me");
      if (!meRes.ok) throw new Error("Failed to load your profile.");
      const meData = await meRes.json();
      setEmployee(meData.employee);
      setIsAdmin(!!meData.isAdmin);

      const seatsRes = await fetch("/api/seats");
      if (seatsRes.ok) {
        const seatsData = await seatsRes.json();
        setReservedSeats(new Set<string>(seatsData.reservedSeats || []));
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

  async function loadAdminData() {
    try {
      const res = await fetch("/api/admin/employees");
      if (res.ok) {
        const data = await res.json();
        setAllEmployees(data.employees || []);
      }
    } catch {}
  }

  async function handleAddWhitelist() {
    if (!whitelistText.trim()) return;
    setAdminBusy(true);
    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: whitelistText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdminMsg(`Added ${data.added} guests to list.`);
      setWhitelistText("");
      await loadAdminData();
      setTimeout(() => setAdminMsg(null), 3000);
    } catch (e) {
      setAdminMsg(e instanceof Error ? e.message : "Failed to add guests.");
    } finally {
      setAdminBusy(false);
    }
  }

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
      let data: { seat?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        setError(data.error || "Could not confirm your seat.");
        setSelectedSeat(null);
        const seatsRes = await fetch("/api/seats");
        if (seatsRes.ok) {
          const seatsData = await seatsRes.json();
          setReservedSeats(new Set<string>(seatsData.reservedSeats || []));
        }
        return;
      }
      setEmployee((prev) => (prev ? { ...prev, seat: data.seat!, status: "reserved" } : prev));
    } finally {
      setConfirming(false);
    }
  }

  if (loadState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07080A]">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          <span className="text-xs font-medium text-zinc-400">Loading auditorium…</span>
        </div>
      </main>
    );
  }

  if (loadState === "error" || !employee) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07080A] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0E1015] p-6 text-center">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => loadAll()}
            className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const isConfirmed = !!employee.seat;
  const isRecliner = selectedSeat?.startsWith("A") || selectedSeat?.startsWith("B");
  const seatTier = isRecliner ? "Premium Recliner" : "Gold Tier";

  return (
    <main className="min-h-screen bg-[#07080A] pb-28 text-white">
      
      {/* MINIMAL NAV HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07080A]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <AddaLogo height={24} variant="white" />
            {isAdmin && (
              <span className="rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                Admin
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => {
                  setShowAdminDrawer(true);
                  loadAdminData();
                }}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Guestlist & VIP Control
              </button>
            )}

            <span className="hidden text-xs text-zinc-400 sm:inline">
              {employee.name || employee.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pt-8">
        
        {/* EVENT & VENUE HERO - CLEAN & CLASSY */}
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-white/[0.06] pb-8 md:flex-row md:items-end">
          <div>
            <span className="text-[11px] font-semibold tracking-widest text-red-500 uppercase">
              Teacher&apos;s Day Private Screening
            </span>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Mirzapur: The Movie
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              5 Sep · 02:45 PM · 1 Cinema Powered by Mukta A2, Star Mall, Gurugram
            </p>
          </div>

          {/* SHOWTIME SELECTOR CHIPS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-center">
              <span className="block text-[9px] uppercase text-zinc-500 font-medium">Sat</span>
              <span className="text-xs font-bold text-white">05 Sep</span>
            </div>

            {["11:15 AM", "02:45 PM", "06:30 PM", "10:15 PM"].map((time) => {
              const isSelected = time === activeShowtime;
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => setActiveShowtime(time)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>

        {/* BODY: CONFIRMED PASS OR SEAT SELECTION */}
        {isConfirmed ? (
          /* DISTRICT / CRED MINIMAL VIP TICKET PASS */
          <div className="mx-auto max-w-md">
            <div className="rounded-3xl border border-white/[0.08] bg-[#0E1015] p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">
                    ✓ Seat Confirmed
                  </span>
                  <h2 className="mt-1 text-xl font-bold text-white">Mirzapur: The Movie</h2>
                  <p className="text-xs text-zinc-400">Teacher&apos;s Day Premiere</p>
                </div>
                <AddaLogo height={20} variant="white" />
              </div>

              {/* SEAT HIGHLIGHT */}
              <div className="my-6 flex items-center justify-between rounded-2xl bg-zinc-900/60 p-5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Your Seat</span>
                  <p className="text-3xl font-extrabold text-white">{employee.seat}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Auditorium</span>
                  <p className="text-sm font-semibold text-white">Audi 1 · Mukta A2</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-zinc-400 border-b border-white/[0.06] pb-6">
                <div className="flex justify-between">
                  <span>Guest</span>
                  <span className="text-white font-medium">{employee.name || employee.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time</span>
                  <span className="text-white font-medium">Sat 05 Sep · 02:45 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Venue</span>
                  <span className="text-white font-medium">Star Mall, Sector 31, Gurugram</span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-6 flex flex-col gap-3">
                <a
                  href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Adda247+Teacher%27s+Day+Movie+Screening+-+Mirzapur&dates=20260905T091500Z/20260905T121500Z&details=Adda247+Teacher%27s+Day+Special+Movie+Screening+at+Mukta+A2+Star+Mall+Gurugram&location=Star+Mall+Gurgaon"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-2xl bg-white py-3 text-xs font-semibold text-black transition hover:bg-zinc-200"
                >
                  Add to Google Calendar
                </a>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 py-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-700"
                >
                  Print Ticket
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SEAT MAP VIEW - EXACT SAME VIEW FOR ALL */
          <>
            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-xs text-red-400">
                {error}
              </div>
            )}

            <SeatMap
              reservedSeats={reservedSeats}
              selectedSeat={selectedSeat}
              adminMode={isAdmin}
              onSeatClick={(seatId) => setSelectedSeat((prev) => (prev === seatId ? null : seatId))}
            />

            {/* CRED / DISTRICT STYLE FLOATING CHECKOUT BAR */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#0A0C10]/95 p-4 backdrop-blur-2xl">
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
                <div>
                  {selectedSeat ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">Seat {selectedSeat}</span>
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                          {seatTier}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">Complimentary Employee Pass</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-zinc-400">
                        {isAdmin ? "Select any seat (including upper recliner rows)" : "Select a seat on the map (Rows C to M)"}
                      </p>
                      <p className="text-[11px] text-zinc-600">Click any available seat above</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!selectedSeat || confirming}
                  onClick={handleConfirm}
                  className="flex items-center gap-2 rounded-2xl bg-[#ED1C24] px-6 py-3 text-xs font-semibold text-white shadow-lg transition-all hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {confirming ? "Confirming…" : selectedSeat ? `Confirm Seat ${selectedSeat}` : "Select a seat"}
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* ADMIN SLIDE-OVER DRAWER */}
      {showAdminDrawer && isAdmin && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="h-full w-full max-w-md bg-[#0E1015] border-l border-white/[0.08] p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Guestlist & VIP Control</h3>
                <p className="text-xs text-zinc-400">Add employees and manage seats</p>
              </div>
              <button
                onClick={() => setShowAdminDrawer(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {adminMsg && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                {adminMsg}
              </div>
            )}

            {/* ADD GUESTS */}
            <div className="mt-6">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Upload / Paste Guest Emails
              </label>
              <textarea
                value={whitelistText}
                onChange={(e) => setWhitelistText(e.target.value)}
                rows={3}
                placeholder={"employee1@adda247.com\nemployee2@adda247.com"}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
              />
              <button
                disabled={adminBusy || !whitelistText.trim()}
                onClick={handleAddWhitelist}
                className="mt-2 w-full rounded-xl bg-white py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40"
              >
                Add to Approved Guestlist
              </button>
            </div>

            {/* QUICK GUEST LIST */}
            <div className="mt-8">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                All Guests ({allEmployees.length})
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {allEmployees.map((emp) => (
                  <div
                    key={emp.email}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs"
                  >
                    <div>
                      <p className="font-medium text-white">{emp.name || emp.email.split("@")[0]}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{emp.email}</p>
                    </div>
                    <div>
                      {emp.seat ? (
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                          {emp.seat}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-600">No seat</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
