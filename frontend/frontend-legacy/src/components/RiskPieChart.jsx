import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

const RiskPieChart = ({ data }) => {
  const chartData = [
    { name: 'Low', value: data.low, color: COLORS[0] },
    { name: 'Medium', value: data.medium, color: COLORS[1] },
    { name: 'High', value: data.high, color: COLORS[2] },
    { name: 'Critical', value: data.critical, color: COLORS[3] }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-md transition-colors">
          <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100">{payload[0].name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{payload[0].value} containers</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ name, percent, cx, cy, midAngle, outerRadius }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="fill-gray-600 text-xs font-semibold">
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="card-premium p-6 h-full bg-gradient-to-br from-backend-800 to-backend-900 border-t border-white/10 shadow-glass"
    >
      <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-1">Risk Distribution</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Container risk level breakdown</p>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={95}
              innerRadius={55}
              fill="#8884d8"
              dataKey="value"
              stroke="none"
              paddingAngle={3}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend */}
      <div className="flex items-center justify-center gap-5 mt-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RiskPieChart;
