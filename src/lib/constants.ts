import type { VehicleCategory } from "./types";

export const REFERENCE_YEAR = 2026;

export const APP_NAME = "RE-VOLVE";
export const APP_FULL_NAME = "Vehicle Retirement & Environmental Intelligence System";
export const APP_TAGLINE = "Smarter vehicle decisions. Cleaner cities.";

export const PRIORITY_NOTE =
  "These bands are prototype-defined inspection-priority categories, not official government classifications.";

export const SYNTHETIC_BANNER =
  "This view is driven by a labelled synthetic demo fleet. It is not a live extract from VAHAN, Parivahan, or any restricted registration database.";

export const CATEGORIES: VehicleCategory[] = [
  "Two-wheeler",
  "Three-wheeler",
  "Passenger Car",
  "LCV",
  "HCV",
  "Bus",
  "Tractor",
];

export const FUELS = ["Petrol", "Diesel", "CNG", "LPG", "Electric", "Hybrid"] as const;

export const EMISSIONS = ["BS-VI", "BS-IV", "BS-III", "BS-II", "BS-I"] as const;

export const PUC_STATUSES = ["valid", "expired", "failed", "unknown"] as const;
export const FITNESS_STATUSES = ["valid", "expired", "unknown", "not_required"] as const;

export const AGE_BANDS = [
  { id: "0-5", label: "0–5 years", from: 2021, to: 2026 },
  { id: "6-10", label: "6–10 years", from: 2016, to: 2020 },
  { id: "11-15", label: "11–15 years", from: 2011, to: 2015 },
  { id: "16-20", label: "16–20 years", from: 2006, to: 2010 },
  { id: "21+", label: "21+ years", from: 1985, to: 2005 },
] as const;

export const CHART_COLORS = [
  "#C7654A",
  "#E88D78",
  "#B58A6A",
  "#D9A6A0",
  "#8F6A56",
  "#C4A574",
  "#6B5E56",
  "#A67C6A",
];

export const PRIORITY_COLORS: Record<string, string> = {
  "Lower priority": "#8B8580",
  "Moderate priority": "#C4A574",
  "Elevated priority": "#E88D78",
  "High priority": "#B5442E",
};

export const FUEL_COLORS: Record<string, string> = {
  Petrol: "#C7654A",
  Diesel: "#6B5E56",
  CNG: "#C4A574",
  LPG: "#D9A6A0",
  Electric: "#8F6A56",
  Hybrid: "#E88D78",
  Unknown: "#8B8580",
};

export const COMMERCIAL_CATEGORIES = new Set<string>([
  "LCV",
  "HCV",
  "Bus",
  "Tractor",
  "Three-wheeler",
]);

export const INSPECTION_COST_INR: Record<string, number> = {
  "Two-wheeler": 80,
  "Three-wheeler": 150,
  "Passenger Car": 400,
  LCV: 600,
  HCV: 900,
  Bus: 900,
  Tractor: 500,
  Unknown: 350,
};

export const REPLACEMENT_COST_INR: Record<string, number> = {
  "Two-wheeler": 8000,
  "Three-wheeler": 18000,
  "Passenger Car": 40000,
  LCV: 75000,
  HCV: 150000,
  Bus: 180000,
  Tractor: 60000,
  Unknown: 35000,
};

export const SCHEMA_FIELDS = [
  { key: "record_id", label: "Record ID", required: true },
  { key: "registration_year", label: "Registration year", required: false },
  { key: "vehicle_category", label: "Vehicle category", required: false },
  { key: "fuel_type", label: "Fuel type", required: false },
  { key: "emission_standard", label: "Emission standard", required: false },
  { key: "annual_distance_km", label: "Annual distance (km)", required: false },
  { key: "puc_status", label: "PUC status", required: false },
  { key: "puc_expiry_date", label: "PUC expiry date", required: false },
  { key: "historical_puc_failures", label: "Historical PUC failures", required: false },
  { key: "fitness_status", label: "Fitness status", required: false },
  { key: "fitness_expiry_date", label: "Fitness expiry date", required: false },
  { key: "state", label: "State / region", required: false },
  { key: "rto_district", label: "RTO / district", required: false },
  { key: "measured_co_percent", label: "Measured CO %", required: false },
  { key: "measured_hc_ppm", label: "Measured HC ppm", required: false },
  { key: "measured_smoke_opacity", label: "Measured smoke opacity", required: false },
] as const;

export const CSV_TEMPLATE_HEADERS = SCHEMA_FIELDS.map((f) => f.key);

export const DEMO_QUESTIONS = [
  "Which vehicle groups have the highest inspection priority?",
  "How does fuel type vary across the dataset?",
  "Which records have missing fitness information?",
  "What happens when the inspection budget covers the top 10%?",
  "What evidence supports a high-priority recommendation?",
];
