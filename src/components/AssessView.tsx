"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, EMISSIONS, FITNESS_STATUSES, FUELS, PUC_STATUSES } from "@/lib/constants";
import { STATE_NAMES } from "@/data/india";
import type { AssessmentResult, VehicleInput } from "@/lib/types";
import { Banner, Button, Field, Input, Panel, Select } from "./ui";
import { ScorePanel } from "./ScorePanel";

const blank: VehicleInput = {
  recordId: "",
  registrationYear: 2014,
  vehicleCategory: "Passenger Car",
  fuelType: "Petrol",
  emissionStandard: "BS-IV",
  annualDistanceKm: 12000,
  pucStatus: "valid",
  pucExpiryDate: "2026-08-01",
  historicalPucFailures: 0,
  fitnessStatus: "not_required",
  fitnessExpiryDate: "",
  state: "Maharashtra",
  rtoDistrict: "Pune",
};

const presets: { name: string; note: string; value: VehicleInput }[] = [
  {
    name: "Documented petrol car",
    note: "Age without other red flags",
    value: { ...blank },
  },
  {
    name: "Failed diesel HCV",
    note: "Test evidence + expired fitness",
    value: {
      recordId: "DEMO-HCV",
      registrationYear: 2005,
      vehicleCategory: "HCV",
      fuelType: "Diesel",
      emissionStandard: "BS-II",
      annualDistanceKm: 62000,
      pucStatus: "failed",
      historicalPucFailures: 3,
      fitnessStatus: "expired",
      fitnessExpiryDate: "2022-01-15",
      measuredSmokeOpacity: 81,
      state: "Delhi",
      rtoDistrict: "South Delhi",
    },
  },
  {
    name: "New electric two-wheeler",
    note: "Lower inspection interest",
    value: {
      recordId: "DEMO-EV",
      registrationYear: 2024,
      vehicleCategory: "Two-wheeler",
      fuelType: "Electric",
      emissionStandard: "BS-VI",
      annualDistanceKm: 5000,
      pucStatus: "valid",
      historicalPucFailures: 0,
      fitnessStatus: "not_required",
      state: "Karnataka",
      rtoDistrict: "Bengaluru",
    },
  },
];

