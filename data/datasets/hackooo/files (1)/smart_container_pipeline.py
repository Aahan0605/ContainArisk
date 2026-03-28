"""
SmartContainer Risk Engine — Full ML Pipeline
==============================================
Layer 1: Isolation Forest (Unsupervised Anomaly Detection)
Layer 2: Random Forest Classifier (Supervised Risk Scoring)
Explainability: Feature importance + rule-based explanation summaries
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import warnings
warnings.filterwarnings('ignore')

from sklearn.ensemble import IsolationForest, RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (classification_report, confusion_matrix,
                             roc_auc_score, ConfusionMatrixDisplay)
from sklearn.pipeline import Pipeline

# ─────────────────────────────────────────────
# 1. LOAD DATA
# ─────────────────────────────────────────────
print("=" * 60)
print("SMARTCONTAINER RISK ENGINE — PIPELINE STARTING")
print("=" * 60)

hist = pd.read_csv('/mnt/user-data/uploads/Historical_Data.csv')
rt   = pd.read_csv('/mnt/user-data/uploads/Real-Time_Data.csv')

print(f"\n✔ Historical data loaded : {hist.shape[0]:,} rows")
print(f"✔ Real-time data loaded  : {rt.shape[0]:,} rows")

# Combine for feature engineering consistency
hist['split'] = 'train'
rt['split']   = 'realtime'
df_all = pd.concat([hist, rt], ignore_index=True)

# ─────────────────────────────────────────────
# 2. FEATURE ENGINEERING
# ─────────────────────────────────────────────
print("\n[1/6] Feature Engineering...")

def engineer_features(df):
    df = df.copy()

    # --- Weight signals ---
    df['weight_discrepancy']       = df['Measured_Weight'] - df['Declared_Weight']
    df['weight_discrepancy_ratio'] = df['weight_discrepancy'] / (df['Declared_Weight'] + 1e-9)
    df['abs_weight_disc_ratio']    = df['weight_discrepancy_ratio'].abs()

    # --- Value signals ---
    df['value_per_kg']             = df['Declared_Value'] / (df['Declared_Weight'] + 1e-9)
    df['log_declared_value']       = np.log1p(df['Declared_Value'])
    df['log_declared_weight']      = np.log1p(df['Declared_Weight'])

    # --- HS Code level statistics (value & weight norms) ---
    hs_stats = df.groupby('HS_Code').agg(
        hs_median_value  = ('Declared_Value',  'median'),
        hs_median_weight = ('Declared_Weight', 'median'),
        hs_median_vpkg   = ('value_per_kg',    'median'),
    ).reset_index()
    df = df.merge(hs_stats, on='HS_Code', how='left')
    df['value_vs_hs_norm']  = df['Declared_Value']  / (df['hs_median_value']  + 1e-9)
    df['weight_vs_hs_norm'] = df['Declared_Weight'] / (df['hs_median_weight'] + 1e-9)
    df['vpkg_vs_hs_norm']   = df['value_per_kg']    / (df['hs_median_vpkg']   + 1e-9)

    # --- Dwell time signals ---
    df['dwell_time_log']    = np.log1p(df['Dwell_Time_Hours'])
    dwell_mean = df['Dwell_Time_Hours'].mean()
    dwell_std  = df['Dwell_Time_Hours'].std()
    df['dwell_zscore']      = (df['Dwell_Time_Hours'] - dwell_mean) / (dwell_std + 1e-9)

    # --- Time signals ---
    df['Declaration_Time_parsed'] = pd.to_datetime(df['Declaration_Time'], format='%H:%M:%S', errors='coerce')
    df['declaration_hour']        = df['Declaration_Time_parsed'].dt.hour
    df['is_odd_hour']             = ((df['declaration_hour'] >= 0) & (df['declaration_hour'] <= 5)).astype(int)

    # --- Declaration date ---
    df['Declaration_Date_parsed'] = pd.to_datetime(df['Declaration_Date (YYYY-MM-DD)'], errors='coerce')
    df['declaration_month']       = df['Declaration_Date_parsed'].dt.month
    df['declaration_dayofweek']   = df['Declaration_Date_parsed'].dt.dayofweek
    df['is_weekend']              = (df['declaration_dayofweek'] >= 5).astype(int)

    # --- Transit flag ---
    df['is_transit'] = (df['Trade_Regime (Import / Export / Transit)'] == 'Transit').astype(int)

    # --- Importer / Exporter frequency encoding ---
    imp_freq = df['Importer_ID'].value_counts()
    exp_freq = df['Exporter_ID'].value_counts()
    df['importer_freq'] = df['Importer_ID'].map(imp_freq).fillna(1)
    df['exporter_freq'] = df['Exporter_ID'].map(exp_freq).fillna(1)

    # --- High-risk origin countries (known trade risk list) ---
    HIGH_RISK_COUNTRIES = {'KP', 'IR', 'SY', 'MM', 'CU', 'VE', 'LY', 'SO', 'YE', 'AF'}
    df['origin_high_risk'] = df['Origin_Country'].isin(HIGH_RISK_COUNTRIES).astype(int)

    # --- Categorical encoding ---
    for col in ['Origin_Country', 'Destination_Country', 'Destination_Port', 'Shipping_Line']:
        freq = df[col].value_counts()
        df[col + '_freq'] = df[col].map(freq).fillna(1)

    return df

df_all = engineer_features(df_all)
print(f"   ✔ {len([c for c in df_all.columns if c not in hist.columns])} new features created")

# ─────────────────────────────────────────────
# 3. PREPARE FEATURES
# ─────────────────────────────────────────────
FEATURE_COLS = [
    'weight_discrepancy_ratio', 'abs_weight_disc_ratio', 'weight_discrepancy',
    'value_per_kg', 'log_declared_value', 'log_declared_weight',
    'value_vs_hs_norm', 'weight_vs_hs_norm', 'vpkg_vs_hs_norm',
    'Dwell_Time_Hours', 'dwell_time_log', 'dwell_zscore',
    'declaration_hour', 'is_odd_hour', 'is_weekend', 'declaration_month',
    'is_transit', 'importer_freq', 'exporter_freq',
    'origin_high_risk',
    'Origin_Country_freq', 'Destination_Country_freq',
    'Destination_Port_freq', 'Shipping_Line_freq',
    'Declared_Value', 'Declared_Weight', 'Measured_Weight',
]

# Label encode target
label_map     = {'Clear': 0, 'Low Risk': 1, 'Critical': 2}
label_map_inv = {0: 'Clear', 1: 'Low Risk', 2: 'Critical'}

train_df = df_all[df_all['split'] == 'train'].copy()
rt_df    = df_all[df_all['split'] == 'realtime'].copy()

train_df['label'] = train_df['Clearance_Status'].map(label_map)
rt_df['label']    = rt_df['Clearance_Status'].map(label_map)

X_train_full = train_df[FEATURE_COLS].fillna(0)
y_train_full = train_df['label']
X_rt         = rt_df[FEATURE_COLS].fillna(0)
y_rt         = rt_df['label']

# ─────────────────────────────────────────────
# 4. LAYER 1 — ISOLATION FOREST
# ─────────────────────────────────────────────
print("\n[2/6] Layer 1 — Isolation Forest (Anomaly Detection)...")

iso = IsolationForest(
    n_estimators=200,
    contamination=0.12,   # ~12% anomalies (Critical + Low Risk combined)
    max_samples='auto',
    random_state=42,
    n_jobs=-1
)

# Fit on training set weight/value anomaly features only
ANOMALY_FEATURES = [
    'abs_weight_disc_ratio', 'weight_discrepancy_ratio',
    'value_per_kg', 'vpkg_vs_hs_norm',
    'dwell_zscore', 'value_vs_hs_norm', 'weight_vs_hs_norm'
]

iso.fit(X_train_full[ANOMALY_FEATURES])

# Scores: Isolation Forest returns negative scores; we flip and normalise
train_anomaly_raw = iso.decision_function(X_train_full[ANOMALY_FEATURES])
rt_anomaly_raw    = iso.decision_function(X_rt[ANOMALY_FEATURES])

# Normalise to 0–1 (higher = more anomalous)
def norm_anomaly(raw):
    return 1 - (raw - raw.min()) / (raw.max() - raw.min() + 1e-9)

train_df['anomaly_score'] = norm_anomaly(train_anomaly_raw)
rt_df['anomaly_score']    = norm_anomaly(
    np.concatenate([train_anomaly_raw, rt_anomaly_raw])
)[len(train_anomaly_raw):]  # only real-time portion

# Append anomaly score to features
X_train_full['anomaly_score'] = train_df['anomaly_score'].values
X_rt['anomaly_score']         = rt_df['anomaly_score'].values
FEATURE_COLS_FINAL = FEATURE_COLS + ['anomaly_score']

print(f"   ✔ Isolation Forest fitted | Anomaly score range: "
      f"{train_df['anomaly_score'].min():.3f} – {train_df['anomaly_score'].max():.3f}")

# ─────────────────────────────────────────────
# 5. LAYER 2 — RANDOM FOREST CLASSIFIER
# ─────────────────────────────────────────────
print("\n[3/6] Layer 2 — Random Forest Classifier (Risk Scoring)...")

X = X_train_full[FEATURE_COLS_FINAL].fillna(0)
y = y_train_full

X_tr, X_val, y_tr, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Class weights to handle imbalance (Critical is rare)
class_weight = {0: 1, 1: 3, 2: 10}

rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=5,
    class_weight=class_weight,
    random_state=42,
    n_jobs=-1
)

rf.fit(X_tr, y_tr)

val_preds  = rf.predict(X_val)
val_probas = rf.predict_proba(X_val)

print("\n   ── Validation Set Performance ──")
print(classification_report(y_val, val_preds,
      target_names=['Clear', 'Low Risk', 'Critical']))

# Cross-validation
cv_scores = cross_val_score(rf, X, y, cv=5, scoring='f1_macro', n_jobs=-1)
print(f"   ✔ 5-Fold CV F1-macro: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ─────────────────────────────────────────────
# 6. PREDICT ON REAL-TIME DATA
# ─────────────────────────────────────────────
print("\n[4/6] Predicting on Real-Time Data...")

X_rt_final    = X_rt[FEATURE_COLS_FINAL].fillna(0)
rt_preds      = rf.predict(X_rt_final)
rt_probas     = rf.predict_proba(X_rt_final)

# Risk score: weighted probability → 0–100
# Critical prob * 100 gives a clear signal
risk_scores = (rt_probas[:, 1] * 40 + rt_probas[:, 2] * 100).clip(0, 100)

rt_df['Risk_Score']        = risk_scores.round(2)
rt_df['Risk_Level_3class'] = [label_map_inv[p] for p in rt_preds]

# Binary Critical / Low (merge Clear+LowRisk = Low)
rt_df['Risk_Level'] = rt_df['Risk_Level_3class'].apply(
    lambda x: 'Critical' if x == 'Critical' else 'Low Risk' if x == 'Low Risk' else 'Low'
)

print(f"   ✔ Predictions complete for {len(rt_df):,} containers")
print(f"   Distribution: {dict(rt_df['Risk_Level_3class'].value_counts())}")

# ─────────────────────────────────────────────
# 7. EXPLAINABILITY — Rule-Based SHAP-Style
# ─────────────────────────────────────────────
print("\n[5/6] Generating Explainability Summaries...")

# Feature importances from RF
feat_imp = pd.Series(rf.feature_importances_, index=FEATURE_COLS_FINAL).sort_values(ascending=False)

def generate_explanation(row):
    reasons = []

    wdr = row['weight_discrepancy_ratio']
    if abs(wdr) > 0.15:
        direction = "over" if wdr > 0 else "under"
        reasons.append(f"Weight {direction}-declared by {abs(wdr)*100:.1f}%")

    if row['dwell_zscore'] > 2.0:
        reasons.append(f"Unusually high dwell time ({row['Dwell_Time_Hours']:.0f} hrs)")

    if row['vpkg_vs_hs_norm'] > 2.5 or row['vpkg_vs_hs_norm'] < 0.3:
        reasons.append(f"Value-per-kg deviates {row['vpkg_vs_hs_norm']:.1f}x from HS code norm")

    if row['value_vs_hs_norm'] > 3.0:
        reasons.append(f"Declared value is {row['value_vs_hs_norm']:.1f}x above HS code median")

    if row['is_odd_hour'] == 1:
        reasons.append(f"Declared at suspicious hour ({int(row['declaration_hour'])}:00)")

    if row['is_transit'] == 1:
        reasons.append("Transit shipment (elevated baseline risk)")

    if row['origin_high_risk'] == 1:
        reasons.append("Origin country flagged as high-risk")

    if row['anomaly_score'] > 0.75:
        reasons.append(f"Isolation Forest anomaly score: {row['anomaly_score']:.2f}")

    if row['importer_freq'] <= 2:
        reasons.append("First-time or rare importer")

    if not reasons:
        if row['Risk_Level_3class'] == 'Clear':
            return "All metrics within normal range; no anomalies detected."
        else:
            return "Mild combination of risk signals across multiple features."

    return "; ".join(reasons[:3]) + "."   # top 3 reasons max

rt_df['Explanation_Summary'] = rt_df.apply(generate_explanation, axis=1)

# ─────────────────────────────────────────────
# 8. OUTPUT CSV
# ─────────────────────────────────────────────
output_csv = rt_df[[
    'Container_ID', 'Risk_Score', 'Risk_Level', 'Explanation_Summary'
]].copy()

output_csv.to_csv('/mnt/user-data/outputs/predictions.csv', index=False)
print(f"   ✔ predictions.csv saved ({len(output_csv):,} rows)")

# ─────────────────────────────────────────────
# 9. SUMMARY DASHBOARD
# ─────────────────────────────────────────────
print("\n[6/6] Generating Summary Dashboard...")

fig = plt.figure(figsize=(20, 14), facecolor='#0d1117')
fig.suptitle('SmartContainer Risk Engine — Summary Dashboard',
             fontsize=22, fontweight='bold', color='white', y=0.98)

gs = gridspec.GridSpec(3, 3, figure=fig, hspace=0.45, wspace=0.35)

COLORS = {
    'Critical': '#FF4B4B',
    'Low Risk': '#FFA500',
    'Low':      '#00C49F',
    'Clear':    '#00C49F',
    'bg':       '#0d1117',
    'panel':    '#161b22',
    'text':     '#e6edf3',
    'subtext':  '#8b949e',
    'accent':   '#58a6ff',
}

def styled_ax(ax, title=''):
    ax.set_facecolor(COLORS['panel'])
    for spine in ax.spines.values():
        spine.set_edgecolor('#30363d')
    ax.tick_params(colors=COLORS['subtext'], labelsize=9)
    ax.xaxis.label.set_color(COLORS['subtext'])
    ax.yaxis.label.set_color(COLORS['subtext'])
    if title:
        ax.set_title(title, color=COLORS['text'], fontsize=11, fontweight='bold', pad=10)

# ── KPI Cards (top row) ──────────────────────────────────────
kpi_data = {
    'Total Containers': (len(rt_df), '#58a6ff'),
    'Critical Risk':    (int((rt_df['Risk_Level_3class'] == 'Critical').sum()),  '#FF4B4B'),
    'Low Risk':         (int((rt_df['Risk_Level_3class'] == 'Low Risk').sum()),  '#FFA500'),
    'Clear':            (int((rt_df['Risk_Level_3class'] == 'Clear').sum()),     '#00C49F'),
}

for i, (label, (val, color)) in enumerate(kpi_data.items()):
    ax = fig.add_subplot(gs[0, i] if i < 3 else gs[0, 2])
    ax.set_facecolor(COLORS['panel'])
    for spine in ax.spines.values():
        spine.set_edgecolor(color)
        spine.set_linewidth(2)
    ax.set_xticks([]); ax.set_yticks([])
    ax.text(0.5, 0.62, f"{val:,}", transform=ax.transAxes,
            fontsize=30, fontweight='bold', color=color,
            ha='center', va='center')
    ax.text(0.5, 0.25, label, transform=ax.transAxes,
            fontsize=11, color=COLORS['subtext'], ha='center', va='center')
    if i == 0:
        ax.set_title('', pad=0)

# ── Risk Distribution Pie ────────────────────────────────────
ax_pie = fig.add_subplot(gs[1, 0])
styled_ax(ax_pie, 'Risk Level Distribution')
counts_3 = rt_df['Risk_Level_3class'].value_counts()
pie_labels  = counts_3.index.tolist()
pie_values  = counts_3.values
pie_colors  = [COLORS.get(l, '#888') for l in pie_labels]
wedges, texts, autotexts = ax_pie.pie(
    pie_values, labels=pie_labels, colors=pie_colors,
    autopct='%1.1f%%', startangle=140,
    textprops={'color': COLORS['text'], 'fontsize': 9},
    wedgeprops={'edgecolor': COLORS['bg'], 'linewidth': 2}
)
for at in autotexts:
    at.set_color('#0d1117'); at.set_fontweight('bold')

# ── Risk Score Histogram ─────────────────────────────────────
ax_hist = fig.add_subplot(gs[1, 1])
styled_ax(ax_hist, 'Risk Score Distribution')
for level, color in [('Critical', '#FF4B4B'), ('Low Risk', '#FFA500'), ('Clear', '#00C49F')]:
    subset = rt_df[rt_df['Risk_Level_3class'] == level]['Risk_Score']
    if len(subset):
        ax_hist.hist(subset, bins=30, alpha=0.7, color=color, label=level, edgecolor='none')
ax_hist.set_xlabel('Risk Score (0–100)')
ax_hist.set_ylabel('Container Count')
ax_hist.legend(fontsize=8, facecolor=COLORS['panel'], labelcolor=COLORS['text'])

# ── Feature Importances ──────────────────────────────────────
ax_fi = fig.add_subplot(gs[1, 2])
styled_ax(ax_fi, 'Top 10 Feature Importances')
top10 = feat_imp.head(10)
bars = ax_fi.barh(top10.index[::-1], top10.values[::-1],
                  color=COLORS['accent'], edgecolor='none')
ax_fi.set_xlabel('Importance')
for bar in bars:
    ax_fi.text(bar.get_width() + 0.001, bar.get_y() + bar.get_height()/2,
               f'{bar.get_width():.3f}', va='center',
               color=COLORS['subtext'], fontsize=7)

# ── Critical Containers by Origin Country ───────────────────
ax_origin = fig.add_subplot(gs[2, 0])
styled_ax(ax_origin, 'Critical Containers by Origin Country')
crit_origin = (rt_df[rt_df['Risk_Level_3class'] == 'Critical']
               ['Origin_Country'].value_counts().head(10))
if len(crit_origin):
    ax_origin.barh(crit_origin.index[::-1], crit_origin.values[::-1],
                   color=COLORS['Critical'], edgecolor='none')
ax_origin.set_xlabel('Count')

# ── Dwell Time vs Weight Discrepancy scatter ─────────────────
ax_sc = fig.add_subplot(gs[2, 1])
styled_ax(ax_sc, 'Dwell Time vs Weight Discrepancy Ratio')
for level, color, zorder in [('Clear','#00C49F',1),('Low Risk','#FFA500',2),('Critical','#FF4B4B',3)]:
    sub = rt_df[rt_df['Risk_Level_3class'] == level]
    ax_sc.scatter(sub['abs_weight_disc_ratio'].clip(0, 1),
                  sub['Dwell_Time_Hours'].clip(0, 200),
                  c=color, s=8, alpha=0.5, label=level, zorder=zorder)
ax_sc.set_xlabel('|Weight Discrepancy Ratio|')
ax_sc.set_ylabel('Dwell Time (hrs)')
ax_sc.legend(fontsize=8, facecolor=COLORS['panel'], labelcolor=COLORS['text'])

# ── Anomaly Score Distribution ───────────────────────────────
ax_ano = fig.add_subplot(gs[2, 2])
styled_ax(ax_ano, 'Anomaly Score by Risk Level')
for level, color in [('Clear','#00C49F'),('Low Risk','#FFA500'),('Critical','#FF4B4B')]:
    sub = rt_df[rt_df['Risk_Level_3class'] == level]['anomaly_score']
    if len(sub):
        ax_ano.hist(sub, bins=25, alpha=0.7, color=color, label=level, edgecolor='none')
ax_ano.set_xlabel('Anomaly Score (Layer 1)')
ax_ano.set_ylabel('Count')
ax_ano.legend(fontsize=8, facecolor=COLORS['panel'], labelcolor=COLORS['text'])

plt.savefig('/mnt/user-data/outputs/dashboard.png',
            dpi=150, bbox_inches='tight', facecolor=COLORS['bg'])
plt.close()
print("   ✔ dashboard.png saved")

# ─────────────────────────────────────────────
# 10. FINAL SUMMARY PRINT
# ─────────────────────────────────────────────
print("\n" + "=" * 60)
print("PIPELINE COMPLETE — SUMMARY")
print("=" * 60)
print(f"\nTotal containers processed : {len(rt_df):,}")
print(f"Critical risk              : {(rt_df['Risk_Level_3class']=='Critical').sum():,} "
      f"({(rt_df['Risk_Level_3class']=='Critical').mean()*100:.1f}%)")
print(f"Low Risk                   : {(rt_df['Risk_Level_3class']=='Low Risk').sum():,} "
      f"({(rt_df['Risk_Level_3class']=='Low Risk').mean()*100:.1f}%)")
print(f"Clear                      : {(rt_df['Risk_Level_3class']=='Clear').sum():,} "
      f"({(rt_df['Risk_Level_3class']=='Clear').mean()*100:.1f}%)")
print(f"\nTop 5 Feature Importances:")
for feat, imp in feat_imp.head(5).items():
    print(f"  {feat:<35} {imp:.4f}")
print(f"\nOutputs:")
print(f"  /mnt/user-data/outputs/predictions.csv")
print(f"  /mnt/user-data/outputs/dashboard.png")
print("\nDone ✔")
