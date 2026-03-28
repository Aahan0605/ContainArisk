"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Package, Shield, AlertTriangle, Scale,
  MapPin, Truck, FileText, TrendingUp, Download, Mail, CheckCircle2, X, ShieldAlert
} from 'lucide-react';
import { getContainerDetails, getRiskAnalysis, downloadReport, sendReportEmail } from '@/lib/services/api';

function buildAnomalies(container: any, analysis: any) {
  const list: { type: string; description: string; severity: string; source: string }[] = [];

  if (analysis?.indicators?.length) {
    analysis.indicators.forEach((ind: any) => {
      list.push({
        type: ind.indicator || 'Risk Indicator',
        description: ind.description || ind.indicator,
        severity: (ind.severity || 'MEDIUM').toUpperCase(),
        source: 'ML Engine',
      });
    });
  }

  if (container?.explanations?.length) {
    container.explanations.forEach((exp: string) => {
      if (!list.find(a => a.description === exp))
        list.push({ type: 'AI Explanation', description: exp, severity: 'HIGH', source: 'AI Model' });
    });
  }

  const wDiff = container?.declared_weight && (container?.weight ?? container?.measured_weight)
    ? (((container.weight ?? container.measured_weight) - container.declared_weight) / container.declared_weight) * 100 : 0;
  const measuredWt = container?.weight ?? container?.measured_weight ?? 0;
  if (Math.abs(wDiff) > 3)
    list.push({
      type: 'Weight Discrepancy',
      description: `Measured weight (${Number(measuredWt).toLocaleString()} kg) differs from declared (${Number(container.declared_weight).toLocaleString()} kg) by ${wDiff > 0 ? '+' : ''}${wDiff.toFixed(1)}%`,
      severity: Math.abs(wDiff) > 15 ? 'CRITICAL' : 'HIGH',
      source: 'Customs Check',
    });

  if ((container?.dwell_time_hours || 0) > 72)
    list.push({
      type: 'Extended Dwell Time',
      description: `Container has been at port for ${container.dwell_time_hours}h, exceeding the 72h threshold`,
      severity: container.dwell_time_hours > 120 ? 'CRITICAL' : 'HIGH',
      source: 'Port System',
    });

  if ((container?.clearance_status || '').toLowerCase() === 'held')
    list.push({
      type: 'Clearance Held',
      description: 'Container clearance is HELD — pending mandatory customs review',
      severity: 'CRITICAL',
      source: 'Customs System',
    });

  const rs = Math.round((container?.risk_score ?? 0) * 100);
  if (rs >= 90)
    list.push({ type: 'Extreme Risk Score', description: `ML model assigned a risk score of ${rs}% — flagged for mandatory inspection`, severity: 'CRITICAL', source: 'ML Engine' });
  else if (rs >= 70)
    list.push({ type: 'High Risk Score', description: `ML model assigned a risk score of ${rs}% — elevated scrutiny required`, severity: 'HIGH', source: 'ML Engine' });

  // deduplicate
  return list.filter((a, i, arr) => arr.findIndex(b => b.description === a.description) === i)
    .sort((a, b) => ['CRITICAL','HIGH','MEDIUM','LOW'].indexOf(a.severity) - ['CRITICAL','HIGH','MEDIUM','LOW'].indexOf(b.severity));
}

const SEV: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  CRITICAL: { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    dot: 'bg-rose-500'    },
  HIGH:     { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  dot: 'bg-orange-500'  },
  MEDIUM:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-500'   },
  LOW:      { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
};

const RISK_COLORS: Record<string, { text: string; bg: string; border: string; bar: string }> = {
  CRITICAL: { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    bar: 'bg-rose-500'    },
  HIGH:     { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  bar: 'bg-orange-500'  },
  MEDIUM:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   bar: 'bg-amber-500'   },
  LOW:      { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', bar: 'bg-emerald-500' },
};

