import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { adminAssignSeat, isWhitelisted } from "@/lib/booking";
import { parseSeat } from "@/lib/seats";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const seatId = typeof body?.seatId === "string" ? body.seatId.trim().toUpperCase() : "";

  if (!email || !parseSeat(seatId)) {
    return NextResponse.json({ error: "Valid email and seat are required." }, { status: 400 });
  }
  const allowed = await isWhitelisted(email);
  if (!allowed) {
    return NextResponse.json({ error: "That email is not on the approved employee list." }, { status: 400 });
  }

  const result = await adminAssignSeat(email, seatId);
  if (result === "ADMIN_ROW") {
    return NextResponse.json({ error: "Rows A and B are reserved for admin use only." }, { status: 400 });
  }
  if (result === "SEAT_TAKEN") {
    return NextResponse.json({ error: "That seat is already reserved by another employee." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
