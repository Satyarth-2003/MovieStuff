import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return <AdminDashboard adminEmail={admin.email} />;
}
