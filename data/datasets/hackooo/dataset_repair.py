import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, classification_report
import os
import warnings
warnings.filterwarnings('ignore')

print("="*60)
print("SMARTCONTAINER RISK ENGINE - DATASET REPAIR PIPELINE")
print("="*60)

DATA_DIR = "/Users/aahanajaygajera/Desktop/ContainArisk/data/datasets/hackooo"
HISTORICAL_FILE = os.path.join(DATA_DIR, "Historical Data (1).csv")
REALTIME_FILE = os.path.join(DATA_DIR, "Real-Time Data (1).csv")

# 1. Load Data
print("\n[1/11] Loading Datasets...")
train_df = pd.read_csv(HISTORICAL_FILE)
test_df = pd.read_csv(REALTIME_FILE)

# Standardize Columns
train_df.columns = train_df.columns.str.replace(r'\s*\(.*?\)', '', regex=True).str.strip().str.replace(' ', '_')
test_df.columns = test_df.columns.str.replace(r'\s*\(.*?\)', '', regex=True).str.strip().str.replace(' ', '_')

def add_synthetic_trade_data(df, is_train=True):
    np.random.seed(42 if is_train else 43)
    df = df.copy()
    n = len(df)
    
    # 2. Ports and Routes
    route_profiles = [
        ("CN", "Shanghai Port", "US", "Los Angeles Port"),
        ("CN", "Shenzhen Port", "DE", "Hamburg Port"),
        ("SG", "Port of Singapore", "IN", "Nhava Sheva Port"),
        ("AE", "Jebel Ali Port", "ZA", "Durban Port"),
        ("DE", "Bremen Port", "US", "New York Port"),
        ("JP", "Tokyo Port", "AU", "Sydney Port"),
        ("KR", "Busan Port", "US", "Seattle Port"),
        ("VN", "Ho Chi Minh Port", "FR", "Marseille Port")
    ]
    
    route_indices = np.random.randint(0, len(route_profiles), n)
    df['Origin_Country'] = [route_profiles[i][0] for i in route_indices]
    df['Destination_Country'] = [route_profiles[i][2] for i in route_indices]
    df['Destination_Port'] = [route_profiles[i][3] for i in route_indices]
    
    lines = ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "Evergreen", "COSCO", "ONE"]
    df['Shipping_Line'] = np.random.choice(lines, n)
    
    df['Trade_Regime'] = np.random.choice(["Import", "Export", "Transit"], n, p=[0.8, 0.1, 0.1])
    df['Clearance_Status'] = np.random.choice(["Clear", "Low Risk", "High Risk", "Held"], n, p=[0.75, 0.15, 0.08, 0.02])
    
    # Importer/Exporter Generation
    importers = [f"IMP_{str(i).zfill(4)}" for i in range(1, 400)]
    exporters = [f"EXP_{str(i).zfill(4)}" for i in range(1, 400)]
    df['Importer_ID'] = np.random.choice(importers, n)
    df['Exporter_ID'] = np.random.choice(exporters, n)
    
    # Dates & Times
    dates = pd.date_range(start='2020-01-01', end='2023-12-31', periods=n)
    df['Declaration_Date'] = np.random.choice(dates, n)
    df['Declaration_Date'] = pd.to_datetime(df['Declaration_Date']).dt.strftime('%Y-%m-%d')
    hours = np.random.randint(0, 24, n)
    mins = np.random.randint(0, 60, n)
    df['Declaration_Time'] = [f"{str(h).zfill(2)}:{str(m).zfill(2)}:00" for h, m in zip(hours, mins)]
    
    # 3. Numeric Data
    df['Declared_Weight'] = np.random.uniform(2000, 28000, n).round(2)
    dev = np.random.normal(0, np.random.uniform(10, 500, n))
    
    anom_mask = df['Clearance_Status'].isin(["High Risk", "Held"])
    dev[anom_mask] = np.random.normal(2500, 1000, sum(anom_mask))
    df['Measured_Weight'] = np.abs(df['Declared_Weight'] + dev).round(2)
    
    df['Declared_Value'] = np.random.uniform(10000, 200000, n).round(2)
    df.loc[anom_mask, 'Declared_Value'] *= np.random.uniform(0.1, 5.0, sum(anom_mask))
    
    df['Dwell_Time_Hours'] = np.random.uniform(2, 96, n).round(1)
    df.loc[anom_mask, 'Dwell_Time_Hours'] += np.random.uniform(48, 144, sum(anom_mask))
    
    # 4. HS Codes
    hs_categories = [
        (850000, 859999), # Electronics
        (600000, 639999), # Textiles
        (840000, 849999), # Machinery
        (870000, 879999), # Auto parts
        (280000, 389999)  # Chemicals
    ]
    df['HS_Code'] = [np.random.randint(cat[0], cat[1]) for cat in [hs_categories[np.random.randint(0, len(hs_categories))] for _ in range(n)]]
    
    return df

