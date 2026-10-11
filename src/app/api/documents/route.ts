import { NextResponse } from "next/server";
import { extractFromText } from "@/lib/document-extract";
import { scoreVehicle } from "@/lib/scoring";
import { logEvent } from "@/lib/aws";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let text = "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const pasted = form.get("text");
      if (typeof pasted === "string" && pasted.trim()) text = pasted;
      if (file instanceof File) {
        if (file.size > 1_000_000) {
          return NextResponse.json({ error: "File exceeds 1 MB." }, { status: 400 });
        }
        const name = file.name.toLowerCase();
        if (name.endsWith(".txt") || name.endsWith(".csv") || file.type.startsWith("text/")) {
          text = (text ? text + "\n" : "") + (await file.text());
        } else {
          return NextResponse.json({
            error:
              "Image/PDF OCR is not enabled in local demo mode (no external document service). Paste text from the RC/PUC or upload a .txt file.",
            extracted: extractFromText(""),
            fallback: true,
          }, { status: 415 });
        }
      }
    } else {
      const body = (await req.json()) as { text?: string };
      text = body.text ?? "";
    }
    if (!text.trim()) {
      return NextResponse.json({ error: "Paste document text or upload a .txt file." }, { status: 400 });
    }
    const extracted = extractFromText(text);
    const result = scoreVehicle({
      recordId: extracted.maskedRegNo ? `DOC-${extracted.maskedRegNo}` : "DOC-manual",
      registrationYear: extracted.registrationYear,
      vehicleCategory: extracted.vehicleCategory,
      fuelType: extracted.fuelType,
      emissionStandard: extracted.emissionStandard,
      pucStatus: extracted.pucStatus,
      pucExpiryDate: extracted.pucExpiryDate,
      fitnessStatus: extracted.fitnessStatus,
      measuredCoPercent: extracted.measuredCoPercent,
      measuredHcPpm: extracted.measuredHcPpm,
      measuredSmokeOpacity: extracted.measuredSmokeOpacity,
      sourceType: "document_extract",
    });
    logEvent("info", "document.extracted", { score: result.score });
    return NextResponse.json({
      extracted,
      result,
      disclosure:
        "Text was processed locally. Nothing was sent to an external OCR or government API. Confirm fields before acting.",
    });
  } catch (err) {
    logEvent("error", "document.failed", { err: String(err) });
    return NextResponse.json({ error: "Unable to extract fields." }, { status: 400 });
  }
}
