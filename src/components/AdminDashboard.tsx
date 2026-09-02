"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import SeatMap from "@/components/SeatMap";
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
      notify("ok", `Added ${data.added} employee(s) to the list.`);
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
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(email: string, seatId: string) {
    if (!email || !seatId) {
      notify("error", "Choose an employee and a seat.");
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

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Mirzapur: The Movie · 05 Sep · 02:45 PM</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">{adminEmail}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pt-8">
        {message && (
          <div
            className={`mb-6 rounded-lg px-4 py-2 text-sm ${
              message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Employees" value={stats.totalEmployees} />
            <StatCard label="Seats Reserved" value={stats.seatsReserved} />
            <StatCard label="Seats Available" value={stats.seatsAvailable} />
            <StatCard label="Yet to Select" value={stats.employeesYetToSelect} />
          </div>
        )}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Seat map</h2>
          <p className="mt-1 text-xs text-slate-500">
            Click a seat to prefill the manual reservation form below. Rows A and B are reserved for admin
            use.
          </p>
          <div className="mt-6">
            <SeatMap
              reservedSeats={new Set(Object.keys(reserved))}
              onSeatClick={onSeatClicked}
              adminMode
              ownerLabel={(seatId) => reserved[seatId]}
            />
          </div>

          <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-3">
            <select
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.email} value={emp.email}>
                  {emp.name || emp.email} {emp.seat ? `(currently ${emp.seat})` : ""}
                </option>
              ))}
            </select>
            <input
              value={assignSeat}
              onChange={(e) => setAssignSeat(e.target.value.toUpperCase())}
              placeholder="Seat e.g. G12"
              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              disabled={busy}
              onClick={() => handleAssign(assignEmail, assignSeat)}
              className="rounded-lg bg-adda-purple px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Reserve / Reassign
            </button>
            {assignEmail && (
              <button
                disabled={busy}
                onClick={() => handleRelease(assignEmail)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
              >
                Release seat
              </button>
            )}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Approved employee list</h2>
          <p className="mt-1 text-xs text-slate-500">
            Paste one email per line (or comma-separated). Only these addresses can sign in.
          </p>
          <textarea
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            rows={3}
            placeholder={"employee1@adda247.com\nemployee2@adda247.com"}
            className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm"
          />
          <button
            disabled={busy}
            onClick={handleAddWhitelist}
            className="mt-3 rounded-lg bg-adda-purple px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Add employees
          </button>

          <div className="mt-6 flex flex-wrap gap-2">
            {whitelist.map((email) => (
              <span
                key={email}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
              >
                {email}
                <button
                  onClick={() => handleRemoveWhitelist(email)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label={`Remove ${email}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Employees</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Seat</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Booking Time</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.email} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{emp.name || "—"}</td>
                    <td className="py-2 pr-4">{emp.email}</td>
                    <td className="py-2 pr-4">{emp.seat || "—"}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          emp.status === "reserved"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {emp.status === "reserved" ? "Reserved" : "Not booked"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      {emp.bookingTime ? new Date(emp.bookingTime).toLocaleString() : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {emp.seat ? (
                        <button
                          disabled={busy}
                          onClick={() => handleRelease(emp.email)}
                          className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40"
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
                          className="text-xs font-medium text-adda-purple hover:underline disabled:opacity-40"
                        >
                          Assign seat
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
