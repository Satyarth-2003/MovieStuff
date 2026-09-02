import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { adminReleaseSeat, adminReleaseSeatById } from "@/lib/booking";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const seatId = typeof body?.seatId === "string" ? body.seatId.trim().toUpperCase() : "";

  if (seatId) {
    await adminReleaseSeatById(seatId);
    return NextResponse.json({ ok: true, releasedSeat: seatId });
  }

  if (email) {
    await adminReleaseSeat(email);
    return NextResponse.json({ ok: true, releasedEmail: email });
  }

  return NextResponse.json({ error: "Email or seatId required." }, { status: 400 });
}
