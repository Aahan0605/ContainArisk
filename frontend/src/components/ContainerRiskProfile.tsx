"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PackageSearch, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown, Scale, ExternalLink } from 'lucide-react';

interface ContainerRiskProfileProps {
  container: any;
  riskAnalysis?: any;
  onViewReport?: () => void;
}

export default function ContainerRiskProfile({ container, riskAnalysis, onViewReport }: ContainerRiskProfileProps) {
  const router = useRouter();

  if (!container) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500">
      <PackageSearch className="w-8 h-8 opacity-20 mb-2" />
      <p className="text-sm">Select a container</p>
    </div>
  );

  const handleViewDetail = () => router.push(`/container/${container.container_id}`);
  const riskScore = Math.round((container.risk_score || 0) * 100);
  const isHighRisk = riskScore >= 75;

  // Real CSV fields (0-100 scale from backend)
  const entityTrust      = Math.round(Math.min(100, Math.max(0, (container.entity_trust_score ?? 0) * 100)));
  const weightDeviation  = Math.abs(Math.round(container.weight_deviation_percent ?? 0));
  const sealTamperProb   = Math.round(Math.min(100, Math.max(0, (container.seal_tamper_prob ?? 0) * 100)));
  const taxEvasionProb   = Math.round(Math.min(100, Math.max(0, (container.tax_evasion_prob ?? 0) * 100)));

  const declaredWeight  = container.declared_weight ?? 0;
  const measuredWeight  = container.weight ?? 0;
  const weightDiffPct   = declaredWeight > 0
    ? ((measuredWeight - declaredWeight) / declaredWeight * 100).toFixed(1)
    : '0.0';
  const weightDiffSign  = parseFloat(weightDiffPct) >= 0 ? '+' : '';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="panel-header">
        <div>
          <button
            onClick={handleViewDetail}
            className="text-base font-bold tracking-tight text-slate-100 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 group"
          >
            {container.container_id || 'UNKNOWN'}
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest font-semibold">Risk Profile · click ID to expand</p>
        </div>
        <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-widest uppercase ${
          isHighRisk ? 'border-rose-500/25 text-rose-400 bg-rose-500/10' : 'border-emerald-500/25 text-emerald-400 bg-emerald-500/10'
        }`}>
          {container.risk_level || (isHighRisk ? 'CRITICAL' : 'OK')}
        </div>
      </div>

      {/* Entity Details */}
      <div className="space-y-4 mb-6 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500/50 via-gray-800 to-transparent"></div>
        
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Declarant / Importer</p>
          <p className="text-sm font-medium text-slate-200">{container.importer || 'N/A'}</p>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Exporter</p>
          <p className="text-sm font-medium text-slate-200">{container.exporter || 'N/A'}</p>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-white/5 to-transparent mb-6"></div>

      {/* Commodity & Value */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">HS Code</p>
          <p className="text-sm font-medium text-slate-200 truncate">{container.hs_code || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1 text-right">Declared Value</p>
          <p className="text-sm font-medium text-slate-200 text-right">
            {container.declared_value ? `$${Number(container.declared_value).toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      {/* Weight Comparison */}
      <div className="bg-[#0a0d14]/50 border border-white/5 rounded-lg p-3 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Declared Wt</p>
            <p className="text-sm font-medium text-slate-200">{declaredWeight ? Number(declaredWeight).toLocaleString() : '—'} kg</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">VS</span>
            <Scale className="w-4 h-4 text-emerald-500" />
            <span className={`text-[10px] font-bold mt-1 ${parseFloat(weightDiffPct) > 5 ? 'text-rose-400' : 'text-emerald-500'}`}>
              {weightDiffSign}{weightDiffPct}%
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Measured Wt</p>
            <p className="text-sm font-medium text-slate-100">{measuredWeight ? Number(measuredWeight).toLocaleString() : '—'} kg</p>
          </div>
        </div>
      </div>

      {/* Risk Indicators (Progress Bars) */}
      <div className="mt-auto space-y-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Risk Indicators</p>
        
        {/* Seal Tamper Probability */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 neon-glow-danger" />
              <span className="text-xs font-medium text-slate-300">Seal Tamper Prob</span>
            </div>
            <span className="text-xs text-rose-400 font-bold">{sealTamperProb}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#0a0d14] rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${sealTamperProb}%` }} className="h-full bg-rose-500" />
          </div>
        </div>

        {/* Weight Deviation */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 neon-glow-warning" />
              <span className="text-xs font-medium text-slate-300">Weight Deviation</span>
            </div>
            <span className="text-xs text-amber-400 font-bold">{weightDeviation}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#0a0d14] rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(weightDeviation, 100)}%` }} className="h-full bg-amber-500" />
          </div>
        </div>

        {/* Entity Trust Score */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 neon-glow-success" />
              <span className="text-xs font-medium text-slate-300">Entity Trust Score</span>
            </div>
            <span className="text-xs text-emerald-400 font-bold">{entityTrust}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#0a0d14] rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${entityTrust}%` }} className="h-full bg-emerald-500" />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <button
          onClick={handleViewDetail}
          className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <PackageSearch className="w-4 h-4" />
          View Detailed Report
        </button>
      </div>
    </div>
  );
}