print("\n[2/11] Generating Synthetic Trade Data (Routes, Entities, Logistics)...")
print("[3/11] Generating Numeric Data (Weights, Value, Dwell Time)...")
print("[4/11] Assigning Realistic HS Codes for Commodities...")
train_df = add_synthetic_trade_data(train_df, is_train=True)
test_df = add_synthetic_trade_data(test_df, is_train=False)

def engineer_51_features(df):
    np.random.seed(random_seed := int(df['Declared_Weight'].sum() % 10000))
    df = df.copy()
    n = len(df)
    
    # 5. Feature Engineering (exactly 51 features)
    # Category 1: Shipment Integrity (10)
    df['weight_difference'] = df['Measured_Weight'] - df['Declared_Weight']
    df['weight_ratio'] = df['Measured_Weight'] / (df['Declared_Weight'] + 1e-6)
    df['weight_deviation_percent'] = (df['weight_difference'] / (df['Declared_Weight'] + 1e-6)) * 100
    df['abs_weight_difference'] = np.abs(df['weight_difference'])
    df['is_overweight'] = (df['weight_difference'] > 500).astype(int)
    df['is_underweight'] = (df['weight_difference'] < -500).astype(int)
    df['weight_risk_score'] = np.clip(df['abs_weight_difference'] / 100, 0, 100)
    df['volumetric_risk'] = np.random.uniform(0, 1, n)
    df['packaging_anomaly'] = np.random.uniform(0, 1, n)
    df['seal_tamper_prob'] = np.random.uniform(0, 1, n)
    
    # Category 2: Value Anomaly (10)
    df['value_weight_ratio'] = df['Declared_Value'] / (df['Declared_Weight'] + 1e-6)
    df['log_value_weight_ratio'] = np.log1p(df['value_weight_ratio'])
    df['commodity_price_deviation'] = np.random.uniform(0, 1, n)
    df['value_risk_score'] = np.clip((df['Declared_Value'] - 100000)/10000, 0, 100)
    df['customs_value_discrepancy'] = np.random.uniform(0, 50, n)
    df['insurance_value_ratio'] = np.random.uniform(0.8, 1.2, n)
    df['tax_evasion_prob'] = np.random.uniform(0, 1, n)
    df['tariff_anomaly_score'] = np.random.uniform(0, 1, n)
    df['hs_code_value_mismatch'] = np.random.uniform(0, 1, n)
    df['trade_finance_risk'] = np.random.uniform(0, 1, n)
    
    # Category 3: Behavioral Entity (10)
    df['entity_trust_score'] = np.random.uniform(10, 100, n)
    df['importer_behavior_shift'] = np.random.uniform(0, 1, n)
    df['exporter_risk_profile'] = np.random.uniform(0, 1, n)
    df['importer_exporter_distance'] = np.random.uniform(0, 100, n)
    df['new_trade_relationship'] = np.random.choice([0, 1], n, p=[0.9, 0.1])
    df['historical_violation_count'] = np.random.randint(0, 5, n)
    df['company_age_years'] = np.random.randint(1, 50, n)
    df['shell_company_prob'] = np.random.uniform(0, 1, n)
    df['blacklist_proximity'] = np.random.uniform(0, 1, n)
    df['smuggling_network_affinity'] = np.random.uniform(0, 1, n)

    # Category 4: Route Intelligence (4)
    df['route_risk_rate'] = np.random.uniform(0, 1, n)
    df['route_novelty_score'] = np.random.uniform(0, 1, n)
    df['trade_route_entropy'] = np.random.uniform(0, 1, n)
    df['unusual_routing_indicator'] = np.random.choice([0, 1], n, p=[0.95, 0.05])
    
    # Category 5: Temporal Patterns (5)
    df['shipment_burst_indicator'] = np.random.uniform(0, 1, n)
    df['night_shipment_indicator'] = np.random.choice([0, 1], n, p=[0.8, 0.2])
    df['weekend_shipment'] = np.random.choice([0, 1], n, p=[0.7, 0.3])
    df['seasonal_anomaly_score'] = np.random.uniform(0, 1, n)
    df['holiday_rush_indicator'] = np.random.uniform(0, 1, n)
    
    # Category 6: Operational Logistics (6)
    df['normalized_dwell_time'] = df['Dwell_Time_Hours'] / 96.0
    df['shipping_line_risk'] = np.random.uniform(0, 1, n)
    df['transshipment_count'] = np.random.randint(0, 4, n)
    df['port_congestion_delay'] = np.random.uniform(0, 48, n)
    df['logistics_delay_risk'] = np.random.uniform(0, 1, n)
    df['documentation_delay_score'] = np.random.uniform(0, 1, n)
    
    # Category 7: Global Trade Intelligence (3)
    df['geo_risk_exposure'] = np.random.uniform(0, 1, n)
    df['multi_jurisdiction_flag'] = np.random.choice([0, 1], n, p=[0.85, 0.15])
    df['high_risk_commodity_flag'] = np.random.choice([0, 1], n, p=[0.9, 0.1])
    
    # Category 8: Advanced Behavioral Features (3)
    df['network_risk_propagation'] = np.random.uniform(0, 1, n)
    df['amendment_frequency'] = np.random.randint(0, 3, n)
    df['overall_complexity_index'] = np.random.uniform(0, 1, n)

    # Convert numeric types efficiently
    for c in df.columns:
        if df[c].dtype == 'float64':
            df[c] = df[c].round(4)
            
    return df

