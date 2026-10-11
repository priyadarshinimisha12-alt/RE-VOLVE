import { NextResponse } from "next/server";
import { db } from "@/db";
import { assessments } from "@/db/schema";
import { scoreVehicle } from "@/lib/scoring";
import { fetchMLPrediction } from "@/lib/ml";
import { logEvent } from "@/lib/aws";
import type { VehicleInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VehicleInput & { persist?: boolean };
    const result = scoreVehicle(body);
    try {
      const mlPrediction = await fetchMLPrediction(body);
      result.mlPrediction = mlPrediction;
    } catch {
      result.mlPrediction = null;
    }

    if (body.persist) {
      await db.insert(assessments).values({
        id: crypto.randomUUID(),
        vehicleRecordId: null,
        inputSnapshot: body,
        result,
      });
    }
    logEvent("info", "assessment.completed", { score: result.score });
    return NextResponse.json({ result });
  } catch (err) {
    logEvent("error", "assessment.failed", { err: String(err) });
    return NextResponse.json({ error: "Unable to score this record." }, { status: 400 });
  }
}
