"use client";

import { useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';

interface ContainerWatchlistProps {
  containers: any[];
  selectedId?: string;
  onSelect: (container: any) => void;
}

export default function ContainerWatchlist({ containers, selectedId, onSelect }: ContainerWatchlistProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');

  const filteredContainers = containers
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .filter(c => {
      const id = (c.container_id || '').toString();
      const importer = (c.importer || '').toString();
      const matchesSearch = id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            importer.toLowerCase().includes(searchTerm.toLowerCase());
      const level = (c.risk_level || '').toUpperCase();
      if (filter === 'HIGH') return matchesSearch && level === 'HIGH';
      if (filter === 'CRITICAL') return matchesSearch && level === 'CRITICAL';
      return matchesSearch;
    });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="panel-header">
        <h2 className="panel-title">
          <AlertTriangle className="w-4 h-4 text-emerald-400" />
          Watchlist
        </h2>
        <div className="flex gap-1">
          {['ALL', 'CRITICAL', 'HIGH'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all ${
                filter === f
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-300 border border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          placeholder="Search containers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-4 py-2 text-xs bg-[#0a0d14]/50 border border-white/5 rounded-lg text-slate-100 placeholder-gray-600 outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all font-medium"
        />
      </div>

      {/* Container List */}
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar" style={{ maxHeight: '320px' }}>
        {filteredContainers.map((container) => {
            const isSelected = container.container_id === selectedId;
            const level = (container.risk_level || '').toUpperCase();
            const isCritical = level === 'CRITICAL';
            
            return (
              <div
                key={container.container_id + container.risk_score}
                onClick={() => onSelect(container)}
                className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-200 group ${
                  isSelected
                    ? 'bg-[#131823] border-white/10 shadow-lg'
                    : 'bg-[#0a0d14]/40 border-white/5 hover:bg-[#0a0d14]/80'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-emerald-500 rounded-r-full"></div>
                )}
                <div className="flex justify-between items-start mb-1.5 ml-1">
                  <span className="text-xs font-bold text-slate-200 tracking-wider flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                    {container.container_id}
                  </span>
                  <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest uppercase ${
                    isCritical ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {Math.round((container.risk_score || 0) * 100)}%
                  </div>
                </div>
                <div className="ml-1 text-[10px] text-gray-500 uppercase tracking-widest truncate">
                  {container.importer && container.importer !== '—' ? container.importer : 'Unknown Importer'}
                </div>
              </div>
            );
          })}
        
        {filteredContainers.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">
            No containers found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
