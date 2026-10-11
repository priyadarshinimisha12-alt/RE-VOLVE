import { NextResponse } from "next/server";
import { filtersFromRequest, loadVehicles, summarise } from "@/lib/queries";
import { logEvent } from "@/lib/aws";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const filters = filtersFromRequest(req);
    const rows = await loadVehicles(filters);
    return NextResponse.json(summarise(rows));
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logEvent("error", "vehicles.stats.failed", { err: errorMsg });
    return NextResponse.json(
      {
        error: "Unable to compute statistics.",
        details: process.env.NODE_ENV !== "production" ? errorMsg : undefined,
      },
      { status: 500 },
    );
  }
}
