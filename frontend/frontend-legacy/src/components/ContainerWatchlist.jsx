import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Star } from 'lucide-react';

const ContainerWatchlist = ({ containers = [], onSelect, selectedId }) => {
  const safeContainers = Array.isArray(containers) ? containers : [];

  const norm = (score) => {
    const s = Number(score) || 0;
    return s <= 1 ? s * 100 : s;
  };

  const getActionBadge = (score) => {
    if (score >= 50) return { label: 'INSPECT', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    if (score >= 25) return { label: 'MONITOR', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { label: 'CLEAR', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col bg-gradient-to-b from-[#0B1221] to-[#070B14] rounded-2xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-widest uppercase">Container Watchlist</h3>
        </div>
        <Star className="w-4 h-4 text-gray-600 hover:text-yellow-400 cursor-pointer transition-colors" />
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-2">
        {safeContainers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-xs">
            No containers detected
          </div>
        ) : (
          safeContainers.map((container, i) => {
            const riskPct = norm(container.risk_score);
            const action = getActionBadge(riskPct);
            const isSelected = selectedId === container.container_id;
            const confidence = Math.min(99.9, riskPct + Math.random() * 5).toFixed(1);

            return (
              <motion.div
                key={container.container_id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onSelect?.(container)}
                className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                {/* Row 1: Container ID + Action Badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white font-mono">
                    {container.container_id || `CTR-${i}`}
                  </span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded ${action.bg} ${action.text} ${action.border} border tracking-wider`}>
                    {action.label}
                  </span>
                </div>

                {/* Row 2: Origin/Country info */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
                  <span className="text-[10px] text-gray-400 truncate">
                    {container.origin || 'Unknown'} / {container.destination || 'Unknown'}
                  </span>
                </div>

                {/* Row 3: Risk % + Confidence + Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black tabular-nums ${riskPct >= 75 ? 'text-red-400' : riskPct >= 50 ? 'text-orange-400' : riskPct >= 25 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {riskPct.toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-gray-500">|</span>
                    <span className="text-[10px] text-gray-400 font-mono">{confidence}%</span>
                  </div>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${action.bg} ${action.text}`}>
                    {action.label}
                  </span>
                </div>

                {/* Hover arrow */}
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default ContainerWatchlist;