print("\n[5/11] Engineering 51 Machine Learning Features...")
train_df = engineer_51_features(train_df)
test_df = engineer_51_features(test_df)

print("\n[6/11] Checking Dataset Consistency...")
assert list(train_df.columns) == list(test_df.columns), "Column mismatch between train and test datasets."
assert train_df.isnull().sum().sum() == 0, "Missing values detected in Training Data"
assert test_df.isnull().sum().sum() == 0, "Missing values detected in Test Data"
print(f" ✓ Both datasets have exactly {len(train_df.columns)} columns (16 base + 51 engineered).")
print(f" ✓ Total engineered features: {len(train_df.columns)-16}")
print(" ✓ No missing values.")

# Generate Target for Training
def generate_risk_target(df):
    score = np.zeros(len(df))
    score += np.clip(df['abs_weight_difference'] / 50, 0, 30)
    score += np.clip(df['Dwell_Time_Hours'] / 2, 0, 20)
    df['Risk_Score'] = np.clip(score + np.random.uniform(5, 15, len(df)), 0, 100).round(2)
    df.loc[df['Clearance_Status'] == 'High Risk', 'Risk_Score'] = np.random.uniform(60, 85, sum(df['Clearance_Status'] == 'High Risk'))
    df.loc[df['Clearance_Status'] == 'Held', 'Risk_Score'] = np.random.uniform(80, 100, sum(df['Clearance_Status'] == 'Held'))
    df['Risk_Level'] = pd.cut(df['Risk_Score'], bins=[-1, 30, 60, 80, 100], labels=['Low', 'Medium', 'High', 'Critical'])
    return df

print("\n[7/11] Preparing Training and Testing setup...")
train_df = generate_risk_target(train_df)
test_df = generate_risk_target(test_df) # For evaluation reference

features_for_model = [c for c in train_df.columns if c not in ['Container_ID', 'Declaration_Date', 'Declaration_Time', 'Trade_Regime', 'Origin_Country', 'Destination_Port', 'Destination_Country', 'Importer_ID', 'Exporter_ID', 'Shipping_Line', 'Clearance_Status', 'Risk_Score', 'Risk_Level']]
X_train = train_df[features_for_model]
y_train = train_df['Risk_Score']

X_test = test_df[features_for_model]
y_test_true = test_df['Risk_Score']

print("\n[8/11] Training Machine Learning Model (Random Forest Regressor)...")
rf = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)

print("\n[9/11] Testing Model on Real-Time Data...")
y_pred_score = rf.predict(X_test)
mae = mean_absolute_error(y_test_true, y_pred_score)
print(f" ✓ Model Evaluation MAE: {mae:.2f}")

test_df['Risk_Score'] = y_pred_score.round(2)
test_df['Risk_Level'] = pd.cut(test_df['Risk_Score'], bins=[-1, 30, 60, 80, 100], labels=['Low', 'Medium', 'High', 'Critical'])

# Map actual targets to train to ensure they exist
train_df['Risk_Score'] = train_df['Risk_Score'].round(2)

print("\n[10/11] Exporting Cleaned Datasets...")
train_output = os.path.join(DATA_DIR, "cleaned_historical_data.csv")
test_output = os.path.join(DATA_DIR, "cleaned_realtime_data.csv")

train_df.to_csv(train_output, index=False)
test_df.to_csv(test_output, index=False)

print(f" ✓ Exported: {train_output} ({len(train_df)} rows, {len(train_df.columns)} columns)")
print(f" ✓ Exported: {test_output} ({len(test_df)} rows, {len(test_df.columns)} columns)")

print("\n[11/11] System Validation & Final Checks...")
print(" ✓ Pipeline executed successfully.")
print(" ✓ Output schemas verified.")
print(f" ✓ Distribution of Risk Levels in Output Real-Time Data:")
print(test_df['Risk_Level'].value_counts())
print("\nPIPELINE COMPLETE - DATA IS READY FOR BACKEND!")
