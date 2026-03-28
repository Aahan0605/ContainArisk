"""
prompt_template.py
------------------
Extracts structured intelligence signals from a container record + risk data
and builds the context dict used by the explanation service.
"""
import math


# High-risk origin countries for signal enrichment
_HIGH_RISK_ORIGINS = {
    "Syria", "Iran", "North Korea", "Myanmar", "Libya",
    "Yemen", "Afghanistan", "Somalia", "Iraq", "Sudan",
}

# Sanction-listed shipping keywords
_FLAGGED_SHIPPING_LINES = {"LINE_SANCTIONED", "UNKNOWN_CARRIER"}


def extract_signals(container: dict, risk_score: float, risk_level: str,
                    indicators: list[dict] | None = None) -> dict:
    """
    Extract all relevant intelligence signals from a container record.

    Parameters
    ----------
    container   : raw container dict (from Supabase / API)
    risk_score  : ML or rule-based score (0-100)
    risk_level  : 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    indicators  : list of triggered risk indicators from report_service

    Returns
    -------
    dict of signal values used by ai_explanation_service to build explanation
    """
    def _f(v, default=0.0):
        try:
            return float(v or default)
        except (ValueError, TypeError):
            return default

    def _s(v, default=""):
        return str(v or default).strip()

    declared_w = _f(container.get("declared_weight") or container.get("Declared_Weight"))
    measured_w = _f(container.get("measured_weight") or container.get("Measured_Weight"))
    declared_v = _f(container.get("declared_value") or container.get("Declared_Value"))
    dwell      = _f(container.get("dwell_time_hours") or container.get("Dwell_Time_Hours"))
    origin     = _s(container.get("origin_country") or container.get("Origin_Country"))
    dest       = _s(container.get("destination_country") or container.get("Destination_Country"))
    clearance  = _s(container.get("clearance_status") or container.get("Clearance_Status"))
    shipping   = _s(container.get("shipping_line") or container.get("Shipping_Line"))
    hs_code    = _s(container.get("hs_code") or container.get("HS_Code"))
    importer   = _s(container.get("importer_id") or container.get("Importer_ID"))
    exporter   = _s(container.get("exporter_id") or container.get("Exporter_ID"))
    container_id = _s(container.get("container_id") or container.get("Container_ID"))

    # Computed metrics
    weight_deviation_pct = 0.0
    if declared_w > 0 and measured_w > 0:
        weight_deviation_pct = abs(measured_w - declared_w) / declared_w * 100

    value_weight_ratio = 0.0
    if declared_w > 0 and declared_v > 0:
        value_weight_ratio = declared_v / declared_w

    is_high_risk_origin = origin in _HIGH_RISK_ORIGINS
    is_flagged_clearance = clearance.lower() in ("hold", "rejected", "flagged", "review", "pending")
    is_extended_dwell = dwell > 72
    is_night_shipment = False  # could be extended with declaration time data
    is_flagged_line = any(k in shipping.upper() for k in _FLAGGED_SHIPPING_LINES)

    # Anomaly severity from indicators list
    triggered = indicators or []
    critical_count = sum(1 for i in triggered if i.get("severity") == "CRITICAL")
    high_count = sum(1 for i in triggered if i.get("severity") == "HIGH")
    medium_count = sum(1 for i in triggered if i.get("severity") == "MEDIUM")

    return {
        "container_id":          container_id,
        "risk_score":            round(risk_score, 1),
        "risk_level":            risk_level,
        "declared_weight":       declared_w,
        "measured_weight":       measured_w,
        "declared_value":        declared_v,
        "weight_deviation_pct":  round(weight_deviation_pct, 2),
        "value_weight_ratio":    round(value_weight_ratio, 4),
        "dwell_hours":           dwell,
        "origin_country":        origin,
        "destination_country":   dest,
        "clearance_status":      clearance,
        "shipping_line":         shipping,
        "hs_code":               hs_code,
        "importer_id":           importer,
        "exporter_id":           exporter,
        "is_high_risk_origin":   is_high_risk_origin,
        "is_flagged_clearance":  is_flagged_clearance,
        "is_extended_dwell":     is_extended_dwell,
        "is_night_shipment":     is_night_shipment,
        "is_flagged_line":       is_flagged_line,
        "triggered_indicators":  triggered,
        "critical_count":        critical_count,
        "high_count":            high_count,
        "medium_count":          medium_count,
    }
