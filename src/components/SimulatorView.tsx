"use client";

import { useCallback, useEffect, useState } from "react";
import { FilterBar } from "./FilterBar";
import { CompareBars } from "./Charts";
import { Banner, Button, Field, Panel, Select } from "./ui";
import { PriorityBadge } from "./PriorityBadge";
import { filterQuery } from "@/lib/client-filters";
import { inr, nfmt, pct } from "@/lib/format";
import type { Filters, ScenarioResult } from "@/lib/types";

type SelectedRow = {
  id: string;
  recordId: string;
  state: string | null;
  vehicleCategory: string | null;
  fuelType: string | null;
  emissionStandard: string | null;
  registrationYear: number | null;
  pucStatus: string | null;
  fitnessStatus: string | null;
  inspectionPriorityScore: number | null;
  priorityCategory: string | null;
};

const STRATEGIES = [
  { id: "top_priority", label: "Highest-priority slice" },
  { id: "puc_failures", label: "PUC failures (current or repeated)" },
  { id: "expired_fitness", label: "Expired fitness" },
  { id: "pre_bsiv_diesel_commercial", label: "Pre-BS-IV diesel commercial-duty" },
  { id: "incomplete_compliance", label: "Incomplete compliance files" },
  { id: "replacement_pre_bsiii", label: "Replacement-first: BS-I / BS-II" },
];

