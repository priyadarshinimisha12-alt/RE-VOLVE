import { NextResponse } from "next/server";
import { guessMapping, parseCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a CSV file." }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds the 2 MB limit." }, { status: 400 });
  }
  const text = await file.text();
  const parsed = parseCsv(text);
  const mapping = guessMapping(parsed.headers);
  return NextResponse.json({
    headers: parsed.headers,
    rowCount: parsed.rows.length,
    preview: parsed.rows.slice(0, 8),
    mapping,
    parseErrors: parsed.errors,
  });
}
