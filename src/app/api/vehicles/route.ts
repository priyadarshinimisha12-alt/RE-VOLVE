import { NextResponse } from "next/server";
import { filtersFromRequest, loadVehicles } from "@/lib/queries";
import { logEvent } from "@/lib/aws";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const filters = filtersFromRequest(req);
    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
    const rows = await loadVehicles(filters);
    const sorted = [...rows].sort(
      (a, b) => (b.inspectionPriorityScore ?? 0) - (a.inspectionPriorityScore ?? 0),
    );
    return NextResponse.json({
      total: sorted.length,
      limit,
      offset,
      records: sorted.slice(offset, offset + limit),
    });
  } catch (err) {
    logEvent("error", "vehicles.list.failed", { err: String(err) });
    return NextResponse.json({ error: "Unable to load vehicles." }, { status: 500 });
  }
}
