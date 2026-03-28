import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const RiskNotification = ({ alert, onClose }) => {
  if (!alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, y: -50, x: '-50%' }}
        className="fixed top-20 left-1/2 transform z-50 bg-white dark:bg-slate-800 border-2 border-l-[6px] border-red-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 rounded-xl shadow-xl p-4 w-96 flex justify-between"
      >
        <div className="flex items-start space-x-3 w-full">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div className="flex-1 pr-4">
            <h4 className="font-bold text-[#1B2A4A] dark:text-slate-100 mb-1">High Risk Container Detected</h4>
            <p className="text-sm font-medium text-gray-600">Container ID: {alert.container_id}</p>
            <p className="text-sm font-medium text-gray-600">Risk Score: {alert.risk_score.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600 mt-[-4px] mr-[-4px]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RiskNotification;
