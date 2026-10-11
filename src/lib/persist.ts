import { normalizeVehicle } from "./normalize";
import { scoreVehicle } from "./scoring";
import type { VehicleInput } from "./types";

export function scoredRow(
  raw: VehicleInput,
  extras: {
    id?: string;
    sourceType: string;
    sourceReference?: string | null;
    importBatchId?: string | null;
  },
) {
  const input = normalizeVehicle(raw);
  const result = scoreVehicle(input);
  const now = new Date();
  return {
    id: extras.id ?? crypto.randomUUID(),
    recordId: String(input.recordId ?? raw.recordId ?? `IMP-${crypto.randomUUID().slice(0, 8)}`),
    registrationYear: input.registrationYear ?? null,
    vehicleCategory: input.vehicleCategory ?? null,
    fuelType: input.fuelType ?? null,
    emissionStandard: input.emissionStandard ?? null,
    annualDistanceKm:
      input.annualDistanceKm != null ? Math.round(input.annualDistanceKm) : null,
    pucStatus: input.pucStatus ?? null,
    pucExpiryDate: input.pucExpiryDate ?? null,
    historicalPucFailures:
      input.historicalPucFailures != null ? Math.round(input.historicalPucFailures) : null,
    fitnessStatus: input.fitnessStatus ?? null,
    fitnessExpiryDate: input.fitnessExpiryDate ?? null,
    state: input.state ?? null,
    rtoDistrict: input.rtoDistrict ?? null,
    measuredCoPercent: input.measuredCoPercent ?? null,
    measuredHcPpm: input.measuredHcPpm ?? null,
    measuredSmokeOpacity: input.measuredSmokeOpacity ?? null,
    sourceType: extras.sourceType,
    sourceReference: extras.sourceReference ?? null,
    dataQualityScore: result.dataQualityScore,
    inspectionPriorityScore: result.score,
    priorityCategory: result.category,
    contributingFactors: result.factors,
    missingFields: result.missing,
    recommendedNextStep: result.recommendedNextStep,
    recommendationRationale: result.rationale,
    lastUpdated: now,
    createdAt: now,
    importBatchId: extras.importBatchId ?? null,
    assessment: result,
  };
}
