export const ROW_LETTERS = ["A", "D", "E", "F", "G", "H"] as const;
export type RowLetter = (typeof ROW_LETTERS)[number];

export const ADMIN_ROWS: RowLetter[] = ["A"];
export const SEATS_PER_ROW = 20;

// Exact active seats in the auditorium
export const VALID_SEATS: Record<RowLetter, number[]> = {
  A: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  D: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16, 17, 18, 19, 20],
  E: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  F: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  G: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  H: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

const validSeatSet = new Set<string>(
  Object.entries(VALID_SEATS).flatMap(([row, nums]) => nums.map((n) => `${row}${n}`))
);

export function allSeatIds(): string[] {
  return Array.from(validSeatSet);
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
  if (!validSeatSet.has(seatId)) return null;
  return { row, num };
}
