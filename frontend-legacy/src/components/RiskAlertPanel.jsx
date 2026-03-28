import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRiskAlerts } from '../services/api';
import RiskBadge from './RiskBadge';

const RiskAlertPanel = ({ onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await getRiskAlerts();
      setAlerts(data);
    };
    fetchAlerts();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-[73px] w-96 h-[calc(100vh-73px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl border-l border-gray-200 dark:border-slate-800 z-50 overflow-y-auto transition-colors"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1B2A4A] dark:text-slate-100">Risk Alerts</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                navigate(`/container/${alert.container_id}`);
                onClose();
              }}
              className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm border-l-4 border-l-red-500 dark:border-l-red-600 cursor-pointer hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#1B2A4A] dark:text-slate-100">{alert.container_id}</span>
                    <RiskBadge level={alert.risk_level} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{alert.importer}</p>
                  <p className="text-sm text-[#1B2A4A] dark:text-slate-200 font-semibold">Risk Score: {alert.risk_score.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{alert.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default RiskAlertPanel;
