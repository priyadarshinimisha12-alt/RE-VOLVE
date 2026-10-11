import { NextResponse } from "next/server";
import { CSV_TEMPLATE_HEADERS } from "@/lib/constants";
import { toCsv } from "@/lib/csv";
import { filtersFromRequest, loadVehicles } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const filters = filtersFromRequest(req);
  const rows = await loadVehicles(filters);
  const mapped = rows.map((r) => ({
    record_id: r.recordId,
    registration_year: r.registrationYear,
    vehicle_category: r.vehicleCategory,
    fuel_type: r.fuelType,
    emission_standard: r.emissionStandard,
    annual_distance_km: r.annualDistanceKm,
    puc_status: r.pucStatus,
    puc_expiry_date: r.pucExpiryDate,
    historical_puc_failures: r.historicalPucFailures,
    fitness_status: r.fitnessStatus,
    fitness_expiry_date: r.fitnessExpiryDate,
    state: r.state,
    rto_district: r.rtoDistrict,
    measured_co_percent: r.measuredCoPercent,
    measured_hc_ppm: r.measuredHcPpm,
    measured_smoke_opacity: r.measuredSmokeOpacity,
    source_type: r.sourceType,
    inspection_priority_score: r.inspectionPriorityScore,
    priority_category: r.priorityCategory,
    data_quality_score: r.dataQualityScore,
    recommended_next_step: r.recommendedNextStep,
  }));
  const headers = [
    ...(CSV_TEMPLATE_HEADERS as unknown as string[]),
    "source_type",
    "inspection_priority_score",
    "priority_category",
    "data_quality_score",
    "recommended_next_step",
  ];
  const csv = toCsv(headers, mapped);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=revolve-cleaned-export.csv",
    },
  });
}
