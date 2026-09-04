import { NextResponse } from "next/server";
import { getEmployeeIdentity } from "@/lib/employeeAuth";
import { ensureEmployee } from "@/lib/booking";

export async function GET() {
  const identity = await getEmployeeIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const employee = await ensureEmployee(identity.email, identity.name);
  return NextResponse.json({
    employee,
    isAdmin: identity.isAdmin,
    isVIP: identity.isVIP,
  });
}
