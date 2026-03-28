"""
ML Prediction Service
---------------------
Thin service layer that accepts shipment data, applies feature engineering
via the risk_engine module, runs the trained ML model, and returns a
structured prediction result.

Output format:
    {
        "prediction": "anomaly" | "normal",
        "risk_score": float  (0-100)
    }
"""

import logging
from typing import List

logger = logging.getLogger(__name__)

# Import the core ML functions from the risk_engine in the app package
from app.risk_engine import predict_risk, predict_risk_batch, load_model


def startup_load_model():
    """Load the ML model and feature stats once at application startup."""
    try:
        load_model()
        logger.info("ML model loaded via ml_service at startup.")
    except FileNotFoundError as e:
        logger.warning(f"ML model not available: {e}")
    except Exception as e:
        logger.warning(f"Failed to load ML model: {e}")


def predict_single(shipment_data: dict) -> dict:
    """
    Run anomaly detection on a single shipment record.

    Parameters
    ----------
    shipment_data : dict
        Raw shipment fields (Container_ID, Declaration_Date, etc.)

    Returns
    -------
    dict with keys:
        - prediction: "anomaly" or "normal"
        - risk_score: float (0-100)
    """
    result = predict_risk(shipment_data)
    risk_score = result["Risk_Score"]
    prediction = "anomaly" if risk_score >= 50 else "normal"

    return {
        "prediction": prediction,
        "risk_score": risk_score,
    }


def predict_batch(shipments: List[dict]) -> List[dict]:
    """
    Run anomaly detection on multiple shipment records.

    Parameters
    ----------
    shipments : list of dict
        Each dict contains raw shipment fields.

    Returns
    -------
    list of dict, each with:
        - prediction: "anomaly" or "normal"
        - risk_score: float (0-100)
    """
    risk_results = predict_risk_batch(shipments)

    results = []
    for risk in risk_results:
        risk_score = risk["Risk_Score"]
        prediction = "anomaly" if risk_score >= 50 else "normal"
        results.append({
            "prediction": prediction,
            "risk_score": risk_score,
        })

    return results
