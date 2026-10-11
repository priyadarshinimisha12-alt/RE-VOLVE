import { COMMERCIAL_CATEGORIES } from "./constants";
import type { Finding, VehicleRecordRow } from "./types";

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function finding(
  partial: Omit<Finding, "percent" | "avgScore" | "highPriorityCount"> & {
    rows: VehicleRecordRow[];
  },
): Finding {
  const scores = partial.rows.map((r) => r.inspectionPriorityScore ?? 0);
  return {
    id: partial.id,
    title: partial.title,
    summary: partial.summary,
    count: partial.count,
    totalAnalysed: partial.totalAnalysed,
    percent: partial.totalAnalysed ? (partial.count / partial.totalAnalysed) * 100 : 0,
    avgScore: avg(scores),
    highPriorityCount: partial.rows.filter((r) => (r.inspectionPriorityScore ?? 0) >= 75).length,
    supportingFields: partial.supportingFields,
    confidence: partial.confidence,
    limitations: partial.limitations,
    recommendedInvestigation: partial.recommendedInvestigation,
    claimGuard: partial.claimGuard,
  };
}

export function buildFindings(rows: VehicleRecordRow[]): Finding[] {
  const n = rows.length;
  if (n === 0) return [];

  const out: Finding[] = [];

  const dieselCommercialOld = rows.filter((r) => {
    const ageOk = r.registrationYear != null && r.registrationYear <= 2015;
    return (
      r.fuelType === "Diesel" &&
      !!r.vehicleCategory &&
      COMMERCIAL_CATEGORIES.has(r.vehicleCategory) &&
      ageOk
    );
  });
  out.push(
    finding({
      id: "diesel-commercial-older",
      title: "Older diesel commercial-duty records",
      summary:
        "Diesel LCV, HCV, bus, tractor, and three-wheeler records registered in 2015 or earlier.",
      count: dieselCommercialOld.length,
      totalAnalysed: n,
      rows: dieselCommercialOld,
      supportingFields: ["fuel_type", "vehicle_category", "registration_year"],
      confidence: dieselCommercialOld.length > 20 ? "High" : "Moderate",
      limitations:
        "Combination of fuel, duty class, and age — not measured PM or NOx. Two vehicles in this group can still differ sharply after maintenance.",
      recommendedInvestigation:
        "Prioritise authorised emissions tests and fitness review for this slice before any replacement discussion.",
      claimGuard:
        "This group is flagged for inspection interest. It is not labelled as the largest emitter in the dataset.",
    }),
  );

  const outdated = rows.filter((r) =>
    ["BS-I", "BS-II", "BS-III"].includes(r.emissionStandard ?? ""),
  );
  out.push(
    finding({
      id: "pre-bsiv-tech",
      title: "Pre-BS-IV emission technology",
      summary: "Records whose Bharat Stage is BS-I, BS-II, or BS-III.",
      count: outdated.length,
      totalAnalysed: n,
      rows: outdated,
      supportingFields: ["emission_standard"],
      confidence: "High",
      limitations:
        "Bharat Stage is a type-approval generation, not an in-use measurement for the individual vehicle.",
      recommendedInvestigation:
        "Cross-check fitness and PUC completeness, then sample this group for authorised testing.",
      claimGuard: "Outdated type-approval technology is not the same as currently measured pollution.",
    }),
  );

  const expiredFit = rows.filter((r) => r.fitnessStatus === "expired");
  out.push(
    finding({
      id: "expired-fitness",
      title: "Expired fitness certificates",
      summary: "Records with fitness_status = expired.",
      count: expiredFit.length,
      totalAnalysed: n,
      rows: expiredFit,
      supportingFields: ["fitness_status", "fitness_expiry_date"],
      confidence: expiredFit.length ? "High" : "Limited",
      limitations:
        "Fitness expiry is a regulatory status. It does not quantify grams of pollutant.",
      recommendedInvestigation:
        "Queue these records for fitness testing centres; allow repair and re-test before ELV classification.",
      claimGuard: "Expired fitness is a compliance signal, not a measured emissions ranking.",
    }),
  );

  const repeats = rows.filter((r) => (r.historicalPucFailures ?? 0) >= 2);
  out.push(
    finding({
      id: "repeat-puc",
      title: "Repeated PUC failures",
      summary: "Records with two or more historical PUC failures.",
      count: repeats.length,
      totalAnalysed: n,
      rows: repeats,
      supportingFields: ["historical_puc_failures", "puc_status"],
      confidence: repeats.length ? "Moderate" : "Limited",
      limitations:
        "Failure counts depend on how complete the source file is. Missing history is not a clean bill of health.",
      recommendedInvestigation:
        "Investigate maintenance quality and confirm with a fresh authorised test.",
      claimGuard: "Repeated fails are test-evidence, not city-level air-quality attribution.",
    }),
  );

  const highUseGap = rows.filter(
    (r) =>
      (r.annualDistanceKm ?? 0) >= 20000 &&
      (r.pucStatus == null || r.pucStatus === "unknown" || r.pucStatus === "expired"),
  );
  out.push(
    finding({
      id: "high-use-incomplete",
      title: "High usage with incomplete PUC evidence",
      summary: "Annual distance ≥ 20,000 km and PUC missing or expired.",
      count: highUseGap.length,
      totalAnalysed: n,
      rows: highUseGap,
      supportingFields: ["annual_distance_km", "puc_status"],
      confidence: "Moderate",
      limitations: "Usage is self-reported or modelled in demo data. It is not a dynamometer result.",
      recommendedInvestigation: "Require a current PUC before any other intervention is modelled.",
      claimGuard: "High kilometres do not prove high emissions without a test.",
    }),
  );

  const missingEs = rows.filter(
    (r) => !r.emissionStandard || r.emissionStandard === "Unknown",
  );
  out.push(
    finding({
      id: "missing-emission",
      title: "Missing emission standard",
      summary: "Records with no usable Bharat Stage field.",
      count: missingEs.length,
      totalAnalysed: n,
      rows: missingEs,
      supportingFields: ["emission_standard"],
      confidence: "High",
      limitations: "The scoring model applies a small uncertainty weight rather than assuming BS-I.",
      recommendedInvestigation: "Backfill from RC documents or manufacturer type-approval year.",
      claimGuard: "Missing technology data is a data-quality issue, not a pollution hotspot.",
    }),
  );

  const failed = rows.filter((r) => r.pucStatus === "failed");
  out.push(
    finding({
      id: "failed-puc",
      title: "Current PUC failed",
      summary: "Records whose latest PUC status is failed.",
      count: failed.length,
      totalAnalysed: n,
      rows: failed,
      supportingFields: ["puc_status", "measured_co_percent", "measured_hc_ppm", "measured_smoke_opacity"],
      confidence: failed.length ? "High" : "Limited",
      limitations: "A fail is evidence from that test event. It is not a continuous emissions monitor.",
      recommendedInvestigation: "Authorised re-test after maintenance. Do not skip to scrappage on one fail.",
      claimGuard: "Failed PUC is compliance/test evidence — the only place this prototype treats as measured concern.",
    }),
  );

  const byState = new Map<string, VehicleRecordRow[]>();
  for (const r of rows) {
    const s = r.state ?? "Unknown";
    const list = byState.get(s) ?? [];
    list.push(r);
    byState.set(s, list);
  }
  let topState = "—";
  let topShare = 0;
  let topRows: VehicleRecordRow[] = [];
  for (const [s, list] of byState) {
    const hp = list.filter((r) => (r.inspectionPriorityScore ?? 0) >= 50).length;
    const share = list.length ? hp / list.length : 0;
    if (share > topShare && list.length >= 15) {
      topShare = share;
      topState = s;
      topRows = list.filter((r) => (r.inspectionPriorityScore ?? 0) >= 50);
    }
  }
  out.push(
    finding({
      id: "regional-concentration",
      title: `Elevated-priority concentration in ${topState}`,
      summary: `Among states with at least 15 records, ${topState} has the highest share of scores ≥ 50.`,
      count: topRows.length,
      totalAnalysed: n,
      rows: topRows,
      supportingFields: ["state", "inspection_priority_score"],
      confidence: topRows.length ? "Moderate" : "Limited",
      limitations:
        "This is a concentration of inspection-priority records in the loaded file. It is not ambient PM2.5 or an official hotspot map.",
      recommendedInvestigation:
        "Inspect the underlying mix (fuel, age, fitness) in that state rather than inferring city air quality.",
      claimGuard: "Vehicle-record concentration ≠ measured regional air pollution.",
    }),
  );

  const privateOld = rows.filter((r) => {
    const personal = r.vehicleCategory === "Passenger Car" || r.vehicleCategory === "Two-wheeler";
    const old = r.registrationYear != null && r.registrationYear <= 2011;
    return personal && old && (r.fitnessStatus == null || r.fitnessStatus === "unknown");
  });
  out.push(
    finding({
      id: "private-15y-fitness-gap",
      title: "Private vehicles around 15+ years without fitness data",
      summary:
        "Passenger cars and two-wheelers registered in 2011 or earlier with no fitness field — relevant because non-transport vehicles need fitness at registration renewal after 15 years.",
      count: privateOld.length,
      totalAnalysed: n,
      rows: privateOld,
      supportingFields: ["vehicle_category", "registration_year", "fitness_status"],
      confidence: "Moderate",
      limitations:
        "The 15-year rule is a registration-renewal trigger, not an emissions measurement and not an automatic scrap order.",
      recommendedInvestigation: "Verify whether registration renewal and fitness testing have occurred.",
      claimGuard: "Do not treat every 15-year-old private vehicle as highly polluting.",
    }),
  );

  return out.sort((a, b) => b.percent - a.percent);
}
