"""
pdf_service.py
--------------
Generates investigation report PDFs for container risk assessments
using reportlab.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import logging

logger = logging.getLogger(__name__)


def generate_report_pdf(
    container: dict,
    risk_indicators: list[dict],
    recommendation: dict,
    ai_explanation: str | None = None,
) -> bytes:
    """
    Generate a PDF investigation report and return raw bytes.

    Sections:
      1. Container Overview
      2. Risk Assessment
      3. Triggered Risk Indicators
      4. Feature Analysis
      5. Operational Recommendation
      6. AI Investigation Analysis  (optional — only added when ai_explanation provided)
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=1.5 * cm, bottomMargin=1.5 * cm,
                            leftMargin=2 * cm, rightMargin=2 * cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("ReportTitle", parent=styles["Title"],
                                  fontSize=20, textColor=colors.HexColor("#1B2A4A"),
                                  spaceAfter=6)
    heading_style = ParagraphStyle("SectionHeading", parent=styles["Heading2"],
                                    fontSize=14, textColor=colors.HexColor("#1B2A4A"),
                                    spaceBefore=14, spaceAfter=8)
    body_style = styles["BodyText"]
    small_style = ParagraphStyle("Small", parent=body_style, fontSize=8,
                                  textColor=colors.grey)

    elements = []

    # --- Header ---
    elements.append(Paragraph("Container Risk Investigation Report", title_style))
    elements.append(Paragraph(
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        small_style))
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB")))
    elements.append(Spacer(1, 0.2 * inch))

    # --- Section 1: Container Overview ---
    elements.append(Paragraph("Section 1 — Container Overview", heading_style))
    overview_data = [
        ["Field", "Value"],
        ["Container ID", str(container.get("container_id", "N/A"))],
        ["Origin Country", str(container.get("origin", "N/A"))],
        ["Destination Country", str(container.get("destination", "N/A"))],
        ["Destination Port", str(container.get("destination_port", "N/A"))],
        ["HS Code", str(container.get("hs_code", "N/A"))],
        ["Importer", str(container.get("importer", "N/A"))],
        ["Exporter", str(container.get("exporter", "N/A"))],
        ["Declared Value", f"${float(container.get('declared_value', 0)):,.2f}"],
        ["Declared Weight", f"{float(container.get('declared_weight', 0)):,.0f} kg"],
        ["Measured Weight", f"{float(container.get('weight', 0)):,.0f} kg"],
        ["Shipping Line", str(container.get("shipping_line", "N/A"))],
        ["Dwell Time", f"{float(container.get('dwell_time_hours', 0)):.0f} hours"],
        ["Clearance Status", str(container.get("clearance_status", "N/A"))],
    ]
    t = Table(overview_data, colWidths=[5 * cm, 11 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B2A4A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.3 * inch))

    # --- Section 2: Risk Assessment ---
    elements.append(Paragraph("Section 2 — Risk Assessment", heading_style))
    risk_score = float(container.get("risk_score", 0)) * 100
    risk_level = container.get("risk_level", "Unknown")
    level_color = (
        colors.red if risk_level in ("Critical", "CRITICAL") else
        colors.orange if risk_level in ("High", "HIGH") else
        colors.HexColor("#F59E0B") if risk_level in ("Medium", "MEDIUM") else
        colors.green
    )
    risk_data = [
        ["Metric", "Value"],
        ["Risk Score", f"{risk_score:.1f} / 100"],
        ["Risk Level", risk_level],
    ]
    t2 = Table(risk_data, colWidths=[5 * cm, 11 * cm])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B2A4A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("TEXTCOLOR", (1, 2), (1, 2), level_color),
        ("FONTNAME", (1, 1), (1, 2), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 0.3 * inch))

    # --- Section 3: Triggered Risk Indicators ---
    elements.append(Paragraph("Section 3 — Triggered Risk Indicators", heading_style))
    indicator_data = [["Indicator", "Severity", "Details"]]
    for ri in risk_indicators:
        indicator_data.append([
            ri.get("indicator", ""),
            ri.get("severity", ""),
            Paragraph(ri.get("description", ""), small_style),
        ])
    t3 = Table(indicator_data, colWidths=[4 * cm, 3 * cm, 9 * cm])
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B2A4A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FEF2F2")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(t3)
    elements.append(Spacer(1, 0.3 * inch))

    # --- Section 4: Feature Analysis ---
    elements.append(Paragraph("Section 4 — Feature Analysis", heading_style))
    for ri in risk_indicators:
        sev = ri.get("severity", "LOW")
        marker = "🔴" if sev in ("CRITICAL", "HIGH") else "🟡" if sev == "MEDIUM" else "🟢"
        elements.append(Paragraph(
            f"{marker} <b>{ri['indicator']}</b>: {ri['description']}",
            body_style))
        elements.append(Spacer(1, 4))
    elements.append(Spacer(1, 0.2 * inch))

    # --- Section 5: Operational Recommendation ---
    elements.append(Paragraph("Section 5 — Operational Recommendation", heading_style))
    rec_color = (
        colors.HexColor("#DC2626") if recommendation["action"] == "INSPECT" else
        colors.HexColor("#F59E0B") if recommendation["action"] == "MONITOR" else
        colors.HexColor("#059669")
    )
    rec_data = [
        ["Recommended Action", "Priority", "Description"],
        [
            recommendation["action"], 
            recommendation["priority"], 
            Paragraph(recommendation["description"], small_style)
        ],
    ]
    t4 = Table(rec_data, colWidths=[4 * cm, 3 * cm, 9 * cm])
    t4.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B2A4A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("TEXTCOLOR", (0, 1), (0, 1), rec_color),
        ("FONTNAME", (0, 1), (0, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(t4)

    # --- Section 6: AI Investigation Analysis (optional) ---
    if ai_explanation:
        elements.append(Paragraph("Section 6 — AI Investigation Analysis", heading_style))
        ai_box_style = ParagraphStyle(
            "AIBox", parent=body_style,
            fontSize=9,
            leading=14,
            backColor=colors.HexColor("#F0F4FF"),
            borderPadding=(8, 8, 8, 8),
            leftIndent=6,
            rightIndent=6,
        )
        elements.append(Spacer(1, 4))
        for paragraph in ai_explanation.split("\n\n"):
            if paragraph.strip():
                elements.append(Paragraph(paragraph.strip(), ai_box_style))
                elements.append(Spacer(1, 6))
        elements.append(Spacer(1, 0.2 * inch))

    # Build PDF
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
