import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import EmployeeSeatFlow from "@/components/EmployeeSeatFlow";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role;
  if (role === "admin") {
    redirect("/admin");
  }

  return <EmployeeSeatFlow />;
}
