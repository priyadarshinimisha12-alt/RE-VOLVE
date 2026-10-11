import { count } from "drizzle-orm";
import { db } from "@/db";
import { vehicleRecords } from "@/db/schema";
import { seedSyntheticFleet } from "@/db/seed";

let seeding: Promise<void> | null = null;

export async function ensureSampleData(): Promise<{ count: number; seeded: boolean }> {
  const [{ value }] = await db.select({ value: count() }).from(vehicleRecords);
  if (value > 0) return { count: value, seeded: false };
  if (!seeding) {
    seeding = seedSyntheticFleet(1100)
      .then(() => undefined)
      .finally(() => {
        seeding = null;
      });
  }
  await seeding;
  const [{ value: after }] = await db.select({ value: count() }).from(vehicleRecords);
  return { count: after, seeded: true };
}
