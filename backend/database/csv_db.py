"""
csv_db.py
Fallback CSV-based database layer when Supabase is unavailable.
"""

import os
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
import pandas as pd

_BACKEND = Path(__file__).resolve().parent.parent
_ROOT = _BACKEND.parent
_DATA_DIR = _ROOT / "data" / "datasets" / "hackooo"

# CSV file paths
CONTAINERS_CSV = _DATA_DIR / "cleaned_realtime_data.csv"
CONTAINERS_HIST_CSV = _DATA_DIR / "cleaned_historical_data.csv"

# In-memory cache of containers and risk assessments
_containers_cache = None
_risk_assessment_cache = {}


def _load_containers():
    """Load all containers from CSV files into memory."""
    global _containers_cache

    if _containers_cache is not None:
        return _containers_cache

    frames = []
    for path in [CONTAINERS_HIST_CSV, CONTAINERS_CSV]:
        if path.exists():
            try:
                df = pd.read_csv(path, dtype={"Container_ID": str})
                frames.append(df)
            except Exception as e:
                print(f"Error loading {path}: {e}")

    if frames:
        all_df = pd.concat(frames, ignore_index=True).drop_duplicates(
            subset=["Container_ID"], keep="first"
        )
        _containers_cache = all_df
        return all_df

    return pd.DataFrame()


def get_container(container_id: str) -> Optional[Dict[str, Any]]:
    """Get a single container by ID from CSV."""
    df = _load_containers()
    if df.empty:
        return None

    container_id = str(container_id)

    # Try both column name formats
    matching = df[
        (df.get("Container_ID", pd.Series()).astype(str) == container_id)
        | (df.get("container_id", pd.Series()).astype(str) == container_id)
    ]

    if matching.empty:
        return None

    row = matching.iloc[0]
    container_dict = row.to_dict()

    # Get or create risk assessment
    if container_id in _risk_assessment_cache:
        container_dict["risk_assessment"] = [_risk_assessment_cache[container_id]]
    else:
        # Create a default risk assessment
        risk_score = float(
            container_dict.get("risk_score") or container_dict.get("Risk_Score") or 0
        )
        risk_level = str(
            container_dict.get("risk_level")
            or container_dict.get("Risk_Level")
            or "LOW"
        )
        container_dict["risk_assessment"] = [
            {
                "container_id": container_id,
                "risk_score": risk_score,
                "risk_level": risk_level,
            }
        ]

    return container_dict


def get_all_containers(limit: int = 100, offset: int = 0) -> Dict[str, Any]:
    """Get all containers with pagination."""
    df = _load_containers()
    if df.empty:
        return {"data": [], "count": 0}

    total = len(df)
    paginated = df.iloc[offset : offset + limit]

    data = []
    for _, row in paginated.iterrows():
        row_dict = row.to_dict()
        container_id = str(
            row_dict.get("Container_ID") or row_dict.get("container_id") or ""
        )

        if container_id in _risk_assessment_cache:
            row_dict["risk_assessment"] = [_risk_assessment_cache[container_id]]
        else:
            risk_score = float(
                row_dict.get("risk_score") or row_dict.get("Risk_Score") or 0
            )
            risk_level = str(
                row_dict.get("risk_level") or row_dict.get("Risk_Level") or "LOW"
            )
            row_dict["risk_assessment"] = [
                {
                    "container_id": container_id,
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                }
            ]

        data.append(row_dict)

    return {"data": data, "count": total}


