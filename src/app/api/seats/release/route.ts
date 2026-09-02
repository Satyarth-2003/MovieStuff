import { NextResponse } from "next/server";
import { getEmployeeIdentity } from "@/lib/employeeAuth";
import { adminReleaseSeat } from "@/lib/booking";

export async function POST() {
  const identity = await getEmployeeIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await adminReleaseSeat(identity.email);
  return NextResponse.json({ ok: true });
}
