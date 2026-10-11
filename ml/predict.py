#!/usr/bin/env python3
"""
RE-VOLVE Machine Learning: Inference Module

Loads the saved Scikit-learn pipeline and predicts vehicle inspection-priority
categories given arbitrary vehicle attributes.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "vehicle_priority.joblib"
METRICS_PATH = PROJECT_ROOT / "ml" / "models" / "metrics.json"

_cached_model_payload: Optional[Dict[str, Any]] = None

def get_model():
    """Loads and caches the trained model pipeline in memory."""
    global _cached_model_payload
    if _cached_model_payload is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found at {MODEL_PATH}. Run 'python ml/train.py' first."
            )
        _cached_model_payload = joblib.load(MODEL_PATH)
    return _cached_model_payload

def predict_single(vehicle: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predicts inspection-priority category and class probabilities for a single vehicle.

    Args:
        vehicle: Dictionary containing vehicle attributes.

    Returns:
        Dictionary with predicted_category, confidence, probabilities, and model metadata.
    """
    model_data = get_model()
    pipeline = model_data["pipeline"]
    classes = model_data["classes"]
    num_cols = model_data["numerical_features"]
    cat_cols = model_data["categorical_features"]

    # Build single-row DataFrame matching training feature columns
    row = {}
    for col in num_cols:
        val = vehicle.get(col)
        # Handle snake_case or camelCase keys if provided
        if val is None and col == "registration_year":
            val = vehicle.get("registrationYear")
        elif val is None and col == "annual_distance_km":
            val = vehicle.get("annualDistanceKm")
        elif val is None and col == "historical_puc_failures":
            val = vehicle.get("historicalPucFailures")
        elif val is None and col == "measured_co_percent":
            val = vehicle.get("measuredCoPercent")
        elif val is None and col == "measured_hc_ppm":
            val = vehicle.get("measuredHcPpm")
        elif val is None and col == "measured_smoke_opacity":
            val = vehicle.get("measuredSmokeOpacity")

        # Convert to numeric or np.nan
        if val is not None and val != "":
            try:
                row[col] = float(val)
            except (ValueError, TypeError):
                row[col] = np.nan
        else:
            row[col] = np.nan

    for col in cat_cols:
        val = vehicle.get(col)
        if val is None and col == "vehicle_category":
            val = vehicle.get("vehicleCategory")
        elif val is None and col == "fuel_type":
            val = vehicle.get("fuelType")
        elif val is None and col == "emission_standard":
            val = vehicle.get("emissionStandard")
        elif val is None and col == "puc_status":
            val = vehicle.get("pucStatus")
        elif val is None and col == "fitness_status":
            val = vehicle.get("fitnessStatus")

        row[col] = str(val) if val is not None and val != "" else "Unknown"

    df = pd.DataFrame([row])

    # Run inference
    pred_class = pipeline.predict(df)[0]
    probabilities = pipeline.predict_proba(df)[0]

    prob_dict = {
        cls_name: round(float(prob), 4)
        for cls_name, prob in zip(classes, probabilities)
    }
    confidence = round(float(max(probabilities)), 4)

    return {
        "predicted_category": pred_class,
        "confidence": confidence,
        "probabilities": prob_dict,
        "classes": classes,
        "model_type": "RandomForestClassifier",
        "is_ml_prediction": True,
        "disclaimer": "Machine learning prototype imitating rule-based inspection priority. Not a direct measurement of vehicle emissions.",
    }

if __name__ == "__main__":
    # Test CLI invocation
    sample = {
        "registration_year": 2005,
        "vehicle_category": "HCV",
        "fuel_type": "Diesel",
        "emission_standard": "BS-II",
        "annual_distance_km": 62000,
        "puc_status": "failed",
        "historical_puc_failures": 3,
        "fitness_status": "expired",
        "state": "Delhi",
        "measured_smoke_opacity": 81.0,
    }
    print(f"Testing prediction on sample vehicle:\n{json.dumps(sample, indent=2)}")
    res = predict_single(sample)
    print(f"\nPrediction Result:\n{json.dumps(res, indent=2)}")