def create_container(container_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new container and save to CSV."""
    # Normalize container_id
    container_id_val = container_data.get("container_id") or container_data.get(
        "Container_ID", ""
    )
    container_id = str(container_id_val)

    # Build record with PascalCase keys matching CSV format
    record = {
        "Container_ID": container_id,
        "Declaration_Date": str(
            container_data.get("Declaration_Date")
            or container_data.get("declaration_date", "")
        ),
        "Trade_Regime": str(
            container_data.get("Trade_Regime")
            or container_data.get("trade_regime", "Import")
        ),
        "Origin_Country": str(
            container_data.get("Origin_Country")
            or container_data.get("origin_country", "")
        ),
        "Destination_Country": str(
            container_data.get("Destination_Country")
            or container_data.get("destination_country", "")
        ),
        "Destination_Port": str(
            container_data.get("Destination_Port")
            or container_data.get("destination_port", "")
        ),
        "HS_Code": str(
            container_data.get("HS_Code") or container_data.get("hs_code", "")
        ),
        "Importer_ID": str(
            container_data.get("Importer_ID") or container_data.get("importer_id", "")
        ),
        "Exporter_ID": str(
            container_data.get("Exporter_ID") or container_data.get("exporter_id", "")
        ),
        "Declared_Value": float(
            container_data.get("Declared_Value")
            or container_data.get("declared_value", 0)
            or 0
        ),
        "Declared_Weight": float(
            container_data.get("Declared_Weight")
            or container_data.get("declared_weight", 0)
            or 0
        ),
        "Measured_Weight": float(
            container_data.get("Measured_Weight")
            or container_data.get("measured_weight", 0)
            or 0
        ),
        "Shipping_Line": str(
            container_data.get("Shipping_Line")
            or container_data.get("shipping_line", "")
        ),
        "Dwell_Time_Hours": float(
            container_data.get("Dwell_Time_Hours")
            or container_data.get("dwell_time_hours", 0)
            or 0
        ),
        "Clearance_Status": str(
            container_data.get("Clearance_Status")
            or container_data.get("clearance_status", "Clear")
        ),
        "Risk_Score": float(
            container_data.get("Risk_Score") or container_data.get("risk_score", 0) or 0
        ),
        "Risk_Level": str(
            container_data.get("Risk_Level")
            or container_data.get("risk_level", "LOW")
            or "LOW"
        ),
    }

    # Append to CSV file
    try:
        if CONTAINERS_CSV.exists():
            df = pd.read_csv(CONTAINERS_CSV)
            # Only include columns that exist in the target CSV
            cols_to_use = {k: v for k, v in record.items() if k in df.columns}
            df = pd.concat([df, pd.DataFrame([cols_to_use])], ignore_index=True)
            df.to_csv(CONTAINERS_CSV, index=False)
            print(f"✓ Container {container_id} saved to CSV")
    except Exception as e:
        print(f"Error saving to CSV: {e}")

    # Store in memory cache
    _risk_assessment_cache[container_id] = {
        "container_id": container_id,
        "risk_score": record.get("Risk_Score", 0),
        "risk_level": record.get("Risk_Level", "LOW"),
    }

    # Reload cache
    global _containers_cache
    _containers_cache = None

    # Return record
    return {"container_id": container_id, **record}


def save_risk_assessment(
    container_id: str, risk_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Save or update risk assessment for a container."""
    container_id = str(container_id)
    _risk_assessment_cache[container_id] = {
        "container_id": container_id,
        "risk_score": risk_data.get("risk_score", risk_data.get("Risk_Score", 0)),
        "risk_level": risk_data.get("risk_level", risk_data.get("Risk_Level", "LOW")),
    }

    # Try to update CSV
    df = _load_containers()
    if not df.empty:
        # Handle both column name formats
        container_col = None
        if "Container_ID" in df.columns:
            container_col = "Container_ID"
        elif "container_id" in df.columns:
            container_col = "container_id"

        if container_col:
            mask = df[container_col].astype(str) == container_id
            if mask.any():
                risk_score_col = (
                    "Risk_Score" if "Risk_Score" in df.columns else "risk_score"
                )
                risk_level_col = (
                    "Risk_Level" if "Risk_Level" in df.columns else "risk_level"
                )

                df.loc[mask, risk_score_col] = risk_data.get(
                    "risk_score", risk_data.get("Risk_Score", 0)
                )
                df.loc[mask, risk_level_col] = risk_data.get(
                    "risk_level", risk_data.get("Risk_Level", "LOW")
                )

                # Save back to CSV
                if CONTAINERS_CSV.exists():
                    try:
                        df.to_csv(CONTAINERS_CSV, index=False)
                        print(f"✓ Risk assessment saved for {container_id}")
                    except Exception as e:
                        print(f"Error updating CSV: {e}")

    return _risk_assessment_cache[container_id]