export function AssessView() {
  const sp = useSearchParams();
  const [form, setForm] = useState<VehicleInput>(blank);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<VehicleInput>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    const rec = sp.get("record");
    if (!rec) return;
    void (async () => {
      const res = await fetch(`/api/vehicles?q=${encodeURIComponent(rec)}&limit=5`);
      if (!res.ok) return;
      const data = (await res.json()) as { records: Array<Record<string, unknown>> };
      const hit = data.records.find((r) => r.recordId === rec) ?? data.records[0];
      if (!hit) return;
      setForm({
        recordId: String(hit.recordId ?? ""),
        registrationYear: (hit.registrationYear as number) ?? null,
        vehicleCategory: (hit.vehicleCategory as string) ?? null,
        fuelType: (hit.fuelType as string) ?? null,
        emissionStandard: (hit.emissionStandard as string) ?? null,
        annualDistanceKm: (hit.annualDistanceKm as number) ?? null,
        pucStatus: (hit.pucStatus as string) ?? null,
        pucExpiryDate: (hit.pucExpiryDate as string) ?? "",
        historicalPucFailures: (hit.historicalPucFailures as number) ?? null,
        fitnessStatus: (hit.fitnessStatus as string) ?? null,
        fitnessExpiryDate: (hit.fitnessExpiryDate as string) ?? "",
        measuredCoPercent: (hit.measuredCoPercent as number) ?? null,
        measuredHcPpm: (hit.measuredHcPpm as number) ?? null,
        measuredSmokeOpacity: (hit.measuredSmokeOpacity as number) ?? null,
        state: (hit.state as string) ?? null,
        rtoDistrict: (hit.rtoDistrict as string) ?? null,
      });
    })();
  }, [sp]);

  async function score() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, persist: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "score");
      setResult(data.result as AssessmentResult);
    } catch {
      setError("Could not score this record.");
    } finally {
      setBusy(false);
    }
  }

  const yearOptions = useMemo(() => {
    const y: number[] = [];
    for (let i = 2026; i >= 1995; i--) y.push(i);
    return y;
  }, []);

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">Vehicle assessment</p>
        <h1 className="font-display mt-1 text-4xl tracking-tight">Explainable inspection priority</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Fill the fields you actually have. The model will not invent the rest as
          maximum pollution. Actual emissions stay unknown unless a test reading is supplied.
        </p>
      </header>
      <Banner>
        Do not enter owner names, addresses, phone numbers, or unmasked registration
        marks. An anonymised record ID is enough.
      </Banner>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button key={p.name} variant="secondary" onClick={() => setForm(p.value)}>
            {p.name}
            <span className="text-mist"> · {p.note}</span>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel title="Record fields">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Record ID">
              <Input value={form.recordId ?? ""} onChange={(e) => set({ recordId: e.target.value })} />
            </Field>
            <Field label="Registration year">
              <Select
                value={form.registrationYear ?? ""}
                onChange={(e) => set({ registrationYear: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Unknown</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category">
              <Select
                value={form.vehicleCategory ?? ""}
                onChange={(e) => set({ vehicleCategory: e.target.value || null })}
              >
                <option value="">Unknown</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fuel">
              <Select value={form.fuelType ?? ""} onChange={(e) => set({ fuelType: e.target.value || null })}>
                <option value="">Unknown</option>
                {FUELS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Bharat Stage">
              <Select
                value={form.emissionStandard ?? ""}
                onChange={(e) => set({ emissionStandard: e.target.value || null })}
              >
                <option value="">Unknown</option>
                {EMISSIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Annual distance (km)">
              <Input
                type="number"
                value={form.annualDistanceKm ?? ""}
                onChange={(e) => set({ annualDistanceKm: e.target.value ? Number(e.target.value) : null })}
              />
            </Field>
            <Field label="PUC status">
              <Select value={form.pucStatus ?? ""} onChange={(e) => set({ pucStatus: e.target.value || null })}>
                <option value="">Unknown</option>
                {PUC_STATUSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="PUC expiry">
              <Input
                type="date"
                value={form.pucExpiryDate ?? ""}
                onChange={(e) => set({ pucExpiryDate: e.target.value })}
              />
            </Field>
            <Field label="Historical PUC failures">
              <Input
                type="number"
                min={0}
                value={form.historicalPucFailures ?? ""}
                onChange={(e) =>
                  set({ historicalPucFailures: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Fitness status">
              <Select
                value={form.fitnessStatus ?? ""}
                onChange={(e) => set({ fitnessStatus: e.target.value || null })}
              >
                <option value="">Unknown</option>
                {FITNESS_STATUSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fitness expiry">
              <Input
                type="date"
                value={form.fitnessExpiryDate ?? ""}
                onChange={(e) => set({ fitnessExpiryDate: e.target.value })}
              />
            </Field>
            <Field label="State">
              <Select value={form.state ?? ""} onChange={(e) => set({ state: e.target.value || null })}>
                <option value="">Unknown</option>
                {STATE_NAMES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Measured CO %">
              <Input
                type="number"
                step="0.01"
                value={form.measuredCoPercent ?? ""}
                onChange={(e) => set({ measuredCoPercent: e.target.value ? Number(e.target.value) : null })}
              />
            </Field>
            <Field label="Measured HC ppm">
              <Input
                type="number"
                value={form.measuredHcPpm ?? ""}
                onChange={(e) => set({ measuredHcPpm: e.target.value ? Number(e.target.value) : null })}
              />
            </Field>
            <Field label="Smoke opacity">
              <Input
                type="number"
                value={form.measuredSmokeOpacity ?? ""}
                onChange={(e) => set({ measuredSmokeOpacity: e.target.value ? Number(e.target.value) : null })}
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => void score()} disabled={busy}>
              {busy ? "Scoring…" : "Score inspection priority"}
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-alert">{error}</p> : null}
        </Panel>
        <Panel title="Result">
          {result ? (
            <ScorePanel result={result} />
          ) : (
            <p className="text-sm text-mist">
              Submit the form to see the score, factor weights, evidence, gaps, and a
              next step consistent with the fields you entered.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
