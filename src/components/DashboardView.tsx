"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FilterBar } from "./FilterBar";
import { AgeStackChart, FuelPie, RegionBars, SimpleBars, TrendLine } from "./Charts";
import { Banner, Button, EmptyState, Kpi, Panel } from "./ui";
import { PriorityBadge } from "./PriorityBadge";
import { SYNTHETIC_BANNER } from "@/lib/constants";
import { filterQuery } from "@/lib/client-filters";
import { nfmt, pct } from "@/lib/format";
import type { Filters } from "@/lib/types";

type Stats = {
  total: number;
  flagged: number;
  flaggedPct: number;
  high: number;
  fitnessExpired: number;
  fitnessExpiredPct: number;
  pucFailed: number;
  fuel: { name: string; value: number; pct: number }[];
  emission: { name: string; value: number; pct: number }[];
  puc: { name: string; value: number; pct: number }[];
  ageDistribution: { band: string; count: number; high: number; elevated: number }[];
  categoryRisk: { name: string; count: number; avgScore: number; high: number }[];
  registrationTrends: { year: number; value: number }[];
  missingCounts: Record<string, number>;
  qualityAvg: number;
  regions: { name: string; count: number; avgScore: number; elevatedPct: number }[];
  table: {
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
    dataQualityScore: number | null;
    sourceType: string;
    recommendedNextStep: string | null;
  }[];
  lastUpdated: string | null;
  disclaimer: string;
};

const emptyFilters: Filters = {};

