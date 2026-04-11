import os
import math
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from contextlib import asynccontextmanager
import io
import logging
import pandas as pd

from database.database import supabase
from services.risk_engine import predict_risk, predict_risk_batch, load_model
from services.report_service import analyze_risk_indicators, get_recommendation
from services.pdf_service import generate_report_pdf
from services.email_service import send_report_email
from ai_explanations.explanation_controller import (
    get_ai_explanation as _get_ai_explanation,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load CSV data at startup
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "datasets", "hackooo")
_df: pd.DataFrame = pd.DataFrame()


def _load_csv():
    global _df
    hist = os.path.join(DATA_DIR, "cleaned_historical_data.csv.gz")
    rt = os.path.join(DATA_DIR, "cleaned_realtime_data.csv.gz")
    hist_raw = os.path.join(DATA_DIR, "cleaned_historical_data.csv")
    rt_raw = os.path.join(DATA_DIR, "cleaned_realtime_data.csv")
    hist_url = "https://raw.githubusercontent.com/aahan0605/containArisk/main/data/datasets/hackooo/cleaned_historical_data.csv"
    rt_url = "https://raw.githubusercontent.com/aahan0605/containArisk/main/data/datasets/hackooo/cleaned_realtime_data.csv"
    frames = []

    if os.path.exists(hist):
        frames.append(pd.read_csv(hist, low_memory=False))
    elif os.path.exists(hist_raw):
        frames.append(pd.read_csv(hist_raw, low_memory=False))
    else:
        logger.info("Fetching historical data from GitHub...")
        frames.append(pd.read_csv(hist_url, low_memory=False))

    if os.path.exists(rt):
        frames.append(pd.read_csv(rt, low_memory=False))
    elif os.path.exists(rt_raw):
        frames.append(pd.read_csv(rt_raw, low_memory=False))
    else:
        logger.info("Fetching realtime data from GitHub...")
        frames.append(pd.read_csv(rt_url, low_memory=False))

    if frames:
        _df = pd.concat(frames, ignore_index=True).drop_duplicates(
            subset=["Container_ID"]
        )
        _df["Risk_Score"] = pd.to_numeric(_df["Risk_Score"], errors="coerce").fillna(0)
        logger.info(f"CSV loaded: {len(_df)} unique containers")


def _risk_level(score: float) -> str:
    if score >= 85:
        return "CRITICAL"
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def _df_to_container(row) -> dict:
    score = float(row.get("Risk_Score", 0))
    level = str(row.get("Risk_Level", "")).strip().upper() or _risk_level(score)
    return {
        "container_id": str(row.get("Container_ID", "")),
        "importer": str(row.get("Importer_ID", "")),
        "exporter": str(row.get("Exporter_ID", "")),
        "origin": str(row.get("Origin_Country", "")),
        "destination": str(row.get("Destination_Country", "")),
        "destination_port": str(row.get("Destination_Port", "")),
        "hs_code": str(row.get("HS_Code", "")),
        "weight": float(row.get("Measured_Weight") or 0),
        "declared_weight": float(row.get("Declared_Weight") or 0),
        "value": float(row.get("Declared_Value") or 0),
        "declared_value": float(row.get("Declared_Value") or 0),
        "risk_score": score,
        "risk_level": level,
        "clearance_status": str(row.get("Clearance_Status", "")),
        "shipping_line": str(row.get("Shipping_Line", "")),
        "dwell_time_hours": float(row.get("Dwell_Time_Hours") or 0),
        "declaration_date": str(row.get("Declaration_Date", "")),
        "trade_regime": str(row.get("Trade_Regime", "")),
        "entity_trust_score": float(row.get("entity_trust_score") or 0),
        "weight_deviation_percent": float(row.get("weight_deviation_percent") or 0),
        "seal_tamper_prob": float(row.get("seal_tamper_prob") or 0),
        "tax_evasion_prob": float(row.get("tax_evasion_prob") or 0),
    }


# ---------------------------------------------------------------------------
# Startup / Shutdown
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_csv()
    try:
        load_model()
        logger.info("ML model loaded at startup.")
    except FileNotFoundError as e:
        logger.warning(f"ML model not available at startup: {e}")
    except Exception as e:
        logger.warning(f"Failed to load ML model at startup: {e}")
    yield


app = FastAPI(
    title="SmartContainer Backend API",
    description="API with Supabase and AI Risk Engine",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------


class AIQuestionRequest(BaseModel):
    question: str


class UserAuth(BaseModel):
    username: str
    password: str


# Simple in-memory user store for demo purposes
# In production, use Supabase Auth or a users table
_USERS = {"admin@containarisk.com": "Admin123!"}


@app.post("/register")
async def register_user(auth: UserAuth):
    if auth.username in _USERS:
        raise HTTPException(status_code=400, detail="User already exists")
    _USERS[auth.username] = auth.password
    return {"success": True, "message": "Signup successful"}


@app.post("/login")
async def login_user(auth: UserAuth):
    if auth.username not in _USERS or _USERS[auth.username] != auth.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"success": True, "message": "Login successful"}


class ContainerInput(BaseModel):
    Container_ID: str
    Declaration_Date: str
    Declaration_Time: Optional[str] = None
    Trade_Regime: Optional[str] = None
    Origin_Country: Optional[str] = None
    Destination_Country: Optional[str] = None
    Destination_Port: Optional[str] = None
    HS_Code: Optional[str] = None
    Importer_ID: Optional[str] = None
    Exporter_ID: Optional[str] = None
    Declared_Value: Optional[float] = 0.0
    Declared_Weight: Optional[float] = 0.0
    Measured_Weight: Optional[float] = 0.0
    Shipping_Line: Optional[str] = None
    Dwell_Time_Hours: Optional[float] = 0.0
    Clearance_Status: Optional[str] = None


class ShipmentPredictRequest(BaseModel):
    Container_ID: Optional[str] = "UNKNOWN"
    Declaration_Date: Optional[str] = "2025-01-01"
    Declaration_Time: Optional[str] = "12:00:00"
    Trade_Regime: Optional[str] = "Import"
    Origin_Country: Optional[str] = "Unknown"
    Destination_Country: Optional[str] = "Unknown"
    Destination_Port: Optional[str] = "Unknown"
    HS_Code: Optional[float] = 0
    Importer_ID: Optional[str] = "Unknown"
    Exporter_ID: Optional[str] = "Unknown"
    Declared_Value: Optional[float] = 0.0
    Declared_Weight: Optional[float] = 0.0
    Measured_Weight: Optional[float] = 0.0
    Shipping_Line: Optional[str] = "Unknown"
    Dwell_Time_Hours: Optional[float] = 0.0
    Clearance_Status: Optional[str] = "Clear"


