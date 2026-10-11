import { buildFindings } from "./insights";
import { compareDefaultScenarios, runScenario } from "./simulator";
import type { VehicleRecordRow } from "./types";
import { nfmt, pct } from "./format";

export type AssistantAnswer = {
  question: string;
  answer: string;
  bullets: string[];
  usedRecords: number;
  refused: boolean;
};

function has(q: string, words: string[]) {
  return words.every((w) => q.includes(w));
}

function any(q: string, words: string[]) {
  return words.some((w) => q.includes(w));
}

export function answerFromData(question: string, rows: VehicleRecordRow[]): AssistantAnswer {
  const q = question.toLowerCase().trim();
  const n = rows.length;
  const base = { question, usedRecords: n, refused: false };

  if (!n) {
    return {
      ...base,
      answer: "The loaded dataset is empty, so I cannot compute a statistic.",
      bullets: ["Import a CSV or restore the synthetic demo fleet in Settings."],
      refused: true,
    };
  }

  if (any(q, ["kg", "pm2.5", "pm2.5", "nox", "co2", "pollution hotspot", "aqi"])) {
    return {
      ...base,
      answer:
        "I will not convert inspection-priority scores into kilograms of pollutant or treat vehicle age as ambient air quality. Those claims are outside this prototype’s evidence.",
      bullets: [
        "Use the simulator’s score-coverage proxy for intervention comparison.",
        "Measured readings, when present, are shown on individual records only.",
      ],
      refused: true,
    };
  }

  if (any(q, ["scrap all", "ban all old", "every old vehicle"])) {
    return {
      ...base,
      answer:
        "RE-VOLVE does not recommend scrapping a vehicle solely because it is old. End-of-life pathways depend on fitness testing and applicable MoRTH rules, not age alone.",
      bullets: ["Open Assessment to see the recommended next step for a specific record."],
      refused: false,
    };
  }

  if (
    any(q, ["highest", "priority"]) &&
    any(q, ["group", "groups", "category", "diesel", "which"])
  ) {
    const findings = buildFindings(rows);
    const top = findings.slice(0, 4);
    return {
      ...base,
      answer: `From the ${nfmt(n)} currently loaded records, these combinations carry the most inspection interest. This is not a ranking of measured pollution.`,
      bullets: top.map(
        (f) =>
          `${f.title}: ${nfmt(f.count)} records (${pct(f.percent)}), mean score ${f.avgScore.toFixed(1)}. ${f.claimGuard}`,
      ),
      refused: false,
    };
  }

  if (any(q, ["fuel"]) && any(q, ["vary", "distribution", "mix", "share", "how"])) {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.fuelType ?? "Unknown", (map.get(r.fuelType ?? "Unknown") ?? 0) + 1);
    const bullets = [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}: ${nfmt(v)} (${pct((v / n) * 100)})`);
    return {
      ...base,
      answer: `Fuel mix in the current dataset (${nfmt(n)} records). These are fleet counts, not emission tonnes.`,
      bullets,
      refused: false,
    };
  }

  if (any(q, ["missing"]) && any(q, ["fitness"])) {
    const missing = rows.filter((r) => !r.fitnessStatus || r.fitnessStatus === "unknown");
    return {
      ...base,
      answer: `${nfmt(missing.length)} of ${nfmt(n)} records (${pct((missing.length / n) * 100)}) have unknown or blank fitness status. For personal vehicles under 15 years a separate certificate is often not required; commercial vehicles and 15+ private vehicles are different.`,
      bullets: [
        `Expired fitness (not merely missing): ${nfmt(rows.filter((r) => r.fitnessStatus === "expired").length)}`,
        "The scoring model does not treat missing personal-vehicle fitness under 15 years as a gap.",
      ],
      refused: false,
    };
  }

  if (any(q, ["budget", "10%", "10 %", "top 10", "inspection budget", "what happens"])) {
    const s5 = runScenario(rows, { strategy: "top_priority", topPercent: 5 });
    const s10 = runScenario(rows, { strategy: "top_priority", topPercent: 10 });
    const s20 = runScenario(rows, { strategy: "top_priority", topPercent: 20 });
    return {
      ...base,
      answer:
        "If the inspection budget is spent on the highest-priority slice of this file, the score-coverage proxy (share of total priority points captured) moves as follows. This is not an emissions-tonne forecast.",
      bullets: [
        `Top 5%: ${nfmt(s5.selectedCount)} vehicles, proxy ${pct(s5.scoreCoverageProxy)}, high-priority catch ${pct(s5.highPriorityCatchRate)}.`,
        `Top 10%: ${nfmt(s10.selectedCount)} vehicles, proxy ${pct(s10.scoreCoverageProxy)}, high-priority catch ${pct(s10.highPriorityCatchRate)}.`,
        `Top 20%: ${nfmt(s20.selectedCount)} vehicles, proxy ${pct(s20.scoreCoverageProxy)}, high-priority catch ${pct(s20.highPriorityCatchRate)}.`,
        "Open the Intervention Simulator to change the slice and compare PUC-first or fitness-first rules.",
      ],
      refused: false,
    };
  }

  if (any(q, ["evidence", "why", "recommend", "high priority", "high-priority"])) {
    const high = rows.filter((r) => (r.inspectionPriorityScore ?? 0) >= 75);
    const failed = high.filter((r) => r.pucStatus === "failed").length;
    const expiredFit = high.filter((r) => r.fitnessStatus === "expired").length;
    const diesel = high.filter((r) => r.fuelType === "Diesel").length;
    return {
      ...base,
      answer: `${nfmt(high.length)} records sit in the prototype high-priority band (75–100). Typical supporting evidence in this file is listed below. Age is never used as a sole scrap recommendation.`,
      bullets: [
        `Failed PUC among high-priority: ${nfmt(failed)}`,
        `Expired fitness among high-priority: ${nfmt(expiredFit)}`,
        `Diesel among high-priority: ${nfmt(diesel)}`,
        "Open any row in Assessment to see factor-level points and the written rationale.",
      ],
      refused: false,
    };
  }

  if (has(q, ["source"]) || any(q, ["vahan", "api", "live data"])) {
    return {
      ...base,
      answer:
        "This prototype does not call the VAHAN individual-record API and does not scrape CAPTCHA-protected portals. The default fleet is labelled synthetic. User CSVs are stored only in the local database.",
      bullets: ["See Data Sources & Methodology for publisher URLs, access conditions, and limitations."],
      refused: false,
    };
  }

  const scenarios = compareDefaultScenarios(rows);
  const fuelTop = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.fuelType ?? "Unknown";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const topFuel = Object.entries(fuelTop).sort((a, b) => b[1] - a[1])[0];
  return {
    ...base,
    answer: `I can only answer from the ${nfmt(n)} records currently loaded. I did not recognise a more specific question, so here is a grounded snapshot.`,
    bullets: [
      `Flagged for review (score ≥ 50): ${nfmt(rows.filter((r) => (r.inspectionPriorityScore ?? 0) >= 50).length)}`,
      `Most common fuel: ${topFuel?.[0] ?? "—"} (${nfmt(topFuel?.[1] ?? 0)})`,
      `Top-10% inspection scenario covers ${pct(scenarios[0].scoreCoverageProxy)} of priority points.`,
      "Try: “Which vehicle groups have the highest inspection priority?”",
    ],
    refused: false,
  };
}
