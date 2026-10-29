import { AdminDashboard } from "@/components/admin-dashboard";
import { readUpiConfig } from "@/lib/upi";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminDashboard upi={readUpiConfig(process.env)} />;
}
