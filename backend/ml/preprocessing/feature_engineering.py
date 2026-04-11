"""
Feature Engineering Module
--------------------------
Transforms the raw 16-column shipment CSV into a 51+ feature dataset
for the anomaly detection pipeline.

Raw columns (16):
    Container_ID, Declaration_Date (YYYY-MM-DD), Declaration_Time,
    Trade_Regime (Import / Export / Transit), Origin_Country,
    Destination_Port, Destination_Country, HS_Code, Importer_ID,
    Exporter_ID, Declared_Value, Declared_Weight, Measured_Weight,
    Shipping_Line, Dwell_Time_Hours, Clearance_Status

Output columns (51 numeric features + optional derived):
    See FEATURE_COLUMNS list below.
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# The 51 core feature columns (matching processed_historical_dataset.csv)
FEATURE_COLUMNS = [
    "hs_code",
    "declared_value",
    "declared_weight",
    "measured_weight",
    "dwell_time_hours",
    "weight_difference",
    "weight_ratio",
    "weight_deviation_percent",
    "weight_risk_score",
    "value_weight_ratio",
    "log_value_weight_ratio",
    "value_deviation_from_hs_average",
    "value_risk_score",
    "importer_shipment_count",
    "importer_average_shipment_value",
    "importer_behavior_shift",
    "exporter_shipment_count",
    "exporter_average_shipment_value",
    "exporter_behavior_shift",
    "entity_trust_score",
    "entity_activity_spike",
    "route_frequency",
    "route_risk_rate",
    "route_novelty_score",
    "port_risk_score",
    "hour_of_declaration",
    "night_shipment_indicator",
    "weekend_shipment_indicator",
    "shipment_interval",
    "shipment_burst_indicator",
    "normalized_dwell_time",
    "shipping_line_risk",
    "clearance_delay_indicator",
    "commodity_price_deviation",
    "hs_code_risk_score",
    "global_trade_ratio",
    "trade_route_entropy",
    "importer_behavior_shift_score",
    "shipment_chain_risk",
    "network_risk_propagation",
    "entity_trust_index",
    "route_stability_score",
    "trade_regime_encoded",
    "clearance_status_encoded",
    "origin_country_freq",
    "destination_country_freq",
    "destination_port_freq",
    "importer_id_freq",
    "exporter_id_freq",
    "shipping_line_freq",
    "route_identifier_freq",
]

# Additional derived feature columns
DERIVED_FEATURE_COLUMNS = [
    "value_zscore",
    "weight_zscore",
    "risk_percentile",
    "value_weight_anomaly_score",
    "entity_route_risk_score",
    "importer_value_spike",
    "exporter_route_variation",
]

TARGET_COLUMN = "clearance_status_encoded"


# ---------------------------------------------------------------------------
# Helper: standardise raw column names
# ---------------------------------------------------------------------------

def _standardise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Strip parenthetical suffixes and normalise whitespace."""
    df = df.copy()
    df.columns = (
        df.columns
        .str.replace(r"\s*\(.*?\)", "", regex=True)
        .str.strip()
        .str.replace(" ", "_")
    )
    return df


# ---------------------------------------------------------------------------
# Main feature engineering function
# ---------------------------------------------------------------------------

