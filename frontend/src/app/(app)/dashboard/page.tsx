"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, CheckCircle, Activity, Navigation } from 'lucide-react';

import { 
  getSummary, 
  getTradeRoutes, 
  getHighRiskContainersList,
  getCriticalContainersList,
  getAnomalies,
  getTradeNetwork,
  getRiskTrends,
} from '@/lib/services/api';

import ContainerRiskProfile from '@/components/ContainerRiskProfile';
import ContainerWatchlist from '@/components/ContainerWatchlist';
import RiskTrendChart from '@/components/RiskTrendChart';
import AnomalyDetectionList from '@/components/AnomalyDetectionList';
import EntityTradeNetwork from '@/components/EntityTradeNetwork';
import AnimatedCounter from '@/components/AnimatedCounter';
import DetailedReportModal from '@/components/DetailedReportModal';

import dynamic from 'next/dynamic';

const TradeRouteMap = dynamic(
  () => import('@/components/TradeRouteMap'),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 animate-pulse">
        <Navigation className="w-8 h-8 opacity-20 mb-2 animate-pulse" />
        <p className="text-sm">Initiating Global Intelligence Map...</p>
      </div>
    ) 
  }
);

const METRICS = [
  { label: 'Total Containers', key: 'total',   icon: Package,       color: 'text-sky-400',     dot: 'bg-sky-400',     bg: 'bg-sky-500/10',     ring: 'ring-sky-500/20',     href: '/containers?filter=all'      },
  { label: 'Critical',         key: 'critical',icon: AlertTriangle, color: 'text-red-400',     dot: 'bg-red-400',     bg: 'bg-red-500/10',     ring: 'ring-red-500/20',     href: '/containers?filter=critical' },
  { label: 'High Risk',        key: 'high',    icon: AlertTriangle, color: 'text-rose-400',    dot: 'bg-rose-400',    bg: 'bg-rose-500/10',    ring: 'ring-rose-500/20',    href: '/containers?filter=high'     },
  { label: 'Medium Risk',      key: 'medium',  icon: Activity,      color: 'text-amber-400',   dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   ring: 'ring-amber-500/20',   href: '/containers?filter=medium'   },
  { label: 'Low Risk',         key: 'low',     icon: CheckCircle,   color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', href: '/containers?filter=low'      },
  { label: 'Active Routes',    key: 'routes',  icon: Navigation,    color: 'text-violet-400',  dot: 'bg-violet-400',  bg: 'bg-violet-500/10',  ring: 'ring-violet-500/20',  href: '/intelligence'               },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>({
    summary: null, riskDist: null, routes: [],
    anomalies: [], network: { nodes: [], edges: [] },
    trends: [], highRiskContainers: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [summaryData, routesData, anomaliesData, networkData, trendsData, criticalData, highRiskData] =
          await Promise.all([
            getSummary(), getTradeRoutes(),
            getAnomalies(1, 100), getTradeNetwork(), getRiskTrends(),
            getCriticalContainersList(1, 100),
            getHighRiskContainersList(1, 100),
          ]);

        const allWatchlistContainers = [
          ...(criticalData.data || []),
          ...(highRiskData.data || []),
        ].filter((c, idx, arr) =>
          arr.findIndex(x => x.container_id === c.container_id) === idx
        );

        setData({
          summary: summaryData,
          routes: routesData,
          anomalies: anomaliesData.data || [], network: networkData,
          trends: trendsData, highRiskContainers: allWatchlistContainers,
        });

        if (allWatchlistContainers.length > 0) setSelectedContainer(allWatchlistContainers[0]);
      } catch (err) {
        console.error("Dashboard mount error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Loading Intelligence</p>
        </div>
      </div>
    );
  }

  const metricValues: Record<string, number> = {
    total:    data.summary?.total_containers || 0,
    critical: data.summary?.critical || 0,
    high:     data.summary?.high_risk || 0,
    medium:   data.summary?.medium || 0,
    low:      data.summary?.low_risk || 0,
    routes:   data.routes?.stats?.active_routes || 0,
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Metric Cards ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {METRICS.map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={() => router.push(m.href)}
            className="relative glass-panel rounded-2xl px-5 py-4 flex items-center gap-4 overflow-hidden cursor-pointer group"
          >
            {/* accent bar */}
            <div className={`absolute left-0 inset-y-0 w-[3px] rounded-r-full ${m.dot} opacity-60 group-hover:opacity-100 transition-opacity`} />
            {/* icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${m.bg} ring-1 ${m.ring} flex items-center justify-center`}>
              <m.icon className={`w-4.5 h-4.5 ${m.color}`} />
            </div>
            {/* text */}
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.12em] font-bold mb-0.5 truncate">{m.label}</p>
              <p className="text-2xl font-black text-slate-100 tabular-nums leading-none">
                <AnimatedCounter value={metricValues[m.key]} />
              </p>
            </div>
            {/* subtle bg glow */}
            <div className={`absolute -right-4 -bottom-4 w-16 h-16 ${m.bg} rounded-full blur-2xl opacity-40`} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main Intelligence Panel ───────────────────────────── */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: 480 }}>
        {/* Left: Risk Profile */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="col-span-12 lg:col-span-3 glass-panel rounded-2xl p-5 flex flex-col overflow-hidden"
        >
          <ContainerRiskProfile
            container={selectedContainer}
            onViewReport={() => setShowDetailedReport(true)}
          />
        </motion.div>

        {/* Centre: Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="col-span-12 lg:col-span-6 glass-panel rounded-2xl overflow-hidden relative"
          style={{ minHeight: 440 }}
        >
          <TradeRouteMap routes={data.routes?.routes} />
        </motion.div>

        {/* Right: Watchlist */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="col-span-12 lg:col-span-3 glass-panel rounded-2xl p-5 flex flex-col overflow-hidden"
        >
          <ContainerWatchlist
            containers={data.highRiskContainers}
            selectedId={selectedContainer?.container_id}
            onSelect={setSelectedContainer}
          />
        </motion.div>
      </div>

      {/* ── Analytics Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: 360 }}>
        {/* Anomaly Detection */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-2xl p-5 flex flex-col overflow-hidden"
        >
          <AnomalyDetectionList anomalies={data.anomalies} />
        </motion.div>

        {/* Risk Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="col-span-12 md:col-span-6 lg:col-span-6 glass-panel rounded-2xl p-5 overflow-hidden"
        >
          <RiskTrendChart data={data.trends} />
        </motion.div>

        {/* Entity Trade Network */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-2xl p-5 overflow-hidden"
        >
          <EntityTradeNetwork nodes={data.network.nodes} edges={data.network.edges} />
        </motion.div>
      </div>

      {showDetailedReport && selectedContainer && (
        <DetailedReportModal
          container={selectedContainer}
          onClose={() => setShowDetailedReport(false)}
        />
      )}
    </div>
  );
}
