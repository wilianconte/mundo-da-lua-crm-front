import { AdminShell } from "@/components/layout/admin-shell";
import { DashboardAuthGuard } from "@/features/auth/components/dashboard-auth-guard";

export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardAuthGuard>
      <AdminShell>{children}</AdminShell>
    </DashboardAuthGuard>
  );
}
