/**
 * Local, deterministic field extraction from pasted RC / PUC text.
 * No external OCR service is called. Image uploads are not sent anywhere.
 */

export type ExtractedFields = {
  registrationYear: number | null;
  vehicleCategory: string | null;
  fuelType: string | null;
  emissionStandard: string | null;
  pucStatus: string | null;
  pucExpiryDate: string | null;
  fitnessStatus: string | null;
  measuredCoPercent: number | null;
  measuredHcPpm: number | null;
  measuredSmokeOpacity: number | null;
  maskedRegNo: string | null;
  notes: string[];
};

function yearFrom(text: string): number | null {
  const labels = text.match(
    /(?:date of registration|registration date|regd?\.?\s*date|manufacturing)\s*[:\-]?\s*([0-3]?\d[\/\-.][01]?\d[\/\-.]((?:19|20)\d{2}))/i,
  );
  if (labels) return Number(labels[2]);
  const years = [...text.matchAll(/\b((?:19|20)\d{2})\b/g)].map((m) => Number(m[1]));
  const plausible = years.filter((y) => y >= 1985 && y <= 2026);
  return plausible.length ? Math.min(...plausible) : null;
}

function find(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

export function extractFromText(raw: string): ExtractedFields {
  const text = raw.replace(/\u0000/g, " ");
  const notes: string[] = [
    "Extraction is a local regex helper. Confirm every field before scoring.",
    "Registration numbers are masked. Owner name, address, and phone are ignored.",
  ];

  const fuelHit = find(
    text,
    /\b(fuel(?:\s*type)?|type of fuel)\s*[:\-]?\s*(petrol|diesel|cng|lpg|electric|hybrid|motor spirit)\b/i,
  );
  const fuel =
    find(text, /\b(petrol|diesel|cng|lpg|electric|hybrid|motor spirit)\b/i) ?? fuelHit;

  const catHit = find(
    text,
    /\b(class of vehicle|vehicle class|vehicle category|maker['’]?s? class)\s*[:\-]?\s*([A-Za-z0-9 \-\/]+)/i,
  );

  let vehicleCategory: string | null = null;
  const blob = `${catHit ?? ""} ${text}`.toLowerCase();
  if (/motor cycle|scooter|m-cycle|two.?wheel/.test(blob)) vehicleCategory = "Two-wheeler";
  else if (/three.?wheel|auto rickshaw|e-rickshaw/.test(blob)) vehicleCategory = "Three-wheeler";
  else if (/goods|lgv|mgv|hgv|truck/.test(blob)) vehicleCategory = /heavy|hgv|hcv/.test(blob) ? "HCV" : "LCV";
  else if (/bus|omnibus/.test(blob)) vehicleCategory = "Bus";
  else if (/tractor/.test(blob)) vehicleCategory = "Tractor";
  else if (/lmv|motor car|car|suv|jeep/.test(blob)) vehicleCategory = "Passenger Car";

  const emission = find(
    text,
    /\b(bs[-\s]?[iv1-6]+|bharat stage\s*[iv1-6]+|bs[-\s]?vi|bs[-\s]?iv)\b/i,
  );

  let pucStatus: string | null = null;
  if (/\bfail(?:ed)?\b/i.test(text) && /puc|pollution/i.test(text)) pucStatus = "failed";
  else if (/\bpass(?:ed)?\b/i.test(text) && /puc|pollution/i.test(text)) pucStatus = "valid";
  const pucExpiry = find(
    text,
    /(?:valid upto|valid to|expiry|valid until)\s*[:\-]?\s*([0-3]?\d[\/\-.][01]?\d[\/\-.](?:19|20)\d{2})/i,
  );

  const co = find(text, /\bco\b[^0-9]{0,8}([0-9]+(?:\.[0-9]+)?)\s*%?/i);
  const hc = find(text, /\bhc\b[^0-9]{0,8}([0-9]+(?:\.[0-9]+)?)\s*(?:ppm)?/i);
  const smoke = find(text, /\b(?:smoke|hsu|opacity)\b[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)/i);

  const reg = find(
    text,
    /\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{1,4})\b/i,
  );
  let maskedRegNo: string | null = null;
  if (reg) {
    const compact = reg.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    maskedRegNo = compact.slice(0, 2) + "••" + compact.slice(-2);
    notes.push("A registration number was detected and masked.");
  }

  if (/owner|father|address|mobile|phone|aadhaar/i.test(text)) {
    notes.push("Personal fields were ignored even if present in the pasted text.");
  }

  return {
    registrationYear: yearFrom(text),
    vehicleCategory,
    fuelType: fuel,
    emissionStandard: emission,
    pucStatus,
    pucExpiryDate: pucExpiry,
    fitnessStatus: /fitness/i.test(text)
      ? /\bexpired|unfit\b/i.test(text)
        ? "expired"
        : "valid"
      : null,
    measuredCoPercent: co ? Number(co) : null,
    measuredHcPpm: hc ? Number(hc) : null,
    measuredSmokeOpacity: smoke ? Number(smoke) : null,
    maskedRegNo,
    notes,
  };
}
