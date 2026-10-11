import type { VehicleInput } from "./types";

const FUEL_ALIASES: Record<string, string> = {
  petrol: "Petrol",
  gasoline: "Petrol",
  "motor spirit": "Petrol",
  ms: "Petrol",
  diesel: "Diesel",
  hsd: "Diesel",
  "high speed diesel": "Diesel",
  cng: "CNG",
  png: "CNG",
  "compressed natural gas": "CNG",
  lpg: "LPG",
  "auto lpg": "LPG",
  electric: "Electric",
  ev: "Electric",
  bev: "Electric",
  "battery electric": "Electric",
  hybrid: "Hybrid",
  hev: "Hybrid",
  phev: "Hybrid",
  unknown: "Unknown",
  na: "Unknown",
  n: "Unknown",
};

const CATEGORY_ALIASES: Record<string, string> = {
  "two-wheeler": "Two-wheeler",
  "two wheeler": "Two-wheeler",
  "2w": "Two-wheeler",
  "2-wheeler": "Two-wheeler",
  motorcycle: "Two-wheeler",
  scooter: "Two-wheeler",
  moped: "Two-wheeler",
  "three-wheeler": "Three-wheeler",
  "three wheeler": "Three-wheeler",
  "3w": "Three-wheeler",
  auto: "Three-wheeler",
  "auto rickshaw": "Three-wheeler",
  "passenger car": "Passenger Car",
  car: "Passenger Car",
  "motor car": "Passenger Car",
  lmvs: "Passenger Car",
  lmv: "Passenger Car",
  suv: "Passenger Car",
  lcv: "LCV",
  "light commercial": "LCV",
  "goods carriage light": "LCV",
  "light goods": "LCV",
  hcv: "HCV",
  "heavy commercial": "HCV",
  "heavy goods": "HCV",
  truck: "HCV",
  bus: "Bus",
  omnibus: "Bus",
  tractor: "Tractor",
  unknown: "Unknown",
};

const EMISSION_ALIASES: Record<string, string> = {
  "bs-vi": "BS-VI",
  bsvi: "BS-VI",
  "bs6": "BS-VI",
  "bs vi": "BS-VI",
  "bharat stage vi": "BS-VI",
  "bharat stage 6": "BS-VI",
  "bs-iv": "BS-IV",
  bsiv: "BS-IV",
  "bs4": "BS-IV",
  "bs iv": "BS-IV",
  "bharat stage iv": "BS-IV",
  "bharat stage 4": "BS-IV",
  "bs-iii": "BS-III",
  bsiii: "BS-III",
  "bs3": "BS-III",
  "bs iii": "BS-III",
  "bharat stage iii": "BS-III",
  "bs-ii": "BS-II",
  bsii: "BS-II",
  "bs2": "BS-II",
  "bs ii": "BS-II",
  "bharat stage ii": "BS-II",
  "bs-i": "BS-I",
  bsi: "BS-I",
  "bs1": "BS-I",
  "bs i": "BS-I",
  "bharat stage i": "BS-I",
  "india 2000": "BS-I",
  unknown: "Unknown",
};

const PUC_ALIASES: Record<string, string> = {
  valid: "valid",
  pass: "valid",
  passed: "valid",
  active: "valid",
  ok: "valid",
  expired: "expired",
  lapse: "expired",
  lapsed: "expired",
  invalid: "expired",
  failed: "failed",
  fail: "failed",
  "non-compliant": "failed",
  unknown: "unknown",
  na: "unknown",
  missing: "unknown",
};

const FITNESS_ALIASES: Record<string, string> = {
  valid: "valid",
  fit: "valid",
  active: "valid",
  expired: "expired",
  unfit: "expired",
  lapsed: "expired",
  unknown: "unknown",
  na: "unknown",
  "not required": "not_required",
  not_required: "not_required",
  "n/a": "not_required",
};

