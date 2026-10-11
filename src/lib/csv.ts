import { SCHEMA_FIELDS } from "./constants";

export type CsvParseResult = {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
};

export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (inQuotes) {
      if (c === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field.trim());
      field = "";
    } else if (c === "\n") {
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell !== "")) records.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field.trim());
  if (row.some((cell) => cell !== "")) records.push(row);

  if (records.length === 0) {
    return { headers: [], rows: [], errors: ["The file is empty."] };
  }

  const headers = records[0].map((h) => h.trim());
  if (headers.some((h) => !h)) errors.push("One or more header cells are blank.");

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < records.length; r++) {
    const line = records[r];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = line[i] ?? "";
    });
    rows.push(obj);
  }

  return { headers, rows, errors };
}

export function guessMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  const aliases: Record<string, string[]> = {
    record_id: ["record_id", "id", "vehicle_id", "anon_id", "uid"],
    registration_year: ["registration_year", "reg_year", "year", "reg_date", "registration_date"],
    vehicle_category: ["vehicle_category", "category", "class", "vehicle_class", "vclass"],
    fuel_type: ["fuel_type", "fuel", "fueltype"],
    emission_standard: ["emission_standard", "emission", "bs_norm", "norm", "bharat_stage"],
    annual_distance_km: ["annual_distance_km", "annual_km", "odometer", "usage_km", "km"],
    puc_status: ["puc_status", "puc", "pollution_status"],
    puc_expiry_date: ["puc_expiry_date", "puc_expiry", "puc_valid_to"],
    historical_puc_failures: ["historical_puc_failures", "puc_failures", "failed_tests"],
    fitness_status: ["fitness_status", "fitness", "fc_status"],
    fitness_expiry_date: ["fitness_expiry_date", "fitness_expiry", "fc_expiry"],
    state: ["state", "state_name", "region"],
    rto_district: ["rto_district", "rto", "district", "office"],
    measured_co_percent: ["measured_co_percent", "co", "co_percent"],
    measured_hc_ppm: ["measured_hc_ppm", "hc", "hc_ppm"],
    measured_smoke_opacity: ["measured_smoke_opacity", "smoke", "opacity"],
  };

  const used = new Set<string>();
  for (const field of SCHEMA_FIELDS) {
    const keys = aliases[field.key] ?? [field.key];
    const hit = headers.find((h) => {
      const n = norm(h);
      return keys.includes(n) && !used.has(h);
    });
    if (hit) {
      mapping[field.key] = hit;
      used.add(hit);
    }
  }
  return mapping;
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const sanitize = (val: string) => {
    if (/^[=+\-@\t\r]/.test(val)) {
      return `'${val}`;
    }
    return val;
  };
  const esc = (v: unknown) => {
    let s = v == null ? "" : String(v);
    s = sanitize(s);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(esc).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => esc(row[h])).join(","));
  }
  return lines.join("\n");
}
