"use client";

import React from "react";
import { isAdminRowSeat } from "@/lib/seats";

export type SeatState = "available" | "selected" | "reserved" | "admin-reserved" | "mine" | "best";

interface SeatMapProps {
  reservedSeats: Set<string>;
  mySeat?: string | null;
  selectedSeat?: string | null;
  onSeatClick?: (seatId: string) => void;
  interactive?: boolean;
  adminMode?: boolean;
  ownerLabel?: (seatId: string) => string | undefined;
}

// Prime viewing seats in the auditorium
const BEST_SEATS = new Set([
  "A9", "A10", "A11", "A12", "A13", "A14", "A15", "A16", "A17",
  "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13", "B14",
  "C11", "C12", "C13", "C14", "C15", "C16", "C17",
  "D4", "D5", "D8", "D9", "D11", "D12", "D15", "D16", "D17",
  "E4", "E5", "E6", "E7", "E8", "E9", "E11", "E12", "E13", "E14",
  "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14",
]);

// Blocked seats according to theatre blueprint
const STRUCTURAL_BLOCKED = new Set([
  "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10",
  "D13", "D14",
]);

function getSeatStatus(
  seatId: string,
  reservedSeats: Set<string>,
  mySeat: string | null | undefined,
  selectedSeat: string | null | undefined,
  adminMode: boolean
): { state: SeatState; isStructuralBlocked: boolean } {
  const isStructuralBlocked = STRUCTURAL_BLOCKED.has(seatId);

  if (isStructuralBlocked) {
    return { state: "reserved", isStructuralBlocked: true };
  }
  if (mySeat === seatId) {
    return { state: "mine", isStructuralBlocked: false };
  }
  if (selectedSeat === seatId) {
    return { state: "selected", isStructuralBlocked: false };
  }
  if (reservedSeats.has(seatId)) {
    return { state: "reserved", isStructuralBlocked: false };
  }
  if (!adminMode && isAdminRowSeat(seatId)) {
    return { state: "admin-reserved", isStructuralBlocked: false };
  }
  if (BEST_SEATS.has(seatId)) {
    return { state: "best", isStructuralBlocked: false };
  }
  return { state: "available", isStructuralBlocked: false };
}

