import { NextResponse } from "next/server";
import { compareDefaultScenarios, runScenario } from "@/lib/simulator";
import { filtersFromRequest, loadVehicles } from "@/lib/queries";
import { logEvent } from "@/lib/aws";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const filters = filtersFromRequest(req);
    const rows = await loadVehicles(filters);
    return NextResponse.json({
      total: rows.length,
      scenarios: compareDefaultScenarios(rows),
    });
  } catch (err) {
    logEvent("error", "simulator.get.failed", { err: String(err) });
    return NextResponse.json({ error: "Unable to run scenarios." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      strategy?: string;
      topPercent?: number;
      filters?: Record<string, string>;
    };
    const url = new URL(req.url);
    if (body.filters) {
      for (const [k, v] of Object.entries(body.filters)) {
        if (v) url.searchParams.set(k, v);
      }
    }
    const filters = filtersFromRequest(new Request(url.toString()));
    const rows = await loadVehicles(filters);
    const scenario = runScenario(rows, {
      strategy: body.strategy ?? "top_priority",
      topPercent: body.topPercent ?? 10,
    });
    const selected = rows
      .filter((r) => scenario.selectedIds.includes(r.id))
      .sort((a, b) => (b.inspectionPriorityScore ?? 0) - (a.inspectionPriorityScore ?? 0))
      .slice(0, 40)
      .map((r) => ({
        id: r.id,
        recordId: r.recordId,
        state: r.state,
        vehicleCategory: r.vehicleCategory,
        fuelType: r.fuelType,
        emissionStandard: r.emissionStandard,
        registrationYear: r.registrationYear,
        pucStatus: r.pucStatus,
        fitnessStatus: r.fitnessStatus,
        inspectionPriorityScore: r.inspectionPriorityScore,
        priorityCategory: r.priorityCategory,
      }));
    logEvent("info", "simulator.run", { strategy: scenario.id, selected: scenario.selectedCount });
    return NextResponse.json({ total: rows.length, scenario, selected });
  } catch (err) {
    logEvent("error", "simulator.post.failed", { err: String(err) });
    return NextResponse.json({ error: "Unable to run scenario." }, { status: 400 });
  }
}
