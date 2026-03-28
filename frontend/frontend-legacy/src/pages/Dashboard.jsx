import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, CheckCircle, Activity, Navigation, ShieldAlert, Globe, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ContainerRiskProfile from '../components/ContainerRiskProfile';
import ContainerVisualization from '../components/ContainerVisualization';
import ContainerWatchlist from '../components/ContainerWatchlist';
import TradeRouteMap from '../components/TradeRouteMap';
import AnomalyCardList from '../components/AnomalyCardList';
import TradeNetworkGraph from '../components/TradeNetworkGraph';
import RiskTrendChart from '../components/RiskTrendChart';
import AnomalyScatterPlot from '../components/AnomalyScatterPlot';
import { 
  getSummary, 
  getRiskDistribution, 
  getTradeRoutes, 
  getRiskHeatmap,
  getAnomalies,
  getTradeNetwork,
  getRiskTrends,
  getHighRiskContainersList,
  getContainerDetails,
  getRiskAnalysis
} from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState({
    summary: null,
    riskDist: null,
    routes: [],
    heatmap: {},
    anomalies: [],
    network: { nodes: [], edges: [] },
    trends: [],
    highRiskContainers: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          summaryData, distData, routesData, heatmapData, 
          anomaliesData, networkData, trendsData, highRiskData
        ] = await Promise.all([
          getSummary(),
          getRiskDistribution(),
          getTradeRoutes(),
          getRiskHeatmap(),
          getAnomalies(1, 100),
          getTradeNetwork(),
          getRiskTrends(),
          getHighRiskContainersList(1, 30)
        ]);

        // DEBUG: verify what the API returned
        console.debug('Dashboard fetched (highRiskData):', highRiskData);

        setData({
          summary: summaryData,
          riskDist: distData,
          routes: routesData,
          heatmap: heatmapData,
          anomalies: anomaliesData.data || [],
          network: networkData,
          trends: trendsData,
          highRiskContainers: highRiskData.data || []
        });
      } catch (err) {
        console.error("Dashboard mount error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectContainer = async (container) => {
    setSelectedContainer(container);
    try {
      const analysis = await getRiskAnalysis(container.container_id);
      setRiskAnalysis(analysis);
    } catch (err) {
      console.error("Error fetching risk analysis:", err);
      setRiskAnalysis(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Metrics for top bar
  const metrics = [
    { label: 'Total Containers', value: data.summary?.total_containers || 0, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'High Risk', value: data.summary?.high_risk || 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Medium Risk', value: data.riskDist?.medium || 0, icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Low Risk', value: data.summary?.low_risk || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Active Trade', value: data.routes?.stats?.active_routes || 0, icon: Navigation, color: 'text-purple-400', bg: 'bg-purple-500/10', suffix: data.summary?.total_containers ? Math.floor(data.summary.total_containers * 0.38).toLocaleString() : '' },
  ];

  return (
    <div className="space-y-4">
      {/* TOP METRICS BAR */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-5 gap-3"
      >
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center gap-3 bg-[#0B1221]/80 backdrop-blur border border-white/5 rounded-xl px-4 py-3">
            <div className={`p-2 rounded-lg ${m.bg}`}>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{m.label}</p>
              <p className="text-lg font-bold text-white tabular-nums">
                {Number(m.value).toLocaleString()}
                {m.suffix && <span className="text-xs text-gray-500 ml-1">{m.suffix}</span>}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* 3-COLUMN INTELLIGENCE PANEL */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: '520px' }}>
        {/* Left: Risk Profile */}
        <div className="col-span-3">
          <ContainerRiskProfile container={selectedContainer} riskAnalysis={riskAnalysis} />
        </div>

        {/* Center: Container Visualization */}
        <div className="col-span-6">
          <ContainerVisualization
            containers={data.highRiskContainers}
            onSelect={handleSelectContainer}
            selectedId={selectedContainer?.container_id}
            selectedContainer={selectedContainer}
          />
        </div>

        {/* Right: Watchlist */}
        <div className="col-span-3">
          <ContainerWatchlist
            containers={data.highRiskContainers}
            onSelect={handleSelectContainer}
            selectedId={selectedContainer?.container_id}
          />
        </div>
      </div>

      {/* BOTTOM ANALYTICS — 4 Column Grid (matching reference) */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: '360px' }}>
        {/* Col 1: Trade Route Map */}
        <div className="col-span-3">
          <TradeRouteMap routes={data.routes?.routes || data.routes} />
        </div>

        {/* Col 2: Risk Trends Over Time */}
        <div className="col-span-3">
          <RiskTrendChart data={data.trends} />
        </div>

        {/* Col 3: Anomaly Detection Cards */}
        <div className="col-span-3">
          <AnomalyCardList anomalies={data.anomalies} />
        </div>

        {/* Col 4: Entity Trade Network */}
        <div className="col-span-3">
          <TradeNetworkGraph nodes={data.network.nodes} edges={data.network.edges} />
        </div>
      </div>

      {/* BOTTOM ROW — Anomaly Scatter Plot (full width) */}
      <div className="mb-8">
        <AnomalyScatterPlot data={data.anomalies} />
      </div>
    </div>
  );
};

export default Dashboard;
