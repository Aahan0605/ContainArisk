"""
ML Testing / Inference Pipeline — test_model.py
-------------------------------------------------
Loads the trained models and generates predictions on the real-time dataset.

Usage (from project root):
    python ml/test_model.py

Outputs:
    ml/outputs/test_predictions.csv
"""

import sys
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

# Ensure project root is on the path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_PROJECT_ROOT / "ml" / "preprocessing"))

from feature_engineering import (
    engineer_features,
    load_stats,
    FEATURE_COLUMNS,
    DERIVED_FEATURE_COLUMNS,
    TARGET_COLUMN,
)


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

DATA_PATH = _PROJECT_ROOT / "data" / "datasets" / "hackooo" / "Real-Time Data (1).csv"
MODEL_DIR = _PROJECT_ROOT / "ml" / "models"
MODEL_PATH = MODEL_DIR / "anomaly_detection_model.pkl"
ISO_MODEL_PATH = MODEL_DIR / "isolation_forest.pkl"
STATS_PATH = MODEL_DIR / "feature_stats.pkl"
OUTPUT_DIR = _PROJECT_ROOT / "ml" / "outputs"
OUTPUT_PATH = OUTPUT_DIR / "test_predictions.csv"


# ---------------------------------------------------------------------------
# Risk level classification
# ---------------------------------------------------------------------------

def assign_risk_level(score: float) -> str:
    if score >= 0.8:
        return "CRITICAL"
    elif score >= 0.6:
        return "HIGH"
    elif score >= 0.3:
        return "MEDIUM"
    else:
        return "LOW"


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def main():
    print("=" * 70)
    print("  SHIPMENT ANOMALY DETECTION — INFERENCE PIPELINE")
    print("=" * 70)

    # ----- 1. Load Models & Stats -----
    print("\n[1/5] Loading trained models and statistics ...")
    model = joblib.load(MODEL_PATH)
    stats = load_stats(STATS_PATH)
    print(f"  Supervised model loaded from {MODEL_PATH}")

    # Try loading Isolation Forest if available
    iso_model = None
    if ISO_MODEL_PATH.exists():
        iso_model = joblib.load(ISO_MODEL_PATH)
        print(f"  Isolation Forest loaded from {ISO_MODEL_PATH}")
    else:
        print("  Isolation Forest not found, using supervised model only.")

    # ----- 2. Load Real-Time Data -----
    print("\n[2/5] Loading real-time dataset ...")
    df_raw = pd.read_csv(DATA_PATH)
    print(f"  Rows : {len(df_raw):,}")
    print(f"  Cols : {df_raw.shape[1]}")

    # ----- 3. Feature Engineering (inference mode) -----
    print("\n[3/5] Engineering features (inference mode) ...")
    df_feat, _ = engineer_features(df_raw, stats=stats, fit_mode=False)
    feature_cols = [c for c in df_feat.columns if c != TARGET_COLUMN]
    X = df_feat[feature_cols]
    print(f"  Feature columns : {X.shape[1]}")

    # ----- 4. Generate Predictions -----
    print("\n[4/5] Generating predictions ...")

    # Supervised probability
    supervised_probability = model.predict_proba(X)[:, 1]

    # Isolation Forest score (if available)
    if iso_model is not None:
        raw_scores = iso_model.score_samples(X)
        # Normalise to 0–1 (higher = more anomalous)
        isolation_score = 1 - (raw_scores - raw_scores.min()) / (
            raw_scores.max() - raw_scores.min() + 1e-6
        )
    else:
        isolation_score = supervised_probability  # fallback

    # Combined final score
    final_anomaly_score = 0.7 * supervised_probability + 0.3 * isolation_score

    # ----- 5. Build Output -----
    print("\n[5/5] Building output file ...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    output_df = pd.DataFrame({
        "anomaly_probability": np.round(supervised_probability, 4),
        "isolation_score": np.round(isolation_score, 4),
        "final_anomaly_score": np.round(final_anomaly_score, 4),
        "risk_level": [assign_risk_level(s) for s in final_anomaly_score],
    })

    output_df.to_csv(OUTPUT_PATH, index=False)
    print(f"  Saved → {OUTPUT_PATH}")
    print(f"  Rows  : {len(output_df):,}")

    print(f"\n  Risk Level Distribution:")
    dist = output_df["risk_level"].value_counts()
    for level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        count = dist.get(level, 0)
        pct = count / len(output_df) * 100
        print(f"    {level:>10} : {count:>6}  ({pct:5.1f}%)")

    print(f"\n{'='*70}")
    print("  INFERENCE COMPLETE")
    print(f"{'='*70}")


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    main()
