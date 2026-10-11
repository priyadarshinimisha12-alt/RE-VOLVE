"use client";

import { INDIA_STATES } from "@/data/india";

type Region = { name: string; count: number; elevatedPct: number; avgScore: number };

export function IndiaTileMap({
  regions,
  selected,
  onSelect,
}: {
  regions: Region[];
  selected?: string;
  onSelect?: (name: string | undefined) => void;
}) {
  const byName = new Map(regions.map((r) => [r.name, r]));
  const max = Math.max(1, ...regions.map((r) => r.elevatedPct));

  return (
    <div>
      <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-mist">
        Schematic state tiles — inspection-priority share, not ambient air quality
      </p>
      <div
        className="grid justify-center gap-1"
        style={{ gridTemplateColumns: "repeat(10, minmax(0, 2.6rem))" }}
      >
        {Array.from({ length: 10 * 9 }).map((_, i) => {
          const col = i % 10;
          const row = Math.floor(i / 10);
          const st = INDIA_STATES.find((s) => s.col === col && s.row === row);
          if (!st) return <div key={i} />;
          const rec = byName.get(st.name);
          const t = rec ? rec.elevatedPct / max : 0;
          const bg = rec
            ? `rgba(199, 101, 74, ${0.12 + t * 0.78})`
            : "rgba(233, 223, 210, 0.5)";
          const active = selected === st.name;
          return (
            <button
              key={st.code}
              type="button"
              title={
                rec
                  ? `${st.name}: ${rec.count} records, ${rec.elevatedPct.toFixed(1)}% elevated priority`
                  : st.name
              }
              onClick={() => onSelect?.(active ? undefined : st.name)}
              className="aspect-square text-[9px] font-medium leading-none text-charcoal"
              style={{
                background: bg,
                outline: active ? "2px solid #34302E" : "1px solid rgba(52,48,46,0.08)",
              }}
            >
              {st.code}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-mist">
        <span>Lower share</span>
        <span className="h-2 w-24" style={{ background: "linear-gradient(90deg, rgba(199,101,74,0.12), rgba(199,101,74,0.9))" }} />
        <span>Higher elevated-priority share</span>
      </div>
    </div>
  );
}
