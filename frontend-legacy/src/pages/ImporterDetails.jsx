import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { getImporterContainers } from '../services/api';

const ImporterDetails = () => {
  const { name } = useParams();
  const [containers, setContainers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const importerName = decodeURIComponent(name);
        const result = await getImporterContainers(importerName);
        setContainers(result.containers || []);
        setAlerts(result.alerts || []);
      } catch (error) {
        console.error('Error fetching importer data:', error);
        setContainers([]);
        setAlerts([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [name]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -4 }}
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Insights</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50">
          <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] dark:text-slate-100 tracking-tight">{decodeURIComponent(name)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Importer details and alerts</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card-premium p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Containers</h3>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{containers.length}</p>
        </div>
        <div className="card-premium p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">High Risk</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{containers.filter(c => c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL').length}</p>
        </div>
        <div className="card-premium p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active Alerts</h3>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{alerts.length}</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card-premium p-6">
        <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-4">Active Alerts</h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div key={index} className={`p-4 rounded-xl border border-gray-100 dark:border-slate-700/50 border-l-[4px] shadow-sm transition-colors ${alert.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/20 border-l-red-500' : 'bg-amber-50 dark:bg-amber-900/20 border-l-amber-500'}`}>
              <div className="flex items-start space-x-3">
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="flex-1">
                  <p className="font-bold text-[#1B2A4A] dark:text-slate-100 text-sm">Container {alert.container_id}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold border shadow-sm transition-colors ${alert.severity === 'CRITICAL' ? 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'}`}>{alert.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card-premium">
        <div className="p-6">
          <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-4">Containers</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 transition-colors">
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">Container ID</th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exporter</th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">Origin</th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk Score</th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk Level</th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((c) => (
                <tr key={c.container_id} onClick={() => navigate(`/container/${c.container_id}`)}
                  className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                  <td className="py-3.5 px-4 text-sm text-[#1B2A4A] dark:text-slate-200 font-bold">{c.container_id}</td>
                  <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{c.exporter}</td>
                  <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{c.origin}</td>
                  <td className="py-3.5 px-4 text-sm text-[#1B2A4A] dark:text-slate-200 font-bold">{c.risk_score.toFixed(2)}</td>
                  <td className="py-3.5 px-4"><RiskBadge level={c.risk_level} /></td>
                  <td className="py-3.5 px-4">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ImporterDetails;
