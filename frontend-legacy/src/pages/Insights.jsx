import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import RiskHeatmap from '../components/RiskHeatmap';
import { getCountryRisk, getImporterRisk, getRiskHeatmap } from '../services/api';

const Insights = () => {
  const [countryRisk, setCountryRisk] = useState([]);
  const [importerRisk, setImporterRisk] = useState([]);
  const [heatmapData, setHeatmapData] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [country, importer, heatmap] = await Promise.all([
        getCountryRisk(),
        getImporterRisk(),
        getRiskHeatmap()
      ]);
      setCountryRisk(country);
      setImporterRisk(importer);
      setHeatmapData(heatmap);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-md transition-colors">
          <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{payload[0].value} risk alerts</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold text-[#1B2A4A] dark:text-slate-100 tracking-tight">Insights</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deep dive into risk patterns and trends</p>
      </motion.div>

      <RiskHeatmap data={heatmapData} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="card-premium p-6">
        <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-1">Risk by Country</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Geographical distribution of flagged shipments</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={countryRisk}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="country" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
            <Bar dataKey="risk_count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="6366f1" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
        className="card-premium p-6">
        <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-1">Top Risky Importers</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Importers with the highest risk flags</p>
        <div className="space-y-2">
          {importerRisk.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              whileHover={{ x: 4 }}
              onClick={() => navigate(`/importer/${encodeURIComponent(item.importer)}`)}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer group transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-blue-500/20">
                  {index + 1}
                </div>
                <span className="font-semibold text-sm text-[#1B2A4A] dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.importer}</span>
              </div>
              <span className="text-sm text-red-600 font-bold">{item.risk_count} alerts</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Insights;
