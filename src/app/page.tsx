import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import EmployeeSeatFlow from "@/components/EmployeeSeatFlow";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Both Admin and Normal users share the same unified, classy view
  return <EmployeeSeatFlow />;
}
