import { AGE_BANDS } from "./constants";
import type { Filters, VehicleRecordRow } from "./types";

export function parseFilters(sp: URLSearchParams): Filters {
  const num = (k: string) => {
    const v = sp.get(k);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    state: sp.get("state") || undefined,
    rto: sp.get("rto") || undefined,
    category: sp.get("category") || undefined,
    fuel: sp.get("fuel") || undefined,
    emission: sp.get("emission") || undefined,
    fitness: sp.get("fitness") || undefined,
    puc: sp.get("puc") || undefined,
    source: sp.get("source") || undefined,
    yearFrom: num("yearFrom"),
    yearTo: num("yearTo"),
    ageBand: sp.get("ageBand") || undefined,
    q: sp.get("q") || undefined,
    flagged: sp.get("flagged") === "1" || sp.get("flagged") === "true",
  };
}

export function applyFilters<T extends VehicleRecordRow>(rows: T[], f: Filters): T[] {
  let yearFrom = f.yearFrom;
  let yearTo = f.yearTo;
  if (f.ageBand) {
    const band = AGE_BANDS.find((b) => b.id === f.ageBand);
    if (band) {
      yearFrom = band.from;
      yearTo = band.to;
    }
  }
  return rows.filter((r) => {
    if (f.state && r.state !== f.state) return false;
    if (f.rto && r.rtoDistrict !== f.rto) return false;
    if (f.category && r.vehicleCategory !== f.category) return false;
    if (f.fuel && r.fuelType !== f.fuel) return false;
    if (f.emission && r.emissionStandard !== f.emission) return false;
    if (f.fitness && r.fitnessStatus !== f.fitness) return false;
    if (f.puc && r.pucStatus !== f.puc) return false;
    if (f.source && r.sourceType !== f.source) return false;
    if (yearFrom && (r.registrationYear == null || r.registrationYear < yearFrom)) return false;
    if (yearTo && (r.registrationYear == null || r.registrationYear > yearTo)) return false;
    if (f.flagged && (r.inspectionPriorityScore ?? 0) < 50) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      const blob = `${r.recordId} ${r.state} ${r.rtoDistrict} ${r.vehicleCategory} ${r.fuelType}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

export function groupCount(rows: { [k: string]: unknown }[], key: string): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const name = String(r[key] ?? "Unknown");
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
