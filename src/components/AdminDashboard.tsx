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
    try {
      const [statsRes, employeesRes, seatmapRes, whitelistRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/employees"),
        fetch("/api/admin/seatmap"),
        fetch("/api/admin/whitelist"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.stats) setStats(statsData.stats);
      }
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        if (employeesData.employees) setEmployees(employeesData.employees);
      }
      if (seatmapRes.ok) {
        const seatmapData = await seatmapRes.json();
        if (seatmapData.reserved) setReserved(seatmapData.reserved);
      }
      if (whitelistRes.ok) {
        const whitelistData = await whitelistRes.json();
        if (whitelistData.whitelist) setWhitelist(whitelistData.whitelist);
      }
    } catch (err) {
      console.error("Error refreshing admin dashboard:", err);
    }
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
      notify("ok", `Added ${data.added} guest(s) to whitelist.`);
      setEmailInput("");
      await refreshAll();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to add.");
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
      notify("ok", `Removed ${email}`);
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(email: string, seatId: string) {
    if (!email || !seatId) {
      notify("error", "Select an employee and enter seat ID.");
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
      notify("ok", `Assigned ${seatId} to ${email}.`);
      setAssignSeat("");
      setAssignEmail("");
      await refreshAll();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to assign.");
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
    if (owner) setAssignEmail(owner);
  }

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
    a.download = `Adda247_Auditorium_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <main className="min-h-screen bg-[#07080A] pb-20 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07080A]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <AddaLogo height={24} variant="white" />
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-zinc-400 sm:inline">{adminEmail}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pt-8">
        {message && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-xs font-medium ${
              message.type === "ok"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* METRICS */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Guests" value={stats.totalEmployees} />
            <StatCard label="Reserved" value={stats.seatsReserved} highlight="text-white" />
            <StatCard label="Available" value={stats.seatsAvailable} />
            <StatCard label="Pending" value={stats.employeesYetToSelect} highlight="text-zinc-400" />
          </div>
        )}

        {/* SEAT MAP */}
        <section className="mt-8 rounded-3xl border border-white/[0.06] bg-[#0E1015] p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Auditorium Grid</h2>
              <p className="text-xs text-zinc-500">Click a seat to inspect or override</p>
            </div>
            <button
              onClick={refreshAll}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Refresh
            </button>
          </div>

          <SeatMap
            reservedSeats={new Set(Object.keys(reserved))}
            onSeatClick={onSeatClicked}
            adminMode
            ownerLabel={(seatId) => reserved[seatId]}
          />

          {/* OVERRIDE BAR */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-6">
            <select
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              className="flex-1 min-w-[200px] rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">Select an employee…</option>
              {employees.map((emp) => (
                <option key={emp.email} value={emp.email}>
                  {emp.name || emp.email} {emp.seat ? `(${emp.seat})` : ""}
                </option>
              ))}
            </select>

            <input
              value={assignSeat}
              onChange={(e) => setAssignSeat(e.target.value.toUpperCase())}
              placeholder="Seat ID (e.g. G12)"
              className="w-32 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none"
            />

            <button
              disabled={busy}
              onClick={() => handleAssign(assignEmail, assignSeat)}
              className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40"
            >
              Assign
            </button>

            {assignEmail && (
              <button
                disabled={busy}
                onClick={() => handleRelease(assignEmail)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
              >
                Release
              </button>
            )}
          </div>
        </section>

        {/* WHITELIST */}
        <section className="mt-8 rounded-3xl border border-white/[0.06] bg-[#0E1015] p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Approved Guestlist</h2>
              <p className="text-xs text-zinc-500">Only listed emails can sign in</p>
            </div>
            <span className="text-xs text-zinc-500">{whitelist.length} guests</span>
          </div>

          <div className="mt-4">
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              rows={2}
              placeholder="Paste email addresses (one per line or comma-separated)…"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                disabled={busy || !emailInput.trim()}
                onClick={handleAddWhitelist}
                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40"
              >
                Add Guests
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {whitelist.map((email) => (
              <span
                key={email}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300"
              >
                <span>{email}</span>
                <button
                  onClick={() => handleRemoveWhitelist(email)}
                  className="text-zinc-500 hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* DIRECTORY TABLE */}
        <section className="mt-8 rounded-3xl border border-white/[0.06] bg-[#0E1015] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">All Bookings</h2>
              <p className="text-xs text-zinc-500">Live seat assignments</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button
                onClick={exportCSV}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.04] text-[10px] uppercase text-zinc-500">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Seat</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.email} className="hover:bg-zinc-900/30">
                    <td className="py-2.5 px-3 font-medium text-white">{emp.name || "—"}</td>
                    <td className="py-2.5 px-3 text-zinc-400 font-mono">{emp.email}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{emp.seat || "—"}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                          emp.status === "reserved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {emp.status === "reserved" ? "Reserved" : "Pending"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {emp.seat ? (
                        <button
                          disabled={busy}
                          onClick={() => handleRelease(emp.email)}
                          className="text-red-400 hover:underline"
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
                          className="text-zinc-400 hover:text-white"
                        >
                          Assign
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
  highlight = "text-zinc-100",
}: {
  label: string;
  value: number;
  highlight?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0E1015] p-5">
      <p className="text-[10px] uppercase font-semibold text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight}`}>{value}</p>
    </div>
  );
}
