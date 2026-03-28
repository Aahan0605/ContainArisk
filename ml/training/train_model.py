"""
ML Training Pipeline — train_model.py
--------------------------------------
Trains and evaluates a RandomForestClassifier on the historical shipment
dataset with proper 5-fold stratified cross-validation, validates schema
compliance, and evaluates on the real-time dataset.

Usage (from project root):
    python ml/train_model.py

Outputs:
    ml/models/anomaly_detection_model.pkl   — trained RandomForest model
    ml/models/feature_stats.pkl             — feature engineering statistics
"""

import sys
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

# Ensure project root is on the path so we can import feature_engineering
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_PROJECT_ROOT / "ml" / "preprocessing"))

from feature_engineering import (
    engineer_features,
    get_feature_and_target,
    save_stats,
    load_stats,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
)


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

DATA_PATH = _PROJECT_ROOT / "data" / "datasets" / "hackooo" / "Historical Data (1).csv"
REALTIME_DATA_PATH = _PROJECT_ROOT / "data" / "datasets" / "hackooo" / "Real-Time Data (1).csv"
MODEL_DIR = _PROJECT_ROOT / "ml" / "models"
MODEL_PATH = MODEL_DIR / "anomaly_detection_model.pkl"
STATS_PATH = MODEL_DIR / "feature_stats.pkl"


# ---------------------------------------------------------------------------
# Schema Validation
# ---------------------------------------------------------------------------

