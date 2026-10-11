import { vehicleRecords } from "./schema";
import { db } from "./index";
import { STATE_NAMES, STATE_RTOS, STATE_WEIGHTS } from "@/data/india";
import { scoreVehicle } from "@/lib/scoring";
import type { VehicleInput } from "@/lib/types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[], weights?: number[]): T {
  if (!weights) return items[Math.floor(rng() * items.length)];
  const total = weights.reduce((s, w) => s + w, 0);
  let x = rng() * total;
  for (let i = 0; i < items.length; i++) {
    x -= weights[i];
    if (x <= 0) return items[i];
  }
  return items[items.length - 1];
}

function chance(rng: () => number, p: number) {
  return rng() < p;
}

function emissionForYear(year: number, rng: () => number): string | null {
  if (chance(rng, 0.08)) return null;
  if (year >= 2020) return chance(rng, 0.08) ? "BS-IV" : "BS-VI";
  if (year >= 2017) return chance(rng, 0.2) ? "BS-VI" : "BS-IV";
  if (year >= 2010) return chance(rng, 0.15) ? "BS-III" : "BS-IV";
  if (year >= 2005) return chance(rng, 0.2) ? "BS-II" : "BS-III";
  if (year >= 2000) return chance(rng, 0.25) ? "BS-I" : "BS-II";
  return "BS-I";
}

function fuelForCategory(cat: string, rng: () => number): string {
  switch (cat) {
    case "Two-wheeler":
      return pick(rng, ["Petrol", "Electric", "Diesel", "CNG"], [0.84, 0.09, 0.04, 0.03]);
    case "Passenger Car":
      return pick(rng, ["Petrol", "Diesel", "CNG", "Electric", "Hybrid", "LPG"], [0.48, 0.27, 0.1, 0.07, 0.05, 0.03]);
    case "LCV":
      return pick(rng, ["Diesel", "CNG", "Petrol", "Electric"], [0.7, 0.15, 0.1, 0.05]);
    case "HCV":
      return pick(rng, ["Diesel", "CNG", "Electric"], [0.92, 0.06, 0.02]);
    case "Three-wheeler":
      return pick(rng, ["CNG", "Petrol", "Diesel", "Electric", "LPG"], [0.38, 0.24, 0.18, 0.14, 0.06]);
    case "Bus":
      return pick(rng, ["Diesel", "CNG", "Electric"], [0.68, 0.26, 0.06]);
    case "Tractor":
      return pick(rng, ["Diesel", "Petrol"], [0.97, 0.03]);
    default:
      return "Petrol";
  }
}

function usageFor(cat: string, rng: () => number): number | null {
  if (chance(rng, 0.12)) return null;
  const base: Record<string, [number, number]> = {
    "Two-wheeler": [4000, 14000],
    "Passenger Car": [6000, 18000],
    "Three-wheeler": [18000, 45000],
    LCV: [15000, 40000],
    HCV: [25000, 80000],
    Bus: [30000, 90000],
    Tractor: [2000, 12000],
  };
  const [lo, hi] = base[cat] ?? [5000, 20000];
  return Math.round(lo + rng() * (hi - lo));
}

