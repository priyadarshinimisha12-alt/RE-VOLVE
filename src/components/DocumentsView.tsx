"use client";

import { useState } from "react";
import type { AssessmentResult } from "@/lib/types";
import { Banner, Button, Field, Panel, Textarea } from "./ui";
import { ScorePanel } from "./ScorePanel";

type Extracted = {
  registrationYear: number | null;
  vehicleCategory: string | null;
  fuelType: string | null;
  emissionStandard: string | null;
  pucStatus: string | null;
  pucExpiryDate: string | null;
  fitnessStatus: string | null;
  measuredCoPercent: number | null;
  measuredHcPpm: number | null;
  measuredSmokeOpacity: number | null;
  maskedRegNo: string | null;
  notes: string[];
};

const SAMPLE = `POLLUTION UNDER CONTROL CERTIFICATE
Vehicle Class: Light Motor Vehicle
Fuel: DIESEL
Date of Registration: 12/03/2008
Emission Norms: BHARAT STAGE III
PUC Status: FAILED
Valid Upto: 01/01/2025
Smoke Density: 76 HSU
`;

export function DocumentsView() {
  const [text, setText] = useState("");
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [disclosure, setDisclosure] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(payload: FormData | { text: string }) {
    setBusy(true);
    setError(null);
    const res =
      payload instanceof FormData
        ? await fetch("/api/documents", { method: "POST", body: payload })
        : await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not extract fields");
      return;
    }
    setExtracted(data.extracted as Extracted);
    setResult(data.result as AssessmentResult);
    setDisclosure(data.disclosure as string);
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">RC & PUC documents</p>
        <h1 className="font-display mt-1 text-4xl tracking-tight">Local extraction, then you confirm</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Paste text from a registration certificate or PUC. Image/PDF OCR is not
          enabled in local demo mode — nothing is sent to an external document API.
        </p>
      </header>
      <Banner>
        Registration marks are masked. Owner names, addresses, and phone numbers are
        ignored even if they appear in the paste.
      </Banner>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Paste or upload text">
          <Field label="Document text">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste RC / PUC text…"
            />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => void run({ text })} disabled={busy || !text.trim()}>
              {busy ? "Extracting…" : "Extract fields"}
            </Button>
            <Button variant="secondary" onClick={() => setText(SAMPLE)}>
              Load sample PUC text
            </Button>
          </div>
          <div className="mt-4">
            <p className="text-[12px] text-mist">Optional .txt upload</p>
            <input
              className="mt-2 text-sm"
              type="file"
              accept=".txt,text/plain"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const form = new FormData();
                form.set("file", f);
                void run(form);
              }}
            />
          </div>
          {error ? <p className="mt-3 text-sm text-alert">{error}</p> : null}
        </Panel>
        <Panel title="Confirm extracted fields">
          {extracted ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(extracted)
                .filter(([k]) => k !== "notes")
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-mist">
                      {k.replace(/[A-Z]/g, (m) => " " + m.toLowerCase())}
                    </dt>
                    <dd className="mt-1">{v == null || v === "" ? "—" : String(v)}</dd>
                  </div>
                ))}
            </dl>
          ) : (
            <p className="text-sm text-mist">Nothing extracted yet.</p>
          )}
          {extracted?.notes?.length ? (
            <ul className="mt-4 grid gap-1 text-[12px] text-mist">
              {extracted.notes.map((n) => (
                <li key={n}>— {n}</li>
              ))}
            </ul>
          ) : null}
          {disclosure ? <p className="mt-3 text-[12px] text-mist">{disclosure}</p> : null}
        </Panel>
      </div>
      {result ? (
        <Panel title="Priority from confirmed fields">
          <ScorePanel result={result} />
        </Panel>
      ) : null}
    </div>
  );
}
