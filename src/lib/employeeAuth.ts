import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isWhitelisted } from "@/lib/booking";

export interface EmployeeIdentity {
  email: string;
  name: string;
}

export async function getEmployeeIdentity(): Promise<EmployeeIdentity | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  const allowed = await isWhitelisted(email);
  if (!allowed) return null;
  return { email, name: session?.user?.name || email.split("@")[0] };
}
