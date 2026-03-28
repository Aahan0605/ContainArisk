"""
report_service.py
-----------------
Analyses a container record against feature engineering thresholds to
identify which risk indicators were triggered and their severity.
"""

import sys
from pathlib import Path
import pandas as pd
import logging

logger = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

_ML_DIR = _PROJECT_ROOT / "ml" / "preprocessing"
if str(_ML_DIR) not in sys.path:
    sys.path.insert(0, str(_ML_DIR))


def analyze_risk_indicators(
    container_record: dict, stats: dict | None = None
) -> list[dict]:
    """
    Analyse a container record and return human-readable risk indicators.

    Each indicator is a dict with:
      - indicator: str  (name)
      - description: str  (human-readable explanation)
      - severity: str  ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
      - value: float | str  (actual value)
    """
    indicators = []

    # --- Weight Analysis ---
    declared_w = float(container_record.get("Declared_Weight") or 0)
    measured_w = float(
        container_record.get("Measured_Weight") or container_record.get("weight") or 0
    )

    if declared_w > 0 and measured_w > 0:
        weight_diff = abs(measured_w - declared_w)
        weight_pct = (weight_diff / declared_w) * 100
        if weight_pct > 15:
            indicators.append(
                {
                    "indicator": "Weight Deviation",
                    "description": f"Weight deviation of {weight_pct:.1f}% between declared ({declared_w:,.0f} kg) and measured ({measured_w:,.0f} kg)",
                    "severity": "CRITICAL" if weight_pct > 30 else "HIGH",
                    "value": round(weight_pct, 1),
                }
            )
        elif weight_pct > 5:
            indicators.append(
                {
                    "indicator": "Weight Deviation",
                    "description": f"Minor weight deviation of {weight_pct:.1f}% detected",
                    "severity": "MEDIUM",
                    "value": round(weight_pct, 1),
                }
            )

    # --- Value/Weight Ratio ---
    declared_v = float(
        container_record.get("Declared_Value")
        or container_record.get("declared_value")
        or 0
    )
    if declared_w > 0 and declared_v > 0:
        vw_ratio = declared_v / declared_w
        if vw_ratio > 50:
            indicators.append(
                {
                    "indicator": "Value-Weight Ratio",
                    "description": f"Unusually high value-to-weight ratio of ${vw_ratio:.2f}/kg",
                    "severity": "HIGH",
                    "value": round(vw_ratio, 2),
                }
            )
        elif vw_ratio < 0.5:
            indicators.append(
                {
                    "indicator": "Value-Weight Ratio",
                    "description": f"Suspiciously low value-to-weight ratio of ${vw_ratio:.2f}/kg",
                    "severity": "HIGH",
                    "value": round(vw_ratio, 2),
                }
            )

    # --- Dwell Time Analysis ---
    dwell = float(
        container_record.get("Dwell_Time_Hours")
        or container_record.get("dwell_time_hours")
        or 0
    )
    if dwell > 72:
        indicators.append(
            {
                "indicator": "Extended Dwell Time",
                "description": f"Container has been dwelling for {dwell:.0f} hours (>{72}h threshold)",
                "severity": "HIGH" if dwell > 120 else "MEDIUM",
                "value": dwell,
            }
        )

    # --- Night Shipment Pattern ---
    decl_time = container_record.get("Declaration_Time") or ""
    if decl_time:
        try:
            hour = int(str(decl_time).split(":")[0])
            if hour < 6 or hour > 22:
                indicators.append(
                    {
                        "indicator": "Night Shipment",
                        "description": f"Declaration submitted at {decl_time} (outside normal business hours)",
                        "severity": "MEDIUM",
                        "value": decl_time,
                    }
                )
        except (ValueError, IndexError):
            pass

    # --- High-Risk Origin ---
    high_risk_origins = {
        "Syria",
        "Iran",
        "North Korea",
        "Myanmar",
        "Libya",
        "Yemen",
        "Afghanistan",
        "Somalia",
    }
    origin = (
        container_record.get("Origin_Country") or container_record.get("origin") or ""
    )
    if origin in high_risk_origins:
        indicators.append(
            {
                "indicator": "High-Risk Origin",
                "description": f"Shipment originates from high-risk country: {origin}",
                "severity": "CRITICAL",
                "value": origin,
            }
        )

    # --- Clearance Status ---
    clearance = (
        container_record.get("Clearance_Status")
        or container_record.get("clearance_status")
        or ""
    )
    if clearance.lower() in ("hold", "rejected", "flagged", "review"):
        indicators.append(
            {
                "indicator": "Clearance Flag",
                "description": f"Container clearance status is '{clearance}'",
                "severity": "HIGH",
                "value": clearance,
            }
        )

    # --- Fallback to default low-risk indicator ---
    # We will do this later if no indicators were triggered including ML features

    # ------------------------------------------------------------------ #
    # Integration of ML Advanced Features
    # ------------------------------------------------------------------ #
    try:
        from services.risk_engine import _prepare_features
        import pandas as pd

        # Ensure we construct the minimal required dict for ML feature extraction
        ml_row = dict(container_record)

        # Mapping API keys to CSV keys needed by the engine
        mapping = {
            "declaration_date": "Declaration_Date",
            "declaration_time": "Declaration_Time",
            "trade_regime": "Trade_Regime",
            "origin_country": "Origin_Country",
            "destination_country": "Destination_Country",
            "destination_port": "Destination_Port",
            "hs_code": "HS_Code",
            "importer_id": "Importer_ID",
            "exporter_id": "Exporter_ID",
            "declared_value": "Declared_Value",
            "declared_weight": "Declared_Weight",
            "measured_weight": "Measured_Weight",
            "shipping_line": "Shipping_Line",
            "dwell_time_hours": "Dwell_Time_Hours",
            "clearance_status": "Clearance_Status",
        }

        for k, v in mapping.items():
            if k in container_record and v not in ml_row:
                ml_row[v] = container_record[k]

        # Fill default required values
        for key in [
            "Declared_Value",
            "Declared_Weight",
            "Measured_Weight",
            "Dwell_Time_Hours",
        ]:
            if ml_row.get(key) is None:
                ml_row[key] = 0.0
            else:
                try:
                    ml_row[key] = float(ml_row[key])
                except:
                    ml_row[key] = 0.0

        for key in [
            "Origin_Country",
            "Destination_Country",
            "Destination_Port",
            "Importer_ID",
            "Exporter_ID",
            "Shipping_Line",
            "Clearance_Status",
        ]:
            if ml_row.get(key) is None:
                ml_row[key] = "Unknown"

        try:
            ml_row["HS_Code"] = int(ml_row.get("HS_Code", 0))
        except:
            ml_row["HS_Code"] = 0

        if "Declaration_Date" not in ml_row or not ml_row["Declaration_Date"]:
            ml_row["Declaration_Date"] = "2020-01-01T00:00:00"
        if "Declaration_Time" not in ml_row or not ml_row["Declaration_Time"]:
            ml_row["Declaration_Time"] = "12:00:00"

        df = pd.DataFrame([ml_row])
        features = _prepare_features(df).iloc[0]

        # Check specific ML thresholds
        route_risk = features.get("route_risk_rate", 0.0)
        if route_risk > 0.4:
            indicators.append(
                {
                    "indicator": "High-Risk Trade Route",
                    "description": f"Trade Route risk rate is exceptionally high ({route_risk * 100:.1f}%) based on historical anomalies.",
                    "severity": "CRITICAL" if route_risk > 0.6 else "HIGH",
                    "value": round(route_risk, 2),
                }
            )

        network_risk = features.get("network_risk_propagation", 0.0)
        if network_risk > 0.3:
            indicators.append(
                {
                    "indicator": "Network Risk Propagation",
                    "description": f"Shipment involves entities and ports with known associated rippling risks in the network (Score: {network_risk:.2f}).",
                    "severity": "CRITICAL" if network_risk > 0.6 else "HIGH",
                    "value": round(network_risk, 2),
                }
            )

        behavior_shift = features.get("importer_behavior_shift_score", 0.0)
        if behavior_shift > 1.5:
            indicators.append(
                {
                    "indicator": "Behavioral Anomaly",
                    "description": f"Importer is demonstrating a significant deviation from typical baseline behavior patterns (Shift Score: {behavior_shift:.2f}).",
                    "severity": "HIGH",
                    "value": round(behavior_shift, 2),
                }
            )

        commodity_risk = features.get("hs_code_risk_score", 0.0)
        if commodity_risk > 0.3:
            indicators.append(
                {
                    "indicator": "Commodity Risk Profile",
                    "description": f"The declared HS Code has a high historic probability of related anomalies (Risk Score: {commodity_risk:.2f}).",
                    "severity": "HIGH",
                    "value": round(commodity_risk, 2),
                }
            )

    except Exception as e:
        logger.error(f"Failed to append ML risk indicators: {e}")

    # If nothing was triggered, add a default low-risk indicator
    if not indicators:
        indicators.append(
            {
                "indicator": "Normal Profile",
                "description": "No significant risk indicators triggered for this container",
                "severity": "LOW",
                "value": "OK",
            }
        )

    return indicators


def get_recommendation(risk_score: float) -> dict:
    """Return an operational recommendation based on the risk score (0-100)."""
    if risk_score >= 85:
        return {
            "action": "MANDATORY_INSPECT",
            "description": "Mandatory physical inspection required. Container exhibits critical risk indicators and must be inspected before clearance.",
            "priority": "CRITICAL",
        }
    elif risk_score >= 70:
        return {
            "action": "ENFORCE_INSPECT",
            "description": "Enforcement inspection required. Container shows multiple high-risk indicators that must be verified.",
            "priority": "URGENT",
        }
    elif risk_score >= 40:
        return {
            "action": "MONITOR",
            "description": "Enhanced monitoring recommended. Review documentation and track shipment chain.",
            "priority": "HIGH",
        }
    else:
        return {
            "action": "CLEAR",
            "description": "Container meets normal risk profile. Clearance is appropriate.",
            "priority": "NORMAL",
        }
