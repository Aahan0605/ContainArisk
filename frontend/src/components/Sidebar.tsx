"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Upload, BarChart3, Globe, ChevronRight, Shield, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
  { path: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'          },
  { path: '/containers',   icon: Package,         label: 'Containers'         },
  { path: '/insights',     icon: BarChart3,       label: 'Insights'           },
  { path: '/intelligence', icon: Globe,           label: 'Trade Intelligence' },
  { path: '/upload',       icon: Upload,          label: 'Upload Data'        },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-60 bg-[#080b12]/90 backdrop-blur-xl text-slate-100 h-full flex-col border-r border-white/[0.05] z-30 shadow-2xl">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.05]">
        <div className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-all duration-300 flex-shrink-0">
            <Shield className="w-4.5 h-4.5 text-emerald-400 neon-glow-success" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight leading-none mb-0.5">
              Smart<span className="text-emerald-400">Container</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Risk Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Navigation</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/');

          return (
            <Link key={item.path} href={item.path} className="block relative">
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-500/10 text-slate-100 border border-emerald-500/15'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}>
                    <Icon className="w-[15px] h-[15px]" />
                  </div>
                  <span className="font-medium text-[13px]">{item.label}</span>
                </div>
                {isActive && (
                  <motion.div layoutId="activeChevron" initial={false} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  </motion.div>
                )}
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeBorder"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-r-full neon-glow-success"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="px-4 py-4 border-t border-white/[0.05]">
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-3 space-y-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">System Status</p>
          {[
            { label: 'ML Engine',   color: 'bg-emerald-400' },
            { label: 'Data Feed',   color: 'bg-emerald-400' },
            { label: 'Risk API',    color: 'bg-amber-400'   },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">{s.label}</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${s.color} animate-pulse`} />
                <span className="text-[10px] text-slate-600 font-semibold">Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