class BatchAnalyzeRequest(BaseModel):
    shipments: List[ShipmentPredictRequest]


class EmailReportRequest(BaseModel):
    email: str


# ---------------------------------------------------------------------------
# New ML Prediction Endpoints
# ---------------------------------------------------------------------------


@app.post("/predict")
async def predict_single(shipment: ShipmentPredictRequest):
    """
    Run ML anomaly detection on a single shipment record.
    Returns: prediction (anomaly/normal), risk_score, risk_level
    """
    try:
        data = shipment.dict()
        result = predict_risk(data)
        prediction = "anomaly" if result["Risk_Score"] >= 50 else "normal"
        return {
            "prediction": prediction,
            "risk_score": result["Risk_Score"],
            "risk_level": result["Risk_Level"],
            "container_id": data.get("Container_ID", "UNKNOWN"),
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@app.get("/shipments")
async def get_shipments(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)
):
    """Fetch shipment records from database (alias for /containers)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")

    offset = (page - 1) * limit

    count_response = (
        supabase.table("containers").select("*", count="exact").limit(1).execute()
    )
    total_count = count_response.count if hasattr(count_response, "count") else 0

    response = (
        supabase.table("containers")
        .select("*")
        .range(offset, offset + limit - 1)
        .order("Risk_Score", desc=True)
        .execute()
    )

    return {
        "data": response.data,
        "page": page,
        "limit": limit,
        "total": total_count,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 0,
    }


@app.get("/anomalies")
async def get_anomalies(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)
):
    """Return detected anomalies (Critical + High risk containers) from CSV."""
    return await _filtered_containers(page, limit, gte=70)


@app.post("/analyze")
async def analyze_batch(request: BatchAnalyzeRequest):
    """
    Accept batch shipment data and run anomaly detection on multiple rows.
    """
    try:
        rows = [s.dict() for s in request.shipments]
        risk_results = predict_risk_batch(rows)

        results = []
        for row, risk in zip(rows, risk_results):
            prediction = "anomaly" if risk["Risk_Score"] >= 50 else "normal"
            results.append(
                {
                    "container_id": row.get("Container_ID", "UNKNOWN"),
                    "prediction": prediction,
                    "risk_score": risk["Risk_Score"],
                    "risk_level": risk["Risk_Level"],
                }
            )

        anomaly_count = sum(1 for r in results if r["prediction"] == "anomaly")
        return {
            "total_analyzed": len(results),
            "anomalies_detected": anomaly_count,
            "normal_count": len(results) - anomaly_count,
            "results": results,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {e}")


# ---------------------------------------------------------------------------
# Filtered Container Endpoints
# ---------------------------------------------------------------------------


def _build_container_list(response_data):
    containers = []
    for r in response_data:
        c = r.get("containers", {})
        containers.append(
            {
                "container_id": r.get("container_id"),
                "importer": c.get("importer_id"),
                "exporter": c.get("exporter_id"),
                "origin": c.get("origin_country"),
                "destination": c.get("destination_country"),
                "risk_score": float(r.get("risk_score", 0)),
                "risk_level": r.get("risk_level"),
                "weight": c.get("measured_weight"),
                "value": c.get("declared_value"),
                "hs_code": c.get("hs_code"),
            }
        )
    return containers


async def _filtered_containers(
    page, limit, level: str = None, gte=None, lte=None, lt=None
):
    if _df.empty:
        return {"data": [], "total": 0, "page": page, "limit": limit, "total_pages": 0}

    # Ensure Risk_Level exists, using derived level if missing
    df_copy = _df.copy()
    if "Risk_Level" not in df_copy.columns:
        df_copy["Risk_Level"] = df_copy["Risk_Score"].apply(_risk_level)
    else:
        # Fill missing Risk_Level values with derived level
        mask = df_copy["Risk_Level"].isna() | (
            df_copy["Risk_Level"].astype(str).str.strip() == ""
        )
        df_copy.loc[mask, "Risk_Level"] = df_copy.loc[mask, "Risk_Score"].apply(
            _risk_level
        )

    if level:
        # Safely filter by level, handling NaN and non-string values
        try:
            filtered = df_copy[
                df_copy["Risk_Level"].astype(str).str.strip().str.upper()
                == level.upper()
            ].sort_values("Risk_Score", ascending=False)
        except Exception:
            # Fallback: derive level for all rows and filter
            df_copy["derived_level"] = df_copy["Risk_Score"].apply(_risk_level)
            filtered = df_copy[df_copy["derived_level"] == level.upper()].sort_values(
                "Risk_Score", ascending=False
            )
    else:
        mask = pd.Series([True] * len(df_copy), index=df_copy.index)
        if gte is not None:
            mask &= df_copy["Risk_Score"] >= gte
        if lte is not None:
            mask &= df_copy["Risk_Score"] <= lte
        if lt is not None:
            mask &= df_copy["Risk_Score"] < lt
        filtered = df_copy[mask].sort_values("Risk_Score", ascending=False)

    total = len(filtered)
    offset = (page - 1) * limit
    page_df = filtered.iloc[offset : offset + limit]
    return {
        "data": [_df_to_container(row) for _, row in page_df.iterrows()],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 0,
    }


@app.get("/containers/critical")
async def get_critical_containers(
    page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=500)
):
    return await _filtered_containers(page, limit, level="CRITICAL")


@app.get("/containers/high-risk")
async def get_high_risk_containers_list(
    page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=500)
):
    return await _filtered_containers(page, limit, level="HIGH")


@app.get("/containers/medium-risk")
async def get_medium_risk_containers_list(
    page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=500)
):
    return await _filtered_containers(page, limit, level="MEDIUM")


@app.get("/containers/low-risk")
async def get_low_risk_containers_list(
    page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=500)
):
    return await _filtered_containers(page, limit, level="LOW")


@app.get("/containers/by-country")
async def get_containers_by_country(
    country: str = Query(...),
    risk_level: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    """Return containers travelling TO a specific country, optionally filtered by risk level."""
    if _df.empty:
        return {"data": [], "total": 0, "page": page, "limit": limit, "total_pages": 0}

    df_copy = _df.copy()
    # Ensure Risk_Level exists
    if "Risk_Level" not in df_copy.columns:
        df_copy["Risk_Level"] = df_copy["Risk_Score"].apply(_risk_level)
    else:
        mask_nan = df_copy["Risk_Level"].isna() | (
            df_copy["Risk_Level"].astype(str).str.strip() == ""
        )
        df_copy.loc[mask_nan, "Risk_Level"] = df_copy.loc[mask_nan, "Risk_Score"].apply(
            _risk_level
        )

    try:
        mask = (
            df_copy["Destination_Country"].astype(str).str.strip().str.upper()
            == country.strip().upper()
        )
    except Exception:
        mask = pd.Series([False] * len(df_copy), index=df_copy.index)

    if risk_level:
        try:
            mask &= (
                df_copy["Risk_Level"].astype(str).str.strip().str.upper()
                == risk_level.strip().upper()
            )
        except Exception:
            mask = pd.Series([False] * len(df_copy), index=df_copy.index)

    filtered = df_copy[mask].sort_values("Risk_Score", ascending=False)
    total = len(filtered)
    offset = (page - 1) * limit
    page_df = filtered.iloc[offset : offset + limit]
    return {
        "data": [_df_to_container(row) for _, row in page_df.iterrows()],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 0,
    }


@app.get("/importer/{name}/containers")
async def get_importer_containers(name: str):
    """Return all containers for a specific importer, plus alerts."""
    if not supabase:
        return {"containers": [], "alerts": []}

    try:
        importer_name = name
        response = (
            supabase.table("containers")
            .select("*, risk_assessment(risk_score, risk_level, explanation)")
            .eq("importer_id", importer_name)
            .limit(50)
            .execute()
        )

        containers = []
        alerts = []
        for r in response.data:
            ra = r.get("risk_assessment", [])
            ra = (
                ra[0]
                if isinstance(ra, list) and len(ra) > 0
                else (ra if isinstance(ra, dict) else {})
            )
            risk_score_raw = float(ra.get("risk_score", 0))

            containers.append(
                {
                    "container_id": r.get("container_id"),
                    "exporter": r.get("exporter_id"),
                    "origin": r.get("origin_country"),
                    "destination": r.get("destination_country"),
                    "risk_score": risk_score_raw / 100.0,
                    "risk_level": ra.get("risk_level", "LOW"),
                    "weight": r.get("measured_weight"),
                    "value": r.get("declared_value"),
                }
            )
            if risk_score_raw > 50:
                explanation = ra.get("explanation", "High risk detected")
                severity = "CRITICAL" if risk_score_raw > 70 else "HIGH"
                alerts.append(
                    {
                        "container_id": r.get("container_id"),
                        "message": explanation
                        if explanation
                        else "High risk container detected",
                        "severity": severity,
                    }
                )

        # Sort by risk locally since we fetched via containers
        containers.sort(key=lambda x: x["risk_score"], reverse=True)
        return {"containers": containers, "alerts": alerts}
    except Exception as e:
        logger.error(f"Failed to fetch importer containers: {e}")
        return {"containers": [], "alerts": []}


# ---------------------------------------------------------------------------
# Existing Endpoints (unchanged)
# ---------------------------------------------------------------------------


@app.post("/upload-containers")
async def upload_containers(file: UploadFile = File(...)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    if "Declaration_Date (YYYY-MM-DD)" in df.columns:
        df["Declaration_Date"] = df["Declaration_Date (YYYY-MM-DD)"]

    df = df.rename(
        columns={
            "Declaration_Date (YYYY-MM-DD)": "Declaration_Date",
            "Trade_Regime (Import / Export / Transit)": "Trade_Regime",
        }
    )

    rows = df.to_dict(orient="records")

    try:
        risk_results = predict_risk_batch(rows)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML inference failed: {e}")

    inserted = 0
    errors = []
    chunk_size = 50

    import math

    def clean(v):
        if v is None or pd.isna(v):
            return None
        try:
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                return None
        except Exception:
            pass
        return v

    def s(v, default=""):
        return str(clean(v) or default)

    def f(v):
        try:
            return float(v or 0)
        except Exception:
            return 0.0

    def i(v):
        try:
            return int(float(v or 0))
        except Exception:
            return 0

    for i_start in range(0, len(rows), chunk_size):
        chunk = rows[i_start : i_start + chunk_size]
        chunk_risks = risk_results[i_start : i_start + chunk_size]

        container_records = []
        risk_records = []

        for row, risk in zip(chunk, chunk_risks):
            cid = s(row.get("Container_ID"))
            if not cid or cid == "nan" or cid == "None":
                continue
            if cid.replace(".", "").isdigit():
                cid = str(int(float(cid)))

            decl_date = s(row.get("Declaration_Date"), "2024-01-01 00:00:00")
            origin = s(row.get("Origin_Country"), "Unknown")
            dest = s(row.get("Destination_Country"), "Unknown")
            if decl_date == "nan" or not decl_date:
                decl_date = "2024-01-01 00:00:00"
            if origin == "nan" or not origin:
                origin = "Unknown"
            if dest == "nan" or not dest:
                dest = "Unknown"

            container_records.append(
                {
                    "container_id": cid,
                    "declaration_date": decl_date,
                    "trade_regime": s(row.get("Trade_Regime")) or None,
                    "origin_country": origin,
                    "destination_country": dest,
                    "destination_port": s(row.get("Destination_Port")) or None,
                    "hs_code": s(row.get("HS_Code")) or None,
                    "importer_id": s(row.get("Importer_ID")) or None,
                    "exporter_id": s(row.get("Exporter_ID")) or None,
                    "declared_value": f(row.get("Declared_Value")) or None,
                    "declared_weight": f(row.get("Declared_Weight")) or None,
                    "measured_weight": f(row.get("Measured_Weight")) or None,
                    "shipping_line": s(row.get("Shipping_Line")) or None,
                    "dwell_time_hours": i(row.get("Dwell_Time_Hours")) or None,
                    "clearance_status": s(row.get("Clearance_Status")) or None,
                }
            )

            risk_records.append(
                {
                    "container_id": cid,
                    "risk_score": float(risk.get("Risk_Score", 50) or 50),
                    "risk_level": s(risk.get("Risk_Level", "MEDIUM")),
                    "explanation": s(risk.get("Explanation_Summary", "Risk flagged")),
                }
            )

        try:
            if container_records:
                response = (
                    supabase.table("containers").insert(container_records).execute()
                )
                inserted += len(response.data) if response.data else 0
            if risk_records:
                supabase.table("risk_assessment").insert(risk_records).execute()
        except Exception as e:
            logger.error(f"Chunk {i_start // chunk_size + 1} upsert failed: {e}")
            errors.append({"chunk": i_start // chunk_size + 1, "error": str(e)[:200]})

    return {
        "filename": file.filename,
        "status": "success",
        "total": len(rows),
        "inserted": inserted,
        "errors": errors,
    }


@app.post("/container")
async def create_single_container(container: ContainerInput):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")

    data = container.dict()

    try:
        from services.risk_engine import predict_risk

        risk = predict_risk(data)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.warning(f"ML inference failed for {data.get('Container_ID')}: {e}")
        risk = {
            "Risk_Score": 50,
            "Risk_Level": "MEDIUM",
            "Explanation_Summary": "Manual Entry",
        }

    import math

    def clean(v):
        if v is None:
            return None
        try:
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                return None
        except Exception:
            pass
        return v

    def s(v, default=""):
        return str(clean(v) or default)

    def f(v):
        try:
            return float(v or 0)
        except Exception:
            return 0.0

    def i(v):
        try:
            return int(float(v or 0))
        except Exception:
            return 0

    cid = s(data.get("Container_ID"))
    if cid.replace(".", "").isdigit():
        cid = str(int(float(cid)))

    c_record = {
        "container_id": cid,
        "declaration_date": s(data.get("Declaration_Date"), "2024-01-01 00:00:00"),
        "trade_regime": s(data.get("Trade_Regime")) or None,
        "origin_country": s(data.get("Origin_Country"), "Unknown"),
        "destination_country": s(data.get("Destination_Country"), "Unknown"),
        "destination_port": s(data.get("Destination_Port")) or None,
        "hs_code": s(data.get("HS_Code")) or None,
        "importer_id": s(data.get("Importer_ID")) or None,
        "exporter_id": s(data.get("Exporter_ID")) or None,
        "declared_value": f(data.get("Declared_Value")) or None,
        "declared_weight": f(data.get("Declared_Weight")) or None,
        "measured_weight": f(data.get("Measured_Weight")) or None,
        "shipping_line": s(data.get("Shipping_Line")) or None,
        "dwell_time_hours": i(data.get("Dwell_Time_Hours")) or None,
        "clearance_status": s(data.get("Clearance_Status")) or None,
    }

    r_record = {
        "container_id": cid,
        "risk_score": float(risk.get("Risk_Score", 50)),
        "risk_level": s(risk.get("Risk_Level", "MEDIUM")),
        "explanation": s(risk.get("Explanation_Summary", "")),
    }

    try:
        res1 = supabase.table("containers").insert([c_record]).execute()
        supabase.table("risk_assessment").insert([r_record]).execute()
        if not res1.data:
            raise HTTPException(status_code=400, detail="Failed to insert")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Append to both CSV datasets for ML retraining
    try:
        import os

        DATA_DIR = os.path.join(
            os.path.dirname(__file__), "..", "data", "datasets", "hackooo"
        )
        csv_row = {
            "Container_ID": cid,
            "Declaration_Date": c_record["declaration_date"],
            "Trade_Regime": c_record["trade_regime"] or "",
            "Origin_Country": c_record["origin_country"],
            "Destination_Country": c_record["destination_country"],
            "Destination_Port": c_record["destination_port"] or "",
            "HS_Code": c_record["hs_code"] or "",
            "Importer_ID": c_record["importer_id"] or "",
            "Exporter_ID": c_record["exporter_id"] or "",
            "Declared_Value": c_record["declared_value"] or 0,
            "Declared_Weight": c_record["declared_weight"] or 0,
            "Measured_Weight": c_record["measured_weight"] or 0,
            "Shipping_Line": c_record["shipping_line"] or "",
            "Dwell_Time_Hours": c_record["dwell_time_hours"] or 0,
            "Clearance_Status": c_record["clearance_status"] or "",
            "Risk_Score": float(risk.get("Risk_Score", 50)),
            "Risk_Level": s(risk.get("Risk_Level", "MEDIUM")),
        }
        new_row_df = pd.DataFrame([csv_row])
        for csv_name in ["cleaned_historical_data.csv", "cleaned_realtime_data.csv"]:
            csv_path = os.path.normpath(os.path.join(DATA_DIR, csv_name))
            if os.path.exists(csv_path):
                existing = pd.read_csv(csv_path, nrows=0)  # read headers only
                # Only write columns that exist in the target CSV
                cols = list(existing.columns)
                row_to_append = {c: csv_row.get(c, "") for c in cols}
                pd.DataFrame([row_to_append]).to_csv(
                    csv_path, mode="a", header=False, index=False
                )
    except Exception as csv_err:
        logger.warning(f"CSV append failed (non-fatal): {csv_err}")

    # Reload in-memory CSV so dashboard stats reflect the new container
    _load_csv()

    return {
        **res1.data[0],
        "risk_score": float(risk.get("Risk_Score", 50)) / 100.0,
        "risk_level": s(risk.get("Risk_Level", "MEDIUM")),
    }


def _compute_inline_risk(r: dict) -> tuple:
    """Rule-based risk score from container fields (0-100 scale)."""
    score = 0.0
    dw = float(r.get("declared_weight") or 0)
    mw = float(r.get("measured_weight") or 0)
    dv = float(r.get("declared_value") or 0)
    dwell = float(r.get("dwell_time_hours") or 0)
    cs = str(r.get("clearance_status") or "").lower()

    if dw > 0 and mw > 0:
        deviation = abs(mw - dw) / dw
        if deviation > 0.20:
            score += 35
        elif deviation > 0.10:
            score += 20
        elif deviation > 0.05:
            score += 10

    if dv > 0 and dw > 0:
        vw = dv / dw
        if vw > 500 or vw < 0.1:
            score += 25
        elif vw > 200 or vw < 0.5:
            score += 15

    if dwell > 120:
        score += 25
    elif dwell > 72:
        score += 15
    elif dwell > 48:
        score += 8

    if cs in ("hold", "rejected", "flagged"):
        score += 30
    elif cs in ("review", "pending"):
        score += 15

    score = min(100.0, score)
    if score >= 70:
        level = "HIGH"
    elif score >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"
    return round(score, 1), level


@app.get("/containers")
async def get_containers(
    page: int = Query(1, ge=1), limit: int = Query(100, ge=1, le=500)
):
    return await _filtered_containers(page, limit)


# ---------------------------------------------------------------------------
# AI Explanation Endpoint
# ---------------------------------------------------------------------------


@app.get("/container/{container_id}/ai-explanation")
async def ai_explanation_endpoint(container_id: str):
    """
    Generate an AI-powered investigation explanation for a container.
    Returns: container_id, risk_score, risk_level, explanation (full + short),
             recommendation, and signals_summary.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        result = await _get_ai_explanation(
            container_id=container_id,
            supabase=supabase,
            risk_engine_fn=predict_risk,
        )
        return result
    except Exception as e:
        logger.error(f"AI explanation error for {container_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/summary")