export function DashboardView() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<"inspectionPriorityScore" | "registrationYear">("inspectionPriorityScore");
  const [q, setQ] = useState("");

  const load = useCallback((f: Filters) => {
    let active = true;
    fetch(`/api/vehicles/stats${filterQuery(f)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.details || errBody.error || "stats");
        }
        const data = (await res.json()) as Stats;
        if (active) {
          setStats(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          const msg = err instanceof Error ? err.message : "";
          if (msg.includes("password authentication failed")) {
            setError("Database password authentication failed. Check your Supabase password in .env.local.");
          } else if (msg.includes("does not exist") || msg.includes("Failed query")) {
            setError("Database tables not found. Run 'npm run db:push' to initialize the Supabase schema.");
          } else {
            setError("Could not load the dataset. Check that the database is running and reachable.");
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cancel = load(filters);
    return cancel;
  }, [filters, load]);

  const table = useMemo(() => {
    if (!stats) return [];
    let rows = stats.table;
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter((r) =>
        `${r.recordId} ${r.state} ${r.vehicleCategory} ${r.fuelType}`.toLowerCase().includes(needle),
      );
    }
    return [...rows].sort((a, b) => {
      if (sortKey === "registrationYear") return (a.registrationYear ?? 0) - (b.registrationYear ?? 0);
      return (b.inspectionPriorityScore ?? 0) - (a.inspectionPriorityScore ?? 0);
    });
  }, [stats, q, sortKey]);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">Intelligence dashboard</p>
          <h1 className="font-display mt-1 text-4xl tracking-tight">Fleet evidence, not folklore</h1>
          <p className="mt-2 max-w-2xl text-sm text-mist">
            Every number below is computed from the currently filtered table. Inspection
            priority is a prototype index — never a measurement of city air.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load(filters)} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </header>

      <Banner>
        {SYNTHETIC_BANNER} Source mix is labelled on each row. Last refresh{" "}
        {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString("en-IN") : "—"}.
      </Banner>

      <FilterBar value={filters} onChange={setFilters} />

      {error ? <EmptyState title="Dashboard unavailable" body={error} /> : null}

      {stats && stats.total === 0 ? (
        <EmptyState
          title="No records in this slice"
          body="Clear filters or restore the synthetic demo fleet in Settings."
        />
      ) : null}

      {stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Kpi label="Records in view" value={nfmt(stats.total)} hint="Filtered dataset" />
            <Kpi
              label="Flagged for review"
              value={nfmt(stats.flagged)}
              hint={`${pct(stats.flaggedPct)} with score ≥ 50`}
              tone="warm"
            />
            <Kpi label="High priority" value={nfmt(stats.high)} hint="Prototype band 75–100" tone="alert" />
            <Kpi
              label="Fitness expired"
              value={nfmt(stats.fitnessExpired)}
              hint={`${pct(stats.fitnessExpiredPct)} of view`}
            />
            <Kpi label="PUC failed" value={nfmt(stats.pucFailed)} hint="Test evidence, not AQI" />
            <Kpi
              label="Data quality"
              value={`${Math.round(stats.qualityAvg)}`}
              hint="Mean completeness 0–100"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <Panel
              eyebrow="Dominant view"
              title="Age distribution by inspection band"
              action={<span className="text-[11px] text-mist">High / elevated / other</span>}
            >
              <AgeStackChart data={stats.ageDistribution} />
              <p className="mt-2 text-[12px] text-mist">
                Older cohorts are not automatically high priority. The stack shows how
                scores actually fall after fuel, Bharat Stage, PUC, and fitness are applied.
              </p>
            </Panel>
            <Panel eyebrow="Fuel mix" title="Counts, not tonnes">
              <FuelPie data={stats.fuel} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel eyebrow="Bharat Stage" title="Technology generation">
              <SimpleBars data={stats.emission} />
            </Panel>
            <Panel eyebrow="PUC status" title="Compliance snapshot">
              <SimpleBars data={stats.puc} color="#6B5E56" />
            </Panel>
            <Panel eyebrow="Category" title="Mean inspection score">
              <SimpleBars
                data={stats.categoryRisk.map((c) => ({
                  name: c.name,
                  value: Number(c.avgScore.toFixed(1)),
                }))}
              />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel eyebrow="Registration years in file" title="Historical trend">
              <TrendLine data={stats.registrationTrends} />
              <p className="mt-2 text-[12px] text-mist">
                Counts of records by registration year in this file — not national VAHAN totals.
              </p>
            </Panel>
            <Panel
              eyebrow="Regions"
              title="Share of elevated-priority records"
              action={
                <Link href="/insights" className="text-[12px] text-terracotta">
                  Open map →
                </Link>
              }
            >
              <RegionBars data={stats.regions} />
              <p className="mt-2 text-[12px] text-mist">
                Share of records with score ≥ 50. Not a pollution hotspot and not ambient PM2.5.
              </p>
            </Panel>
          </div>

          <Panel eyebrow="Data quality" title="Missing-field indicators">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(stats.missingCounts).map(([k, v]) => (
                <div key={k} className="border border-[rgba(52,48,46,0.08)] bg-ivory px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-mist">{k.replace(/_/g, " ")}</p>
                  <p className="tabular mt-1 text-lg">
                    {nfmt(v)}{" "}
                    <span className="text-[12px] text-mist">
                      ({stats.total ? pct((v / stats.total) * 100) : "—"})
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            eyebrow="Prioritised records"
            title="Highest scores in this slice"
            action={
              <div className="flex gap-2">
                <input
                  className="border border-[rgba(52,48,46,0.14)] px-2 py-1 text-sm"
                  placeholder="Filter table"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  className="border border-[rgba(52,48,46,0.14)] px-2 py-1 text-sm"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                >
                  <option value="inspectionPriorityScore">Sort by score</option>
                  <option value="registrationYear">Sort by year</option>
                </select>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-[13px]">
                <thead className="text-[10px] uppercase tracking-[0.12em] text-mist">
                  <tr className="border-b border-[rgba(52,48,46,0.1)]">
                    <th className="py-2 pr-3 font-medium">Record</th>
                    <th className="py-2 pr-3 font-medium">Year</th>
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium">Fuel</th>
                    <th className="py-2 pr-3 font-medium">Norm</th>
                    <th className="py-2 pr-3 font-medium">PUC</th>
                    <th className="py-2 pr-3 font-medium">Fitness</th>
                    <th className="py-2 pr-3 font-medium">Score</th>
                    <th className="py-2 pr-3 font-medium">Band</th>
                    <th className="py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((r) => (
                    <tr key={r.id} className="border-b border-[rgba(52,48,46,0.06)]">
                      <td className="py-2 pr-3">
                        <Link href={`/assess?record=${encodeURIComponent(r.recordId)}`} className="text-terracotta">
                          {r.recordId}
                        </Link>
                        <div className="text-[11px] text-mist">{r.state}</div>
                      </td>
                      <td className="py-2 pr-3 tabular">{r.registrationYear ?? "—"}</td>
                      <td className="py-2 pr-3">{r.vehicleCategory ?? "—"}</td>
                      <td className="py-2 pr-3">{r.fuelType ?? "—"}</td>
                      <td className="py-2 pr-3">{r.emissionStandard ?? "—"}</td>
                      <td className="py-2 pr-3">{r.pucStatus ?? "—"}</td>
                      <td className="py-2 pr-3">{r.fitnessStatus ?? "—"}</td>
                      <td className="py-2 pr-3 tabular font-medium">{r.inspectionPriorityScore ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <PriorityBadge category={r.priorityCategory} />
                      </td>
                      <td className="py-2 text-[11px] text-mist">{r.sourceType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] text-mist">{stats.disclaimer}</p>
          </Panel>
        </>
      ) : loading ? (
        <p className="text-sm text-mist">Loading sample fleet…</p>
      ) : null}
    </div>
  );
}