export function buildSyntheticFleet(count = 1100, seed = 42) {
  const rng = mulberry32(seed);
  const states = STATE_NAMES;
  const stateWeights = states.map((s) => STATE_WEIGHTS[s] ?? 1);
  const categories = [
    "Two-wheeler",
    "Passenger Car",
    "LCV",
    "HCV",
    "Three-wheeler",
    "Bus",
    "Tractor",
  ];
  const catWeights = [0.38, 0.24, 0.12, 0.08, 0.09, 0.05, 0.04];

  const inputs: VehicleInput[] = [];
  for (let i = 0; i < count; i++) {
    const cat = pick(rng, categories, catWeights);
    const state = pick(rng, states, stateWeights);
    const rtos = STATE_RTOS[state] ?? [state];
    const year = 1996 + Math.floor(rng() * 29);
    const fuel = fuelForCategory(cat, rng);
    const emission = emissionForYear(year, rng);
    const commercial = ["LCV", "HCV", "Bus", "Tractor", "Three-wheeler"].includes(cat);
    const age = 2026 - year;

    let puc: string | null = pick(rng, ["valid", "expired", "failed", "unknown"], [0.55, 0.18, 0.08, 0.19]);
    if (fuel === "Electric") puc = chance(rng, 0.7) ? "valid" : "unknown";
    if (year <= 2008 && fuel === "Diesel" && chance(rng, 0.25)) puc = "failed";
    if (chance(rng, 0.06)) puc = null;

    let hist: number | null = chance(rng, 0.2) ? null : 0;
    if (hist === 0) {
      if (puc === "failed") hist = pick(rng, [1, 2, 3, 4], [0.35, 0.35, 0.2, 0.1]);
      else if (year < 2012) hist = pick(rng, [0, 1, 2], [0.7, 0.2, 0.1]);
    }

    let fitness: string | null = "valid";
    if (!commercial && age < 15) {
      fitness = chance(rng, 0.15) ? "unknown" : "not_required";
    } else {
      fitness = pick(rng, ["valid", "expired", "unknown"], [0.62, 0.22, 0.16]);
      if (age >= 18 && chance(rng, 0.2)) fitness = "expired";
    }
    if (chance(rng, 0.05)) fitness = null;

    const pucExpiry =
      puc === "expired"
        ? `${2019 + Math.floor(rng() * 6)}-${String(1 + Math.floor(rng() * 12)).padStart(2, "0")}-15`
        : puc === "valid"
          ? `${2026}-${String(1 + Math.floor(rng() * 12)).padStart(2, "0")}-15`
          : null;

    const fitnessExpiry =
      fitness === "expired"
        ? `${2018 + Math.floor(rng() * 7)}-03-31`
        : fitness === "valid"
          ? `${2026 + Math.floor(rng() * 2)}-03-31`
          : null;

    let measuredCo: number | null = null;
    let measuredHc: number | null = null;
    let measuredSmoke: number | null = null;
    if (puc === "failed" && chance(rng, 0.7)) {
      if (fuel === "Diesel") measuredSmoke = 70 + rng() * 25;
      else {
        measuredCo = 3.2 + rng() * 2;
        measuredHc = 1600 + rng() * 900;
      }
    } else if (puc === "valid" && chance(rng, 0.12)) {
      if (fuel === "Diesel") measuredSmoke = 20 + rng() * 25;
      else {
        measuredCo = 0.1 + rng() * 0.4;
        measuredHc = 80 + rng() * 400;
      }
    }

    inputs.push({
      recordId: `SYN-${String(i + 1).padStart(6, "0")}`,
      registrationYear: year,
      vehicleCategory: cat,
      fuelType: fuel,
      emissionStandard: emission,
      annualDistanceKm: usageFor(cat, rng),
      pucStatus: puc,
      pucExpiryDate: pucExpiry,
      historicalPucFailures: hist,
      fitnessStatus: fitness,
      fitnessExpiryDate: fitnessExpiry,
      measuredCoPercent: measuredCo != null ? Math.round(measuredCo * 100) / 100 : null,
      measuredHcPpm: measuredHc != null ? Math.round(measuredHc) : null,
      measuredSmokeOpacity: measuredSmoke != null ? Math.round(measuredSmoke) : null,
      state,
      rtoDistrict: pick(rng, rtos),
      sourceType: "synthetic_demo",
      sourceReference:
        "RE-VOLVE synthetic demo fleet v1 — labelled synthetic records inspired by published aggregate VAHAN patterns. Not a VAHAN extract.",
    });
  }
  return inputs;
}

export async function seedSyntheticFleet(count = 1100) {
  const inputs = buildSyntheticFleet(count);
  const now = new Date();
  const rows = inputs.map((input) => {
    const result = scoreVehicle(input);
    return {
      id: crypto.randomUUID(),
      recordId: input.recordId as string,
      registrationYear: input.registrationYear ?? null,
      vehicleCategory: input.vehicleCategory ?? null,
      fuelType: input.fuelType ?? null,
      emissionStandard: input.emissionStandard ?? null,
      annualDistanceKm: input.annualDistanceKm ?? null,
      pucStatus: input.pucStatus ?? null,
      pucExpiryDate: input.pucExpiryDate ?? null,
      historicalPucFailures: input.historicalPucFailures ?? null,
      fitnessStatus: input.fitnessStatus ?? null,
      fitnessExpiryDate: input.fitnessExpiryDate ?? null,
      state: input.state ?? null,
      rtoDistrict: input.rtoDistrict ?? null,
      measuredCoPercent: input.measuredCoPercent ?? null,
      measuredHcPpm: input.measuredHcPpm ?? null,
      measuredSmokeOpacity: input.measuredSmokeOpacity ?? null,
      sourceType: "synthetic_demo",
      sourceReference: input.sourceReference ?? null,
      dataQualityScore: result.dataQualityScore,
      inspectionPriorityScore: result.score,
      priorityCategory: result.category,
      contributingFactors: result.factors,
      missingFields: result.missing,
      recommendedNextStep: result.recommendedNextStep,
      recommendationRationale: result.rationale,
      lastUpdated: now,
      createdAt: now,
      importBatchId: null,
    };
  });

  const chunk = 25;
  for (let i = 0; i < rows.length; i += chunk) {
    await db
      .insert(vehicleRecords)
      .values(rows.slice(i, i + chunk))
      .onConflictDoNothing({ target: vehicleRecords.recordId });
  }
  return rows.length;
}
