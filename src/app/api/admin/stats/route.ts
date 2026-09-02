import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getStats } from "@/lib/booking";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const stats = await getStats();
  return NextResponse.json({ stats });
}