const Field = ({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) => (
  <div>
    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{label}</p>
    <p className={`text-sm text-slate-200 font-medium ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</p>
  </div>
);

const Bar = ({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-300 font-bold">{Math.round(value)}</span>
    </div>
    <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

export default function ContainerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [container, setContainer] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle'|'success'|'error'>('idle');
  const [emailing, setEmailing]       = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle'|'success'|'error'>('idle');

  // Registered email from localStorage (set at login)
  const registeredEmail = typeof window !== 'undefined' ? localStorage.getItem('officerName') || '' : '';

  useEffect(() => {
    if (!id) return;
    Promise.all([getContainerDetails(id), getRiskAnalysis(id)]).then(([c, a]) => {
      setContainer(c);
      setAnalysis(a);
      setLoading(false);
    });
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadStatus('idle');
    const res = await downloadReport(id);
    setDownloadStatus(res.success ? 'success' : 'error');
    setDownloading(false);
    setTimeout(() => setDownloadStatus('idle'), 3000);
  };

  const handleEmail = async () => {
    if (!registeredEmail) return;
    setEmailing(true);
    setEmailStatus('idle');
    const res = await sendReportEmail(id, registeredEmail);
    setEmailStatus(res.success !== false ? 'success' : 'error');
    setEmailing(false);
    setTimeout(() => setEmailStatus('idle'), 4000);
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (!container) return (
    <div className="flex h-full items-center justify-center text-slate-500">Container not found.</div>
  );

  const riskScore = Math.round((container.risk_score ?? 0) * 100);
  const level = (container.risk_level || 'LOW').toUpperCase();
  const rc = RISK_COLORS[level] || RISK_COLORS.LOW;
  // backend returns measured weight as `weight`
  const measuredW  = container.measured_weight ?? container.weight ?? 0;
  const declaredW  = container.declared_weight ?? 0;
  const weightDiff = measuredW && declaredW
    ? (((measuredW - declaredW) / declaredW) * 100).toFixed(1)
    : null;
  const anomalies = buildAnomalies(container, analysis);

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto">

      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-200 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        <button onClick={handleDownload} disabled={downloading}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 ${
            downloadStatus === 'success' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-none' :
            downloadStatus === 'error'   ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400 shadow-none' :
            'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
          }`}>
          {downloadStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
           downloadStatus === 'error'   ? <X className="w-3.5 h-3.5" /> :
           <Download className="w-3.5 h-3.5" />}
          {downloading ? 'Generating...' :
           downloadStatus === 'success' ? 'Downloaded!' :
           downloadStatus === 'error'   ? 'Failed — retry' :
           'Download Report'}
        </button>
        <button onClick={handleEmail} disabled={emailing || !registeredEmail}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all border disabled:opacity-50 ${
            emailStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
            emailStatus === 'error'   ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' :
            'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-sky-500/10 hover:border-sky-500/25 hover:text-sky-400'
          }`}
        >
          {emailStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
           emailStatus === 'error'   ? <X className="w-3.5 h-3.5" /> :
           <Mail className="w-3.5 h-3.5" />}
          {emailing ? 'Sending...' :
           emailStatus === 'success' ? `Sent to ${registeredEmail}` :
           emailStatus === 'error'   ? 'Failed — retry' :
           'Email Report'}
        </button>
      </div>

      {/* Title row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Package className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Container ID</p>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight font-mono">{container.container_id}</h1>
        </div>
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${rc.bg} ${rc.border}`}>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Risk Score</p>
            <p className={`text-3xl font-black tabular-nums ${rc.text}`}>{riskScore}%</p>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-widest uppercase ${rc.text} ${rc.bg} border ${rc.border}`}>
            {level}
          </div>
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col — shipment details */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 flex flex-col gap-5">

          {/* Route */}
          <div className="glass-panel rounded-2xl p-5">
            <p className="panel-label mb-4 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Route & Ports</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Origin</p>
                <p className="text-xl font-black text-slate-100">{container.origin || container.origin_country || '—'}</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-1 w-full">
                  <div className="h-px flex-1 bg-white/10" />
                  <Truck className="w-4 h-4 text-slate-600" />
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </div>
              <div className="flex-1 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Destination</p>
                <p className="text-xl font-black text-slate-100">{container.destination || container.destination_country || '—'}</p>
              </div>
            </div>
            {container.destination_port && (
              <p className="text-xs text-slate-500 text-center mt-3">Port: {container.destination_port}</p>
            )}
          </div>

          {/* Declaration details */}
          <div className="glass-panel rounded-2xl p-5">
            <p className="panel-label mb-4 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Declaration Details</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Field label="Importer" value={container.importer || container.importer_id} />
              <Field label="Exporter" value={container.exporter || container.exporter_id} />
              <Field label="HS Code" value={container.hs_code} mono />
              <Field label="Declared Value" value={container.declared_value ? `$${Number(container.declared_value).toLocaleString()}` : '—'} />
              <Field label="Trade Regime" value={container.trade_regime} />
              <Field label="Shipping Line" value={container.shipping_line} />
              <Field label="Declaration Date" value={container.declaration_date ? new Date(container.declaration_date).toLocaleDateString() : '—'} />
              <Field label="Clearance Status" value={container.clearance_status} />
              <Field label="Dwell Time" value={container.dwell_time_hours ? `${container.dwell_time_hours}h` : '—'} />
            </div>
          </div>

          {/* Weight comparison */}
          <div className="glass-panel rounded-2xl p-5">
            <p className="panel-label mb-4 flex items-center gap-2"><Scale className="w-3.5 h-3.5" /> Weight Analysis</p>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Declared</p>
                <p className="text-2xl font-black text-slate-100">{declaredW ? Number(declaredW).toLocaleString() : '—'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">kg</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-black ${weightDiff && Math.abs(parseFloat(weightDiff)) > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {weightDiff ? `${parseFloat(weightDiff) > 0 ? '+' : ''}${weightDiff}%` : 'VS'}
                </p>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest">variance</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Measured</p>
                <p className="text-2xl font-black text-slate-100">{measuredW ? Number(measuredW).toLocaleString() : '—'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">kg</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right col — risk analysis */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-col gap-5">

          {/* Risk score breakdown */}
          <div className="glass-panel rounded-2xl p-5">
            <p className="panel-label mb-4 flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Risk Breakdown</p>
            <div className="space-y-4">
              <Bar label="Overall Risk" value={riskScore} color={rc.bar} />
              <Bar label="Weight Discrepancy" value={weightDiff ? Math.min(Math.abs(parseFloat(weightDiff)) * 5, 100) : 20} color="bg-amber-500" />
              <Bar label="Route Risk" value={level === 'CRITICAL' ? 95 : level === 'HIGH' ? 75 : level === 'MEDIUM' ? 45 : 15} color="bg-sky-500" />
              <Bar label="Entity Trust" value={100 - riskScore} color="bg-emerald-500" />
            </div>
          </div>

          {/* Risk indicators from analysis */}
          {analysis?.indicators?.length > 0 && (
            <div className="glass-panel rounded-2xl p-5">
              <p className="panel-label mb-4 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Risk Indicators</p>
              <div className="space-y-2">
                {analysis.indicators.slice(0, 6).map((ind: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      ind.severity === 'HIGH' || ind.severity === 'CRITICAL' ? 'bg-rose-500' :
                      ind.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <p className="text-xs text-slate-400 leading-relaxed">{ind.description || ind.indicator || ind}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {analysis?.recommendation && (
            <div className="glass-panel rounded-2xl p-5">
              <p className="panel-label mb-3 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Recommendation</p>
              <div className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest mb-3 ${rc.bg} ${rc.text} border ${rc.border}`}>
                {analysis.recommendation.action}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{analysis.recommendation.description}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Anomalies Panel ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-panel rounded-2xl p-5">
        <div className="panel-header">
          <h2 className="panel-title">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Anomalies Detected
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {anomalies.filter(a => a.severity === 'CRITICAL').length} Critical
            </span>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {anomalies.filter(a => a.severity === 'HIGH').length} High
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">{anomalies.length} total</span>
          </div>
        </div>

        {anomalies.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No anomalies detected for this container.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {anomalies.map((a, i) => {
              const s = SEV[a.severity] || SEV.LOW;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`p-4 rounded-xl border ${s.bg} ${s.border} flex flex-col gap-2`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot} ${a.severity === 'CRITICAL' ? 'animate-pulse' : ''}`} />
                      <span className={`text-xs font-bold ${s.text}`}>{a.type}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${s.bg} ${s.text} border ${s.border} whitespace-nowrap`}>
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{a.description}</p>
                  <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mt-auto">Source: {a.source}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