export default function SeatMap({
  reservedSeats,
  mySeat,
  selectedSeat,
  onSeatClick,
  interactive = true,
  adminMode = false,
  ownerLabel,
}: SeatMapProps) {
  const goldRows = ["C", "D", "E", "F", "G", "H", "J", "K", "L", "M"] as const;

  return (
    <div className="w-full select-none">
      <div className="w-full overflow-x-auto rounded-3xl border border-white/[0.06] bg-[#0A0C10] p-6 sm:p-8 backdrop-blur-xl">
        <div className="min-w-[820px] flex flex-col items-center">
          
          {/* SECTION: PREMIUM RECLINER */}
          <div className="w-full max-w-3xl mb-8">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                PREMIUM RECLINER · ₹300
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {/* Row A */}
            <div className="my-1.5 flex items-center justify-center gap-4">
              <span className="w-5 text-center text-xs font-semibold text-zinc-500">A</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div
                    key={`A${n}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent bg-zinc-900/20 text-[10px] text-zinc-700"
                  >
                    ✕
                  </div>
                ))}
                {[9, 10, 11, 12, 13, 14, 15, 16, 17].map((n) => {
                  const seatId = `A${n}`;
                  const { state } = getSeatStatus(seatId, reservedSeats, mySeat, selectedSeat, adminMode);
                  return (
                    <Seat
                      key={seatId}
                      seatId={seatId}
                      n={n}
                      state={state}
                      interactive={interactive}
                      adminMode={adminMode}
                      onClick={onSeatClick}
                      title={ownerLabel?.(seatId)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Row B */}
            <div className="my-1.5 flex items-center justify-center gap-4">
              <span className="w-5 text-center text-xs font-semibold text-zinc-500">B</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => {
                  const seatId = `B${n}`;
                  const { state } = getSeatStatus(seatId, reservedSeats, mySeat, selectedSeat, adminMode);
                  return (
                    <Seat
                      key={seatId}
                      seatId={seatId}
                      n={n}
                      state={state}
                      interactive={interactive}
                      adminMode={adminMode}
                      onClick={onSeatClick}
                      title={ownerLabel?.(seatId)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION: GOLD */}
          <div className="w-full max-w-3xl">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                GOLD · ₹200
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="flex flex-col items-center gap-1.5">
              {goldRows.map((row) => {
                const left = Array.from({ length: 10 }, (_, i) => i + 1);
                const right = Array.from({ length: 10 }, (_, i) => i + 11);

                return (
                  <div key={row} className="flex items-center gap-4">
                    <span className="w-5 text-center text-xs font-semibold text-zinc-500">{row}</span>

                    {/* Left Block */}
                    <div className="flex gap-1.5">
                      {left.map((n) => {
                        const seatId = `${row}${n}`;
                        const { state, isStructuralBlocked } = getSeatStatus(
                          seatId,
                          reservedSeats,
                          mySeat,
                          selectedSeat,
                          adminMode
                        );
                        if (isStructuralBlocked) {
                          return (
                            <div
                              key={seatId}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent bg-zinc-900/20 text-[10px] text-zinc-700"
                            >
                              ✕
                            </div>
                          );
                        }
                        return (
                          <Seat
                            key={seatId}
                            seatId={seatId}
                            n={n}
                            state={state}
                            interactive={interactive}
                            adminMode={adminMode}
                            onClick={onSeatClick}
                            title={ownerLabel?.(seatId)}
                          />
                        );
                      })}
                    </div>

                    {/* Aisle */}
                    <div className="w-6" />

                    {/* Right Block */}
                    <div className="flex gap-1.5">
                      {right.map((n) => {
                        const seatId = `${row}${n}`;
                        const { state, isStructuralBlocked } = getSeatStatus(
                          seatId,
                          reservedSeats,
                          mySeat,
                          selectedSeat,
                          adminMode
                        );
                        if (isStructuralBlocked) {
                          return (
                            <div
                              key={seatId}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent bg-zinc-900/20 text-[10px] text-zinc-700"
                            >
                              ✕
                            </div>
                          );
                        }
                        return (
                          <Seat
                            key={seatId}
                            seatId={seatId}
                            n={n}
                            state={state}
                            interactive={interactive}
                            adminMode={adminMode}
                            onClick={onSeatClick}
                            title={ownerLabel?.(seatId)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MINIMALIST 3D SCREEN CURVE */}
          <div className="mt-12 mb-4 flex flex-col items-center w-full max-w-lg">
            <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-zinc-800 via-white to-zinc-800 opacity-90 shadow-[0_4px_20px_rgba(255,255,255,0.15)]" />
            <p className="mt-3 text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
              SCREEN THIS WAY
            </p>
          </div>

          {/* MINIMALIST LEGEND */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded border border-sky-400/80 bg-sky-500/20" />
              <span>Best Seats</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded border border-zinc-700 bg-zinc-900" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-zinc-900/50 text-[9px] text-zinc-600">
                ✕
              </span>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded bg-[#ED1C24]" />
              <span className="text-white font-medium">Selected</span>
            </div>
            {adminMode && (
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded border border-amber-500/50 bg-amber-500/20" />
                <span className="text-amber-400">VIP / Admin</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function Seat({
  seatId,
  n,
  state,
  interactive,
  adminMode,
  onClick,
  title,
}: {
  seatId: string;
  n: number;
  state: SeatState;
  interactive: boolean;
  adminMode?: boolean;
  onClick?: (seatId: string) => void;
  title?: string;
}) {
  const clickable =
    interactive &&
    onClick &&
    (state === "available" ||
      state === "best" ||
      state === "selected" ||
      (adminMode && (state === "reserved" || state === "mine" || state === "admin-reserved")));

  let styles = "";
  switch (state) {
    case "selected":
      styles = "bg-[#ED1C24] text-white font-bold border-[#ED1C24] shadow-md scale-105";
      break;
    case "mine":
      styles = "bg-emerald-600 text-white font-bold border-emerald-500";
      break;
    case "best":
      styles =
        "border-sky-400/80 bg-sky-500/10 text-sky-200 hover:border-red-500 hover:bg-red-500/20 hover:text-white cursor-pointer";
      break;
    case "reserved":
      styles = "border-transparent bg-zinc-900/30 text-zinc-700 cursor-not-allowed";
      break;
    case "admin-reserved":
      styles = "border-zinc-800 bg-zinc-900/40 text-zinc-600 cursor-not-allowed";
      break;
    case "available":
    default:
      styles =
        "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500 hover:text-white cursor-pointer hover:scale-105";
      break;
  }

  return (
    <button
      type="button"
      title={title || `Seat ${seatId}`}
      disabled={!clickable}
      onClick={() => clickable && onClick?.(seatId)}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-medium transition-all duration-150 active:scale-95 ${styles}`}
    >
      {state === "reserved" ? "✕" : n}
    </button>
  );
}
