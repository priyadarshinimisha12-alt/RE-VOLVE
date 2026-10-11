import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { importBatches, vehicleRecords } from "@/db/schema";
import { parseCsv } from "@/lib/csv";
import { scoredRow } from "@/lib/persist";
import { storeObject, logEvent } from "@/lib/aws";
import { parseDate, parseNumber, parseYear } from "@/lib/normalize";
import type { VehicleInput } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const mappingRaw = form.get("mapping");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a CSV file." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".csv") && file.type && !file.type.includes("csv") && file.type !== "text/plain") {
      return NextResponse.json({ error: "Only CSV files are accepted." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds the 2 MB limit." }, { status: 400 });
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: "No data rows found.", details: parsed.errors }, { status: 400 });
    }
    if (parsed.rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Row limit is ${MAX_ROWS}.` }, { status: 400 });
    }

    const mapping = mappingRaw
      ? (JSON.parse(String(mappingRaw)) as Record<string, string>)
      : {};

    const cell = (row: Record<string, string>, field: string) => {
      const header = mapping[field];
      if (!header) return "";
      return row[header] ?? "";
    };

    await storeObject(file.name, Buffer.from(text, "utf8"));

    const existing = await db.select({ recordId: vehicleRecords.recordId }).from(vehicleRecords);
    const seen = new Set(existing.map((r) => r.recordId));
    const batchId = crypto.randomUUID();
    const accepted: ReturnType<typeof scoredRow>[] = [];
    const rejected: { row: number; reason: string }[] = [];
    let duplicates = 0;
    let invalidDates = 0;

    parsed.rows.forEach((row, idx) => {
      const recordId = cell(row, "record_id") || `IMP-${batchId.slice(0, 6)}-${idx + 1}`;
      if (seen.has(recordId)) {
        duplicates += 1;
        rejected.push({ row: idx + 2, reason: `Duplicate record_id ${recordId}` });
        return;
      }
      const pucDateRaw = cell(row, "puc_expiry_date");
      const fitDateRaw = cell(row, "fitness_expiry_date");
      if (pucDateRaw && !parseDate(pucDateRaw)) {
        invalidDates += 1;
        rejected.push({ row: idx + 2, reason: `Invalid PUC date “${pucDateRaw}”` });
        return;
      }
      if (fitDateRaw && !parseDate(fitDateRaw)) {
        invalidDates += 1;
        rejected.push({ row: idx + 2, reason: `Invalid fitness date “${fitDateRaw}”` });
        return;
      }

      const input: VehicleInput = {
        recordId,
        registrationYear: parseYear(cell(row, "registration_year")),
        vehicleCategory: cell(row, "vehicle_category") || null,
        fuelType: cell(row, "fuel_type") || null,
        emissionStandard: cell(row, "emission_standard") || null,
        annualDistanceKm: parseNumber(cell(row, "annual_distance_km")),
        pucStatus: cell(row, "puc_status") || null,
        pucExpiryDate: parseDate(pucDateRaw),
        historicalPucFailures: parseNumber(cell(row, "historical_puc_failures")),
        fitnessStatus: cell(row, "fitness_status") || null,
        fitnessExpiryDate: parseDate(fitDateRaw),
        state: cell(row, "state") || null,
        rtoDistrict: cell(row, "rto_district") || null,
        measuredCoPercent: parseNumber(cell(row, "measured_co_percent")),
        measuredHcPpm: parseNumber(cell(row, "measured_hc_ppm")),
        measuredSmokeOpacity: parseNumber(cell(row, "measured_smoke_opacity")),
        sourceType: "user_import",
      };

      const scored = scoredRow(input, {
        sourceType: "user_import",
        sourceReference: `User CSV “${file.name}”`,
        importBatchId: batchId,
      });
      seen.add(scored.recordId);
      accepted.push(scored);
    });

    const insertRows = accepted.map(({ assessment: _a, ...row }) => row);
    const chunk = 100;
    for (let i = 0; i < insertRows.length; i += chunk) {
      await db.insert(vehicleRecords).values(insertRows.slice(i, i + chunk));
    }

    const summary = {
      filename: file.name,
      accepted: accepted.length,
      rejected: rejected.length,
      duplicates,
      invalidDates,
      missingFieldCounts: {
        emission_standard: accepted.filter((r) => !r.emissionStandard).length,
        puc_status: accepted.filter((r) => !r.pucStatus).length,
        fitness_status: accepted.filter((r) => !r.fitnessStatus).length,
      },
      preview: accepted.slice(0, 8).map((r) => ({
        recordId: r.recordId,
        score: r.inspectionPriorityScore,
        category: r.priorityCategory,
        missing: r.missingFields,
      })),
      errors: rejected.slice(0, 40),
    };

    await db.insert(importBatches).values({
      id: batchId,
      filename: file.name,
      rowCount: parsed.rows.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      duplicateCount: duplicates,
      summary,
    });

    logEvent("info", "import.completed", { batchId, accepted: accepted.length, rejected: rejected.length });
    return NextResponse.json({ batchId, summary });
  } catch (err) {
    logEvent("error", "import.failed", { err: String(err) });
    return NextResponse.json({ error: "Import failed. Check the CSV and column mapping." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization") ?? "";
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: "Bulk deletion of imports is disabled in production without admin credentials." },
        { status: 403 },
      );
    }
  }
  await db.delete(vehicleRecords).where(eq(vehicleRecords.sourceType, "user_import"));
  return NextResponse.json({ ok: true });
}
