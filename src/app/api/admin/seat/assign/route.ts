import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { adminAssignSeat, isWhitelisted, ensureEmployee } from "@/lib/booking";
import { parseSeat } from "@/lib/seats";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const seatId = typeof body?.seatId === "string" ? body.seatId.trim().toUpperCase() : "";

  if (!email || !parseSeat(seatId)) {
    return NextResponse.json({ error: "Valid email and seat are required." }, { status: 400 });
  }

  const isApproved = adminEmails().includes(email) || (await isWhitelisted(email));
  if (!isApproved) {
    return NextResponse.json(
      { error: "That email is not on the approved guest/admin list." },
      { status: 400 }
    );
  }

  await ensureEmployee(email, email.split("@")[0]);
  const result = await adminAssignSeat(email, seatId);

  if (result === "SEAT_TAKEN") {
    return NextResponse.json({ error: "That seat is already reserved by another employee." }, { status: 409 });
  }

  return NextResponse.json({ ok: true, seat: seatId });
}
