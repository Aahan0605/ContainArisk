import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { getShipments } from '../services/api';

const AllContainers = () => {
  const [containers, setContainers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContainers = async () => {
      setLoading(true);
      try {
        const result = await getShipments(1, 100);
        const mapped = (result.data || []).map(r => ({
          container_id: r.Container_ID || r.container_id,
          importer: r.Importer_ID || r.importer || '',
          exporter: r.Exporter_ID || r.exporter || '',
          origin: r.Origin_Country || r.origin || '',
          destination: r.Destination_Country || r.destination || '',
          risk_score: r.Risk_Score != null ? r.Risk_Score / 100.0 : (r.risk_score || 0),
          risk_level: r.Risk_Level || r.risk_level || 'LOW',
          weight: r.Measured_Weight || r.weight || 0,
          value: r.Declared_Value || r.value || 0,
        }));
        setContainers(mapped);
      } catch (error) {
        console.error('Error fetching containers:', error);
        setContainers([]);
      }
      setLoading(false);
    };
    fetchContainers();
  }, []);

  const filtered = containers.filter(c => {
    const matchesSearch = c.container_id.toLowerCase().includes(search.toLowerCase()) ||
      c.importer.toLowerCase().includes(search.toLowerCase()) ||
      c.origin.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || c.risk_level === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -4 }}
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-[#1B2A4A] dark:text-slate-100 tracking-tight">All Containers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete list of all container shipments</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="card-premium"
      >
        <div className="p-6">
          <div className="flex gap-3 mb-5">
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 w-4 h-4 transition-colors" />
              <input
                type="text"
                placeholder="Search by container ID, importer, or origin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50 text-sm text-[#1B2A4A] dark:text-slate-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 outline-none transition-all"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50 text-sm text-[#1B2A4A] dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Showing {filtered.length} of {containers.length} containers
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Container ID</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Importer</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Exporter</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Origin</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Destination</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Weight (kg)</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Value (USD)</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Risk Score</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Risk Level</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((container, index) => (
                  <motion.tr
                    key={container.container_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => navigate(`/container/${container.container_id}`)}
                    className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 text-sm text-[#1B2A4A] dark:text-slate-100 font-bold">{container.container_id}</td>
                    <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{container.importer}</td>
                    <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{container.exporter}</td>
                    <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{container.origin}</td>
                    <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{container.destination}</td>
                    <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{container.weight.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">${container.value.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-sm text-[#1B2A4A] dark:text-slate-100 font-bold">{container.risk_score.toFixed(2)}</td>
                    <td className="py-3.5 px-4"><RiskBadge level={container.risk_level} /></td>
                    <td className="py-3.5 px-4">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View →</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AllContainers;
