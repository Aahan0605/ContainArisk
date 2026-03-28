"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
        <div className="text-emerald-500/80 font-mono text-sm tracking-widest animate-pulse">
          INITIALIZING GLOBAL SENSORS...
        </div>
      </div>
    )
  }
);

interface TradeRouteMapProps {
  routes?: {
    id: string;
    from: string;
    to: string;
    risk: 'high' | 'medium' | 'low';
    coords: [[number, number], [number, number]];
  }[];
}

const TradeRouteMap: React.FC<TradeRouteMapProps> = ({ routes }) => {
  return (
    <div className="w-full h-full relative" style={{ minHeight: '400px' }}>
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          Global Trade Risk Map
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </h3>
        <p className="text-sm text-slate-400">Live Vessel Tracking & Anomaly Detection</p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
         {/* Map Legend */}
         <div className="glass-panel p-2 rounded-lg text-xs flex flex-col gap-1 border border-white/5">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Low Risk</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Medium</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> High Risk</div>
         </div>
      </div>

      <MapComponent routes={routes} />
      
    </div>
  );
};

export default TradeRouteMap;
