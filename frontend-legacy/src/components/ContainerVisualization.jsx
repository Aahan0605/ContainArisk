import { motion } from 'framer-motion';
import { useState } from 'react';
import { Box, X, Bell } from 'lucide-react';

const ContainerVisualization = ({ containers = [], onSelect, selectedId, selectedContainer }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const safeContainers = Array.isArray(containers) ? containers.slice(0, 30) : [];

  const norm = (s) => { const v = Number(s) || 0; return v <= 1 ? v * 100 : v; };

  const getCellColor = (score) => {
    if (score >= 75) return '#ef4444';
    if (score >= 50) return '#f97316';
    if (score >= 25) return '#eab308';
    return '#22c55e';
  };

  // Build cargo section data from containers
  const cargoSections = safeContainers.slice(0, 5).map((c, i) => {
    const score = norm(c.risk_score);
    const commodities = ['Steel Beams', 'Machinery Parts', 'Electronics', 'Epoxy', 'Textiles'];
    return {
      name: c.commodity || c.hs_code || commodities[i % commodities.length],
      declared: c.declared_weight ? `${Number(c.declared_weight).toLocaleString()} kg` : '—',
      measured: c.measured_weight || c.weight ? `${Number(c.measured_weight || c.weight).toLocaleString()} kg` : '—',
      score,
      color: getCellColor(score),
      container: c
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col bg-gradient-to-b from-[#0B1221] to-[#070B14] rounded-2xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-widest uppercase">
          Container Inspection Visualization
        </h3>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <Bell className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Truck Image with Cargo Overlays */}
      <div className="flex-1 px-5 py-4 flex flex-col items-center justify-center relative">
        <div className="relative w-full max-w-xl">
          {/* Truck image */}
          <img
            src="/images/container-truck.png"
            alt="Container Truck"
            className="w-full h-auto object-contain rounded-lg"
            style={{ filter: 'brightness(0.9) contrast(1.05)' }}
          />

          {/* Overlaid risk scan lines on container area */}
          <div
            className="absolute flex gap-[2px]"
            style={{ 
              top: '8%', left: '28%', width: '65%', height: '55%',
              pointerEvents: 'none'
            }}
          >
            {safeContainers.slice(0, 8).map((c, i) => {
              const score = norm(c.risk_score);
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm opacity-25 border border-white/10"
                  style={{
                    backgroundColor: getCellColor(score),
                    boxShadow: `0 0 8px ${getCellColor(score)}40`
                  }}
                />
              );
            })}
          </div>

          {/* Risk scan label */}
          {selectedContainer && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5">
              <p className="text-[9px] text-gray-400 uppercase">Scan Result</p>
              <p className="text-xs font-bold text-white">{norm(selectedContainer.risk_score).toFixed(1)}% Risk</p>
            </div>
          )}
        </div>

        {/* Cargo Category Cards */}
        <div className="grid grid-cols-4 gap-2 w-full mt-4">
          {cargoSections.slice(0, 4).map((cargo, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              onClick={() => onSelect?.(cargo.container)}
              className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 cursor-pointer hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: cargo.color }} />
                <span className="text-[10px] font-bold text-white truncate">{cargo.name}</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500">Declared</span>
                  <span className="text-[9px] text-gray-300 font-mono">{cargo.declared}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500">Measured</span>
                  <span className="text-[9px] text-gray-300 font-mono">{cargo.measured}</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[9px] text-gray-500">Risk</span>
                  <span className="text-[9px] font-bold" style={{ color: cargo.color }}>
                    {cargo.score.toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ContainerVisualization;