def validate_schema(df: pd.DataFrame, dataset_name: str) -> bool:
    """
    Validate that the engineered feature dataframe matches the 51-column
    schema. Checks column names, order, numeric dtypes, NaN, and Inf values.

    Returns True if validation passes, False otherwise.
    """
    print(f"\n  Schema Validation Report -- {dataset_name}")
    print(f"  {'='*50}")

    passed = True

    # --- Shape ---
    print(f"  Shape: {df.shape}")

    # --- Column count ---
    expected_count = len(FEATURE_COLUMNS)
    # Only check feature columns (the dataframe may have derived columns too)
    schema_cols_present = [c for c in FEATURE_COLUMNS if c in df.columns]
    missing_cols = [c for c in FEATURE_COLUMNS if c not in df.columns]

    print(f"  Expected schema columns: {expected_count}")
    print(f"  Present schema columns:  {len(schema_cols_present)}")

    if missing_cols:
        print(f"  [FAIL] Missing columns: {missing_cols}")
        passed = False
    else:
        print(f"  [OK] All {expected_count} schema columns present")

    # --- Column order ---
    df_feature_cols = [c for c in df.columns if c in FEATURE_COLUMNS]
    order_match = df_feature_cols == FEATURE_COLUMNS
    print(f"  Column order match: {order_match}")
    if not order_match:
        passed = False

    # --- All numeric ---
    non_numeric = []
    for col in FEATURE_COLUMNS:
        if col in df.columns and not np.issubdtype(df[col].dtype, np.number):
            non_numeric.append(col)

    if non_numeric:
        print(f"  [FAIL] Non-numeric columns: {non_numeric}")
        passed = False
    else:
        print(f"  [OK] All columns are numeric")

    # --- NaN check ---
    nan_count = df[FEATURE_COLUMNS].isna().sum().sum()
    print(f"  NaN count: {nan_count}")
    if nan_count > 0:
        print(f"  [FAIL] Found {nan_count} NaN values")
        passed = False
    else:
        print(f"  [OK] No NaN values")

    # --- Inf check ---
    inf_count = np.isinf(df[FEATURE_COLUMNS].select_dtypes(include=[np.number])).sum().sum()
    print(f"  Inf count: {inf_count}")
    if inf_count > 0:
        print(f"  [FAIL] Found {inf_count} infinite values")
        passed = False
    else:
        print(f"  [OK] No infinite values")

    # --- Final status ---
    status = "PASSED" if passed else "FAILED"
    print(f"\n  Validation Status: {status}")
    print(f"  {'='*50}")

    return passed


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def main():
    print("=" * 70)
    print("  SHIPMENT ANOMALY DETECTION — TRAINING PIPELINE")
    print("=" * 70)

    # ----- 1. Load Data -----
    print("\n[1/12] Loading historical dataset ...")
    df_raw = pd.read_csv(DATA_PATH)
    print(f"  Rows : {len(df_raw):,}")
    print(f"  Cols : {df_raw.shape[1]}")
    print(f"  Clearance distribution:\n{df_raw['Clearance_Status'].value_counts().to_string()}")

    # ----- 2. Feature Engineering -----
    print("\n[2/12] Engineering features (fit mode) ...")
    df_feat, stats = engineer_features(df_raw, fit_mode=True)
    print(f"  Feature columns : {df_feat.shape[1]}")
    print(f"  Rows            : {df_feat.shape[0]:,}")

    # ----- 3. Schema Validation (Historical) -----
    print("\n[3/12] Validating schema (Historical) ...")
    hist_valid = validate_schema(df_feat, "Historical Dataset")
    if not hist_valid:
        print("\n  [!] WARNING: Historical dataset schema validation failed!")
        print("  Continuing with available columns...")

    # ----- 4. Separate Features & Target -----
    print("\n[4/12] Separating features and target ...")
    X, y = get_feature_and_target(df_feat)
    print(f"  Features shape : {X.shape}")
    print(f"  Target balance : {y.value_counts().to_dict()}")
    print(f"  Anomaly rate   : {y.mean():.4f}")

    # ----- 5. Train / Test Split (80/20) -----
    print("\n[5/12] Splitting data (80/20, stratified) ...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        stratify=y,
        random_state=42,
    )
    print(f"  Train : {X_train.shape[0]:,} samples")
    print(f"  Test  : {X_test.shape[0]:,} samples")

    # ----- 6. Build Model (regularised RF) -----
    print("\n[6/12] Building RandomForest with regularisation ...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=10,
        min_samples_leaf=5,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    print("  Parameters:")
    for k, v in model.get_params().items():
        if k in [
            "n_estimators", "max_depth", "min_samples_split",
            "min_samples_leaf", "max_features", "class_weight",
        ]:
            print(f"    {k:25s} = {v}")

    # ----- 7. 5-Fold Stratified Cross Validation (Historical) -----
    print("\n[7/12] 5-fold Stratified Cross Validation (Historical) ...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    cv_accuracy  = cross_val_score(model, X_train, y_train, cv=skf, scoring="accuracy",  n_jobs=-1)
    cv_precision = cross_val_score(model, X_train, y_train, cv=skf, scoring="precision", n_jobs=-1)
    cv_recall    = cross_val_score(model, X_train, y_train, cv=skf, scoring="recall",    n_jobs=-1)
    cv_f1        = cross_val_score(model, X_train, y_train, cv=skf, scoring="f1",        n_jobs=-1)

    print(f"\n  {'Metric':<15} {'Mean':>8} {'Std':>8}")
    print(f"  {'-'*33}")
    print(f"  {'Accuracy':<15} {cv_accuracy.mean():>8.4f} {cv_accuracy.std():>8.4f}")
    print(f"  {'Precision':<15} {cv_precision.mean():>8.4f} {cv_precision.std():>8.4f}")
    print(f"  {'Recall':<15} {cv_recall.mean():>8.4f} {cv_recall.std():>8.4f}")
    print(f"  {'F1 Score':<15} {cv_f1.mean():>8.4f} {cv_f1.std():>8.4f}")

    print(f"\n  Per-fold Accuracy : {np.round(cv_accuracy, 4)}")
    print(f"  Per-fold F1       : {np.round(cv_f1, 4)}")

    # ----- 8. Train on Full Training Set -----
    print("\n[8/12] Training model on full training set ...")
    model.fit(X_train, y_train)
    print("  Training complete.")

    # ----- 9. Evaluate on Held-Out Test Set -----
    print("\n[9/12] Evaluating on held-out historical test set ...")
    y_pred = model.predict(X_test)

    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec  = recall_score(y_test, y_pred, zero_division=0)
    f1   = f1_score(y_test, y_pred, zero_division=0)

    print(f"\n  Test Accuracy  : {acc:.4f}")
    print(f"  Test Precision : {prec:.4f}")
    print(f"  Test Recall    : {rec:.4f}")
    print(f"  Test F1 Score  : {f1:.4f}")

    print(f"\n  Mean CV Accuracy : {cv_accuracy.mean():.4f}")
    print(f"  Std  CV Accuracy : {cv_accuracy.std():.4f}")

    print("\n  Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"    {'':>10} Pred 0   Pred 1")
    print(f"    {'Actual 0':>10} {cm[0][0]:>6}   {cm[0][1]:>6}")
    print(f"    {'Actual 1':>10} {cm[1][0]:>6}   {cm[1][1]:>6}")

    print("\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Normal", "Anomaly"], digits=4))

    # ----- 10. Feature Importances -----
    print("[10/12] Feature Importances (Top 20):")
    importances = pd.Series(model.feature_importances_, index=X_train.columns)
    importances = importances.sort_values(ascending=False)
    for i, (feat, imp) in enumerate(importances.head(20).items()):
        print(f"  {i+1:>3}. {feat:40s} {imp:.4f}")

    # ----- 11. Save Model & Stats -----
    print(f"\n{'='*70}")
    print("[11/12] Saving model and feature statistics ...")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, MODEL_PATH)
    print(f"  Model saved -> {MODEL_PATH}")

    save_stats(stats, STATS_PATH)

    # ----- 12. Real-Time Dataset Evaluation -----
    print(f"\n{'='*70}")
    print("[12/12] Real-Time Dataset Evaluation ...")
    print("=" * 70)

    print("\n  Loading real-time dataset ...")
    df_rt_raw = pd.read_csv(REALTIME_DATA_PATH)
    print(f"  Rows : {len(df_rt_raw):,}")
    print(f"  Cols : {df_rt_raw.shape[1]}")

    print("\n  Engineering features (inference mode) ...")
    df_rt_feat, _ = engineer_features(df_rt_raw, stats=stats, fit_mode=False)
    print(f"  Feature columns : {df_rt_feat.shape[1]}")
    print(f"  Rows            : {df_rt_feat.shape[0]:,}")

    # Schema validation (Real-Time)
    print("\n  Validating schema (Real-Time) ...")
    rt_valid = validate_schema(df_rt_feat, "Real-Time Dataset")
    if not rt_valid:
        print("\n  [!] WARNING: Real-time dataset schema validation failed!")
        print("  Continuing with available columns...")

    # Separate features and target
    X_rt, y_rt = get_feature_and_target(df_rt_feat)
    print(f"\n  Real-Time Features shape : {X_rt.shape}")
    print(f"  Real-Time Target balance : {y_rt.value_counts().to_dict()}")
    print(f"  Real-Time Anomaly rate   : {y_rt.mean():.4f}")

    # Direct evaluation on real-time data
    print("\n  --- Real-Time Direct Evaluation ---")
    y_rt_pred = model.predict(X_rt)

    rt_acc  = accuracy_score(y_rt, y_rt_pred)
    rt_prec = precision_score(y_rt, y_rt_pred, zero_division=0)
    rt_rec  = recall_score(y_rt, y_rt_pred, zero_division=0)
    rt_f1   = f1_score(y_rt, y_rt_pred, zero_division=0)

    print(f"\n  Real-Time Accuracy  : {rt_acc:.4f}")
    print(f"  Real-Time Precision : {rt_prec:.4f}")
    print(f"  Real-Time Recall    : {rt_rec:.4f}")
    print(f"  Real-Time F1 Score  : {rt_f1:.4f}")

    print("\n  Real-Time Confusion Matrix:")
    rt_cm = confusion_matrix(y_rt, y_rt_pred)
    print(f"    {'':>10} Pred 0   Pred 1")
    print(f"    {'Actual 0':>10} {rt_cm[0][0]:>6}   {rt_cm[0][1]:>6}")
    print(f"    {'Actual 1':>10} {rt_cm[1][0]:>6}   {rt_cm[1][1]:>6}")

    print("\n  Real-Time Classification Report:")
    print(classification_report(y_rt, y_rt_pred, target_names=["Normal", "Anomaly"], digits=4))

    # Cross-validation on real-time data (performance check only)
    print("  --- Real-Time 5-Fold Cross Validation (Performance Check) ---")
    print("  NOTE: This re-fits on real-time folds for scoring purposes only.")
    print("        The production model remains trained on historical data.\n")

    rt_skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Create a fresh (unfitted) model clone for CV scoring
    rt_cv_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=10,
        min_samples_leaf=5,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    rt_cv_accuracy  = cross_val_score(rt_cv_model, X_rt, y_rt, cv=rt_skf, scoring="accuracy",  n_jobs=-1)
    rt_cv_precision = cross_val_score(rt_cv_model, X_rt, y_rt, cv=rt_skf, scoring="precision", n_jobs=-1)
    rt_cv_recall    = cross_val_score(rt_cv_model, X_rt, y_rt, cv=rt_skf, scoring="recall",    n_jobs=-1)
    rt_cv_f1        = cross_val_score(rt_cv_model, X_rt, y_rt, cv=rt_skf, scoring="f1",        n_jobs=-1)

    print(f"  {'Metric':<15} {'Mean':>8} {'Std':>8}")
    print(f"  {'-'*33}")
    print(f"  {'Accuracy':<15} {rt_cv_accuracy.mean():>8.4f} {rt_cv_accuracy.std():>8.4f}")
    print(f"  {'Precision':<15} {rt_cv_precision.mean():>8.4f} {rt_cv_precision.std():>8.4f}")
    print(f"  {'Recall':<15} {rt_cv_recall.mean():>8.4f} {rt_cv_recall.std():>8.4f}")
    print(f"  {'F1 Score':<15} {rt_cv_f1.mean():>8.4f} {rt_cv_f1.std():>8.4f}")

    print(f"\n  Per-fold Accuracy : {np.round(rt_cv_accuracy, 4)}")
    print(f"  Per-fold F1       : {np.round(rt_cv_f1, 4)}")

    # ----- Summary -----
    print(f"\n{'='*70}")
    print("  PIPELINE SUMMARY")
    print(f"{'='*70}")
    print(f"  Historical Schema Valid  : {'YES' if hist_valid else 'NO'}")
    print(f"  Real-Time Schema Valid   : {'YES' if rt_valid else 'NO'}")
    print(f"  Historical CV Accuracy   : {cv_accuracy.mean():.4f} +/- {cv_accuracy.std():.4f}")
    print(f"  Historical Test Accuracy : {acc:.4f}")
    print(f"  Real-Time Accuracy       : {rt_acc:.4f}")
    print(f"  Real-Time CV Accuracy    : {rt_cv_accuracy.mean():.4f} +/- {rt_cv_accuracy.std():.4f}")
    print(f"  Model saved to           : {MODEL_PATH}")
    print(f"  Stats saved to           : {STATS_PATH}")
    print(f"\n{'='*70}")
    print("  TRAINING COMPLETE")
    print(f"{'='*70}")


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    main()
