"""
explanation_controller.py
--------------------------
FastAPI route handler for the AI explanation endpoint.
Integrates with existing report_service and risk data without modifying
any ML pipeline code.
"""
from __future__ import annotations
import logging
import sys
from pathlib import Path

logger = logging.getLogger(__name__)


async def get_ai_explanation(container_id: str, supabase, risk_engine_fn=None):
    """
    Generate an AI investigation explanation for a given container.

    Steps
    -----
    1. Fetch container data from Supabase
    2. Fetch or compute risk score
    3. Extract intelligence signals via prompt_template
    4. Generate explanation via ai_explanation_service
    5. Return structured response

    Parameters
    ----------
    container_id    : the container to explain
    supabase        : Supabase Client instance (injected by main.py)
    risk_engine_fn  : optional predict_risk function (injected by main.py)
    """
    from ai_explanations.prompt_template import extract_signals
    from ai_explanations.ai_explanation_service import generate_explanation

    # ------------------------------------------------------------------ #
    # 1. Fetch container from Supabase
    # ------------------------------------------------------------------ #
    container = {}
    try:
        resp = supabase.table("containers").select("*").eq("container_id", container_id).execute()
        if resp.data:
            container = resp.data[0]
    except Exception as e:
        logger.warning(f"Could not fetch container {container_id}: {e}")

    if not container:
        # Try uppercase variant (legacy rows)
        try:
            resp = supabase.table("containers").select("*").eq("Container_ID", container_id).execute()
            if resp.data:
                container = resp.data[0]
        except Exception:
            pass

    # ------------------------------------------------------------------ #
    # 2. Fetch risk score from risk_assessment table; fall back to rules
    # ------------------------------------------------------------------ #
    risk_score = 0.0
    risk_level = "LOW"

    try:
        ra = supabase.table("risk_assessment").select("risk_score,risk_level").eq("container_id", container_id).execute()
        if ra.data:
            risk_score = float(ra.data[0].get("risk_score") or 0)
            risk_level = str(ra.data[0].get("risk_level") or "LOW").upper()
    except Exception as e:
        logger.warning(f"risk_assessment lookup failed for {container_id}: {e}")

    # Fall back: compute inline risk if not in DB
    if risk_score == 0.0 and container:
        try:
            from main import _compute_inline_risk
            risk_score, risk_level = _compute_inline_risk(container)
        except Exception:
            pass

    # Fall back: use ML engine if available
    if risk_score == 0.0 and container and risk_engine_fn:
        try:
            result = risk_engine_fn({
                "Declared_Weight": container.get("declared_weight"),
                "Measured_Weight": container.get("measured_weight"),
                "Declared_Value":  container.get("declared_value"),
                "Origin_Country":  container.get("origin_country"),
                "Destination_Country": container.get("destination_country"),
                "HS_Code":         container.get("hs_code"),
                "Dwell_Time_Hours": container.get("dwell_time_hours"),
                "Clearance_Status": container.get("clearance_status"),
                "Importer_ID":     container.get("importer_id"),
                "Exporter_ID":     container.get("exporter_id"),
            })
            risk_score = float(result.get("Risk_Score", 0))
            risk_level = str(result.get("Risk_Level", "LOW")).upper()
        except Exception as e:
            logger.warning(f"ML risk fallback failed for {container_id}: {e}")

    # ------------------------------------------------------------------ #
    # 3. Fetch triggered risk indicators from report_service
    # ------------------------------------------------------------------ #
    indicators = []
    try:
        from services.report_service import analyze_risk_indicators
        # Build display record compatible with report_service key format
        display_record = {
            "Declared_Weight":    container.get("declared_weight"),
            "Measured_Weight":    container.get("measured_weight"),
            "Declared_Value":     container.get("declared_value"),
            "Dwell_Time_Hours":   container.get("dwell_time_hours"),
            "Clearance_Status":   container.get("clearance_status"),
            "Origin_Country":     container.get("origin_country"),
            "Destination_Country": container.get("destination_country"),
        }
        indicators = analyze_risk_indicators(display_record)
    except Exception as e:
        logger.warning(f"analyze_risk_indicators failed for {container_id}: {e}")

    # ------------------------------------------------------------------ #
    # 4. Extract signals
    # ------------------------------------------------------------------ #
    signals = extract_signals(
        container=container,
        risk_score=risk_score,
        risk_level=risk_level,
        indicators=indicators,
    )

    # ------------------------------------------------------------------ #
    # 5. Generate explanation
    # ------------------------------------------------------------------ #
    explanation = generate_explanation(signals)

    return {
        "container_id":     container_id,
        "risk_score":       risk_score,
        "risk_level":       risk_level,
        "explanation":      explanation,
        "signals_summary":  {
            "weight_deviation_pct": signals["weight_deviation_pct"],
            "value_weight_ratio":   signals["value_weight_ratio"],
            "dwell_hours":          signals["dwell_hours"],
            "origin_country":       signals["origin_country"],
            "clearance_status":     signals["clearance_status"],
            "triggered_count":      len([i for i in indicators if i.get("severity") != "LOW"]),
        }
    }
