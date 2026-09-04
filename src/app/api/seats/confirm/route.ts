import { NextRequest, NextResponse } from "next/server";
import { getEmployeeIdentity } from "@/lib/employeeAuth";
import { confirmSeatForEmployee, ensureEmployee } from "@/lib/booking";
import { parseSeat } from "@/lib/seats";

export async function POST(req: NextRequest) {
  const identity = await getEmployeeIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const seatId = typeof body?.seatId === "string" ? body.seatId.trim().toUpperCase() : "";
  if (!parseSeat(seatId)) {
    return NextResponse.json({ error: "Invalid seat selection." }, { status: 400 });
  }

  await ensureEmployee(identity.email, identity.name);
  const canAccessVIP = identity.isAdmin || identity.isVIP;
  const result = await confirmSeatForEmployee(identity.email, seatId, canAccessVIP);

  if (result === "ADMIN_ROW") {
    return NextResponse.json({ error: "This row is reserved for VIP/Admin guests only." }, { status: 403 });
  }
  if (result === "SEAT_TAKEN") {
    return NextResponse.json(
      { error: "Sorry, this seat was just reserved by another employee. Please select another seat." },
      { status: 409 }
    );
  }
  if (result === "ALREADY_HAS_SEAT") {
    return NextResponse.json(
      { error: "You already have a reserved seat. Contact an admin to change it." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, seat: seatId });
}
