import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const AnomalyScatterPlot = ({ data }) => {
  // We'll map the data to a format recharts understands
  // x = declared_value, y = measured_weight
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-md">
          <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100">{data.container_id}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Value: ${data.declared_value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Weight: {data.measured_weight} kg</p>
          <p className="text-xs font-semibold text-red-500 mt-1">Risk: {(data.risk_score * 100).toFixed(1)}%</p>
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
      <h3 className="text-base font-bold text-white tracking-widest uppercase mb-1">Anomaly Detection Grid</h3>
      <p className="text-xs text-gray-400 mb-6">Weight vs Value deviations highlighting outliers</p>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
           <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              type="number" 
              dataKey="declared_value" 
              name="Value" 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} 
              domain={['auto', 'auto']}
            />
            <YAxis 
              type="number" 
              dataKey="measured_weight" 
              name="Weight" 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{strokeDasharray: '3 3'}} />
            <Scatter name="Anomalies" data={data} fill="#ef4444" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AnomalyScatterPlot;
