export const ROW_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"] as const;
export type RowLetter = (typeof ROW_LETTERS)[number];

export const ADMIN_ROWS: RowLetter[] = ["A", "B"];
export const SEATS_PER_ROW = 20;
export const LEFT_BLOCK_SIZE = 10;

export function allSeatIds(): string[] {
  const ids: string[] = [];
  for (const row of ROW_LETTERS) {
    for (let n = 1; n <= SEATS_PER_ROW; n++) ids.push(`${row}${n}`);
  }
  return ids;
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
  if (!(ROW_LETTERS as readonly string[]).includes(row)) return null;
  if (num < 1 || num > SEATS_PER_ROW) return null;
  return { row, num };
}