async def get_summary():
    if _df.empty:
        return {
            "total_containers": 0,
            "critical": 0,
            "high_risk": 0,
            "medium": 0,
            "low_risk": 0,
            "anomalies": 0,
        }
    total = len(_df)
    rl = _df["Risk_Level"].str.strip().str.upper()
    critical = int((rl == "CRITICAL").sum())
    high = int((rl == "HIGH").sum())
    medium = int((rl == "MEDIUM").sum())
    low = int((rl == "LOW").sum())
    return {
        "total_containers": total,
        "critical": critical,
        "high_risk": high,
        "medium": medium,
        "low_risk": low,
        "anomalies": critical + high,
    }


@app.get("/high-risk-containers")
async def get_high_risk_containers():
    if not supabase:
        return []
    try:
        resp = (
            supabase.table("risk_assessment")
            .select("*, containers!inner(importer_id, exporter_id, origin_country)")
            .gt("risk_score", 50)
            .order("risk_score", desc=True)
            .limit(10)
            .execute()
        )
        result = []
        for r in resp.data:
            c = r.get("containers", {})
            result.append(
                {
                    "container_id": r.get("container_id"),
                    "importer": c.get("importer_id"),
                    "exporter": c.get("exporter_id"),
                    "origin": c.get("origin_country"),
                    "risk_score": float(r.get("risk_score", 0)) / 100.0,
                    "risk_level": r.get("risk_level"),
                }
            )
        return result
    except Exception as e:
        logger.error(f"GET /high-risk-containers error: {e}")
        return []


