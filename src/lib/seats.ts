export const ROW_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"] as const;
export type RowLetter = (typeof ROW_LETTERS)[number];

export const ADMIN_ROWS: RowLetter[] = ["A"];
export const SEATS_PER_ROW = 20;

// The ONLY seats available for our private screening
export const ALLOCATED_SEATS: Record<string, number[]> = {
  A: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  D: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16, 17, 18, 19, 20],
  E: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  F: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  G: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  H: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

const allocatedSeatSet = new Set<string>(
  Object.entries(ALLOCATED_SEATS).flatMap(([row, nums]) => nums.map((n) => `${row}${n}`))
);

export function isAllocatedSeat(seatId: string): boolean {
  return allocatedSeatSet.has(seatId);
}

export function allSeatIds(): string[] {
  return Array.from(allocatedSeatSet);
}

export function isAdminRowSeat(seatId: string): boolean {
  const row = seatId.match(/^[A-Z]+/)?.[0] as RowLetter | undefined;
  return !!row && (ADMIN_ROWS as string[]).includes(row);
}

export function parseSeat(seatId: string): { row: RowLetter; num: number } | null {
  const m = seatId.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  const row = m[1] as RowLetter;
  const num = Number(m[2]);
  if (!allocatedSeatSet.has(seatId)) return null;
  return { row, num };
}
