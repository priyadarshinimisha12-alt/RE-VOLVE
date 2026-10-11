import { NextResponse } from "next/server";
import { CSV_TEMPLATE_HEADERS } from "@/lib/constants";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const sample = [
    {
      record_id: "ANON-1001",
      registration_year: "2012",
      vehicle_category: "LCV",
      fuel_type: "Diesel",
      emission_standard: "BS-III",
      annual_distance_km: "28000",
      puc_status: "expired",
      puc_expiry_date: "2024-02-11",
      historical_puc_failures: "1",
      fitness_status: "expired",
      fitness_expiry_date: "2023-08-01",
      state: "Maharashtra",
      rto_district: "Pune",
      measured_co_percent: "",
      measured_hc_ppm: "",
      measured_smoke_opacity: "",
    },
    {
      record_id: "ANON-1002",
      registration_year: "2022",
      vehicle_category: "Passenger Car",
      fuel_type: "Petrol",
      emission_standard: "BS-VI",
      annual_distance_km: "9000",
      puc_status: "valid",
      puc_expiry_date: "2026-11-04",
      historical_puc_failures: "0",
      fitness_status: "not_required",
      fitness_expiry_date: "",
      state: "Karnataka",
      rto_district: "Bengaluru",
      measured_co_percent: "0.21",
      measured_hc_ppm: "120",
      measured_smoke_opacity: "",
    },
    {
      record_id: "ANON-1003",
      registration_year: "2006",
      vehicle_category: "HCV",
      fuel_type: "Diesel",
      emission_standard: "BS-II",
      annual_distance_km: "54000",
      puc_status: "failed",
      puc_expiry_date: "2025-01-20",
      historical_puc_failures: "3",
      fitness_status: "expired",
      fitness_expiry_date: "2022-12-15",
      state: "Delhi",
      rto_district: "South Delhi",
      measured_co_percent: "",
      measured_hc_ppm: "",
      measured_smoke_opacity: "78",
    },
  ];
  const csv = toCsv(CSV_TEMPLATE_HEADERS as unknown as string[], sample);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=revolve-vehicle-template.csv",
    },
  });
}