def engineer_features(
    df: pd.DataFrame,
    stats: dict | None = None,
    fit_mode: bool = False,
) -> tuple[pd.DataFrame, dict]:
    """
    Transform raw shipment data into engineered feature set.

    Parameters
    ----------
    df : pd.DataFrame
        Raw dataframe with 16 columns.
    stats : dict or None
        Pre-computed statistics (from training set). Required when
        fit_mode=False (inference).
    fit_mode : bool
        If True, compute statistics from *this* dataframe and return them.
        If False, use the provided ``stats`` dict.

    Returns
    -------
    (features_df, stats_dict)
        features_df has all 51 core + derived columns.
        stats_dict holds computed aggregates (pass to inference later).
    """
    df = _standardise_columns(df)

    if stats is None:
        stats = {}

    # ------------------------------------------------------------------
    # 1. Pass-through numeric columns
    # ------------------------------------------------------------------
    df["HS_Code"] = pd.to_numeric(df["HS_Code"], errors="coerce").fillna(0).astype("int64")
    df["hs_code"] = df["HS_Code"].astype(float)
    df["declared_value"] = df["Declared_Value"].astype(float)
    df["declared_weight"] = df["Declared_Weight"].astype(float).replace(0, 1e-6)
    df["measured_weight"] = df["Measured_Weight"].astype(float)
    df["dwell_time_hours"] = df["Dwell_Time_Hours"].astype(float)

    # ------------------------------------------------------------------
    # 2. Weight features
    # ------------------------------------------------------------------
    df["weight_difference"] = df["measured_weight"] - df["declared_weight"]
    df["weight_ratio"] = df["measured_weight"] / df["declared_weight"]
    df["weight_deviation_percent"] = (
        np.abs(df["weight_difference"]) / df["declared_weight"]
    )
    # Risk score: higher deviation → higher risk (sigmoid-like)
    df["weight_risk_score"] = 1 / (1 + np.exp(-5 * (df["weight_deviation_percent"] - 0.1)))

    # ------------------------------------------------------------------
    # 3. Value features
    # ------------------------------------------------------------------
    df["value_weight_ratio"] = df["declared_value"] / df["declared_weight"]
    df["log_value_weight_ratio"] = np.log1p(df["value_weight_ratio"])

    # HS-code level value stats
    if fit_mode:
        hs_value_stats = df.groupby("HS_Code")["declared_value"].agg(["mean", "std"]).fillna(0)
        hs_value_stats.columns = ["hs_value_mean", "hs_value_std"]
        hs_value_stats["hs_value_std"] = hs_value_stats["hs_value_std"].replace(0, 1)
        stats["hs_value_stats"] = hs_value_stats

    hs_vs = stats["hs_value_stats"]
    df = df.merge(hs_vs, left_on="HS_Code", right_index=True, how="left")
    df["hs_value_mean"] = df["hs_value_mean"].fillna(df["declared_value"].mean())
    df["hs_value_std"] = df["hs_value_std"].fillna(1)

    df["value_deviation_from_hs_average"] = (
        (df["declared_value"] - df["hs_value_mean"]) / df["hs_value_std"]
    )
    df["value_risk_score"] = 1 / (
        1 + np.exp(-2 * (np.abs(df["value_deviation_from_hs_average"]) - 1))
    )

    # ------------------------------------------------------------------
    # 4. Entity / behavioral features
    # ------------------------------------------------------------------
    for entity, col in [("importer", "Importer_ID"), ("exporter", "Exporter_ID")]:
        if fit_mode:
            entity_stats = df.groupby(col).agg(
                shipment_count=("declared_value", "count"),
                avg_value=("declared_value", "mean"),
                std_value=("declared_value", "std"),
            ).fillna(0)
            entity_stats["std_value"] = entity_stats["std_value"].replace(0, 1)
            stats[f"{entity}_stats"] = entity_stats

        es = stats[f"{entity}_stats"]
        df = df.merge(
            es, left_on=col, right_index=True, how="left", suffixes=("", f"_{entity}")
        )

        df[f"{entity}_shipment_count"] = df["shipment_count"].fillna(1)
        df[f"{entity}_average_shipment_value"] = df["avg_value"].fillna(
            df["declared_value"].mean()
        )
        shift = (df["declared_value"] - df["avg_value"].fillna(df["declared_value"])) / (
            df["std_value"].fillna(1)
        )
        df[f"{entity}_behavior_shift"] = shift.fillna(0)

        df.drop(columns=["shipment_count", "avg_value", "std_value"], inplace=True, errors="ignore")

    # Trust & activity
    df["entity_trust_score"] = (
        np.clip(df["importer_shipment_count"], 0, 100) / 100 * 0.5
        + np.clip(df["exporter_shipment_count"], 0, 100) / 100 * 0.5
    )
    df["entity_activity_spike"] = (
        (df["importer_behavior_shift"].abs() > 2)
        | (df["exporter_behavior_shift"].abs() > 2)
    ).astype(int)

    # ------------------------------------------------------------------
    # 5. Route features
    # ------------------------------------------------------------------
    df["route_id"] = df["Origin_Country"] + "_" + df["Destination_Country"]

    if fit_mode:
        route_stats = df.groupby("route_id").agg(
            route_count=("declared_value", "count"),
            route_critical_count=(
                "Clearance_Status",
                lambda x: (x == "Critical").sum(),
            ),
        )
        route_stats["route_risk_rate"] = (
            route_stats["route_critical_count"] / route_stats["route_count"]
        )
        total_routes = len(route_stats)
        route_stats["route_novelty_score"] = 1 - (
            route_stats["route_count"] / route_stats["route_count"].max()
        )
        stats["route_stats"] = route_stats
        stats["total_routes"] = total_routes

    rs = stats["route_stats"]
    df = df.merge(rs[["route_count", "route_risk_rate", "route_novelty_score"]],
                  left_on="route_id", right_index=True, how="left")
    df["route_frequency"] = df["route_count"].fillna(1)
    df["route_risk_rate"] = df["route_risk_rate"].fillna(0)
    df["route_novelty_score"] = df["route_novelty_score"].fillna(1)
    df.drop(columns=["route_count"], inplace=True, errors="ignore")

    # Port risk
    if fit_mode:
        port_risk = df.groupby("Destination_Port").apply(
            lambda x: (x["Clearance_Status"] == "Critical").sum() / len(x),
            include_groups=False,
        )
        stats["port_risk"] = port_risk

    df["port_risk_score"] = (
        df["Destination_Port"].map(stats["port_risk"]).fillna(0)
    )

    # ------------------------------------------------------------------
    # 6. Time features
    # ------------------------------------------------------------------
    df["Declaration_Time"] = pd.to_datetime(
        df["Declaration_Time"], format="%H:%M:%S", errors="coerce"
    )
    df["hour_of_declaration"] = df["Declaration_Time"].dt.hour.fillna(12).astype(float)
    df["night_shipment_indicator"] = (
        (df["hour_of_declaration"] >= 22) | (df["hour_of_declaration"] <= 5)
    ).astype(int)

    df["Declaration_Date"] = pd.to_datetime(
        df["Declaration_Date"], errors="coerce"
    )
    df["weekend_shipment_indicator"] = (
        df["Declaration_Date"].dt.dayofweek >= 5
    ).astype(int)

    # Shipment interval (per importer, sorted by date)
    df = df.sort_values(["Importer_ID", "Declaration_Date"])
    df["shipment_interval"] = (
        df.groupby("Importer_ID")["Declaration_Date"]
        .diff()
        .dt.total_seconds()
        .div(3600)
        .fillna(0)
    )
    df["shipment_burst_indicator"] = (df["shipment_interval"] < 24).astype(int)

    # ------------------------------------------------------------------
    # 7. Dwell / compliance features
    # ------------------------------------------------------------------
    if fit_mode:
        stats["dwell_mean"] = df["dwell_time_hours"].mean()
        stats["dwell_std"] = max(df["dwell_time_hours"].std(), 1e-6)

    df["normalized_dwell_time"] = (
        (df["dwell_time_hours"] - stats["dwell_mean"]) / stats["dwell_std"]
    )
    df["clearance_delay_indicator"] = (df["normalized_dwell_time"] > 2).astype(int)

    # Shipping line risk
    if fit_mode:
        sl_risk = df.groupby("Shipping_Line").apply(
            lambda x: (x["Clearance_Status"] == "Critical").sum() / len(x),
            include_groups=False,
        )
        stats["shipping_line_risk"] = sl_risk

    df["shipping_line_risk"] = (
        df["Shipping_Line"].map(stats["shipping_line_risk"]).fillna(0)
    )

    # Commodity price deviation (value vs HS-code median)
    if fit_mode:
        hs_median_value = df.groupby("HS_Code")["declared_value"].median()
        stats["hs_median_value"] = hs_median_value

    hs_med = stats["hs_median_value"]
    df["commodity_price_deviation"] = (
        (df["declared_value"] - df["HS_Code"].map(hs_med).fillna(df["declared_value"].median()))
        / df["HS_Code"].map(hs_med).fillna(df["declared_value"].median()).replace(0, 1)
    )

    # HS code risk score
    if fit_mode:
        hs_risk = df.groupby("HS_Code").apply(
            lambda x: (x["Clearance_Status"] == "Critical").sum() / len(x),
            include_groups=False,
        )
        stats["hs_code_risk"] = hs_risk

    df["hs_code_risk_score"] = df["HS_Code"].map(stats["hs_code_risk"]).fillna(0)

    # ------------------------------------------------------------------
    # 8. Global / network features
    # ------------------------------------------------------------------
    df["global_trade_ratio"] = df["declared_value"] / (
        df["declared_value"].mean() + 1e-6
    )

    # Trade route entropy (per importer)
    if fit_mode:
        importer_route_counts = df.groupby("Importer_ID")["route_id"].nunique()
        stats["importer_route_entropy"] = importer_route_counts

    ire = stats["importer_route_entropy"]
    df["trade_route_entropy"] = df["Importer_ID"].map(ire).fillna(1).astype(float)
    df["trade_route_entropy"] = np.log1p(df["trade_route_entropy"])

    # Importer behavior shift score (composite)
    df["importer_behavior_shift_score"] = (
        df["importer_behavior_shift"].abs() * df["value_risk_score"]
    )

    # Shipment chain risk (route risk * entity trust inverse)
    df["shipment_chain_risk"] = (
        df["route_risk_rate"] * (1 - df["entity_trust_score"])
    )

    # Network risk propagation
    df["network_risk_propagation"] = (
        df["shipping_line_risk"] * 0.3
        + df["port_risk_score"] * 0.3
        + df["route_risk_rate"] * 0.4
    )

    # Entity trust index (refined)
    df["entity_trust_index"] = (
        df["entity_trust_score"] * (1 - df["network_risk_propagation"])
    )

    # Route stability score
    if fit_mode:
        route_std = df.groupby("route_id")["declared_value"].std().fillna(0)
        route_mean = df.groupby("route_id")["declared_value"].mean().fillna(1)
        route_cv = (route_std / route_mean.replace(0, 1)).fillna(0)
        stats["route_stability"] = 1 - route_cv.clip(0, 1)

    df["route_stability_score"] = (
        df["route_id"].map(stats["route_stability"]).fillna(0.5)
    )

    # ------------------------------------------------------------------
    # 9. Categorical encodings
    # ------------------------------------------------------------------
    # Trade regime
    trade_regime_map = {"Import": 0, "Export": 1, "Transit": 2}
    df["trade_regime_encoded"] = df["Trade_Regime"].map(trade_regime_map).fillna(0).astype(int)

    # Clearance status (TARGET)
    clearance_map = {"Clear": 0, "Low Risk": 1, "Critical": 2}
    df["clearance_status_encoded"] = (
        df["Clearance_Status"].map(clearance_map).fillna(0).astype(int)
    )

    # Frequency encodings
    freq_cols = {
        "Origin_Country": "origin_country_freq",
        "Destination_Country": "destination_country_freq",
        "Destination_Port": "destination_port_freq",
        "Importer_ID": "importer_id_freq",
        "Exporter_ID": "exporter_id_freq",
        "Shipping_Line": "shipping_line_freq",
    }
    for raw_col, feat_col in freq_cols.items():
        if fit_mode:
            freq_map = df[raw_col].value_counts(normalize=True).to_dict()
            stats[f"freq_{raw_col}"] = freq_map
        df[feat_col] = df[raw_col].map(stats[f"freq_{raw_col}"]).fillna(0)

    # Route identifier frequency
    if fit_mode:
        route_freq_map = df["route_id"].value_counts(normalize=True).to_dict()
        stats["freq_route_id"] = route_freq_map
    df["route_identifier_freq"] = df["route_id"].map(stats["freq_route_id"]).fillna(0)

    # ------------------------------------------------------------------
    # 10. Additional derived features (bonus)
    # ------------------------------------------------------------------
    if fit_mode:
        stats["value_mean"] = df["declared_value"].mean()
        stats["value_std"] = max(df["declared_value"].std(), 1e-6)
        stats["weight_mean"] = df["declared_weight"].mean()
        stats["weight_std"] = max(df["declared_weight"].std(), 1e-6)

    df["value_zscore"] = (df["declared_value"] - stats["value_mean"]) / stats["value_std"]
    df["weight_zscore"] = (df["declared_weight"] - stats["weight_mean"]) / stats["weight_std"]

    # Risk percentile (composite of all risk scores)
    composite_risk = (
        df["weight_risk_score"] * 0.25
        + df["value_risk_score"] * 0.25
        + df["network_risk_propagation"] * 0.25
        + df["hs_code_risk_score"] * 0.25
    )
    df["risk_percentile"] = composite_risk.rank(pct=True)

    df["value_weight_anomaly_score"] = (
        df["value_zscore"].abs() * 0.5 + df["weight_zscore"].abs() * 0.5
    )

    df["entity_route_risk_score"] = (
        df["entity_trust_index"] * df["route_risk_rate"]
    )

    df["importer_value_spike"] = (df["importer_behavior_shift"].abs() > 3).astype(int)

    # Exporter route variation
    if fit_mode:
        exporter_routes = df.groupby("Exporter_ID")["route_id"].nunique()
        stats["exporter_route_variation"] = exporter_routes

    df["exporter_route_variation"] = (
        df["Exporter_ID"].map(stats["exporter_route_variation"]).fillna(1).astype(float)
    )

    # ------------------------------------------------------------------
    # 11. Clean up — keep only numeric feature columns
    # ------------------------------------------------------------------
    all_feature_cols = FEATURE_COLUMNS + DERIVED_FEATURE_COLUMNS
    for col in all_feature_cols:
        if col not in df.columns:
            df[col] = 0

    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df[all_feature_cols] = df[all_feature_cols].fillna(0)

    return df[all_feature_cols], stats


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def get_feature_and_target(df: pd.DataFrame):
    """
    Split engineered dataframe into X (features) and y (binary target).

    Target: clearance_status_encoded >= 2  →  1 (Critical / anomaly)
            else                           →  0 (Normal)
    """
    y = (df[TARGET_COLUMN] >= 2).astype(int)
    feature_cols = [c for c in df.columns if c != TARGET_COLUMN]
    X = df[feature_cols]
    return X, y


def save_stats(stats: dict, path: Path):
    """Save computed statistics to disk."""
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(stats, path)
    print(f"  Feature stats saved -> {path}")


def load_stats(path: Path) -> dict:
    """Load pre-computed statistics from disk."""
    return joblib.load(path)
