import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import TradeRouteMap from '../components/TradeRouteMap';
import { getTradeRoutes } from '../services/api';
import { MapPin, AlertTriangle, Globe } from 'lucide-react';

const Intelligence = () => {
  const [routes, setRoutes] = useState([]);
  const [stats, setStats] = useState({ active_routes: 0, high_risk_routes: 0, tracked_countries: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getTradeRoutes();
      if (data && data.routes) {
        setRoutes(data.routes);
        setStats(data.stats || { active_routes: data.routes.length, high_risk_routes: data.routes.filter(r => r.risk === 'high' || r.risk === 'critical').length, tracked_countries: new Set(data.routes.map(r => r.origin)).size });
      } else {
         const routesArray = Array.isArray(data) ? data : [];
         setRoutes(routesArray);
         setStats({
            active_routes: routesArray.length,
            high_risk_routes: routesArray.filter(r => r.risk === 'high' || r.risk === 'critical').length,
            tracked_countries: new Set(routesArray.map(r => r.origin)).size
         });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const cards = [
    {
      title: 'Active Routes',
      value: stats.active_routes,
      icon: MapPin,
      color: 'from-emerald-500 to-cyan-500',
      shadow: 'shadow-emerald-500/20',
      onClick: () => navigate('/active-routes'),
    },
    {
      title: 'High Risk Routes',
      value: stats.high_risk_routes,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-500',
      shadow: 'shadow-red-500/20',
      onClick: () => navigate('/high-risk-routes'),
    },
    {
      title: 'Countries Monitored',
      value: stats.tracked_countries,
      icon: Globe,
      color: 'from-emerald-400 to-green-500',
      shadow: 'shadow-emerald-500/20',
      onClick: null,
    }
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold text-[#1B2A4A] dark:text-slate-100 tracking-tight">Trade Intelligence</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Global trade routes and risk visualization</p>
      </motion.div>

      <TradeRouteMap routes={routes} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              whileHover={card.onClick ? { y: -4 } : undefined}
              onClick={card.onClick}
              className={`relative card-premium p-6 overflow-hidden group ${card.onClick ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{card.title}</h3>
                  <p className="text-3xl font-bold text-[#1B2A4A] dark:text-slate-100 tracking-tight">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg ${card.shadow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Intelligence;
