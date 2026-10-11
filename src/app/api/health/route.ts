import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const processUptime = process.uptime();
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      status: "healthy",
      app: "healthy",
      database: "connected",
      uptime: processUptime,
    });
  } catch (err) {
    return Response.json(
      {
        status: "degraded",
        app: "healthy",
        database: "disconnected",
        uptime: processUptime,
        error: process.env.NODE_ENV === "development" ? (err instanceof Error ? err.message : "Database connection failed") : "Database connection failed",
      },
      { status: 503 },
    );
  }
}
