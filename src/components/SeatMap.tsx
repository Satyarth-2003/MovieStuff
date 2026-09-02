"use client";

import { ROW_LETTERS, SEATS_PER_ROW, LEFT_BLOCK_SIZE, isAdminRowSeat } from "@/lib/seats";

export type SeatState = "available" | "selected" | "reserved" | "admin-reserved" | "mine";

interface SeatMapProps {
  reservedSeats: Set<string>;
  mySeat?: string | null;
  selectedSeat?: string | null;
  onSeatClick?: (seatId: string) => void;
  interactive?: boolean;
  adminMode?: boolean;
  ownerLabel?: (seatId: string) => string | undefined;
}

function seatState(
  seatId: string,
  reservedSeats: Set<string>,
  mySeat: string | null | undefined,
  selectedSeat: string | null | undefined
): SeatState {
  if (isAdminRowSeat(seatId)) return "admin-reserved";
  if (mySeat === seatId) return "mine";
  if (selectedSeat === seatId) return "selected";
  if (reservedSeats.has(seatId)) return "reserved";
  return "available";
}

const stateClasses: Record<SeatState, string> = {
  available:
    "border-slate-300 text-slate-700 bg-white hover:border-adda-purple hover:text-adda-purple cursor-pointer",
  selected: "border-adda-purple bg-adda-purple text-white cursor-pointer",
  reserved: "border-slate-200 bg-slate-200 text-slate-400 cursor-not-allowed",
  "admin-reserved": "border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed",
  mine: "border-emerald-500 bg-emerald-500 text-white cursor-default",
};

export default function SeatMap({
  reservedSeats,
  mySeat,
  selectedSeat,
  onSeatClick,
  interactive = true,
  adminMode = false,
  ownerLabel,
}: SeatMapProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[820px] px-2">
        <div className="flex flex-col items-center gap-2">
          {ROW_LETTERS.map((row) => {
            const nums = Array.from({ length: SEATS_PER_ROW }, (_, i) => i + 1);
            const left = nums.slice(0, LEFT_BLOCK_SIZE);
            const right = nums.slice(LEFT_BLOCK_SIZE);
            return (
              <div key={row} className="flex items-center gap-4">
                <span className="w-4 text-sm font-medium text-slate-500">{row}</span>
                <div className="flex gap-1.5">
                  {left.map((n) => {
                    const seatId = `${row}${n}`;
                    return (
                      <Seat
                        key={seatId}
                        seatId={seatId}
                        n={n}
                        state={seatState(seatId, reservedSeats, mySeat, selectedSeat)}
                        interactive={interactive}
                        adminMode={adminMode}
                        onClick={onSeatClick}
                        title={ownerLabel?.(seatId)}
                      />
                    );
                  })}
                </div>
                <div className="w-6" />
                <div className="flex gap-1.5">
                  {right.map((n) => {
                    const seatId = `${row}${n}`;
                    return (
                      <Seat
                        key={seatId}
                        seatId={seatId}
                        n={n}
                        state={seatState(seatId, reservedSeats, mySeat, selectedSeat)}
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

        <div className="mt-10 flex justify-center">
          <div className="h-3 w-[720px] max-w-full rounded-full bg-gradient-to-b from-adda-purple/70 to-adda-purple/40 shadow-lg" />
        </div>
        <p className="mt-3 text-center text-xs font-semibold tracking-widest text-adda-purple/80">
          SCREEN THIS WAY
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
          <Legend swatchClass="border-slate-300 bg-white" label="Available" />
          <Legend swatchClass="border-adda-purple bg-adda-purple" label="Selected" />
          <Legend swatchClass="border-slate-200 bg-slate-200" label="Reserved" />
          <Legend swatchClass="border-slate-300 bg-slate-100" label="Admin Reserved" />
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
    (state === "available" || state === "selected" || (adminMode && (state === "reserved" || state === "mine")));
  return (
    <button
      type="button"
      title={title}
      disabled={!clickable}
      onClick={() => clickable && onClick?.(seatId)}
      className={`flex h-7 w-7 items-center justify-center rounded-md border text-[11px] font-medium transition-colors ${stateClasses[state]}`}
    >
      {n}
    </button>
  );
}

function Legend({ swatchClass, label }: { swatchClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded border ${swatchClass}`} />
      <span>{label}</span>
    </div>
  );
}
