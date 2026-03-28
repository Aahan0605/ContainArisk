import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';

const RiskTrendChart = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-md">
          <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100 mb-1">{label}</p>
          <div className="flex flex-col space-y-1">
            {payload.map((entry, index) => (
              <span key={index} className="text-xs font-semibold" style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6 bg-gradient-to-br from-backend-800 to-backend-900 border-t border-white/10 shadow-glass"
    >
      <h3 className="text-base font-bold text-white tracking-widest uppercase mb-1">Risk Trends Over Time</h3>
      <p className="text-xs text-gray-400 mb-6">Tracking total shipments vs high-risk anomalies</p>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" name="Total Shipments" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
            <Area type="monotone" dataKey="high_risk" name="High Risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHighRisk)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default RiskTrendChart;
