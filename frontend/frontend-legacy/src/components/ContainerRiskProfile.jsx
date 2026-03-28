import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Package, User, Building2, Scale, DollarSign, AlertTriangle, CheckCircle, Star, TrendingDown, TrendingUp, Gauge } from 'lucide-react';

const ContainerRiskProfile = ({ container, riskAnalysis }) => {
  if (!container) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0B1221] to-[#070B14] rounded-2xl border border-white/10 p-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-500/50" />
        </div>
        <p className="text-sm font-semibold text-gray-400">No Container Selected</p>
        <p className="text-xs text-gray-600 mt-1 text-center">Select a container from the watchlist to view its risk profile</p>
      </motion.div>
    );
  }

  const rawScore = container.risk_score || 0;
  const score = rawScore <= 1 ? rawScore * 100 : rawScore;

  const getRiskBadge = (s) => {
    if (s >= 75) return { label: 'CRITICAL', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    if (s >= 50) return { label: 'HIGH', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
    if (s >= 25) return { label: 'MEDIUM', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { label: 'LOW', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  };

  const risk = getRiskBadge(score);

  const dw = Number(container.declared_weight) || 0;
  const mw = Number(container.measured_weight || container.weight) || 0;
  const weightDiscrepancy = dw > 0 ? (((mw - dw) / dw) * 100).toFixed(0) : '0';

  // Risk indicators from analysis or computed
  const indicators = riskAnalysis?.indicators || [];
  const riskIndicators = [
    {
      label: 'High Chance',
      value: score >= 50 ? `+${(score * 0.06).toFixed(0)}%` : `-${(100 - score).toFixed(0) * 0.03}%`,
      score: Math.min(99, score + 3),
      color: score >= 50 ? 'text-red-400' : 'text-emerald-400',
      bg: score >= 50 ? 'bg-red-500/10' : 'bg-emerald-500/10'
    },
    {
      label: 'Weight Density',
      value: `${weightDiscrepancy}%`,
      score: Math.abs(Number(weightDiscrepancy)),
      color: Math.abs(Number(weightDiscrepancy)) > 10 ? 'text-orange-400' : 'text-emerald-400',
      bg: Math.abs(Number(weightDiscrepancy)) > 10 ? 'bg-orange-500/10' : 'bg-emerald-500/10'
    },
    {
      label: 'Entity Trust Score',
      value: `${Math.max(10, 100 - score).toFixed(0)}%`,
      score: Math.max(10, 100 - score),
      color: score >= 50 ? 'text-red-400' : 'text-emerald-400',
      bg: score >= 50 ? 'bg-red-500/10' : 'bg-emerald-500/10'
    }
  ];

  const recommendation = riskAnalysis?.recommendation || {
    action: score >= 50 ? 'INSPECT' : 'AUTO_CLEAR',
    description: score >= 50 ? 'Manual inspection recommended' : 'Cleared for processing'
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={container.container_id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="h-full flex flex-col bg-gradient-to-b from-[#0B1221] to-[#070B14] rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-widest uppercase">Container Risk Profile</h3>
          <Star className="w-4 h-4 text-gray-600 hover:text-yellow-400 cursor-pointer transition-colors" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Container ID + Importer Badge */}
          <div className="px-5 py-3 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white font-mono">{container.container_id}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${risk.bg} ${risk.text} ${risk.border} border`}>
                {risk.label} · Importer
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 mt-2">
              <div>
                <p className="text-[9px] text-gray-600 uppercase">Importer</p>
                <p className="text-[11px] text-white font-medium">{container.importer || container.importer_id || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-600 uppercase">Imports</p>
                <p className="text-[11px] text-emerald-400 font-bold">{score >= 50 ? 'HIGH FREQ' : 'NORMAL'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 uppercase">Exporter</p>
                <p className="text-[11px] text-white font-medium">{container.exporter || container.exporter_id || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-600 uppercase">Trust</p>
                <p className="text-[11px] text-gray-400 font-mono">{Math.max(10, 100 - score).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Commodity + Value */}
          <div className="px-5 py-3 border-b border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] text-gray-600 uppercase">Commodity</p>
                <p className="text-xs text-white font-medium">{container.commodity || container.hs_code || '—'}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">Score: {score.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 uppercase">Declared Value</p>
                <p className="text-xs text-white font-medium">
                  {container.declared_value ? `$${Number(container.declared_value).toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Weight Comparison */}
          <div className="px-5 py-3 border-b border-white/5">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
                <p className="text-[8px] text-gray-600 uppercase tracking-wider">Declared Wt</p>
                <p className="text-xs font-bold text-white mt-0.5">
                  {dw > 0 ? `${dw.toLocaleString()} kg` : '—'}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5 flex flex-col items-center justify-center">
                <span className="text-[8px] text-gray-600 uppercase">vs</span>
                {Number(weightDiscrepancy) > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-400 mt-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-emerald-400 mt-0.5" />
                )}
                <span className={`text-[10px] font-bold mt-0.5 ${Math.abs(Number(weightDiscrepancy)) > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {weightDiscrepancy}%
                </span>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
                <p className="text-[8px] text-gray-600 uppercase tracking-wider">Measured Wt</p>
                <p className="text-xs font-bold text-white mt-0.5">
                  {mw > 0 ? `${mw.toLocaleString()} kg` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="px-5 py-3">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Risk Indicators</p>
            <div className="space-y-2">
              {riskIndicators.map((ind, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${ind.bg} border border-white/5`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${ind.color.replace('text-', 'bg-')}`} />
                    <span className="text-[10px] text-gray-300 font-medium">{ind.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${ind.color}`}>{ind.value}</span>
                    <span className="text-[9px] text-gray-500 tabular-nums">{ind.score.toFixed(0)}</span>
                    <span className="text-[9px] text-gray-600">{ind.score >= 50 ? '▲' : '▼'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="px-5 py-3 border-t border-white/10">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
            recommendation.action === 'INSPECT' || recommendation.action === 'HOLD'
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-emerald-500/10 border border-emerald-500/20'
          }`}>
            {recommendation.action === 'INSPECT' || recommendation.action === 'HOLD' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${
                recommendation.action === 'INSPECT' || recommendation.action === 'HOLD' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {recommendation.action}
              </p>
              <p className="text-[10px] text-gray-400">{recommendation.description}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ContainerRiskProfile;
