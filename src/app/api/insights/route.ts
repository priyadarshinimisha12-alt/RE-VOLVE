import { NextResponse } from "next/server";
import { buildFindings } from "@/lib/insights";
import { filtersFromRequest, loadVehicles, summarise } from "@/lib/queries";
import { logEvent } from "@/lib/aws";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const filters = filtersFromRequest(req);
    const rows = await loadVehicles(filters);
    const stats = summarise(rows);
    const findings = buildFindings(rows);
    return NextResponse.json({
      findings,
      regions: stats.regions,
      total: rows.length,
      disclaimer:
        "Findings describe combinations in the loaded file. They do not rank regions by measured air pollution.",
    });
  } catch (err) {
    logEvent("error", "insights.failed", { err: String(err) });
    return NextResponse.json({ error: "Unable to build insights." }, { status: 500 });
  }
}
