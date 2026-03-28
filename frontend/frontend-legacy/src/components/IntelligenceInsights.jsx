import { motion } from 'framer-motion';
import { AlertCircle, ShieldAlert, Info } from 'lucide-react';

const IntelligenceInsights = ({ insights = [] }) => {
  const getIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgStyle = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30';
      case 'high': return 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30';
      default: return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6 flex flex-col h-full bg-gradient-to-br from-backend-800 to-backend-900 border-t border-white/10 shadow-glass"
    >
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide mb-1 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-500 rounded-full inline-block mr-1"></span> Live Intelligence
          </h3>
          <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-500">Dynamically generated from databanks</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-bold text-red-500 tracking-wider">LIVE</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-sm text-gray-500 animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-600 animate-spin-slow mb-3"></div>
            Scanning global manifest databanks...
          </div>
        ) : (
          insights.map((insight, idx) => (
            <motion.div 
              key={insight.id || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-xl border flex items-start space-x-4 bg-white/5 backdrop-blur-md shadow-lg ${
                insight.severity === 'critical' ? 'border-red-500/30' : 
                insight.severity === 'high' ? 'border-orange-500/30' : 'border-blue-500/30'
              }`}
            >
              <div className={`mt-0.5 flex-shrink-0 p-2 rounded-lg ${
                insight.severity === 'critical' ? 'bg-red-500/20' : 
                insight.severity === 'high' ? 'bg-orange-500/20' : 'bg-blue-500/20'
              }`}>
                {getIcon(insight.severity)}
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${
                  insight.severity === 'critical' ? 'text-red-400' : 
                  insight.severity === 'high' ? 'text-orange-400' : 'text-blue-400'
                }`}>
                  {insight.type} ALERT
                </span>
                <p className="text-sm font-medium text-gray-200 leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default IntelligenceInsights;
