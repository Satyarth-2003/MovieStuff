"use client";

import React from "react";
import { isAdminRowSeat, isAllocatedSeat } from "@/lib/seats";

export type SeatState = "available" | "selected" | "reserved" | "admin-reserved" | "mine";

interface SeatMapProps {
  reservedSeats: Set<string>;
  mySeat?: string | null;
  selectedSeat?: string | null;
  onSeatClick?: (seatId: string) => void;
  interactive?: boolean;
  adminMode?: boolean;
  vipMode?: boolean;
  ownerLabel?: (seatId: string) => string | undefined;
}

function getSeatStatus(
  seatId: string,
  reservedSeats: Set<string>,
  mySeat: string | null | undefined,
  selectedSeat: string | null | undefined,
  canAccessVIP: boolean
): SeatState {
  if (!isAllocatedSeat(seatId)) {
    return "reserved"; // Shows booked ✕
  }
  if (mySeat === seatId) {
    return "mine";
  }
  if (selectedSeat === seatId) {
    return "selected";
  }
  if (reservedSeats.has(seatId)) {
    return "reserved";
  }
  if (!canAccessVIP && isAdminRowSeat(seatId)) {
    return "admin-reserved";
  }
  return "available";
}

export default function SeatMap({
  reservedSeats,
  mySeat,
  selectedSeat,
  onSeatClick,
  interactive = true,
  adminMode = false,
  vipMode = false,
  ownerLabel,
}: SeatMapProps) {
  const canAccessVIP = adminMode || vipMode;
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
                PREMIUM RECLINER
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {/* Row A (1 to 17 - Available to VIP/Admin) */}
            <div className="my-1.5 flex items-center justify-center gap-4">
              <span className="w-5 text-center text-xs font-semibold text-zinc-500">A</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((n) => {
                  const seatId = `A${n}`;
                  const state = getSeatStatus(seatId, reservedSeats, mySeat, selectedSeat, canAccessVIP);
                  return (
                    <Seat
                      key={seatId}
                      seatId={seatId}
                      n={n}
                      state={state}
                      interactive={interactive}
                      adminMode={adminMode}
                      onClick={onSeatClick}
                      owner={ownerLabel?.(seatId)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Row B (1 to 14 - Visible, Shows Booked ✕) */}
            <div className="my-1.5 flex items-center justify-center gap-4">
              <span className="w-5 text-center text-xs font-semibold text-zinc-500">B</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => {
                  const seatId = `B${n}`;
                  const state = getSeatStatus(seatId, reservedSeats, mySeat, selectedSeat, canAccessVIP);
                  return (
                    <Seat
                      key={seatId}
                      seatId={seatId}
                      n={n}
                      state={state}
                      interactive={interactive}
                      adminMode={adminMode}
                      onClick={onSeatClick}
                      owner={ownerLabel?.(seatId)}
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
                GOLD
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

                    {/* Left Block (Seats 1 to 10) */}
                    <div className="flex gap-1.5">
                      {left.map((n) => {
                        const seatId = `${row}${n}`;
                        const state = getSeatStatus(
                          seatId,
                          reservedSeats,
                          mySeat,
                          selectedSeat,
                          canAccessVIP
                        );
                        return (
                          <Seat
                            key={seatId}
                            seatId={seatId}
                            n={n}
                            state={state}
                            interactive={interactive}
                            adminMode={adminMode}
                            onClick={onSeatClick}
                            owner={ownerLabel?.(seatId)}
                          />
                        );
                      })}
                    </div>

                    {/* Central Aisle */}
                    <div className="w-6" />

                    {/* Right Block (Seats 11 to 20) */}
                    <div className="flex gap-1.5">
                      {right.map((n) => {
                        const seatId = `${row}${n}`;
                        const state = getSeatStatus(
                          seatId,
                          reservedSeats,
                          mySeat,
                          selectedSeat,
                          canAccessVIP
                        );
                        return (
                          <Seat
                            key={seatId}
                            seatId={seatId}
                            n={n}
                            state={state}
                            interactive={interactive}
                            adminMode={adminMode}
                            onClick={onSeatClick}
                            owner={ownerLabel?.(seatId)}
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
          <div className="mt-12 mb-2 flex flex-col items-center w-full max-w-lg">
            <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-zinc-800 via-white to-zinc-800 opacity-90 shadow-[0_4px_20px_rgba(255,255,255,0.15)]" />
            <p className="mt-3 text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
              SCREEN THIS WAY
            </p>
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
  owner,
}: {
  seatId: string;
  n: number;
  state: SeatState;
  interactive: boolean;
  adminMode?: boolean;
  onClick?: (seatId: string) => void;
  owner?: string;
}) {
  const isAllocated = isAllocatedSeat(seatId);

  const clickable =
    interactive &&
    onClick &&
    isAllocated &&
    (state === "available" ||
      state === "selected" ||
      (adminMode && (state === "reserved" || state === "mine" || state === "admin-reserved")));

  let styles = "";
  let displayText: string | number = n;

  switch (state) {
    case "selected":
      styles = "bg-[#ED1C24] text-white font-bold border-[#ED1C24] shadow-md scale-105";
      break;
    case "mine":
      styles = "bg-emerald-600 text-white font-bold border-emerald-500 cursor-pointer";
      break;
    case "reserved":
      displayText = "✕";
      if (adminMode && isAllocated) {
        styles =
          "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer hover:scale-105 font-bold";
      } else {
        styles = "border-zinc-800/80 bg-zinc-900/30 text-zinc-700 cursor-not-allowed";
      }
      break;
    case "admin-reserved":
      styles = "border-zinc-800/60 bg-zinc-900/20 text-zinc-700 cursor-not-allowed";
      break;
    case "available":
    default:
      styles =
        "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500 hover:text-white cursor-pointer hover:scale-105";
      break;
  }

  const tooltip =
    state === "reserved" && owner
      ? `Seat ${seatId} · Booked by ${owner}${adminMode ? " (Click to Release / Reassign)" : ""}`
      : state === "reserved"
      ? `Seat ${seatId} (Booked)`
      : state === "mine"
      ? `Your Seat: ${seatId}${adminMode ? " (Click to Release / Change)" : ""}`
      : `Seat ${seatId}`;

  return (
    <button
      type="button"
      title={tooltip}
      disabled={!clickable}
      onClick={() => clickable && onClick?.(seatId)}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-medium transition-all duration-150 active:scale-95 ${styles}`}
    >
      {displayText}
    </button>
  );
}
