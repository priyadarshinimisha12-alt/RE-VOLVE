import { NextResponse } from "next/server";
import { fetchMLPrediction, getMLServiceStatus } from "@/lib/ml";
import type { VehicleInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getMLServiceStatus();
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VehicleInput;
    const mlPrediction = await fetchMLPrediction(body);
    return NextResponse.json({ mlPrediction });
  } catch (err) {
    return NextResponse.json(
      { error: "ML prediction request failed.", details: String(err) },
      { status: 400 },
    );
  }
}
