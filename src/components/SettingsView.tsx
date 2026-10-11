"use client";

import { useEffect, useState } from "react";
import { Banner, Button, Panel } from "./ui";

type Arch = {
  mode: string;
  components: { service: string; status: string; role: string }[];
};

export function SettingsView() {
  const [arch, setArch] = useState<Arch | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/architecture")
      .then((r) => r.json())
      .then(setArch);
  }, []);

  async function resetDemo() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    const data = await res.json();
    setBusy(false);
    setMessage(res.ok ? `Demo fleet restored (${data.count ?? 0} records).` : data.error);
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">Settings</p>
        <h1 className="font-display mt-1 text-4xl tracking-tight">Demo controls & privacy</h1>
      </header>
      <Banner>
        Identifiers are masked by default. Uploaded documents are not shared with other
        users. Retention is local to this instance; restoring the demo wipes imported rows.
      </Banner>
      <Panel title="Dataset">
        <p className="text-sm leading-relaxed">
          Restore the labelled synthetic fleet (1,100 rows, seed 42). This deletes
          current vehicle records, import batches, and stored assessments.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void resetDemo()} disabled={busy} variant="danger">
            {busy ? "Restoring…" : "Restore synthetic demo"}
          </Button>
          <a
            href="/api/export"
            className="inline-flex items-center justify-center border border-[rgba(52,48,46,0.14)] bg-white px-4 py-2 text-[13px] font-medium"
          >
            Download cleaned CSV
          </a>
        </div>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </Panel>
      <Panel title="Privacy">
        <ul className="grid gap-2 text-sm">
          <li>· Do not collect owner names, addresses, phone numbers, or identity documents.</li>
          <li>· Record IDs should be anonymous. Registration marks are masked on document extract.</li>
          <li>· CSV and text uploads are stored via the local S3 adapter under data/uploads.</li>
          <li>· This prototype is not an official MoRTH, CPCB, or state transport system.</li>
        </ul>
      </Panel>
      <Panel title="Runtime">
        <p className="text-sm">
          AWS mode: <strong>{arch?.mode ?? "…"}</strong>
        </p>
        <ul className="mt-3 grid gap-1 text-[13px] text-mist">
          {arch?.components.map((c) => (
            <li key={c.service}>
              {c.service} — {c.status}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