function normKey(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_./]+/g, " ")
    .replace(/\s+/g, " ");
}

export function normalizeFuel(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  return FUEL_ALIASES[normKey(v)] ?? (String(v).trim() || null);
}

export function normalizeCategory(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  return CATEGORY_ALIASES[normKey(v)] ?? (String(v).trim() || null);
}

export function normalizeEmission(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  const k = normKey(v).replace(/\s+/g, "");
  return (
    EMISSION_ALIASES[normKey(v)] ??
    EMISSION_ALIASES[k] ??
    (String(v).trim() || null)
  );
}

export function normalizePuc(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  return PUC_ALIASES[normKey(v)] ?? "unknown";
}

export function normalizeFitness(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  return FITNESS_ALIASES[normKey(v)] ?? "unknown";
}

export function parseYear(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const y = Math.round(v);
    return y >= 1980 && y <= 2027 ? y : null;
  }
  const s = String(v).trim();
  const m = s.match(/(19|20)\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  return y >= 1980 && y <= 2027 ? y : null;
}

export function parseNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/[, ]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseDate(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const t = Date.parse(s);
    return Number.isNaN(t) ? null : s;
  }
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    const yyyy = dmy[3];
    const iso = `${yyyy}-${mm}-${dd}`;
    const t = Date.parse(iso);
    return Number.isNaN(t) ? null : iso;
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

export function normalizeState(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  const s = String(v).trim();
  const aliases: Record<string, string> = {
    mh: "Maharashtra",
    up: "Uttar Pradesh",
    tn: "Tamil Nadu",
    ka: "Karnataka",
    gj: "Gujarat",
    rj: "Rajasthan",
    mp: "Madhya Pradesh",
    wb: "West Bengal",
    dl: "Delhi",
    nct: "Delhi",
    "nct of delhi": "Delhi",
    kl: "Kerala",
    ts: "Telangana",
    tg: "Telangana",
    ap: "Andhra Pradesh",
    hr: "Haryana",
    pb: "Punjab",
    br: "Bihar",
    od: "Odisha",
    or: "Odisha",
    as: "Assam",
    jh: "Jharkhand",
    ct: "Chhattisgarh",
    cg: "Chhattisgarh",
    uk: "Uttarakhand",
    ua: "Uttarakhand",
    hp: "Himachal Pradesh",
    jk: "Jammu and Kashmir",
  };
  const k = s.toLowerCase();
  if (aliases[k]) return aliases[k];
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeVehicle(raw: VehicleInput): VehicleInput {
  return {
    ...raw,
    registrationYear: parseYear(raw.registrationYear),
    vehicleCategory: normalizeCategory(raw.vehicleCategory),
    fuelType: normalizeFuel(raw.fuelType),
    emissionStandard: normalizeEmission(raw.emissionStandard),
    annualDistanceKm: parseNumber(raw.annualDistanceKm),
    pucStatus: normalizePuc(raw.pucStatus),
    pucExpiryDate: parseDate(raw.pucExpiryDate),
    historicalPucFailures: parseNumber(raw.historicalPucFailures),
    fitnessStatus: normalizeFitness(raw.fitnessStatus),
    fitnessExpiryDate: parseDate(raw.fitnessExpiryDate),
    measuredCoPercent: parseNumber(raw.measuredCoPercent),
    measuredHcPpm: parseNumber(raw.measuredHcPpm),
    measuredSmokeOpacity: parseNumber(raw.measuredSmokeOpacity),
    state: normalizeState(raw.state),
    rtoDistrict: raw.rtoDistrict ? String(raw.rtoDistrict).trim() : null,
  };
}

export function maskRecordId(id: string | null | undefined): string {
  if (!id) return "—";
  if (id.startsWith("SYN-") || id.startsWith("IMP-") || id.startsWith("DOC-")) return id;
  if (id.length <= 4) return id[0] + "•••";
  return id.slice(0, 3) + "••••" + id.slice(-2);
}
