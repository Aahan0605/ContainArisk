"""
ai_explanation_service.py
--------------------------
Generates a professional customs intelligence investigation explanation
from structured container risk signals.

Design: Template-driven NLG (no external LLM API required).
The explanation reads like a human customs officer wrote it.
"""
from __future__ import annotations
import textwrap
from datetime import datetime


# ---------------------------------------------------------------------------
# Risk level header map
# ---------------------------------------------------------------------------
_LEVEL_VERB = {
    "CRITICAL": "CRITICALLY FLAGGED",
    "HIGH":     "FLAGGED AS HIGH RISK",
    "MEDIUM":   "FLAGGED FOR MONITORING",
    "LOW":      "ASSESSED AS LOW RISK",
}

_LEVEL_URGENCY = {
    "CRITICAL": "Immediate physical inspection is required.",
    "HIGH":     "Enhanced examination and documentation review are recommended.",
    "MEDIUM":   "Continued monitoring and documentation verification are advised.",
    "LOW":      "Standard automated clearance protocols apply.",
}

_LEVEL_CONCLUSION = {
    "CRITICAL": (
        "The combination of these critical indicators strongly suggests the possibility of "
        "cargo misdeclaration, smuggling, or fraudulent trade activity. Immediate intervention "
        "by customs enforcement is recommended."
    ),
    "HIGH": (
        "The cumulative weight of these indicators elevates the probability of cargo "
        "misdeclaration or trade fraud. A comprehensive physical inspection and documentation "
        "audit is advised before clearance is granted."
    ),
    "MEDIUM": (
        "While no single indicator is conclusive, the combination of signals warrants "
        "enhanced scrutiny. Verification of supporting trade documents is recommended "
        "before clearance is approved."
    ),
    "LOW": (
        "No significant risk indicators were identified for this shipment. "
        "The container meets standard risk profile criteria and may proceed through "
        "automated clearance channels."
    ),
}


def _build_weight_paragraph(signals: dict) -> str | None:
    pct = signals["weight_deviation_pct"]
    dw  = signals["declared_weight"]
    mw  = signals["measured_weight"]
    if pct <= 0:
        return None
    severity = "critical" if pct > 30 else ("significant" if pct > 15 else "minor")
    return (
        f"A {severity} discrepancy of {pct:.1f}% was detected between the declared cargo weight "
        f"({dw:,.1f} kg) and the physically measured weight ({mw:,.1f} kg). "
        f"Weight deviations of this magnitude are a primary indicator of potential "
        f"cargo misdeclaration or undisclosed freight."
    )


def _build_value_paragraph(signals: dict) -> str | None:
    vw = signals["value_weight_ratio"]
    dv = signals["declared_value"]
    dw = signals["declared_weight"]
    if dv <= 0 or dw <= 0:
        return None
    if vw > 200:
        return (
            f"The declared commodity value of ${dv:,.2f} against a cargo weight of {dw:,.1f} kg "
            f"produces an unusually high value-to-weight ratio of ${vw:,.2f}/kg. "
            f"This ratio is inconsistent with typical commodity benchmarks for the declared "
            f"HS code ({signals['hs_code'] or 'unspecified'}) and may indicate over-valuation "
            f"or misclassification of goods."
        )
    if vw < 0.5 and dv > 0:
        return (
            f"The declared value of ${dv:,.2f} for {dw:,.1f} kg of cargo translates to a "
            f"suspiciously low value-to-weight ratio of ${vw:.4f}/kg. "
            f"Under-valuation of this degree may indicate deliberate under-invoicing "
            f"to evade customs duties or trade restrictions."
        )
    return None


def _build_dwell_paragraph(signals: dict) -> str | None:
    dwell = signals["dwell_hours"]
    if not signals["is_extended_dwell"]:
        return None
    severity = "critically extended" if dwell > 168 else ("significantly extended" if dwell > 120 else "extended")
    return (
        f"This container has remained at the port facility for {dwell:.0f} hours, "
        f"which is {severity} beyond the standard 72-hour clearance window. "
        f"Prolonged dwell times frequently indicate documentation irregularities, "
        f"ownership disputes, or deliberate concealment strategies."
    )


def _build_clearance_paragraph(signals: dict) -> str | None:
    if not signals["is_flagged_clearance"]:
        return None
    status = signals["clearance_status"]
    return (
        f"The container's current clearance status is recorded as '{status.upper()}'. "
        f"This status reflects that the shipment has already been identified as requiring "
        f"further review by customs processing systems, and confirms the elevated risk profile."
    )


