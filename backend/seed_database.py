"""
seed_database.py
Seeds the Supabase containers + risk_assessment tables from local CSV files.
Run: python seed_database.py (from backend/ directory)
"""
import sys, math, traceback
from pathlib import Path
import pandas as pd

_BACKEND = Path(__file__).resolve().parent
_ROOT = _BACKEND.parent
sys.path.insert(0, str(_BACKEND))
sys.path.insert(0, str(_ROOT / "ml" / "preprocessing"))

from database.database import supabase
from services.risk_engine import predict_risk_batch

CSV_FILES = [
    _ROOT / "data" / "datasets" / "hackooo" / "cleaned_realtime_data.csv",
    _ROOT / "data" / "datasets" / "hackooo" / "cleaned_historical_data.csv",
]

# CSV col → Supabase col (all lowercase snake_case)
CSV_TO_DB = {
    "Container_ID":        "container_id",
    "Declaration_Date":    "declaration_date",
    "Trade_Regime":        "trade_regime",
    "Origin_Country":      "origin_country",
    "Destination_Country": "destination_country",
    "Destination_Port":    "destination_port",
    "HS_Code":             "hs_code",
    "Importer_ID":         "importer_id",
    "Exporter_ID":         "exporter_id",
    "Declared_Value":      "declared_value",
    "Declared_Weight":     "declared_weight",
    "Measured_Weight":     "measured_weight",
    "Shipping_Line":       "shipping_line",
    "Dwell_Time_Hours":    "dwell_time_hours",
    "Clearance_Status":    "clearance_status",
}

DEFAULT_DATE = "2024-01-01 00:00:00"
DEFAULT_COUNTRY = "Unknown"

def clean(v):
    if v is None: return None
    try:
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)): return None
    except Exception: pass
    return v

def s(v, default=""):
    return str(clean(v) or default)

def f(v):
    try: return float(v or 0)
    except Exception: return 0.0

def i(v):
    try: return int(float(v or 0))
    except Exception: return 0

def make_explanation(raw):
    parts = []
    dw, mw = f(raw.get("Declared_Weight")), f(raw.get("Measured_Weight"))
    if dw > 0 and mw > 0 and abs(mw - dw) / dw > 0.10:
        parts.append(f"Weight deviation {abs(mw-dw)/dw*100:.0f}%")
    dv = f(raw.get("Declared_Value"))
    if dv > 0 and dw > 0:
        vw = dv / dw
        if vw > 50: parts.append(f"High value/weight ${vw:.0f}/kg")
        elif vw < 0.5: parts.append(f"Low value/weight ${vw:.2f}/kg")
    dwell = f(raw.get("Dwell_Time_Hours"))
    if dwell > 72: parts.append(f"Extended dwell {dwell:.0f}h")
    cs = s(raw.get("Clearance_Status")).lower()
    if cs in ("hold", "rejected", "flagged", "review"):
        parts.append(f"Clearance: {cs.upper()}")
    return " | ".join(parts) if parts else "No significant risk indicators"

def main():
    if not supabase:
        print("ERROR: Supabase not connected.")
        return

    frames = []
    for path in CSV_FILES:
        if path.exists():
            df = pd.read_csv(path)
            frames.append(df)
            print(f"Loaded {path.name}: {len(df)} rows")
    if not frames:
        print("No CSVs found.")
        return

    all_df = pd.concat(frames, ignore_index=True).drop_duplicates(subset=["Container_ID"], keep="first")
    print(f"Total unique: {len(all_df)} containers")

    rows = all_df.to_dict(orient="records")

    print("Running ML risk scoring...")
    try:
        risk_results = predict_risk_batch(rows)
    except Exception as e:
        print(f"ML failed: {e} — using defaults")
        risk_results = [{"Risk_Score": 50.0, "Risk_Level": "MEDIUM"}] * len(rows)

    container_records = []
    risk_records = []

    for raw in rows:
        cid = s(raw.get("Container_ID"))
        if not cid or cid == "nan":
            continue

        # NOT NULL fields get defaults
        decl_date = s(raw.get("Declaration_Date"), DEFAULT_DATE)
        origin = s(raw.get("Origin_Country"), DEFAULT_COUNTRY)
        dest = s(raw.get("Destination_Country"), DEFAULT_COUNTRY)

        if decl_date == "nan" or not decl_date:
            decl_date = DEFAULT_DATE
        if origin == "nan" or not origin:
            origin = DEFAULT_COUNTRY
        if dest == "nan" or not dest:
            dest = DEFAULT_COUNTRY

        container_records.append({
            "container_id":        cid,
            "declaration_date":    decl_date,
            "trade_regime":        s(raw.get("Trade_Regime")) or None,
            "origin_country":      origin,
            "destination_country": dest,
            "destination_port":    s(raw.get("Destination_Port")) or None,
            "hs_code":             s(raw.get("HS_Code")) or None,
            "importer_id":         s(raw.get("Importer_ID")) or None,
            "exporter_id":         s(raw.get("Exporter_ID")) or None,
            "declared_value":      f(raw.get("Declared_Value")) or None,
            "declared_weight":     f(raw.get("Declared_Weight")) or None,
            "measured_weight":     f(raw.get("Measured_Weight")) or None,
            "shipping_line":       s(raw.get("Shipping_Line")) or None,
            "dwell_time_hours":    i(raw.get("Dwell_Time_Hours")) or None,
            "clearance_status":    s(raw.get("Clearance_Status")) or None,
        })

        rs = float(raw.get("Risk_Score", 50) or 50)
        rl = s(raw.get("Risk_Level", "MEDIUM"))
        risk_records.append({
            "container_id": cid,
            "risk_score":   rs,
            "risk_level":   rl,
            "explanation":  make_explanation(raw),
        })

    CHUNK = 1000
    total_ok = 0
    print(f"\nUploading {len(container_records)} containers...")
    for i_start in range(0, len(container_records), CHUNK):
        chunk = container_records[i_start:i_start + CHUNK]
        try:
            resp = supabase.table("containers").upsert(chunk, on_conflict="container_id").execute()
            n = len(resp.data) if resp.data else len(chunk)
            total_ok += n
            print(f"  ✓ Chunk {i_start//CHUNK+1}: {n} rows")
        except Exception as e:
            err = str(e)
            print(f"  ✗ Chunk {i_start//CHUNK+1}: {err[:300]}")

    risk_ok = 0
    print(f"\nUploading {len(risk_records)} risk scores...")
    for i_start in range(0, len(risk_records), CHUNK):
        chunk = risk_records[i_start:i_start + CHUNK]
        try:
            resp = supabase.table("risk_assessment").insert(chunk).execute()
            n = len(resp.data) if resp.data else len(chunk)
            risk_ok += n
            print(f"  ✓ Risk chunk {i_start//CHUNK+1}: {n} rows")
        except Exception as e:
            print(f"  ✗ Risk chunk {i_start//CHUNK+1}: {str(e)[:300]}")

    print(f"\n✅ Seeded {total_ok} containers + {risk_ok} risk records.")
    print("Open http://localhost:5173 to see live data!")

if __name__ == "__main__":
    main()
