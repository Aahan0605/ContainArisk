#!/usr/bin/env python3
import csv
import json
import os
import math
from collections import defaultdict

DATA_DIR = '/Users/aahanajaygajera/Desktop/ContainArisk/data/datasets/hackooo'
OUT_DIR = '/Users/aahanajaygajera/Desktop/ContainArisk/frontend/public/data'

def num(v):
    try:
        return float(v)
    except:
        return 0

def risk_level(row):
    rl = row.get('Risk_Level', '').strip().upper()
    if rl == 'CRITICAL': return 'CRITICAL'
    if rl == 'HIGH': return 'HIGH'
    if rl == 'MEDIUM': return 'MEDIUM'
    return 'LOW'

COORDS = {
    'CN': {'lat': 35.86, 'lon': 104.20}, 'DE': {'lat': 51.17, 'lon': 10.45},
    'US': {'lat': 37.09, 'lon': -95.71}, 'AE': {'lat': 23.42, 'lon': 53.85},
    'ZA': {'lat': -30.56, 'lon': 22.94}, 'VN': {'lat': 14.06, 'lon': 108.28},
    'FR': {'lat': 46.23, 'lon': 2.21},   'SG': {'lat': 1.35,  'lon': 103.82},
    'IN': {'lat': 20.59, 'lon': 78.96},  'JP': {'lat': 36.20, 'lon': 138.25},
    'AU': {'lat': -25.27, 'lon': 133.78}, 'KR': {'lat': 35.91, 'lon': 127.77},
    'BR': {'lat': -14.24, 'lon': -51.93}, 'GB': {'lat': 55.38, 'lon': -3.44},
    'MY': {'lat': 4.21, 'lon': 101.98},  'HK': {'lat': 22.40, 'lon': 114.11},
    'PK': {'lat': 30.38, 'lon': 69.35},  'BD': {'lat': 23.68, 'lon': 90.36},
    'TH': {'lat': 15.87, 'lon': 100.99}, 'ID': {'lat': -0.79, 'lon': 113.92},
    'NL': {'lat': 52.13, 'lon': 5.29},   'ES': {'lat': 40.46, 'lon': -3.75},
    'IT': {'lat': 41.87, 'lon': 12.57},  'TR': {'lat': 38.96, 'lon': 35.24},
    'SA': {'lat': 23.89, 'lon': 45.08},  'EG': {'lat': 26.82, 'lon': 30.80},
    'NG': {'lat': 9.08, 'lon': 8.68},    'KE': {'lat': -0.02, 'lon': 37.91},
    'CA': {'lat': 56.13, 'lon': -106.35}, 'MX': {'lat': 23.63, 'lon': -102.55},
    'TW': {'lat': 23.70, 'lon': 120.96}, 'PH': {'lat': 12.88, 'lon': 121.77},
    'LK': {'lat': 7.87, 'lon': 80.77},   'MM': {'lat': 21.91, 'lon': 95.96},
    'IR': {'lat': 32.43, 'lon': 53.69},
}

def get_coords(cc):
    return COORDS.get(cc, {'lat': 0, 'lon': 0})

def route_risk(rows):
    avg_score = sum(num(r.get('Risk_Score', 0)) for r in rows) / len(rows)
    if avg_score >= 70: return 'high'
    if avg_score >= 40: return 'medium'
    return 'low'

print('📦 Generating static data from CSV files (Python)...')

os.makedirs(OUT_DIR, exist_ok=True)

all_rows = {}
for fname in ['cleaned_historical_data.csv', 'cleaned_realtime_data.csv']:
    path = os.path.join(DATA_DIR, fname)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = row.get('Container_ID')
            if cid:
                all_rows[cid] = row

all_list = list(all_rows.values())
print(f"Total unique containers: {len(all_list)}")

counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
for r in all_list:
    counts[risk_level(r)] += 1

# 1) Summary
summary = {
    'total_containers': len(all_list),
    'critical': counts['CRITICAL'],
    'high_risk': counts['HIGH'],
    'medium': counts['MEDIUM'],
    'low_risk': counts['LOW'],
    'anomalies': counts['CRITICAL'] + counts['HIGH'],
}
with open(os.path.join(OUT_DIR, 'summary.json'), 'w') as f:
    json.dump(summary, f)

