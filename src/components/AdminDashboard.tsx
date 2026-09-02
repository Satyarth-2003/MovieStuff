"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import SeatMap from "@/components/SeatMap";
import AddaLogo from "@/components/AddaLogo";
import type { Employee } from "@/lib/booking";

interface Stats {
  totalEmployees: number;
  seatsReserved: number;
  seatsAvailable: number;
  employeesYetToSelect: number;
}

export default function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reserved, setReserved] = useState<Record<string, string>>({});
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [assignSeat, setAssignSeat] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function refreshAll() {
    const [statsRes, employeesRes, seatmapRes, whitelistRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/employees"),
      fetch("/api/admin/seatmap"),
      fetch("/api/admin/whitelist"),
    ]);
    const [statsData, employeesData, seatmapData, whitelistData] = await Promise.all([
      statsRes.json(),
      employeesRes.json(),
      seatmapRes.json(),
      whitelistRes.json(),
    ]);
    setStats(statsData.stats);
    setEmployees(employeesData.employees);
    setReserved(seatmapData.reserved);
    setWhitelist(whitelistData.whitelist);
  }

  useEffect(() => {
    refreshAll();
  }, []);

  function notify(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleAddWhitelist() {
    if (!emailInput.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify("ok", `Added ${data.added} employee(s) to the guest whitelist.`);
      setEmailInput("");
      await refreshAll();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to add employees.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveWhitelist(email: string) {
    setBusy(true);
    try {
      await fetch("/api/admin/whitelist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      notify("ok", `Removed ${email} from whitelist.`);
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(email: string, seatId: string) {
    if (!email || !seatId) {
      notify("error", "Please select an employee and a seat ID.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/seat/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, seatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify("ok", `Successfully assigned Seat ${seatId} to ${email}.`);
      setAssignSeat("");
      setAssignEmail("");
      await refreshAll();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to assign seat.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRelease(email: string) {
    setBusy(true);
    try {
      await fetch("/api/admin/seat/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      notify("ok", `Released seat for ${email}.`);
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  function onSeatClicked(seatId: string) {
    setAssignSeat(seatId);
    const owner = reserved[seatId];
    if (owner) {
      setAssignEmail(owner);
    }
  }

  // Filter employees
  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.seat && e.seat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  function exportCSV() {
    const headers = "Name,Email,Seat,Status,BookingTime\n";
    const rows = employees
      .map(
        (e) =>
          `"${e.name || ""}","${e.email}","${e.seat || ""}","${e.status}","${
            e.bookingTime ? new Date(e.bookingTime).toLocaleString() : ""
          }"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Adda247_Screening_Auditorium_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <main className="cinema-ambient-bg min-h-screen pb-20 text-slate-100">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0B0E14]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <AddaLogo size="md" showTagline tagline="Admin Management Portal" variant="gold" />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                ADMIN CONSOLE
              </span>
              <p className="mt-0.5 text-xs text-slate-400 font-mono">{adminEmail}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        
        {/* MESSAGE TOAST */}
        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 text-xs font-semibold shadow-lg backdrop-blur-lg ${
              message.type === "ok"
                ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-300"
                : "border-red-500/40 bg-red-950/50 text-red-300"
            }`}
          >
            {message.type === "ok" ? "✓ " : "⚠️ "} {message.text}
          </div>
        )}

        {/* STATS OVERVIEW CARDS */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Guests"
              value={stats.totalEmployees}
              icon="👥"
              color="text-slate-100"
              subtext="Approved on guestlist"
            />
            <StatCard
              label="Seats Confirmed"
              value={stats.seatsReserved}
              icon="🎟️"
              color="text-emerald-400"
              subtext={`${Math.round((stats.seatsReserved / (stats.totalEmployees || 1)) * 100)}% booked`}
            />
            <StatCard
              label="Seats Available"
              value={stats.seatsAvailable}
              icon="💺"
              color="text-sky-400"
              subtext="In auditorium"
            />
            <StatCard
              label="Yet to Choose"
              value={stats.employeesYetToSelect}
              icon="⏳"
              color="text-amber-400"
              subtext="Pending selection"
            />
          </div>
        )}

        {/* SEAT MAP INSPECTOR & OVERRIDE */}
        <section className="glass-panel mt-8 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-serif">Auditorium Seat Map</h2>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                  Live View
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Click any seat to view owner details or assign/reassign manually.
              </p>
            </div>

            <button
              onClick={refreshAll}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              🔄 Refresh Grid
            </button>
          </div>

          <div className="mt-6">
            <SeatMap
              reservedSeats={new Set(Object.keys(reserved))}
              onSeatClick={onSeatClicked}
              adminMode
              ownerLabel={(seatId) => reserved[seatId]}
            />
          </div>

          {/* QUICK ASSIGN FORM */}
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 shadow-inner">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              🛠️ Manual Seat Assignment & Override
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <select
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                className="flex-1 min-w-[200px] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="">Select an employee…</option>
                {employees.map((emp) => (
                  <option key={emp.email} value={emp.email}>
                    {emp.name || emp.email} {emp.seat ? `(Seat: ${emp.seat})` : "(No seat)"}
                  </option>
                ))}
              </select>

              <input
                value={assignSeat}
                onChange={(e) => setAssignSeat(e.target.value.toUpperCase())}
                placeholder="Seat ID (e.g. F14)"
                className="w-36 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />

              <button
                disabled={busy}
                onClick={() => handleAssign(assignEmail, assignSeat)}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2 text-xs font-bold text-white shadow-glow transition hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                Assign / Reassign
              </button>

              {assignEmail && (
                <button
                  disabled={busy}
                  onClick={() => handleRelease(assignEmail)}
                  className="rounded-xl border border-red-500/50 bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/50 disabled:opacity-40"
                >
                  Release Seat
                </button>
              )}
            </div>
          </div>
        </section>

        {/* APPROVED WHITELIST GUESTLIST */}
        <section className="glass-panel mt-8 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Guest Whitelist Control</h2>
              <p className="mt-1 text-xs text-slate-400">
                Add official Adda247 email addresses authorized for this Teacher&apos;s Day screening.
              </p>
            </div>
            <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs text-slate-300">
              {whitelist.length} Authorized Guests
            </span>
          </div>

          <div className="mt-4">
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              rows={3}
              placeholder="Paste email addresses (one per line or comma-separated) e.g.&#10;teacher1@adda247.com&#10;educator2@adda247.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-xs text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                disabled={busy || !emailInput.trim()}
                onClick={handleAddWhitelist}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2 text-xs font-bold text-white shadow-glow transition hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                + Add Guests to Whitelist
              </button>
            </div>
          </div>

          {/* TAGS LIST */}
          <div className="mt-6 flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
            {whitelist.map((email) => (
              <span
                key={email}
                className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-[11px] text-slate-200"
              >
                <span>{email}</span>
                <button
                  onClick={() => handleRemoveWhitelist(email)}
                  className="ml-1 text-slate-400 hover:text-red-400 font-bold"
                  aria-label={`Remove ${email}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* GUEST DIRECTORY TABLE */}
        <section className="glass-panel mt-8 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Guest & Ticket Directory</h2>
              <p className="mt-1 text-xs text-slate-400">
                Real-time booking status and seat allocations.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, seat…"
                className="w-full sm:w-60 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
              />
              <button
                onClick={exportCSV}
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Educator / Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Allocated Seat</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Confirmed At</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.email} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-white">{emp.name || "—"}</td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{emp.email}</td>
                    <td className="py-3 px-3">
                      {emp.seat ? (
                        <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-bold font-mono text-amber-300">
                          {emp.seat}
                        </span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          emp.status === "reserved"
                            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border border-slate-700 bg-slate-800/60 text-slate-400"
                        }`}
                      >
                        {emp.status === "reserved" ? "✓ Confirmed" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {emp.bookingTime ? new Date(emp.bookingTime).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {emp.seat ? (
                        <button
                          disabled={busy}
                          onClick={() => handleRelease(emp.email)}
                          className="font-semibold text-red-400 hover:text-red-300 hover:underline"
                        >
                          Release
                        </button>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={() => {
                            setAssignEmail(emp.email);
                            setAssignSeat("");
                          }}
                          className="font-semibold text-amber-400 hover:text-amber-300 hover:underline"
                        >
                          Assign Seat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  subtext,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  subtext: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 shadow-lg border border-slate-800/80">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{label}</span>
      </div>
      <p className={`mt-3 text-3xl font-black tracking-tight ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{subtext}</p>
    </div>
  );
}
