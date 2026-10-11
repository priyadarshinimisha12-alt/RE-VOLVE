#!/usr/bin/env python3
"""
RE-VOLVE Machine Learning: Inspection-Priority Classifier Training

Trains a baseline Scikit-learn RandomForestClassifier to predict vehicle
inspection-priority categories based on available vehicle attributes.

IMPORTANT DATA & ETHICAL DISCLOSURE:
The labels in this dataset ('priority_category') were generated from
the deterministic scoring rules in `src/lib/scoring.ts` during synthetic
fleet generation. This model functions as a rule-imitation / surrogate
prototype. It DOES NOT measure or predict ground-truth tailpipe emissions,
ambient air quality, or vehicle legal non-compliance.
"""

import json
import os
import sys
from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
import psycopg2
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# 1. Load Environment Configuration
PROJECT_ROOT = Path(__file__).resolve().parent.parent
env_local_path = PROJECT_ROOT / ".env.local"
env_path = PROJECT_ROOT / ".env"

if env_local_path.exists():
    load_dotenv(env_local_path)
elif env_path.exists():
    load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is required.", file=sys.stderr)
    sys.exit(1)

# Masked URL for safe logging
safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "configured-database"
print(f"[*] Connecting to database host: {safe_url}")

# 2. Define Features and Exclusions (Prevent Target Leakage)
NUMERICAL_FEATURES = [
    "registration_year",
    "annual_distance_km",
    "historical_puc_failures",
    "measured_co_percent",
    "measured_hc_ppm",
    "measured_smoke_opacity",
]

CATEGORICAL_FEATURES = [
    "vehicle_category",
    "fuel_type",
    "emission_standard",
    "puc_status",
    "fitness_status",
    "state",
]

TARGET_COL = "priority_category"

def load_data_from_db(db_url: str) -> pd.DataFrame:
    """Loads vehicle records from Supabase PostgreSQL database."""
    query = """
        SELECT 
            record_id,
            registration_year,
            vehicle_category,
            fuel_type,
            emission_standard,
            annual_distance_km,
            puc_status,
            historical_puc_failures,
            fitness_status,
            state,
            measured_co_percent,
            measured_hc_ppm,
            measured_smoke_opacity,
            priority_category,
            source_type
        FROM vehicle_records;
    """
    conn = psycopg2.connect(db_url)
    try:
        df = pd.read_sql_query(query, conn)
    finally:
        conn.close()
    return df

def build_pipeline() -> Pipeline:
    """Builds an end-to-end preprocessing and RandomForest pipeline."""
    num_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    cat_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_transformer, NUMERICAL_FEATURES),
            ("cat", cat_transformer, CATEGORICAL_FEATURES),
        ]
    )

    classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )

def train_and_evaluate():
    print("\n=======================================================")
    print("  RE-VOLVE Vehicle Inspection Priority Model Training  ")
    print("=======================================================\n")

    # Fetch data
    df = load_data_from_db(DATABASE_URL)
    total_raw = len(df)
    print(f"[*] Total records fetched from Supabase: {total_raw}")

    if total_raw == 0:
        print("ERROR: No vehicle records found in Supabase database.", file=sys.stderr)
        sys.exit(1)

    # Validate target presence
    df = df.dropna(subset=[TARGET_COL])
    usable_count = len(df)
    print(f"[*] Total usable records with valid target '{TARGET_COL}': {usable_count}")

    # Inspect class distribution
    class_counts = df[TARGET_COL].value_counts().to_dict()
    print("\n[+] Target Class Distribution:")
    for cat, count in class_counts.items():
        pct = (count / usable_count) * 100
        print(f"    - {cat:<20}: {count:>4} records ({pct:5.1f}%)")

    # Feature matrix X and target y
    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET_COL]

    # Stratified Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"\n[*] Training set count: {len(X_train)} samples")
    print(f"[*] Testing set count:  {len(X_test)} samples")

    # Fit pipeline strictly on training set
    print("\n[*] Fitting preprocessing and RandomForest pipeline...")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # Predict on unseen test set
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)

    # Evaluation metrics
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")
    report = classification_report(y_test, y_pred, output_dict=True)
    classes = list(pipeline.classes_)
    cm = confusion_matrix(y_test, y_pred, labels=classes)

    print("\n=======================================================")
    print("                 EVALUATION RESULTS                    ")
    print("=======================================================")
    print(f"[*] Test Accuracy:    {acc * 100:.2f}%")
    print(f"[*] Macro F1-score:   {macro_f1:.4f}")
    print(f"[*] Weighted F1-score:{weighted_f1:.4f}")
    print("\n[+] Detailed Classification Report:")
    report_text = classification_report(y_test, y_pred, target_names=classes)
    print(report_text)

    print("[+] Confusion Matrix (rows = Actual, cols = Predicted):")
    print(f"    Classes: {classes}")
    for i, row in enumerate(cm):
        print(f"    {classes[i]:<20}: {row.tolist()}")

    print("\n-------------------------------------------------------")
    print("HONEST EVALUATION & ETHICAL LIMITATION DISCLOSURE:")
    print("  1. The dataset target labels are derived from RE-VOLVE's")
    print("     rule-based scoring algorithm (src/lib/scoring.ts).")
    print("  2. The high agreement/accuracy reflects the Random Forest's")
    print("     fidelity in imitating the multi-factor scoring policy.")
    print("  3. This model DOES NOT predict empirical tailpipe emissions,")
    print("     ambient air pollution, or formal government violation status.")
    print("-------------------------------------------------------\n")

    # Save model artifact
    models_dir = PROJECT_ROOT / "ml" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    model_path = models_dir / "vehicle_priority.joblib"
    metrics_path = models_dir / "metrics.json"

    model_payload = {
        "pipeline": pipeline,
        "classes": classes,
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target_col": TARGET_COL,
    }
    joblib.dump(model_payload, model_path)
    print(f"[+] Model artifact saved to: {model_path}")

    metrics_payload = {
        "accuracy": round(float(acc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "total_samples": usable_count,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classes": classes,
        "class_counts": class_counts,
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "model_type": "RandomForestClassifier",
        "n_estimators": 100,
        "features": {
            "numerical": NUMERICAL_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
        },
        "disclaimer": "Rule-imitation prototype trained on RE-VOLVE synthetic demo dataset. Does not predict tailpipe emissions.",
    }
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"[+] Metrics saved to: {metrics_path}\n")

if __name__ == "__main__":
    train_and_evaluate()
