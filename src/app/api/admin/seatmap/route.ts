import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getReservedSeatMap } from "@/lib/booking";
import { ADMIN_ROWS } from "@/lib/seats";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const reserved = await getReservedSeatMap();
  return NextResponse.json(
    { adminRows: ADMIN_ROWS, reserved },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
