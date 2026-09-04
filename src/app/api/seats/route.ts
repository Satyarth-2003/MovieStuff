import { NextResponse } from "next/server";
import { getEmployeeIdentity } from "@/lib/employeeAuth";
import { getReservedSeatMap, ensureEmployee } from "@/lib/booking";
import { ADMIN_ROWS } from "@/lib/seats";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getEmployeeIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const [reserved, employee] = await Promise.all([
    getReservedSeatMap(),
    ensureEmployee(identity.email, identity.name),
  ]);

  return NextResponse.json(
    {
      adminRows: ADMIN_ROWS,
      reservedSeats: Object.keys(reserved),
      mySeat: employee.seat,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
