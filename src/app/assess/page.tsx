import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { AssessView } from "@/components/AssessView";

export default function AssessPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-mist">Loading assessment…</p>}>
        <AssessView />
      </Suspense>
    </AppShell>
  );
}
