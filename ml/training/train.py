"""
ML Training Pipeline
--------------------
Trains an ensemble model (RandomForest + GradientBoosting + LogisticRegression)
on the historical container data and saves the model for the backend to use.

Usage (from project root):
    python ml/train.py
"""
import pandas as pd
import numpy as np
import joblib
import matplotlib
matplotlib.use("Agg")  # non-interactive backend for servers
import matplotlib.pyplot as plt

from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, classification_report


# ---------------------------------------------------
# Paths (relative to project root)
# ---------------------------------------------------

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

DATA_PATH = _PROJECT_ROOT / "data" / "datasets" / "Historical Data.csv"

MODEL_PATH = _PROJECT_ROOT / "backend" / "models" / "risk_model.joblib"


# ---------------------------------------------------
# Feature Columns
# ---------------------------------------------------

FEATURE_COLUMNS = [
    "weight_ratio",
    "weight_deviation_percent",
    "value_weight_ratio",
    "log_value_weight_ratio",
    "shipment_hour",
    "shipment_dayofweek",
    "dwell_time_hours"
]


# ---------------------------------------------------
# Load Dataset
# ---------------------------------------------------

def load_dataset():

    df = pd.read_csv(DATA_PATH)

    print("Dataset Loaded")
    print("Rows:", len(df))

    return df


# ---------------------------------------------------
# Feature Engineering
# ---------------------------------------------------

def build_features(df):

    df = df.copy()

    # Prevent division by zero
    df["Declared_Weight"] = df["Declared_Weight"].replace(0, 1)

    # Weight features
    df["weight_difference"] = df["Measured_Weight"] - df["Declared_Weight"]

    df["weight_ratio"] = df["Measured_Weight"] / df["Declared_Weight"]

    df["weight_deviation_percent"] = (
        abs(df["weight_difference"]) / df["Declared_Weight"]
    )

    # Value features
    df["value_weight_ratio"] = df["Declared_Value"] / df["Declared_Weight"]

    df["log_value_weight_ratio"] = np.log1p(df["value_weight_ratio"])

    # Time features
    df["Declaration_Date (YYYY-MM-DD)"] = pd.to_datetime(
        df["Declaration_Date (YYYY-MM-DD)"]
    )

    df["shipment_dayofweek"] = df["Declaration_Date (YYYY-MM-DD)"].dt.dayofweek

    df["shipment_hour"] = pd.to_datetime(
        df["Declaration_Time"], format="%H:%M:%S", errors="coerce"
    ).dt.hour

    # Dwell time
    df["dwell_time_hours"] = df["Dwell_Time_Hours"]

    # Replace problematic values
    df.replace([np.inf, -np.inf], np.nan, inplace=True)

    df.fillna(0, inplace=True)

    return df


# ---------------------------------------------------
# Prepare Training Dataset
# ---------------------------------------------------

def prepare_dataset(df):

    df = build_features(df)

    # Label creation
    df["label"] = (df["Clearance_Status"] == "Critical").astype(int)

    X = df[FEATURE_COLUMNS].fillna(0)

    y = df["label"]

    return X, y


# ---------------------------------------------------
# Train Models
# ---------------------------------------------------

def train_models(X_train, y_train):

    print("Training RandomForest...")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        random_state=42
    )

    print("Training GradientBoosting...")
    gb = GradientBoostingClassifier()

    print("Training LogisticRegression...")
    lr = LogisticRegression(max_iter=1000)

    rf.fit(X_train, y_train)
    gb.fit(X_train, y_train)
    lr.fit(X_train, y_train)

    return rf, gb, lr


# ---------------------------------------------------
# Evaluate Models
# ---------------------------------------------------

def evaluate_models(rf, gb, lr, X_test, y_test):

    rf_pred = rf.predict_proba(X_test)[:, 1]
    gb_pred = gb.predict_proba(X_test)[:, 1]
    lr_pred = lr.predict_proba(X_test)[:, 1]

    ensemble_pred = (
        0.5 * rf_pred +
        0.3 * gb_pred +
        0.2 * lr_pred
    )

    auc = roc_auc_score(y_test, ensemble_pred)

    print("\nModel Evaluation")
    print("----------------")
    print("ROC-AUC:", auc)

    predictions = (ensemble_pred > 0.5).astype(int)

    print("\nClassification Report")
    print(classification_report(y_test, predictions))


# ---------------------------------------------------
# Save Model
# ---------------------------------------------------

def save_model(rf, gb, lr):

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    model_package = {
        "rf": rf,
        "gb": gb,
        "lr": lr,
        "features": FEATURE_COLUMNS
    }

    joblib.dump(model_package, MODEL_PATH)

    print("\nModel saved to:", MODEL_PATH)


# ---------------------------------------------------
# Main Training Pipeline
# ---------------------------------------------------

def main():

    print("Starting ML Training Pipeline\n")

    df = load_dataset()

    X, y = prepare_dataset(df)

    print("Training samples:", len(X))

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    rf, gb, lr = train_models(X_train, y_train)

    evaluate_models(rf, gb, lr, X_test, y_test)

    # ---------------------------------------------------
    # Overfitting Check
    # ---------------------------------------------------

    train_pred = rf.predict_proba(X_train)[:, 1]
    test_pred = rf.predict_proba(X_test)[:, 1]

    print("\nTrain AUC:", roc_auc_score(y_train, train_pred))
    print("Test AUC:", roc_auc_score(y_test, test_pred))


    # ---------------------------------------------------
    # Feature Importance Plot
    # ---------------------------------------------------

    importances = pd.Series(rf.feature_importances_, index=X_train.columns)

    importances.nlargest(10).plot(kind="barh")

    plt.title("Top 10 Feature Importances")

    plt.savefig(_PROJECT_ROOT / "ml" / "feature_importance.png", dpi=100, bbox_inches="tight")
    print("\nFeature importance plot saved to: ml/feature_importance.png")


    save_model(rf, gb, lr)

    print("\nTraining Completed")


# ---------------------------------------------------

if __name__ == "__main__":
    main()
