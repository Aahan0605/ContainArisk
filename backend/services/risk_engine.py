"""
risk_engine.py
--------------
Loads the trained RandomForest ML model and the feature engineering pipeline
from the ml/ directory. Exposes predict_risk() and predict_risk_batch()
functions that apply the same feature engineering used during training.
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# project root: backend/app/risk_engine.py -> ../../ = project root
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Add the ml/preprocessing/ directory to sys.path so we can import feature_engineering
_ML_DIR = _PROJECT_ROOT / "ml" / "preprocessing"
if str(_ML_DIR) not in sys.path:
    sys.path.insert(0, str(_ML_DIR))

from feature_engineering import (
    engineer_features,
    load_stats,
    FEATURE_COLUMNS,
    DERIVED_FEATURE_COLUMNS,
    TARGET_COLUMN,
)

_MODEL_PATH = _PROJECT_ROOT / "ml" / "models" / "anomaly_detection_model.pkl"
_STATS_PATH = _PROJECT_ROOT / "ml" / "models" / "feature_stats.pkl"

# Lazy-loaded singletons
_model = None
_stats = None


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------

def load_model():
    """Load the trained model and feature stats at startup."""
    global _model, _stats
    if not _MODEL_PATH.exists():
        raise FileNotFoundError(
            f"ML model not found at {_MODEL_PATH}. "
            "Please run 'python ml/train_model.py' first to train and save the model."
        )
    if not _STATS_PATH.exists():
        raise FileNotFoundError(
            f"Feature stats not found at {_STATS_PATH}. "
            "Please run 'python ml/train_model.py' first."
        )
    _model = joblib.load(_MODEL_PATH)
    _stats = load_stats(_STATS_PATH)
    logger.info("ML model and feature stats loaded successfully.")
    return _model, _stats


def _get_model():
    global _model
    if _model is None:
        load_model()
    return _model


def _get_stats():
    global _stats
    if _stats is None:
        load_model()
    return _stats


# ---------------------------------------------------------------------------
# Risk level classification
# ---------------------------------------------------------------------------

def _score_to_level(score_0_100: float) -> str:
    """Convert a 0-100 risk score to a human-readable risk level."""
    if score_0_100 >= 70:
        return "Critical"
    elif score_0_100 >= 40:
        return "High"
    elif score_0_100 >= 20:
        return "Medium"
    else:
        return "Low"


# ---------------------------------------------------------------------------
# Internal feature engineering helper
# ---------------------------------------------------------------------------

def _prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply feature engineering in inference mode and return the feature matrix
    ready for model prediction.
    """
    stats = _get_stats()

    # The feature engineering expects raw 16-column CSV data.
    # Apply feature engineering in inference mode (fit_mode=False)
    df_feat, _ = engineer_features(df, stats=stats, fit_mode=False)

    # Get all feature columns except the target
    feature_cols = [c for c in df_feat.columns if c != TARGET_COLUMN]
    X = df_feat[feature_cols]

    return X


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_risk(row: dict) -> dict:
    """
    Run ML inference on a single container record.

    Parameters
    ----------
    row : dict
        Must contain the 16 raw CSV columns (Container_ID, Declaration_Date,
        Declaration_Time, Trade_Regime, Origin_Country, etc.)

    Returns
    -------
    dict with keys 'Risk_Score' (float, 0-100) and 'Risk_Level' (str)
    """
    model = _get_model()

    # Normalise column names that may differ between API and CSV format
    row = dict(row)
    if "Declaration_Date" in row and "Declaration_Date (YYYY-MM-DD)" not in row:
        row["Declaration_Date (YYYY-MM-DD)"] = row["Declaration_Date"]
    if "Trade_Regime" in row and "Trade_Regime (Import / Export / Transit)" not in row:
        row["Trade_Regime (Import / Export / Transit)"] = row["Trade_Regime"]

    # Ensure numeric fields have defaults
    for key in ["Declared_Value", "Declared_Weight", "Measured_Weight", "Dwell_Time_Hours"]:
        if key not in row or row[key] is None:
            row[key] = 0.0
        else:
            try:
                row[key] = float(row[key])
            except (ValueError, TypeError):
                row[key] = 0.0

    # Ensure string fields have defaults
    for key in ["Origin_Country", "Destination_Country", "Destination_Port",
                 "Importer_ID", "Exporter_ID", "Shipping_Line", "Clearance_Status"]:
        if key not in row or row[key] is None:
            row[key] = "Unknown"

    if "HS_Code" not in row or row["HS_Code"] is None:
        row["HS_Code"] = 0
    if "Declaration_Time" not in row or row["Declaration_Time"] is None:
        row["Declaration_Time"] = "12:00:00"
    if "Clearance_Status" not in row or row["Clearance_Status"] is None:
        row["Clearance_Status"] = "Clear"

    df = pd.DataFrame([row])
    X = _prepare_features(df)

    # Get prediction probability
    proba = model.predict_proba(X)[:, 1]
    risk_score = float(proba[0]) * 100  # 0-100

    return {
        "Risk_Score": round(risk_score, 2),
        "Risk_Level": _score_to_level(risk_score),
    }


def predict_risk_batch(rows: list[dict]) -> list[dict]:
    """
    Run ML inference on a list of container records efficiently (batch mode).

    Returns a list of dicts, each with 'Risk_Score' and 'Risk_Level'.
    """
    if not rows:
        return []

    model = _get_model()

    # Normalise column names and set defaults
    normalised = []
    for r in rows:
        r2 = dict(r)
        if "Declaration_Date" in r2 and "Declaration_Date (YYYY-MM-DD)" not in r2:
            r2["Declaration_Date (YYYY-MM-DD)"] = r2["Declaration_Date"]
        if "Trade_Regime" in r2 and "Trade_Regime (Import / Export / Transit)" not in r2:
            r2["Trade_Regime (Import / Export / Transit)"] = r2["Trade_Regime"]

        for key in ["Declared_Value", "Declared_Weight", "Measured_Weight", "Dwell_Time_Hours"]:
            if key not in r2 or r2[key] is None:
                r2[key] = 0.0
            else:
                try:
                    r2[key] = float(r2[key])
                except (ValueError, TypeError):
                    r2[key] = 0.0

        for key in ["Origin_Country", "Destination_Country", "Destination_Port",
                     "Importer_ID", "Exporter_ID", "Shipping_Line"]:
            if key not in r2 or r2[key] is None:
                r2[key] = "Unknown"

        if "HS_Code" not in r2 or r2["HS_Code"] is None:
            r2["HS_Code"] = 0
        if "Declaration_Time" not in r2 or r2["Declaration_Time"] is None:
            r2["Declaration_Time"] = "12:00:00"
        if "Clearance_Status" not in r2 or r2["Clearance_Status"] is None:
            r2["Clearance_Status"] = "Clear"

        normalised.append(r2)

    df = pd.DataFrame(normalised)
    X = _prepare_features(df)

    # Get prediction probabilities
    proba = model.predict_proba(X)[:, 1]
    scores = (proba * 100).round(2)

    return [
        {"Risk_Score": float(s), "Risk_Level": _score_to_level(float(s))}
        for s in scores
    ]
