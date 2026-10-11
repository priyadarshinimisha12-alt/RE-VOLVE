import assert from "node:assert/strict";
import { fitnessIsExpected, scoreVehicle, priorityCategory } from "./scoring";
import { normalizeVehicle, parseYear, parseNumber, parseDate, maskRecordId } from "./normalize";
import { parseCsv, guessMapping, toCsv } from "./csv";
import { extractFromText } from "./document-extract";
import { answerFromData } from "./assistant";
import { runScenario, compareDefaultScenarios } from "./simulator";
import type { VehicleRecordRow } from "./types";

function run() {
  console.log("Running comprehensive tests...");

  // 1. Scoring baselines
  const freshEv = scoreVehicle({
    registrationYear: 2024,
    vehicleCategory: "Passenger Car",
    fuelType: "Electric",
    emissionStandard: "BS-VI",
    pucStatus: "valid",
    fitnessStatus: "not_required",
    historicalPucFailures: 0,
    annualDistanceKm: 6000,
    state: "Delhi",
  });
  assert.ok(freshEv.score < 25, `EV should be lower priority, got ${freshEv.score}`);
  assert.equal(freshEv.category, "Lower priority");
  assert.equal(freshEv.actualEmissionsKnown, false);

  const oldPetrolOk = scoreVehicle({
    registrationYear: 2011,
    vehicleCategory: "Passenger Car",
    fuelType: "Petrol",
    emissionStandard: "BS-IV",
    pucStatus: "valid",
    fitnessStatus: "valid",
    historicalPucFailures: 0,
    annualDistanceKm: 9000,
  });
  assert.ok(
    oldPetrolOk.score < 75,
    `Age alone must not push a well-documented petrol car to high priority (got ${oldPetrolOk.score})`,
  );
  assert.ok(!/scrap/i.test(oldPetrolOk.recommendedNextStep));

  const failedDiesel = scoreVehicle({
    registrationYear: 2004,
    vehicleCategory: "HCV",
    fuelType: "Diesel",
    emissionStandard: "BS-II",
    pucStatus: "failed",
    historicalPucFailures: 3,
    fitnessStatus: "expired",
    annualDistanceKm: 60000,
    measuredSmokeOpacity: 82,
  });
  assert.ok(failedDiesel.score >= 75, `Expected high priority, got ${failedDiesel.score}`);
  assert.equal(failedDiesel.actualEmissionsKnown, true);
  assert.ok(/test|failure|fitness|end-of-life/i.test(failedDiesel.recommendedNextStep));
  assert.ok(failedDiesel.evidence.some((e) => /failed|reading/i.test(e)));

  const missing = scoreVehicle({
    registrationYear: 2010,
    vehicleCategory: "Passenger Car",
    fuelType: "Petrol",
  });
  assert.ok(missing.missing.includes("PUC status"));
  assert.ok(missing.score < 80, "Missing data must not be scored as worst-case pollution");
  assert.ok(/missing|verify/i.test(missing.recommendedNextStep));

  const youngPrivate = scoreVehicle({
    registrationYear: 2020,
    vehicleCategory: "Two-wheeler",
    fuelType: "Petrol",
    emissionStandard: "BS-VI",
  });
  assert.equal(youngPrivate.fitnessExpected, false);
  assert.equal(fitnessIsExpected("Two-wheeler", 5), false);
  assert.equal(fitnessIsExpected("HCV", 3), true);
  assert.equal(fitnessIsExpected("Passenger Car", 16), true);

  const expiredPuc = scoreVehicle({
    registrationYear: 2018,
    vehicleCategory: "Passenger Car",
    fuelType: "Petrol",
    emissionStandard: "BS-IV",
    pucStatus: "expired",
    historicalPucFailures: 0,
  });
  assert.ok(/emissions test/i.test(expiredPuc.recommendedNextStep));

  // 2. Score bounds [0, 100] and extreme/edge inputs
  const emptyVehicle = scoreVehicle({});
  assert.ok(emptyVehicle.score >= 0 && emptyVehicle.score <= 100, "Empty vehicle score must be 0-100");
  assert.ok(emptyVehicle.dataQualityScore <= 20, "Empty vehicle should have low data quality score");

  const negativeValues = scoreVehicle({
    registrationYear: -500,
    annualDistanceKm: -10000,
    historicalPucFailures: -5,
  });
  assert.ok(negativeValues.score >= 0 && negativeValues.score <= 100, "Negative inputs must not break 0-100 score bounds");

  const futureYear = scoreVehicle({
    registrationYear: 2099,
  });
  assert.equal(futureYear.ageYears, null, "Future registration years should result in null age");

  // Priority categories threshold checks
  assert.equal(priorityCategory(10), "Lower priority");
  assert.equal(priorityCategory(25), "Moderate priority");
  assert.equal(priorityCategory(50), "Elevated priority");
  assert.equal(priorityCategory(75), "High priority");
  assert.equal(priorityCategory(100), "High priority");

  // 3. Normalization helpers
  assert.equal(parseYear("2015"), 2015);
  assert.equal(parseYear("01-05-2018"), 2018);
  assert.equal(parseYear(1970), null); // Below 1980 threshold
  assert.equal(parseNumber("12,500.5"), 12500.5);
  assert.equal(parseNumber(null), null);
  assert.equal(parseDate("2026-05-12"), "2026-05-12");
  assert.equal(parseDate("15/08/2025"), "2025-08-15");
  assert.equal(maskRecordId("DL01AB1234"), "DL0••••34");
  assert.equal(maskRecordId("SYN-000001"), "SYN-000001");

  const normalized = normalizeVehicle({
    fuelType: "petrol",
    vehicleCategory: "car",
    emissionStandard: "bs6",
    pucStatus: "pass",
    fitnessStatus: "fit",
    state: "mh",
  });
  assert.equal(normalized.fuelType, "Petrol");
  assert.equal(normalized.vehicleCategory, "Passenger Car");
  assert.equal(normalized.emissionStandard, "BS-VI");
  assert.equal(normalized.pucStatus, "valid");
  assert.equal(normalized.fitnessStatus, "valid");
  assert.equal(normalized.state, "Maharashtra");

  // 4. CSV parsing and export
  const csvText = `record_id,registration_year,vehicle_category,fuel_type\nREC-001,2018,Passenger Car,Petrol\n"REC-002,quoted",2020,"Two-wheeler",Electric`;
  const parsed = parseCsv(csvText);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].record_id, "REC-001");
  assert.equal(parsed.rows[1].record_id, "REC-002,quoted");

  const emptyCsv = parseCsv("");
  assert.equal(emptyCsv.rows.length, 0);
  assert.ok(emptyCsv.errors.length > 0);

  const mappedHeaders = guessMapping(["id", "reg_year", "fuel", "category"]);
  assert.equal(mappedHeaders.record_id, "id");
  assert.equal(mappedHeaders.registration_year, "reg_year");
  assert.equal(mappedHeaders.fuel_type, "fuel");
  assert.equal(mappedHeaders.vehicle_category, "category");

  // CSV formula injection protection test
  const dangerousRow = [{ name: "=cmd|' /C calc'!A0", val: "+12345", text: "@sum(1,2)" }];
  const exportedCsv = toCsv(["name", "val", "text"], dangerousRow);
  assert.ok(exportedCsv.includes("'=cmd"), "Formula starting with = must be sanitized");
  assert.ok(exportedCsv.includes("'+12345"), "Formula starting with + must be sanitized");
  assert.ok(exportedCsv.includes("'@sum"), "Formula starting with @ must be sanitized");

  // 5. Document text extraction
  const docExtract = extractFromText(
    "Certificate of Registration DL 01 AB 1234. Date of Registration: 12-04-2015. Class: LMV Motor Car. Fuel: Petrol. Emission: Bharat Stage IV. PUC Passed valid upto 15-09-2026.",
  );
  assert.equal(docExtract.registrationYear, 2015);
  assert.equal(docExtract.vehicleCategory, "Passenger Car");
  assert.equal(docExtract.fuelType, "Petrol");
  assert.equal(docExtract.pucStatus, "valid");
  assert.ok(docExtract.maskedRegNo?.includes("••"));

  // 6. Dataset Assistant constraints
  const sampleRow: VehicleRecordRow = {
    id: "uuid-1",
    recordId: "REC-1",
    registrationYear: 2010,
    vehicleCategory: "Passenger Car",
    fuelType: "Diesel",
    emissionStandard: "BS-III",
    annualDistanceKm: 15000,
    pucStatus: "valid",
    pucExpiryDate: "2026-08-01",
    historicalPucFailures: 0,
    fitnessStatus: "valid",
    fitnessExpiryDate: "2026-08-01",
    state: "Delhi",
    rtoDistrict: "Central",
    measuredCoPercent: null,
    measuredHcPpm: null,
    measuredSmokeOpacity: null,
    sourceType: "synthetic_demo",
    sourceReference: null,
    dataQualityScore: 90,
    inspectionPriorityScore: 40,
    priorityCategory: "Moderate priority",
    contributingFactors: null,
    missingFields: null,
    recommendedNextStep: "Routine inspection",
    recommendationRationale: "Normal profile",
    lastUpdated: new Date(),
    createdAt: new Date(),
    importBatchId: null,
  };

  const emptyAssistant = answerFromData("Which cars are worst?", []);
  assert.equal(emptyAssistant.refused, true);

  const pollutantRefused = answerFromData("How many kg of PM2.5 does this emit?", [sampleRow]);
  assert.equal(pollutantRefused.refused, true);
  assert.ok(pollutantRefused.answer.includes("not convert"));

  const fuelMixAnswer = answerFromData("What is the fuel mix?", [sampleRow]);
  assert.equal(fuelMixAnswer.refused, false);
  assert.ok(fuelMixAnswer.bullets.some((b) => b.includes("Diesel")));

  // 7. Simulator scenario logic
  const scenarios = compareDefaultScenarios([sampleRow]);
  assert.equal(scenarios.length, 4);
  const top10 = runScenario([sampleRow], { strategy: "top_priority", topPercent: 10 });
  assert.equal(top10.totalCount, 1);
  assert.ok(top10.scoreCoverageProxy >= 0);

  console.log("scoring.test.ts: all comprehensive assertions passed successfully!");
}

run();

