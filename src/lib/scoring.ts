import { COMMERCIAL_CATEGORIES, PRIORITY_NOTE, REFERENCE_YEAR } from "./constants";
import type {
  AssessmentResult,
  PriorityCategory,
  RiskFactor,
  VehicleInput,
} from "./types";
import { normalizeVehicle } from "./normalize";

const CATEGORY_NOTE = PRIORITY_NOTE;

function ageYears(year: number | null): number | null {
  if (year == null || year < 1950 || year > REFERENCE_YEAR + 1) return null;
  return Math.max(0, REFERENCE_YEAR - year);
}

export function fitnessIsExpected(
  category: string | null,
  age: number | null,
): boolean {
  if (category && COMMERCIAL_CATEGORIES.has(category)) return true;
  if (age != null && age >= 15) return true;
  return false;
}

function categoryOf(score: number): PriorityCategory {
  if (score >= 75) return "High priority";
  if (score >= 50) return "Elevated priority";
  if (score >= 25) return "Moderate priority";
  return "Lower priority";
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * Prototype inspection-priority model.
 *
 * This is a transparent, rules-based baseline. It does not measure tailpipe
 * emissions, ambient air quality, or legal non-compliance on its own.
 * Points describe how strongly the available record argues for closer review.
 */
function nn<T>(v: T | null | undefined): T | null {
  return v ?? null;
}

export function scoreVehicle(raw: VehicleInput): AssessmentResult {
  const cleaned = normalizeVehicle(raw);
  const input = {
    ...cleaned,
    registrationYear: nn(cleaned.registrationYear),
    vehicleCategory: nn(cleaned.vehicleCategory),
    fuelType: nn(cleaned.fuelType),
    emissionStandard: nn(cleaned.emissionStandard),
    annualDistanceKm: nn(cleaned.annualDistanceKm),
    pucStatus: nn(cleaned.pucStatus),
    pucExpiryDate: nn(cleaned.pucExpiryDate),
    historicalPucFailures: nn(cleaned.historicalPucFailures),
    fitnessStatus: nn(cleaned.fitnessStatus),
    fitnessExpiryDate: nn(cleaned.fitnessExpiryDate),
    measuredCoPercent: nn(cleaned.measuredCoPercent),
    measuredHcPpm: nn(cleaned.measuredHcPpm),
    measuredSmokeOpacity: nn(cleaned.measuredSmokeOpacity),
    state: nn(cleaned.state),
    rtoDistrict: nn(cleaned.rtoDistrict),
  };
  const age = ageYears(input.registrationYear);
  const fitnessExpected = fitnessIsExpected(input.vehicleCategory, age);
  const factors: RiskFactor[] = [];
  const evidence: string[] = [];
  const missing: string[] = [];

  const measuredPresent =
    input.measuredCoPercent != null ||
    input.measuredHcPpm != null ||
    input.measuredSmokeOpacity != null;

  let pucStatus = input.pucStatus;
  if (input.pucExpiryDate) {
    const exp = Date.parse(input.pucExpiryDate);
    if (!Number.isNaN(exp) && exp < Date.parse(`${REFERENCE_YEAR}-06-01`) && pucStatus === "valid") {
      pucStatus = "expired";
      evidence.push(
        `PUC expiry ${input.pucExpiryDate} is before the demo reference date; status treated as expired.`,
      );
    }
  }

  // --- Age (modest): technology is captured mainly by emission standard.
  let agePoints = 0;
  if (age == null) {
    missing.push("registration year");
    factors.push({
      key: "age",
      label: "Vehicle age",
      points: 0,
      maxPoints: 16,
      evidence: "Registration year is missing, so age is not scored.",
      kind: "missing",
    });
  } else {
    if (age >= 20) agePoints = 16;
    else if (age >= 15) agePoints = 14;
    else if (age >= 10) agePoints = 10;
    else if (age >= 5) agePoints = 5;
    else agePoints = 0;
    factors.push({
      key: "age",
      label: "Vehicle age",
      points: agePoints,
      maxPoints: 16,
      evidence: `About ${age} years old (registration year ${input.registrationYear}). Age is a weak prior, not a pollution measurement.`,
      kind: "observed",
    });
    evidence.push(`Registration year ${input.registrationYear} (age ~${age} years).`);
  }

  // --- Emission standard (primary technology factor)
  let emissionPoints = 0;
  const es = input.emissionStandard;
  if (!es || es === "Unknown") {
    emissionPoints = 5;
    missing.push("emission standard");
    factors.push({
      key: "emission",
      label: "Emission standard",
      points: emissionPoints,
      maxPoints: 22,
      evidence:
        "Bharat Stage is unknown. A small uncertainty weight is applied — the record is not treated as the oldest technology.",
      kind: "missing",
    });
  } else {
    const map: Record<string, number> = {
      "BS-VI": 0,
      "BS-IV": 7,
      "BS-III": 14,
      "BS-II": 18,
      "BS-I": 22,
    };
    emissionPoints = map[es] ?? 5;
    factors.push({
      key: "emission",
      label: "Emission standard",
      points: emissionPoints,
      maxPoints: 22,
      evidence: `${es} is used as a technology generation marker. It is not a measured emission rate for this vehicle.`,
      kind: "observed",
    });
    evidence.push(`Emission standard recorded as ${es}.`);
  }

  // --- Fuel
  let fuelPoints = 0;
  const fuel = input.fuelType;
  if (!fuel || fuel === "Unknown") {
    fuelPoints = 4;
    missing.push("fuel type");
    factors.push({
      key: "fuel",
      label: "Fuel type",
      points: fuelPoints,
      maxPoints: 10,
      evidence: "Fuel type is unknown; a modest uncertainty weight is applied.",
      kind: "missing",
    });
  } else {
    const map: Record<string, number> = {
      Electric: 0,
      Hybrid: 2,
      CNG: 3,
      LPG: 3,
      Petrol: 5,
      Diesel: 10,
    };
    fuelPoints = map[fuel] ?? 4;
    factors.push({
      key: "fuel",
      label: "Fuel type",
      points: fuelPoints,
      maxPoints: 10,
      evidence: `${fuel} influences typical pollutant profiles in the literature, but this record has no measured tailpipe values unless listed below.`,
      kind: "observed",
    });
    evidence.push(`Fuel type recorded as ${fuel}.`);
  }

  // --- Duty class (commercial vs personal) — usage pattern, not emissions
  let classPoints = 0;
  const cat = input.vehicleCategory;
  if (!cat || cat === "Unknown") {
    missing.push("vehicle category");
    factors.push({
      key: "class",
      label: "Duty class",
      points: 0,
      maxPoints: 8,
      evidence: "Vehicle category is missing, so commercial-duty weighting is skipped.",
      kind: "missing",
    });
  } else {
    const map: Record<string, number> = {
      HCV: 8,
      Bus: 7,
      LCV: 5,
      Tractor: 5,
      "Three-wheeler": 3,
      "Passenger Car": 0,
      "Two-wheeler": 0,
    };
    classPoints = map[cat] ?? 0;
    factors.push({
      key: "class",
      label: "Duty class",
      points: classPoints,
      maxPoints: 8,
      evidence: `${cat}${COMMERCIAL_CATEGORIES.has(cat) ? " is treated as a higher-utilisation / commercial-duty class." : " is treated as a personal/light-duty class."} This is not a measured emission factor.`,
      kind: "inferred",
    });
    evidence.push(`Vehicle category recorded as ${cat}.`);
  }

  // --- Measured readings vs PUC status
  let readingsSuggestFail = false;
  if (measuredPresent) {
    const bits: string[] = [];
    if (input.measuredCoPercent != null) bits.push(`CO ${input.measuredCoPercent}%`);
    if (input.measuredHcPpm != null) bits.push(`HC ${input.measuredHcPpm} ppm`);
    if (input.measuredSmokeOpacity != null) {
      bits.push(`smoke opacity ${input.measuredSmokeOpacity}`);
    }
    evidence.push(`Measured test readings supplied: ${bits.join(", ")}.`);
    // Prototype screening thresholds — not official PUC cut-points for every class.
    if (input.measuredCoPercent != null && input.measuredCoPercent > 3) readingsSuggestFail = true;
    if (input.measuredHcPpm != null && input.measuredHcPpm > 1500) readingsSuggestFail = true;
    if (input.measuredSmokeOpacity != null && input.measuredSmokeOpacity > 65) readingsSuggestFail = true;
    if (readingsSuggestFail) {
      evidence.push(
        "Prototype screening thresholds flag at least one reading as elevated. This is evidence of a test concern, not a certified laboratory result.",
      );
    }
  }

  let pucPoints = 0;
  const effectivePuc = readingsSuggestFail && pucStatus !== "failed" ? "failed" : pucStatus;
  if (!effectivePuc || effectivePuc === "unknown") {
    pucPoints = 5;
    missing.push("PUC status");
    factors.push({
      key: "puc",
      label: "PUC / test status",
      points: pucPoints,
      maxPoints: 18,
      evidence:
        "No current pollution-under-control outcome is available. Actual emissions remain unknown.",
      kind: "missing",
    });
  } else if (effectivePuc === "valid") {
    pucPoints = 0;
    factors.push({
      key: "puc",
      label: "PUC / test status",
      points: 0,
      maxPoints: 18,
      evidence:
        "A valid PUC status is recorded. That is a compliance snapshot, not a continuous emissions measurement.",
      kind: "observed",
    });
    evidence.push("PUC status recorded as valid.");
  } else if (effectivePuc === "expired") {
    pucPoints = 11;
    factors.push({
      key: "puc",
      label: "PUC / test status",
      points: 11,
      maxPoints: 18,
      evidence:
        "PUC is expired. This is a compliance-gap signal. Actual present-day emissions are still unknown.",
      kind: "observed",
    });
    evidence.push("PUC status recorded as expired.");
  } else {
    pucPoints = 18;
    factors.push({
      key: "puc",
      label: "PUC / test status",
      points: 18,
      maxPoints: 18,
      evidence:
        "A failed pollution test (or readings above prototype screening thresholds) is documented. This is evidence of a compliance or emission concern for that test — not a city-level pollution measurement.",
      kind: "observed",
    });
    evidence.push("PUC / test status treated as failed.");
  }

  // --- Historical failures (down-weighted if current test already failed)
  let histPoints = 0;
  if (input.historicalPucFailures == null) {
    missing.push("historical PUC failures");
    factors.push({
      key: "puc_history",
      label: "Repeated test failures",
      points: 0,
      maxPoints: 10,
      evidence: "No history of prior PUC failures is supplied. Absence of history is not evidence of a clean record.",
      kind: "missing",
    });
  } else {
    const n = input.historicalPucFailures;
    if (n >= 3) histPoints = 10;
    else if (n >= 2) histPoints = 7;
    else if (n >= 1) histPoints = 4;
    else histPoints = 0;
    if (effectivePuc === "failed") histPoints = round1(histPoints * 0.5);
    factors.push({
      key: "puc_history",
      label: "Repeated test failures",
      points: histPoints,
      maxPoints: 10,
      evidence:
        n === 0
          ? "Zero prior PUC failures are recorded in this file."
          : `${n} prior PUC failure(s) recorded.${effectivePuc === "failed" ? " Weight is reduced because the current failed test is already scored." : ""}`,
      kind: "observed",
    });
    if (n > 0) evidence.push(`${n} historical PUC failure(s) recorded.`);
  }

  // --- Fitness
  let fitnessPoints = 0;
  if (!fitnessExpected) {
    factors.push({
      key: "fitness",
      label: "Fitness certification",
      points: 0,
      maxPoints: 10,
      evidence:
        "A separate fitness certificate is typically not required for this personal/light vehicle while it is under 15 years. Missing fitness is not treated as a gap.",
      kind: "inferred",
    });
  } else if (!input.fitnessStatus || input.fitnessStatus === "unknown") {
    fitnessPoints = 3;
    missing.push("fitness status");
    factors.push({
      key: "fitness",
      label: "Fitness certification",
      points: 3,
      maxPoints: 10,
      evidence:
        "Fitness information is expected for this record (commercial duty or age ≥ 15) but is missing.",
      kind: "missing",
    });
  } else if (input.fitnessStatus === "valid" || input.fitnessStatus === "not_required") {
    fitnessPoints = 0;
    factors.push({
      key: "fitness",
      label: "Fitness certification",
      points: 0,
      maxPoints: 10,
      evidence: `Fitness status recorded as ${input.fitnessStatus}.`,
      kind: "observed",
    });
    evidence.push(`Fitness status recorded as ${input.fitnessStatus}.`);
  } else {
    fitnessPoints = 10;
    factors.push({
      key: "fitness",
      label: "Fitness certification",
      points: 10,
      maxPoints: 10,
      evidence:
        "Fitness certificate is expired. This is a regulatory review signal, not proof of excess emissions.",
      kind: "observed",
    });
    evidence.push("Fitness status recorded as expired.");
  }

  // --- Usage
  let usagePoints = 0;
  if (input.annualDistanceKm == null) {
    missing.push("annual distance");
    factors.push({
      key: "usage",
      label: "Annual usage",
      points: 0,
      maxPoints: 8,
      evidence: "Annual distance is missing, so usage is not scored.",
      kind: "missing",
    });
  } else {
    const km = input.annualDistanceKm;
    if (km > 30000) usagePoints = 8;
    else if (km > 15000) usagePoints = 6;
    else if (km >= 8000) usagePoints = 3;
    else usagePoints = 0;
    factors.push({
      key: "usage",
      label: "Annual usage",
      points: usagePoints,
      maxPoints: 8,
      evidence: `Reported annual distance ${km.toLocaleString("en-IN")} km. Higher utilisation can raise inspection interest; it is not a measured emission rate.`,
      kind: "observed",
    });
    evidence.push(`Annual distance recorded as ${km.toLocaleString("en-IN")} km.`);
  }

  // --- Missing-document bump (investigation, not assumed pollution)
  let missingPoints = 0;
  const missingBits: string[] = [];
  if (!es || es === "Unknown") {
    missingPoints += 2;
    missingBits.push("emission standard");
  }
  if (!effectivePuc || effectivePuc === "unknown") {
    missingPoints += 2;
    missingBits.push("PUC status");
  }
  if (fitnessExpected && (!input.fitnessStatus || input.fitnessStatus === "unknown")) {
    missingPoints += 2;
    missingBits.push("fitness status");
  }
  factors.push({
    key: "missing",
    label: "Document completeness",
    points: missingPoints,
    maxPoints: 6,
    evidence:
      missingBits.length === 0
        ? "Key compliance fields are populated."
        : `Missing ${missingBits.join(", ")}. A small investigation weight is added; missing data is not treated as maximum pollution.`,
    kind: missingBits.length ? "missing" : "observed",
  });

  const rawScore =
    agePoints +
    emissionPoints +
    fuelPoints +
    classPoints +
    pucPoints +
    histPoints +
    fitnessPoints +
    usagePoints +
    missingPoints;
  const score = Math.round(clamp(rawScore));
  const category = categoryOf(score);

  const qualityFields: { ok: boolean }[] = [
    { ok: input.registrationYear != null },
    { ok: !!cat && cat !== "Unknown" },
    { ok: !!fuel && fuel !== "Unknown" },
    { ok: !!es && es !== "Unknown" },
    { ok: !!effectivePuc && effectivePuc !== "unknown" },
    { ok: input.annualDistanceKm != null },
    { ok: !!input.state },
  ];
  if (fitnessExpected) {
    qualityFields.push({
      ok: !!input.fitnessStatus && input.fitnessStatus !== "unknown",
    });
  }
  const dataQualityScore = Math.round(
    (qualityFields.filter((f) => f.ok).length / qualityFields.length) * 100,
  );
  const confidenceLabel =
    dataQualityScore >= 80 ? "High" : dataQualityScore >= 50 ? "Moderate" : "Limited";

  const rec = recommend({
    score,
    puc: effectivePuc,
    hist: input.historicalPucFailures ?? 0,
    fitness: input.fitnessStatus,
    fitnessExpected,
    fuel,
    cat,
    es,
    age,
    missing,
    measuredPresent,
    readingsSuggestFail,
  });

  const caveats = [
    "The score is an inspection-priority index for this prototype, not a measurement of grams of pollutant.",
    CATEGORY_NOTE,
    measuredPresent
      ? "Where test readings exist, they are evidence from that test only."
      : "No test readings are on this record, so actual emissions remain unknown.",
    "Age and Bharat Stage are correlated; age is deliberately given a lower weight than the emission standard.",
    "RE-VOLVE does not recommend scrapping a vehicle solely because it is old.",
  ];

  return {
    score,
    category,
    categoryNote: CATEGORY_NOTE,
    factors,
    evidence,
    missing,
    dataQualityScore,
    confidenceLabel,
    recommendedNextStep: rec.step,
    rationale: rec.rationale,
    caveats,
    actualEmissionsKnown: measuredPresent,
    ageYears: age,
    fitnessExpected,
  };
}

function recommend(args: {
  score: number;
  puc: string | null;
  hist: number;
  fitness: string | null;
  fitnessExpected: boolean;
  fuel: string | null;
  cat: string | null;
  es: string | null;
  age: number | null;
  missing: string[];
  measuredPresent: boolean;
  readingsSuggestFail: boolean;
}): { step: string; rationale: string } {
  const commercial = !!(args.cat && COMMERCIAL_CATEGORIES.has(args.cat));
  const outdated =
    args.es === "BS-I" || args.es === "BS-II" || args.es === "BS-III";

  if (args.puc === "failed" && args.hist >= 2) {
    return {
      step: "Investigate repeated test failures",
      rationale:
        "More than one documented pollution-test failure is on record, including a current fail. The next step is an authorised re-test and a maintenance review — not an automatic end-of-life declaration.",
    };
  }
  if (args.puc === "failed" || args.readingsSuggestFail) {
    return {
      step: "Schedule an authorised emissions test",
      rationale: args.measuredPresent
        ? "A documented test result indicates a compliance or emission concern. Confirm with an authorised centre and record the official reading. The priority score is not itself a laboratory measurement."
        : "The record is marked as a failed PUC. Confirm the result at an authorised centre. Actual continuous emissions are still not known from this file alone.",
    };
  }
  if (args.fitnessExpected && args.fitness === "expired") {
    return {
      step: "Review fitness certification",
      rationale:
        "Fitness has expired. Under Motor Vehicles rules, transport vehicles (and private vehicles after 15 years) need a valid fitness certificate. Review the certificate before considering any end-of-life pathway.",
    };
  }
  if (args.missing.includes("PUC status") || args.missing.includes("emission standard") || (args.fitnessExpected && args.missing.includes("fitness status"))) {
    return {
      step: "Verify missing documents",
      rationale: `Key fields are incomplete (${args.missing.slice(0, 4).join(", ")}). Fill the gaps before treating this record as high-emitting. Missing data is not evidence of pollution.`,
    };
  }
  if (args.puc === "expired") {
    return {
      step: "Schedule an authorised emissions test",
      rationale:
        "PUC validity has lapsed. Renewing the test is the proportionate next step. Expiry is a compliance gap, not a measured emission rate.",
    };
  }
  if (
    args.score >= 75 &&
    commercial &&
    args.fuel === "Diesel" &&
    outdated &&
    args.age != null &&
    args.age >= 15
  ) {
    return {
      step: "Evaluate the applicable end-of-life vehicle rules",
      rationale:
        "Several independent signals align (older diesel commercial duty, pre-BS-IV technology, and high inspection priority). Check current MoRTH fitness and ELV provisions — including the option to repair and re-test. Age alone still does not mandate scrapping.",
    };
  }
  if (args.score >= 50) {
    return {
      step: "Consider maintenance and a scheduled inspection",
      rationale:
        "Combined evidence places this record in an elevated inspection band. A maintenance check and an authorised test are proportionate. This is not a finding that the vehicle is the largest polluter in its city.",
    };
  }
  return {
    step: "No accelerated action from available evidence",
    rationale:
      "Available fields do not justify jumping the inspection queue. Continue routine PUC/fitness cycles. The score is a prioritisation aid, not a clean-vehicle certificate.",
  };
}

export function priorityCategory(score: number): PriorityCategory {
  return categoryOf(score);
}
