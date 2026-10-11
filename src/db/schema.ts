import { integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import type { RiskFactor } from "@/lib/types";

export const vehicleRecords = pgTable("vehicle_records", {
  id: text("id").primaryKey(),
  recordId: text("record_id").notNull().unique(),
  registrationYear: integer("registration_year"),
  vehicleCategory: text("vehicle_category"),
  fuelType: text("fuel_type"),
  emissionStandard: text("emission_standard"),
  annualDistanceKm: integer("annual_distance_km"),
  pucStatus: text("puc_status"),
  pucExpiryDate: text("puc_expiry_date"),
  historicalPucFailures: integer("historical_puc_failures"),
  fitnessStatus: text("fitness_status"),
  fitnessExpiryDate: text("fitness_expiry_date"),
  state: text("state"),
  rtoDistrict: text("rto_district"),
  measuredCoPercent: real("measured_co_percent"),
  measuredHcPpm: real("measured_hc_ppm"),
  measuredSmokeOpacity: real("measured_smoke_opacity"),
  sourceType: text("source_type").notNull().default("synthetic_demo"),
  sourceReference: text("source_reference"),
  dataQualityScore: integer("data_quality_score"),
  inspectionPriorityScore: integer("inspection_priority_score"),
  priorityCategory: text("priority_category"),
  contributingFactors: jsonb("contributing_factors").$type<RiskFactor[]>(),
  missingFields: jsonb("missing_fields").$type<string[]>(),
  recommendedNextStep: text("recommended_next_step"),
  recommendationRationale: text("recommendation_rationale"),
  lastUpdated: timestamp("last_updated", { mode: "date" }).defaultNow(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  importBatchId: text("import_batch_id"),
});

export const importBatches = pgTable("import_batches", {
  id: text("id").primaryKey(),
  filename: text("filename"),
  rowCount: integer("row_count"),
  acceptedCount: integer("accepted_count"),
  rejectedCount: integer("rejected_count"),
  duplicateCount: integer("duplicate_count"),
  summary: jsonb("summary"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: text("id").primaryKey(),
  vehicleRecordId: text("vehicle_record_id"),
  inputSnapshot: jsonb("input_snapshot"),
  result: jsonb("result"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});
