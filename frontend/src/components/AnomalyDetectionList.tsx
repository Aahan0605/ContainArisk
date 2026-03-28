"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertCircle } from 'lucide-react';

interface AnomalyDetectionListProps {
  anomalies: any[];
}

const ANOMALY_TYPES = ['Weight Mismatch', 'Route Deviation', 'Document Anomaly', 'Value Discrepancy', 'Flagged Exporter', 'Dwell Time Exceeded'];

const MOCK = [
  { id: 'AN-1042', type: 'Weight Mismatch',   severity: 'CRITICAL', container: 'HLXU-849201', time: '10 min ago' },
  { id: 'AN-1043', type: 'Route Deviation',   severity: 'HIGH',     container: 'MSCU-901234', time: '1 hr ago'   },
  { id: 'AN-1044', type: 'Document Anomaly',  severity: 'CRITICAL', container: 'CMAU-456789', time: '2 hrs ago'  },
  { id: 'AN-1045', type: 'Value Discrepancy', severity: 'HIGH',     container: 'TGHU-112233', time: '5 hrs ago'  },
];

export default function AnomalyDetectionList({ anomalies }: AnomalyDetectionListProps) {
  // Map backend container objects → anomaly display objects
  const displayAnomalies = anomalies && anomalies.length > 0
    ? anomalies.slice(0, 6).map((c: any, i: number) => {
        const level = (c.risk_level || '').toUpperCase();
        const severity = level === 'CRITICAL' ? 'CRITICAL' : level === 'HIGH' ? 'HIGH' : 'MEDIUM';
        return {
          id: `AN-${c.container_id || i}`,
          type: ANOMALY_TYPES[i % ANOMALY_TYPES.length],
          severity,
          container: c.container_id || '—',
          time: `${i + 1}h ago`,
        };
      })
    : MOCK;

  const criticalCount = displayAnomalies.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <h2 className="panel-title">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          Anomaly Detection
        </h2>
        <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg font-bold tracking-widest uppercase border border-rose-500/20 animate-pulse">
          {criticalCount} Critical
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        <AnimatePresence>
          {displayAnomalies.map((anomaly, idx) => (
            <motion.div
              key={anomaly.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              className="p-3 bg-[#0a0d14]/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-3.5 h-3.5 flex-shrink-0 ${
                    anomaly.severity === 'CRITICAL' ? 'text-rose-500' :
                    anomaly.severity === 'HIGH'     ? 'text-amber-500' : 'text-emerald-500'
                  }`} />
                  <span className="text-xs font-bold text-slate-200">{anomaly.type}</span>
                </div>
                <span className="text-[9px] text-gray-500 uppercase tracking-widest whitespace-nowrap ml-1">{anomaly.time}</span>
              </div>
              <div className="flex justify-between items-end mt-2">
                <span className="text-[10px] text-gray-400 font-mono bg-[#131823] px-1.5 py-0.5 rounded border border-white/5">
                  {anomaly.container}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest uppercase ${
                  anomaly.severity === 'CRITICAL' ? 'text-rose-500 bg-rose-500/10' :
                  anomaly.severity === 'HIGH'     ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'
                }`}>
                  {anomaly.severity}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
