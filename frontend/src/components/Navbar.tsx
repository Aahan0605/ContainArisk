"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Bell, LogOut, Search, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [officerName, setOfficerName] = useState('Officer');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOfficerName(localStorage.getItem('officerName') || 'aahan@containarisk.com');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('officerName');
    window.location.href = '/login';
  };

  return (
    <nav className="sticky top-0 z-40 h-14 flex items-center px-6 gap-4 navbar-glass">
      {/* Search */}
      <div className="relative group flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
        <input
          type="text"
          placeholder="Search containers, routes..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/25 transition-all font-medium"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Officer info */}
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Officer Personnel</span>
        <span className="text-xs font-semibold text-slate-300 leading-tight">{officerName}</span>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-5 bg-white/[0.08]" />

      {/* Icon actions */}
      <div className="flex items-center gap-1">
        {mounted && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-white/[0.05] transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-white/[0.05] transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-1 ring-[#080b12] animate-pulse" />
        </motion.button>
      </div>

      {/* Logout */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl border border-white/[0.06] hover:border-rose-500/20 transition-all duration-200"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Exit</span>
      </motion.button>

    </nav>
  );
};

export default Navbar;
