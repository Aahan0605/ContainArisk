import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import RiskBadge from './RiskBadge';

const ContainerTable = ({ containers }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  const filtered = containers.filter(c => {
    const matchesSearch = c.container_id.toLowerCase().includes(search.toLowerCase()) ||
      c.importer.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || c.risk_level === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card-premium"
    >
      <div className="p-6">
        <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-4">High Risk Containers</h3>

        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative group">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-4 h-4 transition-colors" />
            <input
              type="text"
              placeholder="Search containers..."
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
            <option value="ALL">All Levels</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700/50">
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Container ID</th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Importer</th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Exporter</th>
                <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Origin</th>
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
                  className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 text-sm text-[#1B2A4A] dark:text-slate-100 font-semibold">{container.container_id}</td>
                  <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{container.importer}</td>
                  <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{container.exporter}</td>
                  <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{container.origin}</td>
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
  );
};

export default ContainerTable;
