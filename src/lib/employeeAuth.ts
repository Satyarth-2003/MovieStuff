import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isWhitelisted } from "@/lib/booking";

function adminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS || "satyarth.prakash@adda247.com";
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function vipEmails(): string[] {
  const env = process.env.VIP_EMAILS || "anil.bhadauria@adda247.com";
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export interface EmployeeIdentity {
  email: string;
  name: string;
  isAdmin: boolean;
  isVIP: boolean;
}

export async function getEmployeeIdentity(): Promise<EmployeeIdentity | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin" || adminEmails().includes(email);
  const isVIP = role === "vip" || vipEmails().includes(email);
  const allowed = isAdmin || isVIP || (await isWhitelisted(email));

  if (!allowed) return null;
  return {
    email,
    name: session?.user?.name || email.split("@")[0],
    isAdmin,
    isVIP,
  };
}
