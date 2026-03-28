import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, BarChart3, Globe, ChevronRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload Data' },
    { path: '/insights', icon: BarChart3, label: 'Insights' },
    { path: '/intelligence', icon: Globe, label: 'Trade Intelligence' }
  ];

  return (
    <aside className="w-72 bg-[#0A0F1C] text-slate-100 h-screen sticky top-0 flex flex-col border-r border-white/10 z-30">
      {/* Logo section */}
      <div className="px-6 pt-7 pb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800/50 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 tracking-tight">
              CONTAIN'<span className="text-blue-600 dark:text-blue-400">A'RISK</span>
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">Risk Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="px-4 mb-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">Navigation</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="block relative"
            >
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-[#1B2A4A] dark:text-slate-100 dark:hover:text-slate-100 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 dark:text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-slate-300'
                    }`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="flex items-center"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                )}
              </motion.div>
              {/* Active left border indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeBorder"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
};

export default Sidebar;
