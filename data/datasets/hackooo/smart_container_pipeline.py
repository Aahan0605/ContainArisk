"""
SmartContainer Risk Engine ML Pipeline
Two-layer architecture: Isolation Forest (unsupervised) + Random Forest/XGBoost (supervised)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

print("="*80)
print("SMARTCONTAINER RISK ENGINE - ML PIPELINE")
print("="*80)

# ============================================================================
# 1. DATA LOADING
# ============================================================================
print("\n[1/8] Loading data...")
train_df = pd.read_csv('Historical Data (1).csv')
test_df = pd.read_csv('Real-Time Data (1).csv')

# Standardize column names
train_df.columns = train_df.columns.str.replace(r'\s*\(.*?\)', '', regex=True).str.strip().str.replace(' ', '_')
test_df.columns = test_df.columns.str.replace(r'\s*\(.*?\)', '', regex=True).str.strip().str.replace(' ', '_')

print(f"Training data: {len(train_df)} rows")
print(f"Test data: {len(test_df)} rows")
print(f"Class distribution:\n{train_df['Clearance_Status'].value_counts(normalize=True)}")

# ============================================================================
# 2. FEATURE ENGINEERING
# ============================================================================
print("\n[2/8] Engineering features...")

def engineer_features(df, hs_stats=None, compute_stats=False):
    """Comprehensive feature engineering pipeline"""
    df = df.copy()
    
    # Weight signals
    df['weight_discrepancy'] = df['Measured_Weight'] - df['Declared_Weight']
    df['weight_discrepancy_ratio'] = df['weight_discrepancy'] / (df['Declared_Weight'] + 1e-6)
    df['abs_weight_disc_ratio'] = np.abs(df['weight_discrepancy_ratio'])
    
    # Value signals
    df['value_per_kg'] = df['Declared_Value'] / (df['Declared_Weight'] + 1e-6)
    df['log_declared_value'] = np.log1p(df['Declared_Value'])
    
    # HS Code normalization - compute from full dataset
    if compute_stats:
        hs_stats = df.groupby('HS_Code').agg({
            'Declared_Value': 'median',
            'Declared_Weight': 'median',
            'value_per_kg': 'median'
        }).rename(columns={
            'Declared_Value': 'hs_median_value',
            'Declared_Weight': 'hs_median_weight',
            'value_per_kg': 'hs_median_vpkg'
        })
    
    df = df.merge(hs_stats, on='HS_Code', how='left')
    df['value_vs_hs_norm'] = df['Declared_Value'] / (df['hs_median_value'] + 1e-6)
    df['weight_vs_hs_norm'] = df['Declared_Weight'] / (df['hs_median_weight'] + 1e-6)
    df['vpkg_vs_hs_norm'] = df['value_per_kg'] / (df['hs_median_vpkg'] + 1e-6)
    
    # Dwell time
    df['dwell_time_log'] = np.log1p(df['Dwell_Time_Hours'])
    dwell_mean = df['Dwell_Time_Hours'].mean()
    dwell_std = df['Dwell_Time_Hours'].std()
    df['dwell_zscore'] = (df['Dwell_Time_Hours'] - dwell_mean) / (dwell_std + 1e-6)
    
    # Time-based features
    df['Declaration_Time'] = pd.to_datetime(df['Declaration_Time'], format='%H:%M:%S', errors='coerce')
    df['declaration_hour'] = df['Declaration_Time'].dt.hour
    df['is_odd_hour'] = ((df['declaration_hour'] >= 0) & (df['declaration_hour'] <= 5)).astype(int)
    
    df['Declaration_Date'] = pd.to_datetime(df['Declaration_Date'], errors='coerce')
    df['is_weekend'] = (df['Declaration_Date'].dt.dayofweek >= 5).astype(int)
    df['declaration_month'] = df['Declaration_Date'].dt.month
    
    # Categorical/behavioral
    df['is_transit'] = (df['Trade_Regime'] == 'Transit').astype(int)
    
    # High-risk origin countries (sanctions list)
    high_risk_countries = {'KP', 'IR', 'SY', 'MM', 'CU', 'VE', 'LY', 'SO', 'YE', 'AF'}
    df['origin_high_risk'] = df['Origin_Country'].isin(high_risk_countries).astype(int)
    
    # Frequency encoding
    for col in ['Importer_ID', 'Exporter_ID', 'Origin_Country', 'Destination_Country', 
                'Destination_Port', 'Shipping_Line']:
        freq = df[col].value_counts()
        df[f'{col.lower()}_freq'] = df[col].map(freq).fillna(0)
    
    return df, hs_stats

# Engineer features for both datasets
train_df, hs_stats = engineer_features(train_df, compute_stats=True)
test_df, _ = engineer_features(test_df, hs_stats=hs_stats, compute_stats=False)

print(f"Engineered {len([c for c in train_df.columns if c not in test_df.columns[:16]])} new features")

# ============================================================================
# 3. LAYER 1: ISOLATION FOREST (UNSUPERVISED ANOMALY DETECTION)
# ============================================================================
print("\n[3/8] Training Layer 1: Isolation Forest...")

# Select anomaly-relevant features
anomaly_features = [
    'weight_discrepancy_ratio', 'abs_weight_disc_ratio',
    'value_per_kg', 'vpkg_vs_hs_norm', 'value_vs_hs_norm',
    'dwell_zscore', 'log_declared_value'
]

# Train Isolation Forest on training data
iso_forest = IsolationForest(
    n_estimators=200,
    contamination=0.15,  # Expect ~15% anomalies
    random_state=RANDOM_STATE,
    n_jobs=-1
)

X_anomaly_train = train_df[anomaly_features].fillna(0)
X_anomaly_test = test_df[anomaly_features].fillna(0)

iso_forest.fit(X_anomaly_train)

# Generate anomaly scores (normalize to 0-1, higher = more anomalous)
train_anomaly_raw = iso_forest.score_samples(X_anomaly_train)
test_anomaly_raw = iso_forest.score_samples(X_anomaly_test)

# Normalize to 0-1 range
train_df['anomaly_score'] = 1 - (train_anomaly_raw - train_anomaly_raw.min()) / (train_anomaly_raw.max() - train_anomaly_raw.min() + 1e-6)
test_df['anomaly_score'] = 1 - (test_anomaly_raw - test_anomaly_raw.min()) / (test_anomaly_raw.max() - test_anomaly_raw.min() + 1e-6)

print(f"Anomaly score range: [{train_df['anomaly_score'].min():.3f}, {train_df['anomaly_score'].max():.3f}]")

# ============================================================================
# 4. PREPARE FEATURES FOR LAYER 2
# ============================================================================
print("\n[4/8] Preparing features for Layer 2...")

# Select features for supervised model (including anomaly_score)
feature_cols = [
    'weight_discrepancy', 'weight_discrepancy_ratio', 'abs_weight_disc_ratio',
    'value_per_kg', 'log_declared_value',
    'value_vs_hs_norm', 'weight_vs_hs_norm', 'vpkg_vs_hs_norm',
    'dwell_time_log', 'dwell_zscore',
    'declaration_hour', 'is_odd_hour', 'is_weekend', 'declaration_month',
    'is_transit', 'origin_high_risk',
    'importer_id_freq', 'exporter_id_freq', 'origin_country_freq',
    'destination_country_freq', 'destination_port_freq', 'shipping_line_freq',
    'anomaly_score'  # Layer 1 output as input feature
]

X_train = train_df[feature_cols].fillna(0)
y_train = train_df['Clearance_Status']

X_test = test_df[feature_cols].fillna(0)

# Add calibrated noise to training data (simulate real-world measurement error)
print("Adding calibrated noise to prevent overfitting to synthetic patterns...")
noise_cols = ['weight_discrepancy_ratio', 'value_per_kg', 'dwell_zscore', 'vpkg_vs_hs_norm']
for col in noise_cols:
    if col in X_train.columns:
        noise = np.random.normal(0, 0.03 * X_train[col].std(), size=len(X_train))
        X_train[col] = X_train[col] + noise

# Encode target
label_encoder = LabelEncoder()
y_train_encoded = label_encoder.fit_transform(y_train)

print(f"Feature matrix: {X_train.shape}")
print(f"Target classes: {label_encoder.classes_}")

# ============================================================================
# 5. LAYER 2: SUPERVISED MODEL (RANDOM FOREST WITH CLASS WEIGHTS)
# ============================================================================
print("\n[5/8] Training Layer 2: Random Forest with class weights...")

# Heavy class weights to penalize missing Critical containers
class_weights = {
    label_encoder.transform(['Clear'])[0]: 1,
    label_encoder.transform(['Low Risk'])[0]: 3,
    label_encoder.transform(['Critical'])[0]: 10
}

rf_model = RandomForestClassifier(
    n_estimators=300,
    max_depth=15,
    min_samples_split=20,
    min_samples_leaf=10,
    class_weight=class_weights,
    random_state=RANDOM_STATE,
    n_jobs=-1
)

# Train model
rf_model.fit(X_train, y_train_encoded)

# ============================================================================
# 6. CROSS-VALIDATION AND EVALUATION
# ============================================================================
print("\n[6/8] Performing 5-fold stratified cross-validation...")

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
cv_scores = cross_val_score(rf_model, X_train, y_train_encoded, cv=skf, 
                            scoring='f1_macro', n_jobs=-1)

print(f"5-Fold CV F1-Macro: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# Training set evaluation
y_train_pred = rf_model.predict(X_train)
print("\n" + "="*80)
print("TRAINING SET EVALUATION")
print("="*80)
print("\nClassification Report:")
print(classification_report(y_train_encoded, y_train_pred, 
                          target_names=label_encoder.classes_, digits=4))

print("\nConfusion Matrix:")
cm = confusion_matrix(y_train_encoded, y_train_pred)
print(cm)
print(f"\nRows: Actual | Columns: Predicted")
print(f"Classes: {label_encoder.classes_}")

# Feature importances
feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=False)

print("\n" + "="*80)
print("TOP 10 FEATURE IMPORTANCES")
print("="*80)
for idx, row in feature_importance.head(10).iterrows():
    print(f"{row['feature']:30s}: {row['importance']:.4f}")

# ============================================================================
# 7. GENERATE PREDICTIONS AND RISK SCORES
# ============================================================================
print("\n[7/8] Generating predictions for test data...")

# Predict probabilities
y_test_proba = rf_model.predict_proba(X_test)
y_test_pred = rf_model.predict(X_test)

# Convert to risk scores (0-100)
# Use weighted probability: Critical=100, Low Risk=50, Clear=0
risk_mapping = {'Critical': 100, 'Low Risk': 50, 'Clear': 0}
test_df['Risk_Score'] = 0.0

for idx, class_name in enumerate(label_encoder.classes_):
    test_df['Risk_Score'] += y_test_proba[:, idx] * risk_mapping[class_name]

# Assign risk levels based on optimized thresholds
def assign_risk_level(score):
    if score >= 70:
        return 'Critical'
    elif score >= 30:
        return 'Low Risk'
    else:
        return 'Low'

test_df['Risk_Level'] = test_df['Risk_Score'].apply(assign_risk_level)

# ============================================================================
# 8. GENERATE EXPLAINABILITY SUMMARIES
# ============================================================================
print("\n[8/8] Generating explainability summaries...")

def generate_explanation(row):
    """Generate human-readable explanation for risk assessment"""
    explanations = []
    
    # Check signals in priority order
    if row['abs_weight_disc_ratio'] > 0.15:
        pct = abs(row['weight_discrepancy_ratio']) * 100
        direction = "over" if row['weight_discrepancy_ratio'] > 0 else "under"
        explanations.append(f"Weight {direction}-declared by {pct:.1f}%")
    
    if row['dwell_zscore'] > 2.0:
        explanations.append(f"Unusually high dwell time ({row['Dwell_Time_Hours']:.1f} hrs)")
    
    if row['vpkg_vs_hs_norm'] > 2.5:
        explanations.append(f"Value-per-kg {row['vpkg_vs_hs_norm']:.1f}x above HS norm")
    elif row['vpkg_vs_hs_norm'] < 0.3:
        explanations.append(f"Value-per-kg {row['vpkg_vs_hs_norm']:.2f}x below HS norm")
    
    if row['value_vs_hs_norm'] > 3.0:
        explanations.append(f"Declared value {row['value_vs_hs_norm']:.1f}x above HS median")
    
    if row['is_odd_hour'] == 1:
        explanations.append(f"Declared at suspicious hour ({row['declaration_hour']}:00)")
    
    if row['is_transit'] == 1:
        explanations.append("Transit shipment (elevated baseline risk)")
    
    if row['origin_high_risk'] == 1:
        explanations.append("Origin country on high-risk list")
    
    if row['anomaly_score'] > 0.75:
        explanations.append(f"High anomaly score ({row['anomaly_score']:.2f})")
    
    if row['importer_id_freq'] <= 2:
        explanations.append("First-time or rare importer")
    
    # Return top 3 or default message
    if explanations:
        return "; ".join(explanations[:3]) + "."
    else:
        return "All metrics within normal range; no anomalies detected."

test_df['Explanation_Summary'] = test_df.apply(generate_explanation, axis=1)

# ============================================================================
# SAVE PREDICTIONS
# ============================================================================
output_df = test_df[['Container_ID', 'Risk_Score', 'Risk_Level', 'Explanation_Summary']].copy()
output_df['Risk_Score'] = output_df['Risk_Score'].round(2)
output_df.to_csv('predictions.csv', index=False)

print(f"\nPredictions saved to predictions.csv")
print(f"\nFinal Risk Level Distribution:")
print(output_df['Risk_Level'].value_counts())

# ============================================================================
# GENERATE DASHBOARD
# ============================================================================
print("\nGenerating dashboard...")

plt.style.use('dark_background')
fig = plt.figure(figsize=(20, 12))
gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)

# KPI Cards
ax_kpi = fig.add_subplot(gs[0, :])
ax_kpi.axis('off')

total_containers = len(output_df)
critical_count = (output_df['Risk_Level'] == 'Critical').sum()
low_risk_count = (output_df['Risk_Level'] == 'Low Risk').sum()
clear_count = (output_df['Risk_Level'] == 'Low').sum()

kpi_text = f"""
SMARTCONTAINER RISK ENGINE - DASHBOARD

