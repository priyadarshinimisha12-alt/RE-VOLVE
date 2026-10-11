#!/usr/bin/env python3
"""
RE-VOLVE Machine Learning: FastAPI Inference Service

Exposes lightweight HTTP endpoints for real-time inference and model status.
Designed to be consumed by Next.js server-side API routes.
"""

import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml.predict import get_model, predict_single, METRICS_PATH

class VehiclePredictionInput(BaseModel):
    recordId: Optional[str] = Field(default=None, description="Optional vehicle identifier")
    registrationYear: Optional[int] = Field(default=None, ge=1950, le=2050, description="Registration year")
    vehicleCategory: Optional[str] = Field(default=None, description="Category (e.g. Passenger Car, HCV)")
    fuelType: Optional[str] = Field(default=None, description="Fuel type (e.g. Diesel, Petrol)")
    emissionStandard: Optional[str] = Field(default=None, description="Bharat Stage standard")
    annualDistanceKm: Optional[float] = Field(default=None, ge=0, description="Estimated annual distance")
    pucStatus: Optional[str] = Field(default=None, description="PUC status (valid, expired, failed)")
    historicalPucFailures: Optional[int] = Field(default=None, ge=0, description="Count of prior test failures")
    fitnessStatus: Optional[str] = Field(default=None, description="Fitness certificate status")
    state: Optional[str] = Field(default=None, description="Registered state")
    rtoDistrict: Optional[str] = Field(default=None, description="RTO district")
    measuredCoPercent: Optional[float] = Field(default=None, ge=0, le=100, description="Measured CO percentage")
    measuredHcPpm: Optional[float] = Field(default=None, ge=0, description="Measured HC in ppm")
    measuredSmokeOpacity: Optional[float] = Field(default=None, ge=0, le=100, description="Measured smoke opacity")

class PredictionResponse(BaseModel):
    predicted_category: str
    confidence: float
    probabilities: Dict[str, float]
    classes: List[str]
    model_type: str
    is_ml_prediction: bool
    disclaimer: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload the model into memory at startup
    try:
        get_model()
        print("[+] ML Model loaded successfully into memory.")
    except Exception as exc:
        print(f"[!] Warning: Failed to preload model: {exc}")
    yield

app = FastAPI(
    title="RE-VOLVE ML Inference Service",
    description="RandomForest inspection-priority classification service",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow local Next.js server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    try:
        model_data = get_model()
        classes = model_data.get("classes", [])
        return {
            "status": "healthy",
            "model_loaded": True,
            "classes": classes,
            "service": "re-volve-ml",
        }
    except Exception as e:
        return {
            "status": "degraded",
            "model_loaded": False,
            "error": str(e),
            "service": "re-volve-ml",
        }

@app.get("/metrics", status_code=status.HTTP_200_OK)
def get_metrics():
    if not METRICS_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metrics file not found. Train the model first.",
        )
    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to read metrics: {str(e)}",
        )

@app.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
def predict(payload: VehiclePredictionInput):
    try:
        result = predict_single(payload.model_dump())
        return result
    except FileNotFoundError as fnf:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model artifact not found. Please train the model first.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Prediction failed: {str(exc)}",
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml.service:app", host="127.0.0.1", port=8000, reload=False)
