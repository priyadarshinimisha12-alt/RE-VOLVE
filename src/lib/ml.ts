import type { MLPredictionResult, VehicleInput } from "./types";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Invokes the local Python FastAPI machine learning inference service.
 * Safely falls back if the service is unreachable or uninitialized.
 */
export async function fetchMLPrediction(
  input: VehicleInput,
): Promise<MLPredictionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recordId: input.recordId ?? null,
        registrationYear: input.registrationYear ?? null,
        vehicleCategory: input.vehicleCategory ?? null,
        fuelType: input.fuelType ?? null,
        emissionStandard: input.emissionStandard ?? null,
        annualDistanceKm: input.annualDistanceKm ?? null,
        pucStatus: input.pucStatus ?? null,
        historicalPucFailures: input.historicalPucFailures ?? null,
        fitnessStatus: input.fitnessStatus ?? null,
        state: input.state ?? null,
        rtoDistrict: input.rtoDistrict ?? null,
        measuredCoPercent: input.measuredCoPercent ?? null,
        measuredHcPpm: input.measuredHcPpm ?? null,
        measuredSmokeOpacity: input.measuredSmokeOpacity ?? null,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      return {
        predictedCategory: "Unavailable",
        confidence: 0,
        probabilities: {},
        classes: [],
        modelType: "RandomForestClassifier",
        isMlPrediction: false,
        disclaimer: "ML inference service returned an error. Using rule-based fallback.",
        status: "error",
        error: `HTTP ${res.status}: ${errText}`,
      };
    }

    const data = (await res.json()) as {
      predicted_category: string;
      confidence: number;
      probabilities: Record<string, number>;
      classes: string[];
      model_type: string;
      is_ml_prediction: boolean;
      disclaimer: string;
    };

    return {
      predictedCategory: data.predicted_category,
      confidence: data.confidence,
      probabilities: data.probabilities,
      classes: data.classes,
      modelType: data.model_type,
      isMlPrediction: data.is_ml_prediction,
      disclaimer: data.disclaimer,
      status: "success",
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      predictedCategory: "Unavailable",
      confidence: 0,
      probabilities: {},
      classes: [],
      modelType: "RandomForestClassifier",
      isMlPrediction: false,
      disclaimer:
        "ML inference service is offline. Scoring relies solely on transparent deterministic rules.",
      status: "unavailable",
      error: msg,
    };
  }
}

/**
 * Checks ML service status and retrieves trained model metrics.
 */
export async function getMLServiceStatus(): Promise<{
  online: boolean;
  metrics?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/metrics`, {
      method: "GET",
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return { online: false, error: `HTTP ${res.status}` };
    }
    const metrics = await res.json();
    return { online: true, metrics };
  } catch (err) {
    return {
      online: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
