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
  const [isVIP, setIsVIP] = useState(false);
  const [reservedSeats, setReservedSeats] = useState<Set<string>>(new Set());
  const [seatOwners, setSeatOwners] = useState<Record<string, string>>({});
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [releasing, setReleasing] = useState(false);

  // Admin View Switcher: "map" | "ticket"
  const [adminTab, setAdminTab] = useState<"map" | "ticket">("map");

  // Admin Selected Seat Action Modal state
  const [adminSeatModal, setAdminSeatModal] = useState<string | null>(null);
  const [reassignEmail, setReassignEmail] = useState("");

  // Admin Slide-over Drawer state
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [whitelistText, setWhitelistText] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [quickAssignSeat, setQuickAssignSeat] = useState<Record<string, string>>({});

  async function loadAll() {
    setLoadState("loading");
    try {
      const meRes = await fetch("/api/employee/me");
      if (!meRes.ok) throw new Error("Failed to load your profile.");
      const meData = await meRes.json();
      setEmployee(meData.employee);
      const userIsAdmin = !!meData.isAdmin;
      const userIsVIP = !!meData.isVIP;
      setIsAdmin(userIsAdmin);
      setIsVIP(userIsVIP);

      const seatsRes = await fetch("/api/seats");
      if (seatsRes.ok) {
        const seatsData = await seatsRes.json();
        setReservedSeats(new Set<string>(seatsData.reservedSeats || []));
      }

      if (userIsAdmin) {
        const seatmapRes = await fetch("/api/admin/seatmap");
        if (seatmapRes.ok) {
          const seatmapData = await seatmapRes.json();
          setSeatOwners(seatmapData.reserved || {});
        }
        await loadAdminData();
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

  async function handleConfirmBooking() {
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
        setShowConfirmModal(false);
        await refreshSeats();
        return;
      }

      // Update confirmed state and take user directly to the Confirmed Ticket Pass page
      setEmployee((prev) => (prev ? { ...prev, seat: data.seat!, status: "reserved" } : prev));
      setShowConfirmModal(false);
      setAdminTab("ticket");
      window.scrollTo({ top: 0, behavior: "smooth" });
      await refreshSeats();
    } finally {
      setConfirming(false);
    }
  }

  async function refreshSeats() {
    const seatsRes = await fetch("/api/seats");
    if (seatsRes.ok) {
      const seatsData = await seatsRes.json();
      setReservedSeats(new Set<string>(seatsData.reservedSeats || []));
    }
    if (isAdmin) {
      const seatmapRes = await fetch("/api/admin/seatmap");
      if (seatmapRes.ok) {
        const seatmapData = await seatmapRes.json();
        setSeatOwners(seatmapData.reserved || {});
      }
      await loadAdminData();
    }
  }

  async function handleReleaseMySeat() {
    setReleasing(true);
    try {
      const res = await fetch("/api/seats/release", { method: "POST" });
      if (res.ok) {
        setEmployee((prev) => (prev ? { ...prev, seat: null, status: "not_booked" } : prev));
        setSelectedSeat(null);
        setAdminTab("map");
        window.scrollTo({ top: 0, behavior: "smooth" });
        await refreshSeats();
      }
    } finally {
      setReleasing(false);
    }
  }

  // Admin Actions for any user/seat
  async function handleAdminReleaseSeat(seatIdOrEmail: { seatId?: string; email?: string }) {
    setAdminBusy(true);
    try {
      const res = await fetch("/api/admin/seat/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seatIdOrEmail),
      });
      if (res.ok) {
        setAdminMsg("Seat released successfully.");
        setAdminSeatModal(null);
        await refreshSeats();
        if (seatIdOrEmail.email === employee?.email || (employee?.seat && seatIdOrEmail.seatId === employee.seat)) {
          setEmployee((prev) => (prev ? { ...prev, seat: null, status: "not_booked" } : prev));
        }
        setTimeout(() => setAdminMsg(null), 3000);
      }
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleAdminAssignSeat(email: string, seatId: string) {
    if (!email || !seatId) return;
    setAdminBusy(true);
    try {
      const res = await fetch("/api/admin/seat/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, seatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign seat.");
      setAdminMsg(`Assigned ${seatId} to ${email}`);
      setAdminSeatModal(null);
      setReassignEmail("");
      await refreshSeats();
      if (email.toLowerCase() === employee?.email.toLowerCase()) {
        setEmployee((prev) => (prev ? { ...prev, seat: seatId, status: "reserved" } : prev));
      }
      setTimeout(() => setAdminMsg(null), 3000);
    } catch (e) {
      setAdminMsg(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setAdminBusy(false);
    }
  }

  function handleSeatClick(seatId: string) {
    if (isAdmin) {
      const owner = seatOwners[seatId];
      if (owner || seatId === employee?.seat || reservedSeats.has(seatId)) {
        setAdminSeatModal(seatId);
        return;
      }
    }
    setSelectedSeat((prev) => (prev === seatId ? null : seatId));
  }

  if (loadState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07080A] px-4">
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
        <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0E1015] p-6 text-center shadow-2xl">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => loadAll()}
            className="mt-4 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200"
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

  // Dedicated Ticket Pass Page view condition
  const showTicketView = !isAdmin && isConfirmed ? true : isAdmin && isConfirmed && adminTab === "ticket";

  return (
    <main className="min-h-screen bg-[#07080A] pb-28 text-white">
      
      {/* MINIMAL RESPONSIVE HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07080A]/90 backdrop-blur-xl no-print">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <AddaLogo height={22} variant="white" />
            {isAdmin ? (
              <span className="rounded-md bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                Admin
              </span>
            ) : isVIP ? (
              <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                VIP Guest
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Admin Tabs Toggle */}
            {isAdmin && isConfirmed && (
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 p-0.5 text-[11px] sm:text-xs">
                <button
                  onClick={() => setAdminTab("map")}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    adminTab === "map" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Seats Map
                </button>
                <button
                  onClick={() => setAdminTab("ticket")}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    adminTab === "ticket" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Pass ({employee.seat})
                </button>
              </div>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  setShowAdminDrawer(true);
                  loadAdminData();
                }}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Guestlist
              </button>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[11px] sm:text-xs text-zinc-500 transition hover:text-zinc-300 whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8">
        
        {/* EVENT & VENUE HERO */}
        <div className="mb-6 sm:mb-8 flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-6 sm:pb-8 md:flex-row md:items-end no-print">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-widest text-red-500 uppercase">
              Teacher&apos;s Day Private Screening
            </span>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Mirzapur: The Movie
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">
              5 Sep · 02:45 PM · 1 Cinema Powered by Mukta A2, Star Mall, Gurugram
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-zinc-900/80 px-3.5 py-2 sm:px-4 sm:py-2.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <div>
                <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400">Auditorium 1</span>
                <span className="text-xs font-bold text-white">Sat, 05 Sep · 02:45 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* ADMIN MSG TOAST */}
        {adminMsg && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-400 no-print">
            {adminMsg}
          </div>
        )}

        {/* BODY: CONFIRMED TICKET PASS PAGE OR SEAT MAP SELECTION */}
        {showTicketView ? (
          /* NEXT PAGE: CONFIRMED VIP TICKET PASS */
          <div className="mx-auto max-w-md animate-in fade-in duration-300">
            <div className="ticket-card rounded-3xl border border-white/[0.08] bg-[#0E1015] p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">
                    ✓ Seat Confirmed
                  </span>
                  <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">Mirzapur: The Movie</h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400">Teacher&apos;s Day Premiere</p>
                </div>
                <AddaLogo height={20} variant="white" />
              </div>

              {/* SEAT HIGHLIGHT */}
              <div className="my-5 sm:my-6 flex items-center justify-between rounded-2xl bg-zinc-900/80 border border-white/[0.04] p-4 sm:p-5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Your Seat</span>
                  <p className="text-3xl font-extrabold text-white">{employee.seat}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Auditorium</span>
                  <p className="text-xs sm:text-sm font-semibold text-white">Audi 1 · Mukta A2</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-400 border-b border-white/[0.06] pb-5">
                <div className="flex justify-between">
                  <span>Guest</span>
                  <span className="text-white font-medium">{employee.name || employee.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Showtime</span>
                  <span className="text-white font-medium">Sat 05 Sep · 02:45 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Venue</span>
                  <span className="text-white font-medium">Star Mall, Sector 31, Gurugram</span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-5 sm:mt-6 flex flex-col gap-2.5 no-print">
                <a
                  href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Adda247+Teacher%27s+Day+Movie+Screening+-+Mirzapur&dates=20260905T091500Z/20260905T121500Z&details=Adda247+Teacher%27s+Day+Special+Movie+Screening+at+Mukta+A2+Star+Mall+Gurugram&location=Star+Mall+Gurgaon"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-2xl bg-white py-3 text-xs font-semibold text-black transition hover:bg-zinc-200"
                >
                  Add to Google Calendar
                </a>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 py-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-700"
                  >
                    Print Ticket
                  </button>

                  <button
                    disabled={releasing}
                    onClick={handleReleaseMySeat}
                    className="flex-1 rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
                  >
                    {releasing ? "Freeing Seat…" : "Change / Free Seat"}
                  </button>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setAdminTab("map")}
                    className="mt-2 text-center text-[11px] text-zinc-500 hover:text-zinc-300"
                  >
                    ← Switch back to Live Auditorium Map
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SEAT MAP VIEW */
          <>
            {error && (
              <div className="mb-4 sm:mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-center text-xs text-red-400">
                {error}
              </div>
            )}

            {isAdmin && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-3 sm:px-4 sm:py-2.5 text-xs text-zinc-400">
                <span>
                  Admin Mode Active: Click any booked seat to view details or release it.
                </span>
                <span className="font-mono text-amber-400 font-medium">
                  {reservedSeats.size} Seats Reserved
                </span>
              </div>
            )}

            <SeatMap
              reservedSeats={reservedSeats}
              selectedSeat={selectedSeat}
              mySeat={employee.seat}
              adminMode={isAdmin}
              vipMode={isVIP}
              ownerLabel={(seatId) => seatOwners[seatId]}
              onSeatClick={handleSeatClick}
            />

            {/* FLOATING CHECKOUT BAR (MOBILE OPTIMIZED) */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#0A0C10]/95 p-3 sm:p-4 backdrop-blur-2xl no-print">
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
                <div className="min-w-0">
                  {selectedSeat ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                          Seat {selectedSeat}
                        </span>
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-zinc-300 truncate">
                          {seatTier}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate">Complimentary Pass</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-zinc-300 truncate">
                        {isAdmin || isVIP
                          ? "Select a seat (Rows A to H)"
                          : "Select a seat (Rows D to H)"}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500">Tap any available seat above</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!selectedSeat}
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center justify-center rounded-2xl bg-[#ED1C24] px-4 py-2.5 sm:px-6 sm:py-3 text-xs font-semibold text-white shadow-lg transition-all hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 whitespace-nowrap"
                >
                  {selectedSeat ? `Confirm ${selectedSeat}` : "Select a seat"}
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* CONFIRMATION MODAL BEFORE LOCKING SEAT */}
      {showConfirmModal && selectedSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#0E1015] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500">
                  Step 2 · Confirm Booking
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">Review Your Seat</h3>
              </div>
              <AddaLogo height={20} variant="white" />
            </div>

            <div className="my-5 rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Selected Seat</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">{selectedSeat}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-zinc-300">
                    {seatTier}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Movie</span>
                  <span className="font-medium text-white">Mirzapur: The Movie</span>
                </div>
                <div className="flex justify-between">
                  <span>Showtime</span>
                  <span className="font-medium text-white">Sat, 05 Sep · 02:45 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Venue</span>
                  <span className="font-medium text-white">Mukta A2, Star Mall, Gurugram</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest</span>
                  <span className="font-medium text-white">{employee.name || employee.email}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 mb-5 text-center">
              Please ensure you can attend at this showtime before locking your seat.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                disabled={confirming}
                onClick={handleConfirmBooking}
                className="w-full rounded-2xl bg-[#ED1C24] py-3 sm:py-3.5 text-xs font-semibold text-white shadow-lg transition hover:bg-red-600 active:scale-95 disabled:opacity-40"
              >
                {confirming ? "Locking Seat…" : "Yes, Confirm & Lock Seat"}
              </button>

              <button
                disabled={confirming}
                onClick={() => setShowConfirmModal(false)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-2.5 sm:py-3 text-xs font-medium text-zinc-400 transition hover:text-white"
              >
                Change Seat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN SEAT INSPECT & RELEASE MODAL */}
      {adminSeatModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0E1015] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Admin Seat Control</span>
                <h3 className="text-base sm:text-lg font-bold text-white">Seat {adminSeatModal}</h3>
              </div>
              <button onClick={() => setAdminSeatModal(null)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <div className="my-4 rounded-2xl bg-zinc-900/60 p-3.5 text-xs">
              <span className="text-zinc-500">Current Status:</span>
              <p className="font-semibold text-white mt-0.5">
                {seatOwners[adminSeatModal]
                  ? `Booked by ${seatOwners[adminSeatModal]}`
                  : adminSeatModal === employee?.seat
                  ? `Booked by You (${employee.email})`
                  : reservedSeats.has(adminSeatModal)
                  ? "Booked"
                  : "Available"}
              </p>
            </div>

            <div className="space-y-2.5">
              {(seatOwners[adminSeatModal] || reservedSeats.has(adminSeatModal) || adminSeatModal === employee?.seat) && (
                <button
                  disabled={adminBusy}
                  onClick={() => handleAdminReleaseSeat({ seatId: adminSeatModal })}
                  className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
                >
                  {adminBusy ? "Releasing…" : "Release / Free this Seat"}
                </button>
              )}

              <div className="border-t border-white/[0.06] pt-3">
                <label className="block text-[11px] text-zinc-400 mb-1.5">Reassign seat to guest:</label>
                <div className="flex gap-2">
                  <select
                    value={reassignEmail}
                    onChange={(e) => setReassignEmail(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">Select an employee…</option>
                    {allEmployees.map((emp) => (
                      <option key={emp.email} value={emp.email}>
                        {emp.name || emp.email} {emp.seat ? `(Seat: ${emp.seat})` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={adminBusy || !reassignEmail}
                    onClick={() => handleAdminAssignSeat(reassignEmail, adminSeatModal)}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40"
                  >
                    Assign
                  </button>
                </div>
              </div>

              <button
                disabled={adminBusy}
                onClick={() => handleAdminAssignSeat(employee.email, adminSeatModal)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-40"
              >
                Claim this seat for Myself
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN SLIDE-OVER DRAWER */}
      {showAdminDrawer && isAdmin && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="h-full w-full max-w-md bg-[#0E1015] border-l border-white/[0.08] p-5 sm:p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Guestlist & VIP Control</h3>
                <p className="text-xs text-zinc-400">Manage all guests and seat assignments</p>
              </div>
              <button
                onClick={() => setShowAdminDrawer(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* ADD GUESTS */}
            <div className="mt-5">
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
            <div className="mt-6 sm:mt-8">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                All Guests ({allEmployees.length})
              </h4>
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {allEmployees.map((emp) => (
                  <div
                    key={emp.email}
                    className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{emp.name || emp.email.split("@")[0]}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{emp.email}</p>
                      </div>
                      <div>
                        {emp.seat ? (
                          <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                            Seat {emp.seat}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-600">No seat</span>
                        )}
                      </div>
                    </div>

                    {/* Admin Actions for this user */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                      <input
                        placeholder="Seat (e.g. A10)"
                        value={quickAssignSeat[emp.email] || ""}
                        onChange={(e) =>
                          setQuickAssignSeat((prev) => ({ ...prev, [emp.email]: e.target.value.toUpperCase() }))
                        }
                        className="w-24 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-white uppercase focus:outline-none"
                      />
                      <button
                        disabled={adminBusy || !quickAssignSeat[emp.email]}
                        onClick={() => handleAdminAssignSeat(emp.email, quickAssignSeat[emp.email])}
                        className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold text-black hover:bg-zinc-200 disabled:opacity-30"
                      >
                        {emp.seat ? "Change" : "Assign"}
                      </button>
                      {emp.seat && (
                        <button
                          disabled={adminBusy}
                          onClick={() => handleAdminReleaseSeat({ email: emp.email })}
                          className="text-[11px] font-medium text-amber-400 hover:text-amber-300 ml-auto"
                        >
                          Release Seat
                        </button>
                      )}
                      <button
                        disabled={adminBusy}
                        onClick={async () => {
                          if (confirm(`Are you sure you want to remove ${emp.email} from the guestlist?`)) {
                            setAdminBusy(true);
                            try {
                              const res = await fetch("/api/admin/whitelist", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email: emp.email }),
                              });
                              if (res.ok) {
                                setAdminMsg(`Removed ${emp.email} from guest list.`);
                                await refreshSeats();
                                setTimeout(() => setAdminMsg(null), 3000);
                              }
                            } finally {
                              setAdminBusy(false);
                            }
                          }
                        }}
                        className={`text-[11px] font-medium text-red-400 hover:text-red-300 ${!emp.seat ? "ml-auto" : ""}`}
                      >
                        Remove
                      </button>
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