# 2) Risk Distribution
risk_dist = {
    'low': counts['LOW'],
    'medium': counts['MEDIUM'],
    'high': counts['HIGH'],
    'critical': counts['CRITICAL']
}
with open(os.path.join(OUT_DIR, 'risk-distribution.json'), 'w') as f:
    json.dump(risk_dist, f)

# 3) Critical
critical_rows = [r for r in all_list if risk_level(r) == 'CRITICAL']
critical_rows.sort(key=lambda r: num(r.get('Risk_Score', 0)), reverse=True)
crit_data = []
for r in critical_rows[:50]:
    crit_data.append({
        'container_id': r.get('Container_ID'),
        'importer': r.get('Importer_ID'),
        'exporter': r.get('Exporter_ID'),
        'origin': r.get('Origin_Country'),
        'destination': r.get('Destination_Country'),
        'hs_code': r.get('HS_Code'),
        'weight': num(r.get('Measured_Weight')),
        'declared_weight': num(r.get('Declared_Weight')),
        'declared_value': num(r.get('Declared_Value')),
        'risk_score': num(r.get('Risk_Score')) / 100,
        'risk_level': 'CRITICAL',
        'entity_trust_score': num(r.get('entity_trust_score')),
        'weight_deviation_percent': num(r.get('weight_deviation_percent')),
        'seal_tamper_prob': num(r.get('seal_tamper_prob')),
        'tax_evasion_prob': num(r.get('tax_evasion_prob')),
    })

with open(os.path.join(OUT_DIR, 'critical-containers.json'), 'w') as f:
    json.dump({
        'data': crit_data,
        'total': counts['CRITICAL'],
        'page': 1,
        'limit': 50,
        'total_pages': math.ceil(counts['CRITICAL'] / 50)
    }, f)

# 4) High
high_rows = [r for r in all_list if risk_level(r) == 'HIGH']
high_rows.sort(key=lambda r: num(r.get('Risk_Score', 0)), reverse=True)
high_data = []
for r in high_rows[:50]:
    high_data.append({
        'container_id': r.get('Container_ID'),
        'importer': r.get('Importer_ID'),
        'exporter': r.get('Exporter_ID'),
        'origin': r.get('Origin_Country'),
        'destination': r.get('Destination_Country'),
        'hs_code': r.get('HS_Code'),
        'weight': num(r.get('Measured_Weight')),
        'declared_weight': num(r.get('Declared_Weight')),
        'declared_value': num(r.get('Declared_Value')),
        'risk_score': num(r.get('Risk_Score')) / 100,
        'risk_level': 'HIGH',
        'entity_trust_score': num(r.get('entity_trust_score')),
        'weight_deviation_percent': num(r.get('weight_deviation_percent')),
        'seal_tamper_prob': num(r.get('seal_tamper_prob')),
        'tax_evasion_prob': num(r.get('tax_evasion_prob')),
    })

with open(os.path.join(OUT_DIR, 'high-risk-containers.json'), 'w') as f:
    json.dump({
        'data': high_data,
        'total': counts['HIGH'],
        'page': 1,
        'limit': 50,
        'total_pages': math.ceil(counts['HIGH'] / 50)
    }, f)

# 5) Anomalies
ano_rows = [r for r in all_list if num(r.get('Risk_Score')) >= 60]
ano_rows.sort(key=lambda x: num(x.get('Risk_Score')), reverse=True)
ano_data = []
for r in ano_rows[:50]:
    ano_data.append({
        'container_id': r.get('Container_ID'),
        'importer': r.get('Importer_ID'),
        'origin': r.get('Origin_Country'),
        'destination': r.get('Destination_Country'),
        'risk_score': num(r.get('Risk_Score')) / 100,
        'risk_level': risk_level(r),
        'weight': num(r.get('Measured_Weight')),
        'declared_value': num(r.get('Declared_Value')),
    })
with open(os.path.join(OUT_DIR, 'anomalies.json'), 'w') as f:
    json.dump({
        'data': ano_data,
        'total': len(ano_rows),
        'page': 1, 'limit': 50,
        'total_pages': math.ceil(len(ano_rows) / 50)
    }, f)

# 6) Routes
route_map = defaultdict(list)
for r in all_list:
    k = f"{r.get('Origin_Country')}→{r.get('Destination_Country')}"
    route_map[k].append(r)

route_entries = sorted(route_map.values(), key=lambda v: len(v), reverse=True)[:15]
routes = []
tracked_countries = set()
hr_routes = 0

