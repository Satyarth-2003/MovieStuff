"use client";

import React, { useState } from "react";
import { ROW_LETTERS, isAdminRowSeat } from "@/lib/seats";

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

// Prime viewing seats in the auditorium for best audio-visual experience
const BEST_SEATS = new Set([
  "A9", "A10", "A11", "A12", "A13", "A14", "A15", "A16", "A17",
  "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13", "B14",
  "C11", "C12", "C13", "C14", "C15", "C16", "C17",
  "D4", "D5", "D8", "D9", "D11", "D12", "D15", "D16", "D17",
  "E4", "E5", "E6", "E7", "E8", "E9", "E11", "E12", "E13", "E14",
  "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14",
]);

// Blocked or aisle dummy seats to match theatre architectural map
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
): { state: SeatState; isBest: boolean; isStructuralBlocked: boolean } {
  const isBest = BEST_SEATS.has(seatId);
  const isStructuralBlocked = STRUCTURAL_BLOCKED.has(seatId);

  if (isStructuralBlocked) {
    return { state: "reserved", isBest: false, isStructuralBlocked: true };
  }

  if (mySeat === seatId) {
    return { state: "mine", isBest, isStructuralBlocked: false };
  }

  if (selectedSeat === seatId) {
    return { state: "selected", isBest, isStructuralBlocked: false };
  }

  if (reservedSeats.has(seatId)) {
    return { state: "reserved", isBest, isStructuralBlocked: false };
  }

  if (!adminMode && isAdminRowSeat(seatId)) {
    return { state: "admin-reserved", isBest, isStructuralBlocked: false };
  }

  if (isBest) {
    return { state: "best", isBest: true, isStructuralBlocked: false };
  }

  return { state: "available", isBest: false, isStructuralBlocked: false };
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
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  // Split rows into Recliner vs Gold
  const reclinerRows = ["A", "B"] as const;
  const goldRows = ["C", "D", "E", "F", "G", "H", "J", "K", "L", "M"] as const;

  return (
    <div className="w-full select-none">
      {/* Floating Seat Details Indicator Bar */}
      <div className="mb-4 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-400">
            {hoveredSeat ? (
              <span className="font-semibold text-white">
                Hovering: <span className="text-amber-400">{hoveredSeat}</span> ·{" "}
                {hoveredSeat.startsWith("A") || hoveredSeat.startsWith("B")
                  ? "Premium Recliner (₹300)"
                  : "Gold Tier (₹200)"}{" "}
                {BEST_SEATS.has(hoveredSeat) && "✨ Prime Sound & Visuals"}
              </span>
            ) : selectedSeat ? (
              <span className="font-semibold text-white">
                Selected: <span className="text-red-400">{selectedSeat}</span> (Click Confirm below)
              </span>
            ) : (
              "Click on any available seat to reserve"
            )}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-slate-400">
          <span>Audi 1 · Dolby Atmos 7.1</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#0E131E]/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="min-w-[840px] flex flex-col items-center">
          
          {/* SECTION 1: PREMIUM RECLINER */}
          <div className="w-full max-w-3xl mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-amber-500/10" />
              <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-400 shadow-sm">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                PREMIUM RECLINER : ₹300
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/30 to-amber-500/10" />
            </div>

            {/* Row A */}
            <div className="flex items-center justify-center gap-4 my-2">
              <span className="w-5 text-center text-xs font-bold text-amber-400/80">A</span>
              {/* Row A has blocked 1-8, then 9-17 */}
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div
                    key={`A${n}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800/40 bg-slate-900/30 text-[10px] text-slate-700"
                  >
                    ✕
                  </div>
                ))}
                {[9, 10, 11, 12, 13, 14, 15, 16, 17].map((n) => {
                  const seatId = `A${n}`;
                  const { state, isBest } = getSeatStatus(seatId, reservedSeats, mySeat, selectedSeat, adminMode);
                  return (
                    <SeatButton
                      key={seatId}
                      seatId={seatId}
                      n={n}
                      state={state}
                      isBest={isBest}
                      interactive={interactive}
                      adminMode={adminMode}
                      onClick={onSeatClick}
                      onHover={setHoveredSeat}
                      title={ownerLabel?.(seatId)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Row B */}
            <div className="flex items-center justify-center gap-4 my-2">
              <span className="w-5 text-center text-xs font-bold text-amber-400/80">B</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => {
                  const seatId = `B${n}`;
                  const { state, isBest } = getSeatStatus(seatId, reservedSeats, mySeat, selectedSeat, adminMode);
                  return (
                    <SeatButton
                      key={seatId}
                      seatId={seatId}
                      n={n}
                      state={state}
                      isBest={isBest}
                      interactive={interactive}
                      adminMode={adminMode}
                      onClick={onSeatClick}
                      onHover={setHoveredSeat}
                      title={ownerLabel?.(seatId)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: GOLD */}
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-slate-700/20" />
              <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-4 py-1 text-xs font-bold uppercase tracking-widest text-slate-300 shadow-sm">
                GOLD : ₹200
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-700 to-slate-700/20" />
            </div>

            <div className="flex flex-col items-center gap-2">
              {goldRows.map((row) => {
                const leftSeats = Array.from({ length: 10 }, (_, i) => i + 1);
                const rightSeats = Array.from({ length: 10 }, (_, i) => i + 11);

                return (
                  <div key={row} className="flex items-center gap-4">
                    <span className="w-5 text-center text-xs font-bold text-slate-400">{row}</span>

                    {/* Left Block (1 - 10) */}
                    <div className="flex gap-1.5">
                      {leftSeats.map((n) => {
                        const seatId = `${row}${n}`;
                        const { state, isBest, isStructuralBlocked } = getSeatStatus(
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
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800/40 bg-slate-900/20 text-[10px] text-slate-700 select-none"
                            >
                              ✕
                            </div>
                          );
                        }
                        return (
                          <SeatButton
                            key={seatId}
                            seatId={seatId}
                            n={n}
                            state={state}
                            isBest={isBest}
                            interactive={interactive}
                            adminMode={adminMode}
                            onClick={onSeatClick}
                            onHover={setHoveredSeat}
                            title={ownerLabel?.(seatId)}
                          />
                        );
                      })}
                    </div>

                    {/* Central Walkway Aisle */}
                    <div className="w-6 flex items-center justify-center">
                      <span className="h-4 w-px bg-slate-800/40" />
                    </div>

                    {/* Right Block (11 - 20) */}
                    <div className="flex gap-1.5">
                      {rightSeats.map((n) => {
                        const seatId = `${row}${n}`;
                        const { state, isBest, isStructuralBlocked } = getSeatStatus(
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
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800/40 bg-slate-900/20 text-[10px] text-slate-700 select-none"
                            >
                              ✕
                            </div>
                          );
                        }
                        return (
                          <SeatButton
                            key={seatId}
                            seatId={seatId}
                            n={n}
                            state={state}
                            isBest={isBest}
                            interactive={interactive}
                            adminMode={adminMode}
                            onClick={onSeatClick}
                            onHover={setHoveredSeat}
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

          {/* 3D CURVED CINEMA SCREEN PROJECTION */}
          <div className="relative mt-14 mb-4 flex flex-col items-center w-full max-w-xl">
            {/* Screen Projection Cone Lighting */}
            <div className="projection-cone" />
            
            {/* Curved Screen Element */}
            <div className="w-full px-4">
              <div className="curved-cinema-screen w-full" />
            </div>

            {/* Screen Direction Indicator */}
            <div className="mt-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              <p className="text-[11px] font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-red-400 uppercase">
                SCREEN THIS WAY
              </p>
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 tracking-wider">
              All eyes toward the screen · 4K Laser Projection
            </p>
          </div>

          {/* LUXURY THEATRE LEGEND */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-3 text-xs text-slate-300 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-sky-400/80 bg-gradient-to-b from-sky-400/30 to-sky-600/40 shadow-glow-blue" />
              <span className="font-medium text-sky-200">Best Seats</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-600 bg-slate-800/80" />
              <span className="font-medium text-slate-300">Available</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-800 bg-slate-900/40 text-[9px] text-slate-600">
                ✕
              </span>
              <span className="font-medium text-slate-500">Occupied</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-red-400 bg-gradient-to-r from-red-500 to-red-600 shadow-glow" />
              <span className="font-bold text-red-400">Selected</span>
            </div>

            {adminMode ? (
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded border border-amber-500/50 bg-amber-500/20" />
                <span className="font-medium text-amber-400">VIP / Admin</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded border border-emerald-400 bg-emerald-500 shadow-sm" />
                <span className="font-medium text-emerald-400">My Confirmed Seat</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function SeatButton({
  seatId,
  n,
  state,
  isBest,
  interactive,
  adminMode,
  onClick,
  onHover,
  title,
}: {
  seatId: string;
  n: number;
  state: SeatState;
  isBest: boolean;
  interactive: boolean;
  adminMode?: boolean;
  onClick?: (seatId: string) => void;
  onHover: (seatId: string | null) => void;
  title?: string;
}) {
  const clickable =
    interactive &&
    onClick &&
    (state === "available" ||
      state === "best" ||
      state === "selected" ||
      (adminMode && (state === "reserved" || state === "mine" || state === "admin-reserved")));

  // Custom visual classes based on seat state
  let styleClasses = "";

  switch (state) {
    case "selected":
      styleClasses =
        "border-red-400 bg-gradient-to-b from-[#FF3B44] to-[#C6181F] text-white font-bold shadow-glow seat-selected-pulse scale-105 z-10";
      break;
    case "mine":
      styleClasses =
        "border-emerald-400 bg-gradient-to-b from-emerald-500 to-teal-700 text-white font-bold shadow-md cursor-default";
      break;
    case "reserved":
      styleClasses = "border-slate-800/80 bg-slate-900/30 text-slate-600 cursor-not-allowed";
      break;
    case "admin-reserved":
      styleClasses = "border-amber-500/30 bg-amber-500/10 text-amber-500/60 cursor-not-allowed";
      break;
    case "best":
      styleClasses =
        "border-sky-400/80 bg-gradient-to-b from-sky-500/20 to-sky-600/30 text-sky-100 shadow-glow-blue hover:border-red-400 hover:bg-red-600/30 hover:text-white cursor-pointer hover:scale-110";
      break;
    case "available":
    default:
      styleClasses =
        "border-slate-700/80 bg-slate-800/70 text-slate-200 hover:border-red-500 hover:text-white hover:bg-red-600/20 cursor-pointer hover:scale-110";
      break;
  }

  return (
    <button
      type="button"
      title={title || `Seat ${seatId}`}
      disabled={!clickable}
      onMouseEnter={() => onHover(seatId)}
      onMouseLeave={() => onHover(null)}
      onClick={() => clickable && onClick?.(seatId)}
      className={`relative flex h-7 w-7 items-center justify-center rounded-md border text-[11px] font-semibold transition-all duration-150 active:scale-95 ${styleClasses}`}
    >
      {state === "reserved" ? "✕" : n}
    </button>
  );
}