@app.get("/risk-distribution")
async def get_risk_distribution():
    if not supabase:
        return {"low": 800, "medium": 200, "high": 80, "critical": 20}
    try:
        response = supabase.table("risk_assessment").select("risk_level").execute()
        dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for r in response.data:
            lvl = str(r.get("risk_level", "low")).lower()
            if lvl in dist:
                dist[lvl] += 1
            else:
                dist[lvl] = 1
        return dist
    except Exception:
        pass
    return {"low": 800, "medium": 200, "high": 80, "critical": 20}


@app.get("/container/{id}")
async def get_container_details(id: str):
    if _df.empty:
        raise HTTPException(status_code=503, detail="CSV data not loaded")
    rows = _df[_df["Container_ID"].astype(str) == str(id)]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Container not found")
    row = rows.iloc[0]
    c = _df_to_container(row)
    score = float(row.get("Risk_Score", 0))
    return {
        **c,
        "declared_weight": float(row.get("Declared_Weight") or 0),
        "destination_port": str(row.get("Destination_Port", "")),
        "risk_score": score / 100.0,
        "risk_level": c["risk_level"],
        "entity_trust_score": float(row.get("entity_trust_score") or 0),
        "weight_deviation_percent": float(row.get("weight_deviation_percent") or 0),
        "seal_tamper_prob": float(row.get("seal_tamper_prob") or 0),
        "tax_evasion_prob": float(row.get("tax_evasion_prob") or 0),
        "explanations": [],
    }