for re in route_entries:
    origin = re[0].get('Origin_Country')
    dest = re[0].get('Destination_Country')
    risk = route_risk(re)
    o = get_coords(origin)
    d = get_coords(dest)
    if risk == 'high': hr_routes += 1
    tracked_countries.add(origin)
    tracked_countries.add(dest)
    routes.append({
        'origin': origin,
        'destination': dest,
        'risk': risk,
        'lat1': o['lat'], 'lon1': o['lon'],
        'lat2': d['lat'], 'lon2': d['lon'],
        'volume': len(re)
    })

with open(os.path.join(OUT_DIR, 'trade-routes.json'), 'w') as f:
    json.dump({
        'routes': routes,
        'stats': {
            'active_routes': len(routes),
            'high_risk_routes': hr_routes,
            'tracked_countries': len(tracked_countries)
        }
    }, f)

# 7) Network
node_set = set()
edge_map = {}
country_vol = defaultdict(int)

for r in all_list:
    origin = r.get('Origin_Country')
    dest = r.get('Destination_Country')
    if origin and dest:
        country_vol[origin] += 1
        country_vol[dest] += 1
        ek = f"{origin}→{dest}"
        if ek not in edge_map:
            edge_map[ek] = {'source': origin, 'target': dest, 'weight': 0, 'totalRisk': 0}
        edge_map[ek]['weight'] += 1
        edge_map[ek]['totalRisk'] += num(r.get('Risk_Score'))

top_countries = [c[0] for c in sorted(country_vol.items(), key=lambda x: x[1], reverse=True)[:15]]
top_country_set = set(top_countries)

country_risk_sum = defaultdict(float)
country_risk_cnt = defaultdict(int)
for r in all_list:
    o = r.get('Origin_Country')
    if o:
        country_risk_sum[o] += num(r.get('Risk_Score'))
        country_risk_cnt[o] += 1

nodes = []
for cc in top_countries:
    r_val = country_risk_sum[cc] / country_risk_cnt[cc] if country_risk_cnt[cc] > 0 else 0
    nodes.append({
        'id': cc,
        'label': cc,
        'type': 'country',
        'risk': round(r_val) / 100
    })

edges_list = [e for e in edge_map.values() if e['source'] in top_country_set and e['target'] in top_country_set]
edges_list.sort(key=lambda x: x['weight'], reverse=True)
edges = [{'source': e['source'], 'target': e['target'], 'weight': e['weight']} for e in edges_list[:20]]

with open(os.path.join(OUT_DIR, 'trade-network.json'), 'w') as f:
    json.dump({'nodes': nodes, 'edges': edges}, f)

# 8) Risk Trends
month_map = {}
for r in all_list:
    date = r.get('Declaration_Date', '')
    month = date[:7]
    if len(month) == 7:
        if month not in month_map:
            month_map[month] = {'total': 0, 'totalRisk': 0, 'highRisk': 0}
        month_map[month]['total'] += 1
        month_map[month]['totalRisk'] += num(r.get('Risk_Score'))
        if num(r.get('Risk_Score')) >= 60:
            month_map[month]['highRisk'] += 1

trends = []
for month in sorted(month_map.keys()):
    d = month_map[month]
    if d['total'] > 0:
        trends.append({
            'month': month,
            'risk': round(d['totalRisk'] / d['total']),
            'volume': d['total'],
            'anomalies': d['highRisk']
        })

with open(os.path.join(OUT_DIR, 'risk-trends.json'), 'w') as f:
    json.dump(trends, f)

# 9) Country Risk
c_risk = defaultdict(int)
for r in all_list:
    if num(r.get('Risk_Score')) >= 60:
        c = r.get('Origin_Country')
        if c: c_risk[c] += 1

cr_list = [{'country': k, 'risk_count': v} for k, v in sorted(c_risk.items(), key=lambda x: x[1], reverse=True)[:10]]
with open(os.path.join(OUT_DIR, 'country-risk.json'), 'w') as f:
    json.dump(cr_list, f)

# 10) Importer Risk
i_risk = defaultdict(int)
for r in all_list:
    if num(r.get('Risk_Score')) >= 60:
        imp = r.get('Importer_ID')
        if imp: i_risk[imp] += 1

ir_list = [{'importer': k, 'risk_count': v} for k, v in sorted(i_risk.items(), key=lambda x: x[1], reverse=True)[:10]]
with open(os.path.join(OUT_DIR, 'importer-risk.json'), 'w') as f:
    json.dump(ir_list, f)

print('✅ Complete.')
