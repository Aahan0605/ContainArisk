"use client";

import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const MOCK_DATA = [
  { month: 'Jan', risk: 40, volume: 120, anomalies: 8  },
  { month: 'Feb', risk: 45, volume: 130, anomalies: 10 },
  { month: 'Mar', risk: 35, volume: 140, anomalies: 6  },
  { month: 'Apr', risk: 50, volume: 160, anomalies: 14 },
  { month: 'May', risk: 65, volume: 180, anomalies: 18 },
  { month: 'Jun', risk: 85, volume: 160, anomalies: 24 },
  { month: 'Jul', risk: 60, volume: 190, anomalies: 16 },
  { month: 'Aug', risk: 55, volume: 200, anomalies: 13 },
  { month: 'Sep', risk: 45, volume: 180, anomalies: 9  },
  { month: 'Oct', risk: 70, volume: 150, anomalies: 20 },
  { month: 'Nov', risk: 90, volume: 140, anomalies: 28 },
  { month: 'Dec', risk: 80, volume: 130, anomalies: 22 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#060912]/95 border border-white/[0.08] rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="text-slate-400 font-bold uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-slate-200 font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function RiskTrendChart({ data }: { data: any[] }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      const filtered = data
        .map((d: any) => {
          const dateStr = d.date || d.month || '';
          const year = dateStr ? parseInt(dateStr.split('-')[0]) : selectedYear;
          return year === selectedYear
            ? {
                month:     d.month || d.date?.slice(5, 7) || d.date?.slice(0, 7) || '',
                risk:      Math.round((d.risk ?? d.high_risk ?? 0)),
                volume:    Math.round((d.volume ?? d.total ?? 0)),
                anomalies: Math.round((d.anomalies ?? d.high_risk ?? 0)),
              }
            : null;
        })
        .filter(Boolean);
      return filtered.length > 0 ? filtered : MOCK_DATA;
    }
    return MOCK_DATA;
  }, [data, selectedYear]);

  const availableYears = useMemo(() => {
    if (!data || data.length === 0) return [new Date().getFullYear()];
    const years = new Set<number>();
    data.forEach((d: any) => {
      const dateStr = d.date || d.month || '';
      if (dateStr) {
        const year = parseInt(dateStr.split('-')[0]);
        if (!isNaN(year)) years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <h2 className="panel-title">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Risk Trends Over Time
        </h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="text-[10px] text-slate-300 border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 rounded-lg font-semibold tracking-widest uppercase cursor-pointer hover:bg-white/[0.06] transition-all"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 w-full" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.2}  />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gAnom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={8} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle" iconSize={7}
              formatter={(v) => <span className="text-[10px] text-slate-500 font-medium">{v}</span>}
              wrapperStyle={{ paddingTop: 8 }}
            />
            <Area type="monotone" dataKey="volume"    name="Trade Volume"   stroke="#0ea5e9" strokeWidth={1.8} fill="url(#gVolume)" />
            <Area type="monotone" dataKey="risk"      name="Avg Risk Score" stroke="#f43f5e" strokeWidth={1.8} fill="url(#gRisk)"   />
            <Area type="monotone" dataKey="anomalies" name="Anomalies"      stroke="#f59e0b" strokeWidth={1.5} fill="url(#gAnom)"   />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
