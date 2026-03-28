import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const RiskHeatmap = ({ data }) => {
  const chartData = Object.entries(data).map(([country, count]) => ({
    country,
    count
  }));

  const getColor = (value) => {
    if (value > 30) return '#ef4444';
    if (value > 20) return '#f97316';
    if (value > 10) return '#f59e0b';
    return '#10b981';
  };

  const CustomHeatmapTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-md transition-colors">
          <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Count: {payload[0].value}</p>
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
      <h3 className="text-base font-bold text-white tracking-widest uppercase mb-1">Risk Heatmap by Country</h3>
      <p className="text-xs text-gray-400 mb-6">Geographical distribution of flagged shipments</p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="country" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomHeatmapTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
            <Bar dataKey="count" name="Count" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.count)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default RiskHeatmap;