Total Containers: {total_containers:,}  |  Critical: {critical_count:,} ({critical_count/total_containers*100:.1f}%)  |  Low Risk: {low_risk_count:,} ({low_risk_count/total_containers*100:.1f}%)  |  Clear: {clear_count:,} ({clear_count/total_containers*100:.1f}%)
"""
ax_kpi.text(0.5, 0.5, kpi_text, ha='center', va='center', fontsize=14, 
           bbox=dict(boxstyle='round', facecolor='#1a1a1a', edgecolor='cyan', linewidth=2))

# Pie chart: Risk level distribution
ax1 = fig.add_subplot(gs[1, 0])
risk_counts = output_df['Risk_Level'].value_counts()
colors = ['#ff4444', '#ffaa00', '#44ff44']
ax1.pie(risk_counts.values, labels=risk_counts.index, autopct='%1.1f%%', 
       colors=colors, startangle=90)
ax1.set_title('Risk Level Distribution', fontsize=12, pad=10)

# Histogram: Risk score distribution
ax2 = fig.add_subplot(gs[1, 1])
for level, color in zip(['Low', 'Low Risk', 'Critical'], colors):
    data = output_df[output_df['Risk_Level'] == level]['Risk_Score']
    ax2.hist(data, bins=30, alpha=0.6, label=level, color=color)
ax2.set_xlabel('Risk Score')
ax2.set_ylabel('Frequency')
ax2.set_title('Risk Score Distribution by Level', fontsize=12)
ax2.legend()
ax2.grid(alpha=0.3)

# Bar chart: Top 10 feature importances
ax3 = fig.add_subplot(gs[1, 2])
top_features = feature_importance.head(10)
ax3.barh(range(len(top_features)), top_features['importance'].values, color='cyan')
ax3.set_yticks(range(len(top_features)))
ax3.set_yticklabels(top_features['feature'].values, fontsize=9)
ax3.set_xlabel('Importance')
ax3.set_title('Top 10 Feature Importances', fontsize=12)
ax3.invert_yaxis()
ax3.grid(alpha=0.3, axis='x')

# Bar chart: Critical containers by origin country
ax4 = fig.add_subplot(gs[2, 0])
critical_df = test_df[test_df['Risk_Level'] == 'Critical']
if len(critical_df) > 0:
    origin_counts = critical_df['Origin_Country'].value_counts().head(10)
    ax4.bar(range(len(origin_counts)), origin_counts.values, color='#ff4444')
    ax4.set_xticks(range(len(origin_counts)))
    ax4.set_xticklabels(origin_counts.index, rotation=45, ha='right', fontsize=9)
    ax4.set_ylabel('Count')
    ax4.set_title('Top 10 Origin Countries (Critical Containers)', fontsize=12)
    ax4.grid(alpha=0.3, axis='y')
else:
    ax4.text(0.5, 0.5, 'No Critical Containers', ha='center', va='center')
    ax4.set_title('Top 10 Origin Countries (Critical Containers)', fontsize=12)

# Scatter: Dwell time vs weight discrepancy
ax5 = fig.add_subplot(gs[2, 1])
for level, color in zip(['Low', 'Low Risk', 'Critical'], colors):
    data = test_df[test_df['Risk_Level'] == level]
    ax5.scatter(data['Dwell_Time_Hours'], data['abs_weight_disc_ratio'], 
               alpha=0.5, s=20, label=level, color=color)
ax5.set_xlabel('Dwell Time (Hours)')
ax5.set_ylabel('Abs Weight Discrepancy Ratio')
ax5.set_title('Dwell Time vs Weight Discrepancy', fontsize=12)
ax5.legend()
ax5.grid(alpha=0.3)

# Histogram: Anomaly score distribution by risk level
ax6 = fig.add_subplot(gs[2, 2])
for level, color in zip(['Low', 'Low Risk', 'Critical'], colors):
    data = test_df[test_df['Risk_Level'] == level]['anomaly_score']
    ax6.hist(data, bins=30, alpha=0.6, label=level, color=color)
ax6.set_xlabel('Anomaly Score')
ax6.set_ylabel('Frequency')
ax6.set_title('Anomaly Score Distribution by Risk Level', fontsize=12)
ax6.legend()
ax6.grid(alpha=0.3)

plt.savefig('dashboard.png', dpi=150, bbox_inches='tight', facecolor='#0a0a0a')
print("Dashboard saved to dashboard.png")

print("\n" + "="*80)
print("PIPELINE COMPLETE")
print("="*80)
print(f"✓ Predictions: predictions.csv ({len(output_df)} containers)")
print(f"✓ Dashboard: dashboard.png")
print(f"✓ Model: Two-layer architecture (Isolation Forest + Random Forest)")
print(f"✓ Evaluation: F1-Macro = {cv_scores.mean():.4f}")
print("="*80)