def _build_origin_paragraph(signals: dict) -> str | None:
    if not signals["is_high_risk_origin"]:
        return None
    origin = signals["origin_country"]
    dest   = signals["destination_country"]
    return (
        f"The shipment originates from {origin}, a country currently subject to elevated "
        f"customs scrutiny due to known patterns of trade-based money laundering, "
        f"sanctioned goods trafficking, or dual-use commodity export. "
        f"The declared trade route from {origin} to {dest} warrants additional verification "
        f"of end-user documentation and export licensing."
    )


def _build_entity_paragraph(signals: dict) -> str | None:
    importer = signals["importer_id"]
    exporter = signals["exporter_id"]
    if not importer and not exporter:
        return None
    parties = []
    if importer:
        parties.append(f"importer '{importer}'")
    if exporter:
        parties.append(f"exporter '{exporter}'")
    entity_str = " and ".join(parties)
    risk = signals["risk_level"]
    if risk in ("HIGH", "CRITICAL"):
        return (
            f"The {entity_str} associated with this shipment should be cross-referenced "
            f"against the trade entity risk registry. Historical shipment patterns from "
            f"flagged entities can significantly amplify the overall risk assessment."
        )
    return None


def _build_indicator_summary(signals: dict) -> str | None:
    critical = signals["critical_count"]
    high     = signals["high_count"]
    medium   = signals["medium_count"]
    total    = critical + high + medium
    if total == 0:
        return None
    parts = []
    if critical:
        parts.append(f"{critical} CRITICAL")
    if high:
        parts.append(f"{high} HIGH")
    if medium:
        parts.append(f"{medium} MEDIUM")
    severity_str = ", ".join(parts)
    return (
        f"In total, the automated risk engine identified {total} triggered indicator(s) "
        f"for this container ({severity_str} severity). "
        f"These indicators were evaluated collectively using machine learning pattern "
        f"analysis trained on historical customs inspection data."
    )


def generate_explanation(signals: dict) -> dict:
    """
    Generate a full investigation explanation from extracted signals.

    Returns
    -------
    dict with:
      - full_explanation  : complete multi-paragraph text
      - short_summary     : 2-sentence summary for email body
      - recommendation    : action to take
      - generated_at      : ISO timestamp
      - risk_level        : echoed from signals
      - risk_score        : echoed from signals
    """
    cid   = signals["container_id"]
    level = signals["risk_level"].upper()
    score = signals["risk_score"]

    level_verb = _LEVEL_VERB.get(level, "ASSESSED")
    urgency    = _LEVEL_URGENCY.get(level, "")
    conclusion = _LEVEL_CONCLUSION.get(level, "")

    # --- Header ---
    paragraphs = [
        f"Container {cid} has been {level_verb} with a risk score of {score:.1f}/100.",
        urgency,
    ]

    # --- Evidence paragraphs (only include triggered ones) ---
    evidence = []
    weight_p   = _build_weight_paragraph(signals)
    value_p    = _build_value_paragraph(signals)
    dwell_p    = _build_dwell_paragraph(signals)
    clearance_p = _build_clearance_paragraph(signals)
    origin_p   = _build_origin_paragraph(signals)
    entity_p   = _build_entity_paragraph(signals)
    indicator_p = _build_indicator_summary(signals)

    for p in [weight_p, value_p, dwell_p, clearance_p, origin_p, entity_p, indicator_p]:
        if p:
            evidence.append(p)

    if not evidence:
        evidence.append(
            f"No specific anomalies were identified in the automated analysis. "
            f"The shipment profile is consistent with normal trade patterns for "
            f"this commodity type and trade corridor."
        )

    paragraphs.extend(evidence)
    paragraphs.append(conclusion)

    full_text = "\n\n".join(paragraphs)

    # --- Short summary for email ---
    short = (
        f"Container {cid} received a risk score of {score:.1f}/100 and was {level_verb.lower()}. "
        f"{urgency}"
    )

    # --- Action ---
    if level == "CRITICAL":
        action = "IMMEDIATE INSPECTION"
    elif level == "HIGH":
        action = "PHYSICAL INSPECTION"
    elif level == "MEDIUM":
        action = "ENHANCED MONITORING"
    else:
        action = "AUTO_CLEAR"

    return {
        "container_id":    cid,
        "risk_score":      score,
        "risk_level":      level,
        "full_explanation": full_text,
        "short_summary":   short,
        "recommendation":  action,
        "paragraph_count": len(paragraphs),
        "signals_used":    list(signals.keys()),
        "generated_at":    datetime.utcnow().isoformat() + "Z",
    }
