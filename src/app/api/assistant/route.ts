import { NextResponse } from "next/server";
import { answerFromData } from "@/lib/assistant";
import { filtersFromRequest, loadVehicles } from "@/lib/queries";
import { logEvent } from "@/lib/aws";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { question?: string };
    const question = (body.question ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "Ask a question about the loaded dataset." }, { status: 400 });
    }
    if (question.length > 500) {
      return NextResponse.json({ error: "Question is too long." }, { status: 400 });
    }
    const filters = filtersFromRequest(req);
    const rows = await loadVehicles(filters);
    const answer = answerFromData(question, rows);
    logEvent("info", "assistant.answered", { refused: answer.refused });
    return NextResponse.json(answer);
  } catch (err) {
    logEvent("error", "assistant.failed", { err: String(err) });
    return NextResponse.json({ error: "Unable to answer from the loaded data." }, { status: 500 });
  }
}
