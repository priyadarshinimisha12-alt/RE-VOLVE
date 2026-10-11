import { COMMERCIAL_CATEGORIES, INSPECTION_COST_INR, REPLACEMENT_COST_INR } from "./constants";
import type { ScenarioResult, VehicleRecordRow } from "./types";

const SHARED_LIMITATIONS = [
  "Outputs are counts and a priority-score coverage proxy — not kilograms of CO₂, PM2.5, or NOx.",
  "The proxy is the share of total inspection-priority points captured by the selected set.",
  "Costs are illustrative operating assumptions for comparison inside this prototype, not MoRTH tariffs.",
  "Selecting a record for inspection is not a finding that the vehicle must be scrapped.",
];

function costOf(rows: VehicleRecordRow[], table: Record<string, number>): number {
  return rows.reduce((sum, r) => {
    const key = r.vehicleCategory && table[r.vehicleCategory] != null ? r.vehicleCategory : "Unknown";
    return sum + (table[key] ?? 0);
  }, 0);
}

function pack(
  id: string,
  name: string,
  description: string,
  selected: VehicleRecordRow[],
  all: VehicleRecordRow[],
  extraAssumptions: string[],
  includeReplacement: boolean,
): ScenarioResult {
  const totalScore = all.reduce((s, r) => s + (r.inspectionPriorityScore ?? 0), 0);
  const selScore = selected.reduce((s, r) => s + (r.inspectionPriorityScore ?? 0), 0);
  const hpAll = all.filter((r) => (r.inspectionPriorityScore ?? 0) >= 75);
  const hpSel = selected.filter((r) => (r.inspectionPriorityScore ?? 0) >= 75);
  return {
    id,
    name,
    description,
    selectedCount: selected.length,
    totalCount: all.length,
    percentOfDataset: all.length ? (selected.length / all.length) * 100 : 0,
    highPrioritySelected: hpSel.length,
    highPriorityTotal: hpAll.length,
    highPriorityCatchRate: hpAll.length ? (hpSel.length / hpAll.length) * 100 : 0,
    scoreCoverageProxy: totalScore ? (selScore / totalScore) * 100 : 0,
    estimatedInspectionCostInr: costOf(selected, INSPECTION_COST_INR),
    estimatedReplacementCostInr: includeReplacement ? costOf(selected, REPLACEMENT_COST_INR) : null,
    assumptions: [
      "Inspection cost table (INR / vehicle): two-wheeler 80, three-wheeler 150, car 400, LCV 600, HCV/bus 900, tractor 500.",
      ...(includeReplacement
        ? [
            "Replacement-incentive table is hypothetical (INR): two-wheeler 8,000; car 40,000; LCV 75,000; HCV 1,50,000. Not an official scheme amount.",
          ]
        : []),
      ...extraAssumptions,
    ],
    limitations: SHARED_LIMITATIONS,
    selectedIds: selected.map((r) => r.id),
  };
}

export function runScenario(
  all: VehicleRecordRow[],
  opts: { strategy: string; topPercent?: number },
): ScenarioResult {
  const sorted = [...all].sort(
    (a, b) => (b.inspectionPriorityScore ?? 0) - (a.inspectionPriorityScore ?? 0),
  );
  const pct = opts.topPercent ?? 10;
  const k = Math.max(0, Math.round((pct / 100) * all.length));

  switch (opts.strategy) {
    case "top_priority": {
      const selected = sorted.slice(0, k);
      return pack(
        "top_priority",
        `Inspect highest-priority ${pct}%`,
        `Select the ${pct}% of records with the highest inspection-priority scores.`,
        selected,
        all,
        [`Selection cutoff is rank-based inside the currently filtered dataset (${pct}%).`],
        false,
      );
    }
    case "puc_failures": {
      const selected = all.filter(
        (r) => r.pucStatus === "failed" || (r.historicalPucFailures ?? 0) >= 2,
      );
      return pack(
        "puc_failures",
        "Prioritise repeated or current PUC failures",
        "Select records with a current failed PUC or two or more historical failures.",
        selected,
        all,
        ["Rule: puc_status = failed OR historical_puc_failures ≥ 2."],
        false,
      );
    }
    case "expired_fitness": {
      const selected = all.filter((r) => r.fitnessStatus === "expired");
      return pack(
        "expired_fitness",
        "Prioritise expired fitness certificates",
        "Select records whose fitness_status is expired.",
        selected,
        all,
        ["Rule: fitness_status = expired."],
        false,
      );
    }
    case "pre_bsiv_diesel_commercial": {
      const selected = all.filter(
        (r) =>
          r.fuelType === "Diesel" &&
          !!r.vehicleCategory &&
          COMMERCIAL_CATEGORIES.has(r.vehicleCategory) &&
          ["BS-I", "BS-II", "BS-III"].includes(r.emissionStandard ?? ""),
      );
      return pack(
        "pre_bsiv_diesel_commercial",
        "Inspect pre-BS-IV diesel commercial-duty",
        "Select diesel commercial-duty records with BS-I/II/III technology.",
        selected,
        all,
        ["Rule: diesel + commercial category + emission standard in {BS-I, BS-II, BS-III}."],
        false,
      );
    }
    case "incomplete_compliance": {
      const selected = all.filter(
        (r) =>
          !r.pucStatus ||
          r.pucStatus === "unknown" ||
          r.pucStatus === "expired" ||
          !r.emissionStandard ||
          r.emissionStandard === "Unknown",
      );
      return pack(
        "incomplete_compliance",
        "Verify incomplete compliance files first",
        "Select records missing PUC or Bharat Stage, or with expired PUC.",
        selected,
        all,
        ["This is a data-completion intervention, not an emissions abatement claim."],
        false,
      );
    }
    case "replacement_pre_bsiii": {
      const selected = all.filter((r) =>
        ["BS-I", "BS-II"].includes(r.emissionStandard ?? ""),
      );
      return pack(
        "replacement_pre_bsiii",
        "Replacement-first: BS-I and BS-II records",
        "Model a replacement-first look at the oldest type-approval generations in the file. This is not a legal scrap order.",
        selected,
        all,
        [
          "Replacement is modelled only as a what-if on BS-I/BS-II records in this file.",
          "End-of-life classification in law depends on fitness testing outcomes, not this score.",
        ],
        true,
      );
    }
    default: {
      const selected = sorted.slice(0, k);
      return pack(
        "top_priority",
        `Inspect highest-priority ${pct}%`,
        `Select the ${pct}% of records with the highest inspection-priority scores.`,
        selected,
        all,
        [`Selection cutoff is rank-based (${pct}%).`],
        false,
      );
    }
  }
}

export function compareDefaultScenarios(all: VehicleRecordRow[]): ScenarioResult[] {
  return [
    runScenario(all, { strategy: "top_priority", topPercent: 10 }),
    runScenario(all, { strategy: "puc_failures" }),
    runScenario(all, { strategy: "expired_fitness" }),
    runScenario(all, { strategy: "replacement_pre_bsiii" }),
  ];
}
