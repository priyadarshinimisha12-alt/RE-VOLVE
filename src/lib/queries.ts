import { db } from "@/db";
import { vehicleRecords } from "@/db/schema";
import { applyFilters, parseFilters } from "./filters";
import { ensureSampleData } from "./ensure-data";
import { AGE_BANDS } from "./constants";
import { ageBandLabel } from "./format";
import type { Filters, VehicleRecordRow } from "./types";

export function filtersFromRequest(req: Request): Filters {
  const url = new URL(req.url);
  return parseFilters(url.searchParams);
}

export async function loadVehicles(filters: Filters = {}): Promise<VehicleRecordRow[]> {
  await ensureSampleData();
  const rows = (await db.select().from(vehicleRecords)) as unknown as VehicleRecordRow[];
  return applyFilters(rows, filters);
}

export function summarise(rows: VehicleRecordRow[]) {
  const total = rows.length;
  const flagged = rows.filter((r) => (r.inspectionPriorityScore ?? 0) >= 50);
  const high = rows.filter((r) => (r.inspectionPriorityScore ?? 0) >= 75);
  const fitnessExpired = rows.filter((r) => r.fitnessStatus === "expired");
  const pucFailed = rows.filter((r) => r.pucStatus === "failed");

  const dist = (key: keyof VehicleRecordRow) => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const name = String(r[key] ?? "Unknown");
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value, pct: total ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  };

  const ageMap = new Map<string, { count: number; high: number; elevated: number }>();
  for (const band of ["0–5", "6–10", "11–15", "16–20", "21+", "Unknown"]) {
    ageMap.set(band, { count: 0, high: 0, elevated: 0 });
  }
  for (const r of rows) {
    const band = ageBandLabel(r.registrationYear);
    const rec = ageMap.get(band) ?? { count: 0, high: 0, elevated: 0 };
    rec.count += 1;
    if ((r.inspectionPriorityScore ?? 0) >= 75) rec.high += 1;
    else if ((r.inspectionPriorityScore ?? 0) >= 50) rec.elevated += 1;
    ageMap.set(band, rec);
  }
  const ageDistribution = [...ageMap.entries()].map(([band, v]) => ({ band, ...v }));

  const catMap = new Map<string, { count: number; scoreSum: number; high: number }>();
  for (const r of rows) {
    const name = r.vehicleCategory ?? "Unknown";
    const rec = catMap.get(name) ?? { count: 0, scoreSum: 0, high: 0 };
    rec.count += 1;
    rec.scoreSum += r.inspectionPriorityScore ?? 0;
    if ((r.inspectionPriorityScore ?? 0) >= 75) rec.high += 1;
    catMap.set(name, rec);
  }
  const categoryRisk = [...catMap.entries()]
    .map(([name, v]) => ({
      name,
      count: v.count,
      avgScore: v.count ? v.scoreSum / v.count : 0,
      high: v.high,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  const yearMap = new Map<number, number>();
  for (const r of rows) {
    if (r.registrationYear == null) continue;
    yearMap.set(r.registrationYear, (yearMap.get(r.registrationYear) ?? 0) + 1);
  }
  const registrationTrends = [...yearMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, value]) => ({ year, value }));

  const missingCounts: Record<string, number> = {
    registration_year: 0,
    vehicle_category: 0,
    fuel_type: 0,
    emission_standard: 0,
    puc_status: 0,
    fitness_status: 0,
    annual_distance_km: 0,
    state: 0,
  };
  for (const r of rows) {
    if (r.registrationYear == null) missingCounts.registration_year += 1;
    if (!r.vehicleCategory || r.vehicleCategory === "Unknown") missingCounts.vehicle_category += 1;
    if (!r.fuelType || r.fuelType === "Unknown") missingCounts.fuel_type += 1;
    if (!r.emissionStandard || r.emissionStandard === "Unknown") missingCounts.emission_standard += 1;
    if (!r.pucStatus || r.pucStatus === "unknown") missingCounts.puc_status += 1;
    if (!r.fitnessStatus || r.fitnessStatus === "unknown") missingCounts.fitness_status += 1;
    if (r.annualDistanceKm == null) missingCounts.annual_distance_km += 1;
    if (!r.state) missingCounts.state += 1;
  }

  const qualityAvg =
    total === 0 ? 0 : rows.reduce((s, r) => s + (r.dataQualityScore ?? 0), 0) / total;

  const regionMap = new Map<
    string,
    { count: number; scoreSum: number; high: number; elevated: number; rtos: Map<string, number> }
  >();
  for (const r of rows) {
    const name = r.state ?? "Unknown";
    const rec =
      regionMap.get(name) ?? {
        count: 0,
        scoreSum: 0,
        high: 0,
        elevated: 0,
        rtos: new Map<string, number>(),
      };
    rec.count += 1;
    rec.scoreSum += r.inspectionPriorityScore ?? 0;
    if ((r.inspectionPriorityScore ?? 0) >= 75) rec.high += 1;
    if ((r.inspectionPriorityScore ?? 0) >= 50) rec.elevated += 1;
    if (r.rtoDistrict) rec.rtos.set(r.rtoDistrict, (rec.rtos.get(r.rtoDistrict) ?? 0) + 1);
    regionMap.set(name, rec);
  }
  const regions = [...regionMap.entries()]
    .map(([name, v]) => ({
      name,
      count: v.count,
      avgScore: v.count ? v.scoreSum / v.count : 0,
      high: v.high,
      elevated: v.elevated,
      elevatedPct: v.count ? (v.elevated / v.count) * 100 : 0,
      rtos: [...v.rtos.entries()].map(([rto, c]) => ({ rto, count: c })),
    }))
    .sort((a, b) => b.elevatedPct - a.elevatedPct);

  const priorityDist = dist("priorityCategory");
  const sourceDist = dist("sourceType");

  const lastUpdated = rows.reduce((acc: string | null, r) => {
    const v = r.lastUpdated ? new Date(r.lastUpdated).toISOString() : null;
    if (!v) return acc;
    if (!acc || v > acc) return v;
    return acc;
  }, null);

  const table = [...rows]
    .sort((a, b) => (b.inspectionPriorityScore ?? 0) - (a.inspectionPriorityScore ?? 0))
    .slice(0, 25)
    .map((r) => ({
      id: r.id,
      recordId: r.recordId,
      state: r.state,
      rtoDistrict: r.rtoDistrict,
      vehicleCategory: r.vehicleCategory,
      fuelType: r.fuelType,
      emissionStandard: r.emissionStandard,
      registrationYear: r.registrationYear,
      pucStatus: r.pucStatus,
      fitnessStatus: r.fitnessStatus,
      inspectionPriorityScore: r.inspectionPriorityScore,
      priorityCategory: r.priorityCategory,
      dataQualityScore: r.dataQualityScore,
      sourceType: r.sourceType,
      recommendedNextStep: r.recommendedNextStep,
    }));

  return {
    total,
    flagged: flagged.length,
    flaggedPct: total ? (flagged.length / total) * 100 : 0,
    high: high.length,
    highPct: total ? (high.length / total) * 100 : 0,
    fitnessExpired: fitnessExpired.length,
    fitnessExpiredPct: total ? (fitnessExpired.length / total) * 100 : 0,
    pucFailed: pucFailed.length,
    fuel: dist("fuelType"),
    emission: dist("emissionStandard"),
    puc: dist("pucStatus"),
    fitness: dist("fitnessStatus"),
    category: dist("vehicleCategory"),
    ageDistribution,
    categoryRisk,
    registrationTrends,
    missingCounts,
    qualityAvg,
    regions,
    priorityDist,
    sourceDist,
    lastUpdated,
    table,
    ageBands: AGE_BANDS,
    datasetLabel: "synthetic_demo",
    disclaimer:
      "Counts describe the currently filtered dataset. Inspection priority is not a measurement of ambient air pollution or tailpipe grams.",
  };
}
