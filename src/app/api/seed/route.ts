import { NextResponse } from "next/server";
import { db } from "@/db";
import { assessments, importBatches, vehicleRecords } from "@/db/schema";
import { seedSyntheticFleet } from "@/db/seed";
import { logEvent } from "@/lib/aws";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { reset?: boolean };

    // Protection for destructive operations in production
    if (body.reset && process.env.NODE_ENV === "production") {
      const authHeader = req.headers.get("authorization") ?? "";
      const adminKey = process.env.ADMIN_API_KEY;
      if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
        return NextResponse.json(
          { error: "Reset is disabled in production without admin credentials." },
          { status: 403 },
        );
      }
    }

    if (body.reset) {
      await db.delete(vehicleRecords);
      await db.delete(importBatches);
      await db.delete(assessments);
    }
    const existing = await db.select({ id: vehicleRecords.id }).from(vehicleRecords).limit(1);
    if (existing.length && !body.reset) {
      return NextResponse.json({ ok: true, seeded: false, message: "Dataset already present." });
    }
    const n = await seedSyntheticFleet(1100);
    logEvent("info", "seed.completed", { n });
    return NextResponse.json({ ok: true, seeded: true, count: n });
  } catch (err) {
    logEvent("error", "seed.failed", { err: String(err) });
    return NextResponse.json({ error: "Unable to seed demo data." }, { status: 500 });
  }
}
