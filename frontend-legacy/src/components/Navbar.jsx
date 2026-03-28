import { useState } from 'react';
import { Bell, LogOut, Search, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import RiskAlertPanel from './RiskAlertPanel';

const Navbar = ({ darkMode, setDarkMode, onLogout }) => {
  const [showAlerts, setShowAlerts] = useState(false);
  const navigate = useNavigate();
  const officerName = localStorage.getItem('officerName') || 'Officer';

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="px-8 py-3.5 flex items-center justify-between">
        {/* Left: Search */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search containers, routes..."
              className="w-72 pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[#1B2A4A] dark:text-slate-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all font-medium"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            <span className="font-semibold text-[#1B2A4A] dark:text-slate-100">{officerName}</span>
          </span>

          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1"></div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className="relative p-2.5 rounded-xl hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-[18px] h-[18px] text-amber-500" />
            ) : (
              <Moon className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2.5 rounded-xl hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex items-center space-x-2 ml-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700/50 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showAlerts && <RiskAlertPanel onClose={() => setShowAlerts(false)} />}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
