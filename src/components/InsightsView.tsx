"use client";

import { useCallback, useEffect, useState } from "react";
import { FilterBar } from "./FilterBar";
import { IndiaTileMap } from "./IndiaTileMap";
import { RegionBars } from "./Charts";
import { Banner, EmptyState, Panel } from "./ui";
import { filterQuery } from "@/lib/client-filters";
import { nfmt, pct } from "@/lib/format";
import type { Filters, Finding } from "@/lib/types";

type Region = { name: string; count: number; avgScore: number; elevatedPct: number; high: number };

export function InsightsView() {
  const [filters, setFilters] = useState<Filters>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<"percent" | "avgScore" | "count">("percent");
  const [minCount, setMinCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback((f: Filters) => {
    let active = true;
    fetch(`/api/insights${filterQuery(f)}`)
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { findings: Finding[]; regions: Region[]; total: number };
          if (active) {
            setFindings(data.findings);
            setRegions(data.regions);
            setTotal(data.total);
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

  const sorted = [...findings]
    .filter((f) => f.count >= minCount)
    .sort((a, b) => b[sort] - a[sort]);

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">Regional & population insights</p>
        <h1 className="font-display mt-1 text-4xl tracking-tight">Where attention concentrates</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          The tile map is a schematic of Indian states. Colour encodes the share of
          elevated inspection-priority records in this file — never measured ambient pollution.
        </p>
      </header>
      <Banner>
        Vehicle population concentration, estimated inspection priority, and measured air
        quality are three different things. Only the first two can be computed here.
      </Banner>
      <FilterBar value={filters} onChange={setFilters} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Schematic regional view">
          <IndiaTileMap
            regions={regions}
            selected={filters.state}
            onSelect={(name) => setFilters((f) => ({ ...f, state: name, rto: undefined }))}
          />
        </Panel>
        <Panel title="Elevated-priority share by state">
          <RegionBars data={regions} />
        </Panel>
      </div>

      <Panel
        title="Population findings"
        action={
          <div className="flex flex-wrap gap-2 text-sm">
            <select
              className="border border-[rgba(52,48,46,0.14)] px-2 py-1"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="percent">Sort by share</option>
              <option value="avgScore">Sort by mean score</option>
              <option value="count">Sort by count</option>
            </select>
            <select
              className="border border-[rgba(52,48,46,0.14)] px-2 py-1"
              value={minCount}
              onChange={(e) => setMinCount(Number(e.target.value))}
            >
              <option value={0}>All sizes</option>
              <option value={20}>At least 20 records</option>
              <option value={50}>At least 50 records</option>
            </select>
          </div>
        }
      >
        {loading ? <p className="text-sm text-mist">Analysing…</p> : null}
        {!loading && sorted.length === 0 ? (
          <EmptyState title="No findings" body="The current filters leave too few records." />
        ) : null}
        <div className="grid gap-4">
          {sorted.map((f) => (
            <article key={f.id} className="border border-[rgba(52,48,46,0.08)] bg-ivory p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl">{f.title}</h3>
                <p className="tabular text-sm text-mist">
                  {nfmt(f.count)} / {nfmt(f.totalAnalysed)} · {pct(f.percent)}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{f.summary}</p>
              <p className="mt-2 text-[13px] text-charcoal/90">{f.recommendedInvestigation}</p>
              <dl className="mt-3 grid gap-2 text-[12px] text-mist sm:grid-cols-2">
                <div>
                  Fields: {f.supportingFields.join(", ")}
                </div>
                <div>
                  Mean score {f.avgScore.toFixed(1)} · high-priority {nfmt(f.highPriorityCount)} ·
                  confidence {f.confidence}
                </div>
                <div className="sm:col-span-2">{f.limitations}</div>
                <div className="sm:col-span-2 text-charcoal">{f.claimGuard}</div>
              </dl>
            </article>
          ))}
        </div>
        <p className="mt-4 text-[12px] text-mist">{nfmt(total)} records analysed in the current filter.</p>
      </Panel>
    </div>
  );
}
