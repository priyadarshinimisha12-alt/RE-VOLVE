import { NextResponse } from "next/server";
import { architectureStatus } from "@/lib/aws";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(architectureStatus());
}