export function SimulatorView() {
  const [filters, setFilters] = useState<Filters>({});
  const [strategy, setStrategy] = useState("top_priority");
  const [topPercent, setTopPercent] = useState(10);
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [selected, setSelected] = useState<SelectedRow[]>([]);
  const [compare, setCompare] = useState<ScenarioResult[]>([]);
  const [busy, setBusy] = useState(false);

  const run = useCallback(() => {
    let active = true;
    Promise.all([
      fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy,
          topPercent,
          filters: {
            state: filters.state ?? "",
            category: filters.category ?? "",
            fuel: filters.fuel ?? "",
            emission: filters.emission ?? "",
            fitness: filters.fitness ?? "",
            puc: filters.puc ?? "",
          },
        }),
      }).then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { scenario: ScenarioResult; selected: SelectedRow[] };
          if (active) {
            setScenario(data.scenario);
            setSelected(data.selected);
          }
        }
      }),
      fetch(`/api/simulator${filterQuery(filters)}`).then(async (cmp) => {
        if (cmp.ok) {
          const data = (await cmp.json()) as { scenarios: ScenarioResult[] };
          if (active) {
            setCompare(data.scenarios);
          }
        }
      }),
    ]).finally(() => {
      if (active) setBusy(false);
    });
    return () => {
      active = false;
    };
  }, [filters, strategy, topPercent]);

  useEffect(() => {
    const cancel = run();
    return cancel;
  }, [run]);

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">Intervention simulator</p>
        <h1 className="font-display mt-1 text-4xl tracking-tight">Spend a finite inspection budget honestly</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Compare inspection-first and replacement-first rules on the loaded file.
          Results are vehicle counts and a priority-point coverage proxy — not kilograms of pollutant.
        </p>
      </header>
      <Banner>
        Cost figures are illustrative prototype assumptions (see the assumptions list on
        each scenario). They are not official fees or scheme amounts.
      </Banner>
      <FilterBar value={filters} onChange={setFilters} />

      <div className="revolve-card grid gap-4 p-4 md:grid-cols-3">
        <Field label="Strategy">
          <Select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            {STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Top slice (when rank-based)">
          <Select
            value={topPercent}
            onChange={(e) => setTopPercent(Number(e.target.value))}
            disabled={strategy !== "top_priority"}
          >
            {[5, 10, 20].map((n) => (
              <option key={n} value={n}>
                Highest-priority {n}%
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button onClick={() => void run()} disabled={busy}>
            {busy ? "Updating…" : "Run scenario"}
          </Button>
        </div>
      </div>

      {scenario ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Vehicles selected" value={nfmt(scenario.selectedCount)} />
          <Stat label="Share of dataset" value={pct(scenario.percentOfDataset)} />
          <Stat label="Priority-point coverage" value={pct(scenario.scoreCoverageProxy)} />
          <Stat label="High-priority catch" value={pct(scenario.highPriorityCatchRate)} />
          <Stat label="Illustrative inspection cost" value={inr(scenario.estimatedInspectionCostInr)} />
        </div>
      ) : null}

      {scenario?.estimatedReplacementCostInr != null ? (
        <p className="text-sm">
          Illustrative replacement-incentive sketch:{" "}
          <strong>{inr(scenario.estimatedReplacementCostInr)}</strong> — hypothetical, not a
          government scheme.
        </p>
      ) : null}

      <Panel title="Compare default strategies">
        <CompareBars
          data={compare.map((s) => ({
            name: s.id.replace(/_/g, " "),
            coverage: Number(s.scoreCoverageProxy.toFixed(1)),
            catch: Number(s.highPriorityCatchRate.toFixed(1)),
            share: Number(s.percentOfDataset.toFixed(1)),
          }))}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="text-[10px] uppercase tracking-[0.12em] text-mist">
              <tr className="border-b border-[rgba(52,48,46,0.1)]">
                <th className="py-2 pr-3">Scenario</th>
                <th className="py-2 pr-3">Selected</th>
                <th className="py-2 pr-3">Coverage proxy</th>
                <th className="py-2 pr-3">High-priority catch</th>
                <th className="py-2">Inspection cost</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((s) => (
                <tr key={s.id} className="border-b border-[rgba(52,48,46,0.06)]">
                  <td className="py-2 pr-3">{s.name}</td>
                  <td className="py-2 pr-3 tabular">
                    {nfmt(s.selectedCount)} ({pct(s.percentOfDataset)})
                  </td>
                  <td className="py-2 pr-3 tabular">{pct(s.scoreCoverageProxy)}</td>
                  <td className="py-2 pr-3 tabular">{pct(s.highPriorityCatchRate)}</td>
                  <td className="py-2 tabular">{inr(s.estimatedInspectionCostInr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {scenario ? (
        <Panel title={scenario.name}>
          <p className="text-sm leading-relaxed">{scenario.description}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist">Assumptions</p>
              <ul className="mt-2 grid gap-1 text-[13px] text-charcoal">
                {scenario.assumptions.map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist">Limitations</p>
              <ul className="mt-2 grid gap-1 text-[13px] text-charcoal">
                {scenario.limitations.map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel title="Selected records (preview)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="text-[10px] uppercase tracking-[0.12em] text-mist">
              <tr className="border-b border-[rgba(52,48,46,0.1)]">
                <th className="py-2 pr-3">Record</th>
                <th className="py-2 pr-3">Year</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Fuel</th>
                <th className="py-2 pr-3">Norm</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2">Band</th>
              </tr>
            </thead>
            <tbody>
              {selected.map((r) => (
                <tr key={r.id} className="border-b border-[rgba(52,48,46,0.06)]">
                  <td className="py-2 pr-3">
                    {r.recordId}
                    <div className="text-[11px] text-mist">{r.state}</div>
                  </td>
                  <td className="py-2 pr-3 tabular">{r.registrationYear ?? "—"}</td>
                  <td className="py-2 pr-3">{r.vehicleCategory ?? "—"}</td>
                  <td className="py-2 pr-3">{r.fuelType ?? "—"}</td>
                  <td className="py-2 pr-3">{r.emissionStandard ?? "—"}</td>
                  <td className="py-2 pr-3 tabular">{r.inspectionPriorityScore ?? "—"}</td>
                  <td className="py-2">
                    <PriorityBadge category={r.priorityCategory} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="revolve-card px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-mist">{label}</p>
      <p className="font-display mt-2 text-2xl tabular">{value}</p>
    </div>
  );
}
