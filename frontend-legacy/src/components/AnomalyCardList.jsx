import { motion } from 'framer-motion';
import { AlertTriangle, Scale, TrendingDown, ArrowDownRight } from 'lucide-react';

const AnomalyCardList = ({ anomalies = [] }) => {
  const safeAnomalies = Array.isArray(anomalies) ? anomalies.slice(0, 10) : [];

  const norm = (s) => { const v = Number(s) || 0; return v <= 1 ? v * 100 : v; };

  const getAnomalyType = (anomaly) => {
    const dv = Number(anomaly.declared_value) || 0;
    const mw = Number(anomaly.measured_weight) || 0;
    if (mw > 15000) return { type: 'Weight Detection', icon: Scale, color: 'text-orange-400', bg: 'bg-orange-500/10' };
    if (dv > 500000) return { type: 'VUP M4', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' };
    return { type: 'Weight Detection', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-b from-[#0B1221] to-[#070B14] rounded-2xl border border-white/10 overflow-hidden h-full flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-widest uppercase">Anomaly Detection</h3>
        <div className="flex items-center gap-2">
          <ArrowDownRight className="w-3.5 h-3.5 text-gray-500" />
        </div>
      </div>

      {/* Anomaly Cards */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
        {safeAnomalies.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-xs">
            No anomalies detected
          </div>
        ) : (
          safeAnomalies.map((anomaly, i) => {
            const score = norm(anomaly.risk_score);
            const at = getAnomalyType(anomaly);
            const deviation = (score * -0.01 + Math.random() * 0.2 - 0.1).toFixed(3);

            return (
              <motion.div
                key={anomaly.container_id || i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${at.bg} flex-shrink-0`}>
                    <at.icon className={`w-4 h-4 ${at.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-white">{at.type}</span>
                      <span className={`text-[9px] font-bold ${score >= 75 ? 'text-red-400' : score >= 50 ? 'text-orange-400' : 'text-yellow-400'}`}>
                        {deviation}
                      </span>
                    </div>

                    <p className="text-[10px] font-mono text-gray-300 mb-1">{anomaly.container_id}</p>

                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[8px] text-gray-600 uppercase">Origin</span>
                        <p className="text-[9px] text-gray-400">{anomaly.origin || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-600 uppercase">Dest</span>
                        <p className="text-[9px] text-gray-400">{anomaly.destination || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-600 uppercase">Risk</span>
                        <p className={`text-[9px] font-bold ${score >= 75 ? 'text-red-400' : 'text-orange-400'}`}>
                          {anomaly.risk_level || 'HIGH'}
                        </p>
                      </div>
                    </div>

                    {/* Indicator bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] text-gray-600">Indicator</span>
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${Math.min(score, 100)}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-gray-500 tabular-nums">{score.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default AnomalyCardList;
