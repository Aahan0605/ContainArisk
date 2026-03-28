"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import { ArrowLeft, BarChart3, PieChart as PieIcon, TrendingUp, Globe, AlertTriangle } from 'lucide-react';
import {
  getRiskDistribution, getCountryRisk, getImporterRisk,
  getSummary, getAnomalies
} from '@/lib/services/api';

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

const MOCK_TRENDS = [
  { month: 'Jan', high: 18, medium: 42, low: 95 },
  { month: 'Feb', high: 22, medium: 38, low: 102 },
  { month: 'Mar', high: 15, medium: 50, low: 88 },
  { month: 'Apr', high: 30, medium: 45, low: 110 },
  { month: 'May', high: 28, medium: 60, low: 125 },
  { month: 'Jun', high: 40, medium: 55, low: 98 },
  { month: 'Jul', high: 35, medium: 48, low: 130 },
  { month: 'Aug', high: 25, medium: 52, low: 140 },
  { month: 'Sep', high: 20, medium: 44, low: 118 },
  { month: 'Oct', high: 38, medium: 58, low: 105 },
  { month: 'Nov', high: 45, medium: 62, low: 95 },
  { month: 'Dec', high: 42, medium: 55, low: 88 },
];

const tooltipStyle = {
  backgroundColor: 'rgba(6,9,18,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#e2e8f0',
};

export default function InsightsPage() {
  const router = useRouter();
  const [riskDist, setRiskDist] = useState<any>(null);
  const [countryRisk, setCountryRisk] = useState<any[]>([]);
  const [importerRisk, setImporterRisk] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRiskDistribution(), getCountryRisk(), getImporterRisk(), getSummary()])
      .then(([dist, country, importer, sum]) => {
        setRiskDist(dist);
        setCountryRisk(Array.isArray(country) ? country.slice(0, 8) : []);
        setImporterRisk(Array.isArray(importer) ? importer.slice(0, 8) : []);
        setSummary(sum);
      })
      .finally(() => setLoading(false));
  }, []);

  const pieData = riskDist ? [
    { name: 'Low',      value: riskDist.low      || 800 },
    { name: 'Medium',   value: riskDist.medium    || 200 },
    { name: 'High',     value: riskDist.high      || 80  },
    { name: 'Critical', value: riskDist.critical  || 20  },
  ] : [
    { name: 'Low', value: 800 }, { name: 'Medium', value: 200 },
    { name: 'High', value: 80 }, { name: 'Critical', value: 20 },
  ];

  const countryData = countryRisk.length > 0 ? countryRisk : [
    { country: 'China', risk_count: 45 }, { country: 'UAE', risk_count: 30 },
    { country: 'Singapore', risk_count: 20 }, { country: 'Hong Kong', risk_count: 15 },
    { country: 'Malaysia', risk_count: 12 }, { country: 'Pakistan', risk_count: 10 },
  ];

  const importerData = importerRisk.length > 0 ? importerRisk : [
    { importer: 'ABC Imports', risk_count: 12 }, { importer: 'Global Trade Co', risk_count: 10 },
    { importer: 'Fast Shipping', risk_count: 8 }, { importer: 'Ocean Freight', risk_count: 6 },
    { importer: 'Asia Logistics', risk_count: 5 }, { importer: 'Euro Cargo', risk_count: 4 },
  ];

  const statCards = [
    { label: 'Total Containers', value: summary?.total_containers ?? 1200, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { label: 'High Risk',        value: summary?.high_risk ?? 86,           color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { label: 'Anomalies',        value: summary?.anomalies ?? 42,           color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Cleared',          value: summary?.low_risk ?? 1114,          color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Risk Insights</h1>
          <p className="text-xs text-slate-500 mt-0.5">Analytics & distribution across all containers</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`glass-panel rounded-2xl px-5 py-4 border ${s.border}`}>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{s.label}</p>
            <p className={`text-3xl font-black tabular-nums ${s.color}`}>{loading ? '—' : s.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Row 1: Pie + Risk by Country */}
      <div className="grid grid-cols-12 gap-4">
        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="col-span-12 md:col-span-5 glass-panel rounded-2xl p-5 flex flex-col" style={{ minHeight: 320 }}>
          <div className="panel-header">
            <h2 className="panel-title"><PieIcon className="w-4 h-4 text-emerald-400" />Risk Distribution</h2>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%"
                  paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Country Risk Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="col-span-12 md:col-span-7 glass-panel rounded-2xl p-5 flex flex-col" style={{ minHeight: 320 }}>
          <div className="panel-header">
            <h2 className="panel-title"><Globe className="w-4 h-4 text-emerald-400" />High-Risk by Country</h2>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="country" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="risk_count" name="Risk Count" radius={[0, 4, 4, 0]} fill="#f43f5e" fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Row 2: Risk Trends + Top Importers */}
      <div className="grid grid-cols-12 gap-4">
        {/* Stacked Area Trend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="col-span-12 lg:col-span-7 glass-panel rounded-2xl p-5 flex flex-col" style={{ minHeight: 300 }}>
          <div className="panel-header">
            <h2 className="panel-title"><TrendingUp className="w-4 h-4 text-emerald-400" />Monthly Risk Breakdown</h2>
            <span className="text-[10px] text-slate-500 border border-white/[0.06] bg-white/[0.03] px-2 py-1 rounded-lg font-semibold tracking-widest uppercase">YTD 2026</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TRENDS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="low"    stroke="#10b981" strokeWidth={1.5} fill="url(#gLow)"  name="Low"    />
                <Area type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gMed)"  name="Medium" />
                <Area type="monotone" dataKey="high"   stroke="#f43f5e" strokeWidth={1.5} fill="url(#gHigh)" name="High"   />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Importers */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="col-span-12 lg:col-span-5 glass-panel rounded-2xl p-5 flex flex-col" style={{ minHeight: 300 }}>
          <div className="panel-header">
            <h2 className="panel-title"><AlertTriangle className="w-4 h-4 text-emerald-400" />Top Risk Importers</h2>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={importerData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="importer" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="risk_count" name="Risk Count" radius={[0, 4, 4, 0]} fill="#f59e0b" fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
