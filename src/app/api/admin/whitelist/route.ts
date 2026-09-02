import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { addToWhitelist, getWhitelist, removeFromWhitelist } from "@/lib/booking";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const whitelist = await getWhitelist();
  return NextResponse.json({ whitelist });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const raw = typeof body?.emails === "string" ? body.emails : Array.isArray(body?.emails) ? body.emails.join("\n") : "";
  const emails = raw
    .split(/[\n,;\s]+/)
    .map((e: string) => e.trim())
    .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  if (emails.length === 0) {
    return NextResponse.json({ error: "No valid email addresses found." }, { status: 400 });
  }

  const added = await addToWhitelist(emails);
  const whitelist = await getWhitelist();
  return NextResponse.json({ ok: true, added, whitelist });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  await removeFromWhitelist(email);
  const whitelist = await getWhitelist();
  return NextResponse.json({ ok: true, whitelist });
}