@app.get("/country-risk")
async def get_country_risk():
    if not supabase:
        return []
    try:
        response = (
            supabase.table("risk_assessment")
            .select("*, containers!inner(origin_country)")
            .gt("risk_score", 50)
            .execute()
        )
        country_counts = {}
        for r in response.data:
            c = r.get("containers", {})
            country = c.get("origin_country", "Unknown") if c else "Unknown"
            country_counts[country] = country_counts.get(country, 0) + 1
        result = [
            {"country": k, "risk_count": v}
            for k, v in sorted(country_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        return result
    except Exception:
        return []


@app.get("/importer-risk")
async def get_importer_risk():
    if not supabase:
        return []
    try:
        response = (
            supabase.table("risk_assessment")
            .select("*, containers!inner(importer_id)")
            .gt("risk_score", 50)
            .execute()
        )
        importer_counts = {}
        for r in response.data:
            c = r.get("containers", {})
            importer = c.get("importer_id", "Unknown") if c else "Unknown"
            importer_counts[importer] = importer_counts.get(importer, 0) + 1
        result = [
            {"importer": k, "risk_count": v}
            for k, v in sorted(
                importer_counts.items(), key=lambda x: x[1], reverse=True
            )[:10]
        ]
        return result
    except Exception:
        return []


@app.get("/trade-routes")
async def get_trade_routes():
    if _df.empty:
        return {
            "routes": [],
            "stats": {
                "active_routes": 0,
                "high_risk_routes": 0,
                "tracked_countries": 0,
            },
        }
    try:
        coords = {
            "PH": [12.8797, 121.774],
            "IT": [41.8719, 12.5674],
            "BE": [50.5039, 4.4699],
            "PT": [39.3999, -8.2245],
            "VN": [14.0583, 108.2772],
            "GR": [39.0742, 21.8243],
            "UA": [48.3794, 31.1656],
            "KR": [35.9078, 127.7669],
            "FI": [61.9241, 25.7482],
            "MA": [31.7917, -7.0926],
            "JP": [36.2048, 138.2529],
            "ES": [40.4637, -3.7492],
            "SE": [60.1282, 18.6435],
            "TH": [15.87, 100.9925],
            "HK": [22.3193, 114.1694],
            "SK": [48.669, 19.699],
            "NZ": [-40.9006, 174.886],
            "CN": [35.8617, 104.1954],
            "KE": [-1.2864, 36.8172],
            "TR": [38.9637, 35.2433],
            "AE": [23.4241, 53.8478],
            "HN": [15.2, -86.2419],
            "HU": [47.1625, 19.5033],
            "CH": [46.8182, 8.2275],
            "LK": [7.8731, 80.7718],
            "FR": [46.2276, 2.2137],
            "NL": [52.1326, 5.2913],
            "MY": [4.2105, 101.9758],
            "ID": [-0.7893, 113.9213],
            "US": [37.0902, -95.7129],
            "RU": [61.524, 105.3188],
            "EE": [58.5953, 25.0136],
            "MD": [47.4116, 28.3699],
            "AR": [-38.4161, -63.6167],
            "MX": [23.6345, -102.5528],
            "PL": [51.9194, 19.1451],
            "CZ": [49.8175, 15.473],
            "DE": [51.1657, 10.4515],
            "IE": [53.1424, -7.6921],
            "MP": [15.1955, 145.746],
            "BD": [23.685, 90.3563],
            "AT": [47.5162, 14.5501],
            "TW": [23.6978, 120.9605],
            "DK": [56.2639, 9.5018],
            "IL": [31.0461, 34.8516],
            "GB": [55.3781, -3.436],
            "NP": [28.3949, 84.124],
            "CA": [56.1304, -106.3468],
            "KH": [12.5657, 104.991],
            "RS": [44.0165, 21.0059],
            "LA": [19.8563, 102.4955],
            "RO": [45.9432, 24.9668],
            "AU": [-25.2744, 133.7751],
            "SG": [1.3521, 103.8198],
            "CR": [9.7489, -83.7534],
            "NO": [60.472, 8.4689],
            "IN": [20.5937, 78.9629],
            "MT": [35.9375, 14.3754],
            "LB": [33.8547, 35.8623],
            "BA": [43.9159, 17.6791],
            "TT": [10.6918, -61.2225],
            "IR": [32.4279, 53.688],
            "BR": [-14.235, -51.9253],
            "BG": [42.7339, 25.4858],
            "UZ": [41.3775, 64.5853],
            "SN": [14.4974, -14.4524],
            "AM": [40.0691, 45.0382],
            "NG": [9.082, 8.6753],
            "CO": [4.5709, -74.2973],
            "WS": [-13.759, -172.1046],
            "ZZ": [0, 0],
            "DJ": [11.8251, 42.5903],
            "CL": [-35.6751, -71.543],
            "FJ": [-16.5782, 179.4144],
            "SV": [13.7942, -88.8965],
            "MG": [-18.7669, 46.8691],
            "UG": [1.3733, 32.2903],
            "LV": [56.8796, 24.6032],
            "EC": [-1.8312, -78.1834],
            "PY": [-23.4425, -58.4438],
            "GG": [49.4657, -2.5853],
            "SD": [12.8628, 30.2176],
            "OM": [21.4735, 55.9754],
            "SI": [46.1512, 14.9955],
            "MN": [46.8625, 103.8467],
            "GN": [9.9456, -9.6966],
            "GU": [13.4443, 144.7937],
            "PG": [-6.314993, 143.95555],
            "LR": [6.4281, -9.4295],
        }

        default_coord = [0, 0]

        routes_dict = {}
        total_active_routes = 0
        high_risk_routes = 0
        countries = set()

        for _, row in _df.iterrows():
            origin = str(row.get("Origin_Country", "Unknown"))
            dest = str(row.get("Destination_Country", "Unknown"))
            cid = str(row.get("Container_ID", "Unknown"))
            risk_val = float(row.get("Risk_Score", 0))

            # Skip missing mappings
            c1 = coords.get(origin, default_coord)
            c2 = coords.get(dest, default_coord)
            if c1 == default_coord and c2 == default_coord:
                continue

            route_id = f"{origin}-{dest}"

            if route_id not in routes_dict:
                routes_dict[route_id] = {
                    "origin": origin,
                    "destination": dest,
                    "lat1": c1[0],
                    "lon1": c1[1],
                    "lat2": c2[0],
                    "lon2": c2[1],
                    "container_id": cid,
                    "risk_score": 0,
                    "count": 0,
                    "max_risk": 0,
                }
                total_active_routes += 1
                countries.add(origin)
                countries.add(dest)

            routes_dict[route_id]["count"] += 1
            routes_dict[route_id]["risk_score"] += risk_val
            if risk_val > routes_dict[route_id]["max_risk"]:
                routes_dict[route_id]["max_risk"] = risk_val

        # Assign risk levels by splitting routes into quartiles by max_risk
        routes_list = sorted(
            routes_dict.values(), key=lambda x: x["max_risk"], reverse=True
        )
        n = len(routes_list)
        for i, rd in enumerate(routes_list):
            pct = i / max(n - 1, 1)  # 0 = highest risk, 1 = lowest
            if pct < 0.25:
                rd["risk"] = "critical"
                high_risk_routes += 1
            elif pct < 0.50:
                rd["risk"] = "high"
                high_risk_routes += 1
            elif pct < 0.75:
                rd["risk"] = "medium"
            else:
                rd["risk"] = "low"
            rd["avg_risk"] = (
                round(rd["risk_score"] / rd["count"], 2) if rd["count"] else 0
            )

        # Sort by risk descending and return top N for map visual
        routes_list.sort(key=lambda x: x["max_risk"], reverse=True)

        return {
            "routes": routes_list[:200],  # return up to 200 unique connections
            "stats": {
                "active_routes": total_active_routes,
                "high_risk_routes": high_risk_routes,
                "tracked_countries": len(countries),
            },
        }
    except Exception as e:
        logger.error(f"Error fetching trade routes: {e}")
        return {
            "routes": [],
            "stats": {
                "active_routes": 0,
                "high_risk_routes": 0,
                "tracked_countries": 0,
            },
        }


@app.get("/risk-heatmap")
async def get_risk_heatmap():
    if not supabase:
        return {}
    try:
        response = (
            supabase.table("risk_assessment")
            .select("*, containers!inner(origin_country)")
            .gt("risk_score", 30)
            .execute()
        )
        heatmap = {}
        for r in response.data:
            c = r.get("containers", {})
            country = c.get("origin_country", "Unknown") if c else "Unknown"
            heatmap[country] = heatmap.get(country, 0) + 1
        return heatmap
    except Exception:
        return {}


@app.post("/ai-explain")
async def ask_ai(request: AIQuestionRequest):
    return {
        "answer": f"Simulated AI Analysis for: '{request.question}'. Container is high risk due to weight discrepancy and routing history."
    }


@app.get("/risk-alerts")
async def get_risk_alerts():
    if not supabase:
        return []
    try:
        response = (
            supabase.table("risk_assessment")
            .select("*, containers!inner(importer_id)")
            .gt("risk_score", 70)
            .order("risk_score", desc=True)
            .limit(5)
            .execute()
        )
        alerts = []
        for r in response.data:
            c = r.get("containers", {})
            importer = c.get("importer_id", "Unknown") if c else "Unknown"
            alerts.append(
                {
                    "container_id": r.get("container_id"),
                    "importer": importer,
                    "risk_score": float(r.get("risk_score", 0)) / 100.0,
                    "risk_level": r.get("risk_level"),
                    "message": r.get("explanation"),
                }
            )
        return alerts
    except Exception:
        return []


# ---------------------------------------------------------------------------
# New Feature Endpoints (Risk Analysis, PDF, Email, Comparison)
# ---------------------------------------------------------------------------


@app.get("/container/{id}/risk-analysis")
async def get_risk_analysis(id: str):
    """Return detailed risk indicators for a specific container."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    response = (
        supabase.table("containers")
        .select("*, risk_assessment(*)")
        .eq("container_id", id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Container not found")
    r = response.data[0]

    ra = r.get("risk_assessment", [])
    ra = ra[0] if isinstance(ra, list) and ra else (ra if isinstance(ra, dict) else {})

    # Prefer the container's own risk_score/risk_level (always up-to-date)
    raw_score = float(r.get("risk_score") or ra.get("risk_score") or 0)
    risk_score = raw_score * 100 if raw_score <= 1.0 else raw_score
    risk_level = r.get("risk_level") or ra.get("risk_level") or "LOW"

    indicators = analyze_risk_indicators(r)
    recommendation = get_recommendation(risk_score)
    return {
        "container_id": id,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "indicators": indicators,
        "recommendation": recommendation,
    }


@app.get("/container/{id}/report")
async def download_report(id: str):
    """Generate and return a PDF investigation report for a container."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    response = (
        supabase.table("containers")
        .select("*, risk_assessment(*)")
        .eq("container_id", id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Container not found")
    r = response.data[0]

    ra = r.get("risk_assessment", [])
    ra = ra[0] if isinstance(ra, list) and ra else (ra if isinstance(ra, dict) else {})

    container_data = {
        "container_id": r.get("container_id"),
        "origin": r.get("origin_country"),
        "destination": r.get("destination_country"),
        "destination_port": r.get("destination_port"),
        "hs_code": r.get("hs_code"),
        "importer": r.get("importer_id"),
        "exporter": r.get("exporter_id"),
        "declared_value": r.get("declared_value", 0),
        "declared_weight": r.get("declared_weight", 0),
        "weight": r.get("measured_weight", 0),
        "shipping_line": r.get("shipping_line"),
        "dwell_time_hours": r.get("dwell_time_hours", 0),
        "clearance_status": r.get("clearance_status"),
        "risk_score": float(ra.get("risk_score", 0)) / 100.0,
        "risk_level": ra.get("risk_level", "LOW"),
    }

    indicators = analyze_risk_indicators(r)
    _rs = float(ra.get("risk_score", 0))
    recommendation = get_recommendation(_rs * 100 if _rs <= 1.0 else _rs)
    pdf_bytes = generate_report_pdf(container_data, indicators, recommendation)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=container_report_{id}.pdf"
        },
    )


@app.post("/container/{id}/send-report")
async def send_container_report(id: str, request: EmailReportRequest):
    """Generate a report PDF and email it to the specified address."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    response = (
        supabase.table("containers")
        .select("*, risk_assessment(*)")
        .eq("container_id", id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Container not found")
    r = response.data[0]

    ra = r.get("risk_assessment", [])
    ra = ra[0] if isinstance(ra, list) and ra else (ra if isinstance(ra, dict) else {})
    risk_score = float(ra.get("risk_score", 0))
    risk_level = ra.get("risk_level", "LOW")

    container_data = {
        "container_id": r.get("container_id"),
        "origin": r.get("origin_country"),
        "destination": r.get("destination_country"),
        "destination_port": r.get("destination_port"),
        "hs_code": r.get("hs_code"),
        "importer": r.get("importer_id"),
        "exporter": r.get("exporter_id"),
        "declared_value": r.get("declared_value", 0),
        "declared_weight": r.get("declared_weight", 0),
        "weight": r.get("measured_weight", 0),
        "shipping_line": r.get("shipping_line"),
        "dwell_time_hours": r.get("dwell_time_hours", 0),
        "clearance_status": r.get("clearance_status"),
        "risk_score": risk_score / 100.0,
        "risk_level": risk_level,
    }

    indicators = analyze_risk_indicators(r)
    recommendation = get_recommendation(
        risk_score * 100 if risk_score <= 1.0 else risk_score
    )
    pdf_bytes = generate_report_pdf(container_data, indicators, recommendation)

    result = send_report_email(
        to_email=request.email,
        container_id=id,
        risk_level=risk_level,
        risk_score=risk_score,
        pdf_bytes=pdf_bytes,
    )
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])
    return result


@app.get("/container/{id}/comparison")
async def get_container_comparison(id: str):
    """Return container values vs dataset averages for comparative charts."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    response = (
        supabase.table("containers")
        .select("*, risk_assessment(risk_score)")
        .eq("container_id", id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Container not found")
    r = response.data[0]

    ra = r.get("risk_assessment", [])
    ra = ra[0] if isinstance(ra, list) and ra else (ra if isinstance(ra, dict) else {})

    # Compute dataset averages
    try:
        all_resp = (
            supabase.table("containers")
            .select("*, risk_assessment(risk_score)")
            .limit(500)
            .execute()
        )
        rows = all_resp.data or []
        if rows:
            avg_value = sum(float(x.get("declared_value", 0) or 0) for x in rows) / len(
                rows
            )
            avg_dec_wt = sum(
                float(x.get("declared_weight", 0) or 0) for x in rows
            ) / len(rows)
            avg_meas_wt = sum(
                float(x.get("measured_weight", 0) or 0) for x in rows
            ) / len(rows)
            avg_dwell = sum(
                float(x.get("dwell_time_hours", 0) or 0) for x in rows
            ) / len(rows)

            risk_sum = 0
            rc = 0
            for x in rows:
                x_ra = x.get("risk_assessment", [])
                x_ra = (
                    x_ra[0]
                    if isinstance(x_ra, list) and x_ra
                    else (x_ra if isinstance(x_ra, dict) else {})
                )
                if x_ra:
                    risk_sum += float(x_ra.get("risk_score", 0))
                    rc += 1
            avg_risk = risk_sum / rc if rc > 0 else 0
        else:
            avg_value = avg_dec_wt = avg_meas_wt = avg_dwell = avg_risk = 0
    except Exception:
        avg_value = avg_dec_wt = avg_meas_wt = avg_dwell = avg_risk = 0

    container_val = float(r.get("declared_value", 0) or 0)
    container_dec_wt = float(r.get("declared_weight", 0) or 0)
    container_meas_wt = float(r.get("measured_weight", 0) or 0)
    container_dwell = float(r.get("dwell_time_hours", 0) or 0)
    container_risk = float(ra.get("risk_score", 0) or 0)

    return {
        "container_id": id,
        "metrics": [
            {
                "name": "Declared Value ($)",
                "container": round(container_val, 2),
                "average": round(avg_value, 2),
            },
            {
                "name": "Declared Weight (kg)",
                "container": round(container_dec_wt, 2),
                "average": round(avg_dec_wt, 2),
            },
            {
                "name": "Measured Weight (kg)",
                "container": round(container_meas_wt, 2),
                "average": round(avg_meas_wt, 2),
            },
            {
                "name": "Dwell Time (hrs)",
                "container": round(container_dwell, 2),
                "average": round(avg_dwell, 2),
            },
            {
                "name": "Risk Score",
                "container": round(container_risk, 2),
                "average": round(avg_risk, 2),
            },
        ],
    }


# ---------------------------------------------------------------------------
# Intelligence Dashboard Overhaul Endpoints
# ---------------------------------------------------------------------------


@app.get("/trade-network")
async def get_trade_network():
    """Return top 6 nodes with guaranteed edges between them for network graph."""
    if _df.empty:
        return {"nodes": [], "edges": []}
    try:
        edges_dict: dict = {}
        for _, row in _df.iterrows():
            imp = str(row.get("Importer_ID", "") or "")
            exp = str(row.get("Exporter_ID", "") or "")
            risk = float(row.get("Risk_Score", 0))
            if (
                imp
                and exp
                and imp not in ("Unknown", "nan", "")
                and exp not in ("Unknown", "nan", "")
            ):
                eid = f"{exp}||{imp}"
                if eid not in edges_dict:
                    edges_dict[eid] = {
                        "source": exp,
                        "target": imp,
                        "weight": 0,
                        "risks": [],
                    }
                edges_dict[eid]["weight"] += 1
                edges_dict[eid]["risks"].append(risk)

        # Sort edges by weight descending, pick top edges, collect nodes from them
        sorted_edges = sorted(
            edges_dict.values(), key=lambda x: x["weight"], reverse=True
        )

        # First pass: collect top 6 nodes from highest-weight edges
        selected_nodes: dict = {}
        for e in sorted_edges:
            src, tgt = e["source"], e["target"]
            if src not in selected_nodes:
                selected_nodes[src] = {
                    "id": src,
                    "group": "Exporter",
                    "risks": [],
                    "count": 0,
                }
            if tgt not in selected_nodes:
                selected_nodes[tgt] = {
                    "id": tgt,
                    "group": "Importer",
                    "risks": [],
                    "count": 0,
                }
            selected_nodes[src]["risks"].extend(e["risks"])
            selected_nodes[src]["count"] += e["weight"]
            selected_nodes[tgt]["risks"].extend(e["risks"])
            selected_nodes[tgt]["count"] += e["weight"]
            if len(selected_nodes) >= 6:
                break

        # Second pass: only keep edges where BOTH endpoints are in selected_nodes
        final_node_ids = set(selected_nodes.keys())
        selected_edges = []
        for e in sorted_edges:
            src, tgt = e["source"], e["target"]
            if src in final_node_ids and tgt in final_node_ids:
                avg_risk = sum(e["risks"]) / len(e["risks"])
                selected_edges.append(
                    {
                        "source": src,
                        "target": tgt,
                        "val": e["weight"],
                        "risk": round(avg_risk, 2),
                    }
                )
            if len(selected_edges) >= 8:
                break

        nodes = [
            {
                "id": v["id"],
                "group": v["group"],
                "val": v["count"],
                "risk": round(sum(v["risks"]) / len(v["risks"]), 2),
            }
            for v in selected_nodes.values()
        ]
        return {"nodes": nodes[:6], "edges": selected_edges[:8]}
    except Exception as e:
        logger.error(f"Error fetching trade network: {e}")
        return {"nodes": [], "edges": []}


@app.get("/risk-trends")
async def get_risk_trends():
    """Return risk aggregations over time from CSV."""
    if _df.empty:
        return []
    try:
        df = _df.copy()
        df["month"] = (
            pd.to_datetime(df["Declaration_Date"], errors="coerce")
            .dt.to_period("M")
            .astype(str)
        )
        df = df[df["month"].notna() & (df["month"] != "NaT")]
        grouped = (
            df.groupby("month")
            .agg(
                total=("Container_ID", "count"),
                high_risk=("Risk_Score", lambda x: (x >= 70).sum()),
                avg_risk=("Risk_Score", "mean"),
            )
            .reset_index()
        )
        grouped = grouped.sort_values("month").tail(12)
        return [
            {
                "date": r["month"],
                "total": int(r["total"]),
                "high_risk": int(r["high_risk"]),
                "avg_risk": round(float(r["avg_risk"]), 1),
            }
            for _, r in grouped.iterrows()
        ]
    except Exception as e:
        logger.error(f"Error fetching risk trends: {e}")
        return []


@app.get("/intelligence-insights")
async def get_intelligence_insights():
    """Dynamically generate recent insights from database state."""
    if not supabase:
        return []
    try:
        insights = []
        # Insight 1: Highest risk routes
        r1 = (
            supabase.table("risk_assessment")
            .select("*, containers!inner(origin_country, destination_country)")
            .gt("risk_score", 50)
            .execute()
        )
        routes = {}
        for r in r1.data:
            c = r.get("containers", {})
            if not c:
                continue
            k = f"{c.get('origin_country')} -> {c.get('destination_country')}"
            routes[k] = routes.get(k, 0) + 1
        if routes:
            top_route = max(routes.items(), key=lambda x: x[1])
            insights.append(
                {
                    "id": "ins-1",
                    "type": "route",
                    "severity": "high",
                    "message": f"{top_route[1]} high-risk shipments detected on corridor {top_route[0]}",
                }
            )

        # Insight 2: Suspicious Importers
        r2 = (
            supabase.table("risk_assessment")
            .select("*, containers!inner(importer_id)")
            .gt("risk_score", 70)
            .execute()
        )
        importers = {}
        for r in r2.data:
            c = r.get("containers", {})
            if not c:
                continue
            imp = c.get("importer_id")
            importers[imp] = importers.get(imp, 0) + 1
        if importers:
            top_imp = max(importers.items(), key=lambda x: x[1])
            insights.append(
                {
                    "id": "ins-2",
                    "type": "entity",
                    "severity": "critical",
                    "message": f"Entity {top_imp[0]} flagged for {top_imp[1]} critical-risk violations",
                }
            )

        # Default insights if DB is sparse
        if not insights:
            insights = [
                {
                    "id": "ins-default",
                    "type": "system",
                    "severity": "low",
                    "message": "System nominal. Scanning incoming manifests.",
                }
            ]
        return insights
    except Exception as e:
        logger.error(f"Error fetching intelligence insights: {e}")
        return []


@app.get("/health")
async def health_check():
    return {"status": "ok", "containers_loaded": len(_df)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", port=8000, reload=True)
