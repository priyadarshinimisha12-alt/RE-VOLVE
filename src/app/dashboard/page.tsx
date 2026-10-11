import { AppShell } from "@/components/AppShell";
import { DashboardView } from "@/components/DashboardView";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  );
}
