export type FuelType =
  | "Petrol"
  | "Diesel"
  | "CNG"
  | "LPG"
  | "Electric"
  | "Hybrid"
  | "Unknown";

export type VehicleCategory =
  | "Two-wheeler"
  | "Three-wheeler"
  | "Passenger Car"
  | "LCV"
  | "HCV"
  | "Bus"
  | "Tractor"
  | "Unknown";

export type EmissionStandard =
  | "BS-VI"
  | "BS-IV"
  | "BS-III"
  | "BS-II"
  | "BS-I"
  | "Unknown";

export type PucStatus = "valid" | "expired" | "failed" | "unknown";
export type FitnessStatus = "valid" | "expired" | "unknown" | "not_required";

export type SourceType = "synthetic_demo" | "user_import" | "document_extract";

export type PriorityCategory =
  | "Lower priority"
  | "Moderate priority"
  | "Elevated priority"
  | "High priority";

export type FactorKind = "observed" | "inferred" | "missing";

export type RiskFactor = {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  evidence: string;
  kind: FactorKind;
};

export type VehicleInput = {
  recordId?: string | null;
  registrationYear?: number | null;
  vehicleCategory?: string | null;
  fuelType?: string | null;
  emissionStandard?: string | null;
  annualDistanceKm?: number | null;
  pucStatus?: string | null;
  pucExpiryDate?: string | null;
  historicalPucFailures?: number | null;
  fitnessStatus?: string | null;
  fitnessExpiryDate?: string | null;
  measuredCoPercent?: number | null;
  measuredHcPpm?: number | null;
  measuredSmokeOpacity?: number | null;
  state?: string | null;
  rtoDistrict?: string | null;
  sourceType?: SourceType | string | null;
  sourceReference?: string | null;
};

export type MLPredictionResult = {
  predictedCategory: PriorityCategory | string;
  confidence: number;
  probabilities: Record<string, number>;
  classes: string[];
  modelType: string;
  isMlPrediction: boolean;
  disclaimer: string;
  status: "success" | "unavailable" | "error";
  error?: string;
};

export type AssessmentResult = {
  score: number;
  category: PriorityCategory;
  categoryNote: string;
  factors: RiskFactor[];
  evidence: string[];
  missing: string[];
  dataQualityScore: number;
  confidenceLabel: "Limited" | "Moderate" | "High";
  recommendedNextStep: string;
  rationale: string;
  caveats: string[];
  actualEmissionsKnown: boolean;
  ageYears: number | null;
  fitnessExpected: boolean;
  mlPrediction?: MLPredictionResult | null;
};

export type Filters = {
  state?: string;
  rto?: string;
  category?: string;
  fuel?: string;
  emission?: string;
  fitness?: string;
  puc?: string;
  source?: string;
  yearFrom?: number;
  yearTo?: number;
  ageBand?: string;
  q?: string;
  flagged?: boolean;
};

export type VehicleRecordRow = {
  id: string;
  recordId: string;
  registrationYear: number | null;
  vehicleCategory: string | null;
  fuelType: string | null;
  emissionStandard: string | null;
  annualDistanceKm: number | null;
  pucStatus: string | null;
  pucExpiryDate: string | null;
  historicalPucFailures: number | null;
  fitnessStatus: string | null;
  fitnessExpiryDate: string | null;
  state: string | null;
  rtoDistrict: string | null;
  measuredCoPercent: number | null;
  measuredHcPpm: number | null;
  measuredSmokeOpacity: number | null;
  sourceType: string;
  sourceReference: string | null;
  dataQualityScore: number | null;
  inspectionPriorityScore: number | null;
  priorityCategory: string | null;
  contributingFactors: RiskFactor[] | null;
  missingFields: string[] | null;
  recommendedNextStep: string | null;
  recommendationRationale: string | null;
  lastUpdated: Date | string | null;
  createdAt: Date | string | null;
  importBatchId: string | null;
};

export type Finding = {
  id: string;
  title: string;
  summary: string;
  count: number;
  totalAnalysed: number;
  percent: number;
  avgScore: number;
  highPriorityCount: number;
  supportingFields: string[];
  confidence: "Limited" | "Moderate" | "High";
  limitations: string;
  recommendedInvestigation: string;
  claimGuard: string;
};

export type ScenarioId =
  | "top_priority"
  | "puc_failures"
  | "expired_fitness"
  | "pre_bsiv_diesel_commercial"
  | "incomplete_compliance"
  | "replacement_pre_bsiii";

export type ScenarioResult = {
  id: ScenarioId | string;
  name: string;
  description: string;
  selectedCount: number;
  totalCount: number;
  percentOfDataset: number;
  highPrioritySelected: number;
  highPriorityTotal: number;
  highPriorityCatchRate: number;
  scoreCoverageProxy: number;
  estimatedInspectionCostInr: number;
  estimatedReplacementCostInr: number | null;
  assumptions: string[];
  limitations: string[];
  selectedIds: string[];
};
