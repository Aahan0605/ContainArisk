#!/usr/bin/env node
/**
 * Pre-build script: reads the actual CSV datasets and generates
 * JSON files in public/data/ so the frontend can serve real data
 * even when the Python backend is not deployed.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DATA_DIR  = resolve(__dirname, '../../data/datasets/hackooo');
const OUT_DIR   = resolve(__dirname, '../public/data');

// ─── Helpers ────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    if (vals.length < headers.length) continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = vals[j]?.trim() ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

function riskLevel(row) {
  const rl = (row.Risk_Level || '').trim().toUpperCase();
  if (rl === 'CRITICAL') return 'CRITICAL';
  if (rl === 'HIGH') return 'HIGH';
  if (rl === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

// Country code → {lat, lon} for trade-route map
const COORDS = {
  CN: { lat: 35.86, lon: 104.20 }, DE: { lat: 51.17, lon: 10.45 },
  US: { lat: 37.09, lon: -95.71 }, AE: { lat: 23.42, lon: 53.85 },
  ZA: { lat: -30.56, lon: 22.94 }, VN: { lat: 14.06, lon: 108.28 },
  FR: { lat: 46.23, lon: 2.21 },   SG: { lat: 1.35,  lon: 103.82 },
  IN: { lat: 20.59, lon: 78.96 },  JP: { lat: 36.20, lon: 138.25 },
  AU: { lat: -25.27, lon: 133.78 }, KR: { lat: 35.91, lon: 127.77 },
  BR: { lat: -14.24, lon: -51.93 }, GB: { lat: 55.38, lon: -3.44 },
  MY: { lat: 4.21, lon: 101.98 },  HK: { lat: 22.40, lon: 114.11 },
  PK: { lat: 30.38, lon: 69.35 },  BD: { lat: 23.68, lon: 90.36 },
  TH: { lat: 15.87, lon: 100.99 }, ID: { lat: -0.79, lon: 113.92 },
  NL: { lat: 52.13, lon: 5.29 },   ES: { lat: 40.46, lon: -3.75 },
  IT: { lat: 41.87, lon: 12.57 },  TR: { lat: 38.96, lon: 35.24 },
  SA: { lat: 23.89, lon: 45.08 },  EG: { lat: 26.82, lon: 30.80 },
  NG: { lat: 9.08, lon: 8.68 },    KE: { lat: -0.02, lon: 37.91 },
  CA: { lat: 56.13, lon: -106.35 }, MX: { lat: 23.63, lon: -102.55 },
  TW: { lat: 23.70, lon: 120.96 }, PH: { lat: 12.88, lon: 121.77 },
  LK: { lat: 7.87, lon: 80.77 },   MM: { lat: 21.91, lon: 95.96 },
  IR: { lat: 32.43, lon: 53.69 },
};

function getCoords(cc) {
  return COORDS[cc] || { lat: 0, lon: 0 };
}

function routeRisk(rows) {
  const avgScore = rows.reduce((s, r) => s + num(r.Risk_Score), 0) / rows.length;
  if (avgScore >= 70) return 'high';
  if (avgScore >= 40) return 'medium';
  return 'low';
}

// ─── Main ───────────────────────────────────────────────────────────
console.log('📦 Generating static data from CSV files...');

mkdirSync(OUT_DIR, { recursive: true });

// Read both CSVs
const hist = parseCSV(resolve(DATA_DIR, 'cleaned_historical_data.csv'));
const real = parseCSV(resolve(DATA_DIR, 'cleaned_realtime_data.csv'));

// De-duplicate by Container_ID (realtime takes priority)
const map = new Map();
for (const r of hist) map.set(r.Container_ID, r);
for (const r of real) map.set(r.Container_ID, r);
const all = [...map.values()];

console.log(`  Total unique containers: ${all.length}`);

// ── 1) Summary ──────────────────────────────────────────────────────
const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
for (const r of all) counts[riskLevel(r)]++;

const summary = {
  total_containers: all.length,
  critical: counts.CRITICAL,
  high_risk: counts.HIGH,
  medium: counts.MEDIUM,
  low_risk: counts.LOW,
  anomalies: counts.CRITICAL + counts.HIGH,
};
writeFileSync(resolve(OUT_DIR, 'summary.json'), JSON.stringify(summary));
console.log('  ✓ summary.json');

// ── 2) Risk Distribution ────────────────────────────────────────────
const riskDist = {
  low: counts.LOW,
  medium: counts.MEDIUM,
  high: counts.HIGH,
  critical: counts.CRITICAL,
};
writeFileSync(resolve(OUT_DIR, 'risk-distribution.json'), JSON.stringify(riskDist));
console.log('  ✓ risk-distribution.json');

// ── 3) Critical containers (top 50) ────────────────────────────────
const criticalRows = all
  .filter(r => riskLevel(r) === 'CRITICAL')
  .sort((a, b) => num(b.Risk_Score) - num(a.Risk_Score))
  .slice(0, 50)
  .map(r => ({
    container_id: r.Container_ID,
    importer: r.Importer_ID,
    exporter: r.Exporter_ID,
    origin: r.Origin_Country,
    destination: r.Destination_Country,
    hs_code: r.HS_Code,
    weight: num(r.Measured_Weight),
    declared_weight: num(r.Declared_Weight),
    declared_value: num(r.Declared_Value),
    risk_score: num(r.Risk_Score) / 100,
    risk_level: 'CRITICAL',
    entity_trust_score: num(r.entity_trust_score),
    weight_deviation_percent: num(r.weight_deviation_percent),
    seal_tamper_prob: num(r.seal_tamper_prob),
    tax_evasion_prob: num(r.tax_evasion_prob),
  }));
writeFileSync(resolve(OUT_DIR, 'critical-containers.json'), JSON.stringify({
  data: criticalRows,
  total: counts.CRITICAL,
  page: 1,
  limit: 50,
  total_pages: Math.ceil(counts.CRITICAL / 50),
}));
console.log('  ✓ critical-containers.json');

// ── 4) High-risk containers (top 50) ───────────────────────────────
const highRows = all
  .filter(r => riskLevel(r) === 'HIGH')
  .sort((a, b) => num(b.Risk_Score) - num(a.Risk_Score))
  .slice(0, 50)
  .map(r => ({
    container_id: r.Container_ID,
    importer: r.Importer_ID,
    exporter: r.Exporter_ID,
    origin: r.Origin_Country,
    destination: r.Destination_Country,
    hs_code: r.HS_Code,
    weight: num(r.Measured_Weight),
    declared_weight: num(r.Declared_Weight),
    declared_value: num(r.Declared_Value),
    risk_score: num(r.Risk_Score) / 100,
    risk_level: 'HIGH',
    entity_trust_score: num(r.entity_trust_score),
    weight_deviation_percent: num(r.weight_deviation_percent),
    seal_tamper_prob: num(r.seal_tamper_prob),
    tax_evasion_prob: num(r.tax_evasion_prob),
  }));
writeFileSync(resolve(OUT_DIR, 'high-risk-containers.json'), JSON.stringify({
  data: highRows,
  total: counts.HIGH,
  page: 1,
  limit: 50,
  total_pages: Math.ceil(counts.HIGH / 50),
}));
console.log('  ✓ high-risk-containers.json');

// ── 5) Anomalies (top 50 by risk) ──────────────────────────────────
const anomalyRows = all
  .filter(r => num(r.Risk_Score) >= 60)
  .sort((a, b) => num(b.Risk_Score) - num(a.Risk_Score))
  .slice(0, 50)
  .map(r => ({
    container_id: r.Container_ID,
    importer: r.Importer_ID,
    origin: r.Origin_Country,
    destination: r.Destination_Country,
    risk_score: num(r.Risk_Score) / 100,
    risk_level: riskLevel(r),
    weight: num(r.Measured_Weight),
    declared_value: num(r.Declared_Value),
  }));
writeFileSync(resolve(OUT_DIR, 'anomalies.json'), JSON.stringify({
  data: anomalyRows,
  total: all.filter(r => num(r.Risk_Score) >= 60).length,
  page: 1, limit: 50,
  total_pages: Math.ceil(all.filter(r => num(r.Risk_Score) >= 60).length / 50),
}));
console.log('  ✓ anomalies.json');

// ── 6) Trade Routes ─────────────────────────────────────────────────
const routeMap = {};
for (const r of all) {
  const key = `${r.Origin_Country}→${r.Destination_Country}`;
  if (!routeMap[key]) routeMap[key] = { origin: r.Origin_Country, dest: r.Destination_Country, rows: [] };
  routeMap[key].rows.push(r);
}
const routeEntries = Object.values(routeMap)
  .sort((a, b) => b.rows.length - a.rows.length)
  .slice(0, 15);

const routes = routeEntries.map(re => {
  const o = getCoords(re.origin);
  const d = getCoords(re.dest);
  return {
    origin: re.origin,
    destination: re.dest,
    risk: routeRisk(re.rows),
    lat1: o.lat, lon1: o.lon,
    lat2: d.lat, lon2: d.lon,
    volume: re.rows.length,
  };
});
const hrRoutes = routes.filter(r => r.risk === 'high').length;
const trackedCountries = new Set();
for (const r of routes) { trackedCountries.add(r.origin); trackedCountries.add(r.destination); }

writeFileSync(resolve(OUT_DIR, 'trade-routes.json'), JSON.stringify({
  routes,
  stats: {
    active_routes: routes.length,
    high_risk_routes: hrRoutes,
    tracked_countries: trackedCountries.size,
  },
}));
console.log('  ✓ trade-routes.json');

// ── 7) Trade Network ────────────────────────────────────────────────
const nodeSet = new Set();
const edgeMap = {};
for (const r of all) {
  nodeSet.add(r.Origin_Country);
  nodeSet.add(r.Destination_Country);
  const ek = `${r.Origin_Country}→${r.Destination_Country}`;
  if (!edgeMap[ek]) edgeMap[ek] = { source: r.Origin_Country, target: r.Destination_Country, weight: 0, totalRisk: 0 };
  edgeMap[ek].weight++;
  edgeMap[ek].totalRisk += num(r.Risk_Score);
}

// Top 15 countries by volume
const countryVol = {};
for (const r of all) {
  countryVol[r.Origin_Country] = (countryVol[r.Origin_Country] || 0) + 1;
  countryVol[r.Destination_Country] = (countryVol[r.Destination_Country] || 0) + 1;
}
const topCountries = Object.entries(countryVol)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .map(([cc]) => cc);

const topCountrySet = new Set(topCountries);
// Compute avg risk per country
const countryRiskSum = {};
const countryRiskCnt = {};
for (const r of all) {
  const o = r.Origin_Country;
  if (!countryRiskSum[o]) { countryRiskSum[o] = 0; countryRiskCnt[o] = 0; }
  countryRiskSum[o] += num(r.Risk_Score);
  countryRiskCnt[o]++;
}

const nodes = topCountries.map(cc => ({
  id: cc,
  label: cc,
  type: 'country',
  risk: countryRiskCnt[cc] ? Math.round((countryRiskSum[cc] / countryRiskCnt[cc])) / 100 : 0,
}));

const edges = Object.values(edgeMap)
  .filter(e => topCountrySet.has(e.source) && topCountrySet.has(e.target))
  .sort((a, b) => b.weight - a.weight)
  .slice(0, 20)
  .map(e => ({ source: e.source, target: e.target, weight: e.weight }));

writeFileSync(resolve(OUT_DIR, 'trade-network.json'), JSON.stringify({ nodes, edges }));
console.log('  ✓ trade-network.json');

// ── 8) Risk Trends (group by month) ────────────────────────────────
const monthMap = {};
for (const r of all) {
  const date = r.Declaration_Date || '';
  const month = date.slice(0, 7); // YYYY-MM
  if (!month || month.length < 7) continue;
  if (!monthMap[month]) monthMap[month] = { total: 0, totalRisk: 0, highRisk: 0 };
  monthMap[month].total++;
  monthMap[month].totalRisk += num(r.Risk_Score);
  if (num(r.Risk_Score) >= 60) monthMap[month].highRisk++;
}

const trends = Object.entries(monthMap)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([month, d]) => ({
    month,
    risk: Math.round(d.totalRisk / d.total),
    volume: d.total,
    anomalies: d.highRisk,
  }));
writeFileSync(resolve(OUT_DIR, 'risk-trends.json'), JSON.stringify(trends));
console.log('  ✓ risk-trends.json');

// ── 9) Country Risk ─────────────────────────────────────────────────
const cRisk = {};
for (const r of all) {
  if (num(r.Risk_Score) >= 60) {
    const c = r.Origin_Country;
    cRisk[c] = (cRisk[c] || 0) + 1;
  }
}
const countryRiskArr = Object.entries(cRisk)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([country, risk_count]) => ({ country, risk_count }));
writeFileSync(resolve(OUT_DIR, 'country-risk.json'), JSON.stringify(countryRiskArr));
console.log('  ✓ country-risk.json');

// ── 10) Importer Risk ───────────────────────────────────────────────
const iRisk = {};
for (const r of all) {
  if (num(r.Risk_Score) >= 60) {
    const imp = r.Importer_ID;
    iRisk[imp] = (iRisk[imp] || 0) + 1;
  }
}
const importerRiskArr = Object.entries(iRisk)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([importer, risk_count]) => ({ importer, risk_count }));
writeFileSync(resolve(OUT_DIR, 'importer-risk.json'), JSON.stringify(importerRiskArr));
console.log('  ✓ importer-risk.json');

console.log(`\n✅ All data generated in ${OUT_DIR}`);
