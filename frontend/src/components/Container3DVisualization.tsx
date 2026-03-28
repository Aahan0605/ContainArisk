"use client";

import { motion } from 'framer-motion';
import { Layers, Maximize } from 'lucide-react';
import Image from 'next/image';

interface Container3DVisualizationProps {
  containerData: any;
}

export default function Container3DVisualization({ containerData }: Container3DVisualizationProps) {
  // Use mock data if not provided
  const data = containerData || {
    id: 'HLXU-849201',
    segments: [
      { id: 'front', type: 'Electronics', risk: 'high', score: 88, weight: '4.2t' },
      { id: 'middle', type: 'Machinery', risk: 'medium', score: 45, weight: '8.5t' },
      { id: 'back', type: 'Textiles', risk: 'low', score: 12, weight: '3.1t' },
    ]
  };

  return (
    <div className="flex flex-col h-full relative z-0">
      <div className="flex justify-between items-center mb-4 relative z-10 p-1">
        <h2 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          Container Inspection Visualization
        </h2>
        
        <div className="flex gap-2">
          <button className="text-[10px] text-gray-400 border border-white/5 bg-[#131823] hover:bg-white/5 px-2 py-1 rounded font-medium tracking-widest uppercase transition-colors">
            X-Ray View
          </button>
          <button className="text-gray-400 hover:text-white transition-colors bg-[#131823] border border-white/5 rounded p-1">
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full bg-[#0a0d14]/50 border border-white/5 rounded-xl overflow-hidden relative flex flex-col items-center justify-center">
        
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at center, transparent 0%, #0a0d14 100%), linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
          backgroundSize: '100% 100%, 30px 30px, 30px 30px'
        }}></div>

        {/* 2.5D Isometric Truck Image Integration */}
        <div className="relative w-full max-w-lg aspect-[16/9] flex items-center justify-center origin-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <Image 
              src="/images/container-truck.png" 
              alt="Container Truck 3D Model" 
              fill
              className="object-contain"
              priority
            />
          </motion.div>

          {/* Holographic glowing segments overlaid on the truck cargo area */}
          <div className="absolute w-[60%] h-[40%] top-[25%] left-[20%] skew-y-[15deg] skew-x-[-35deg] flex">
             {data.segments.map((segment: any, idx: number) => {
               const colorClass = segment.risk === 'high' ? 'bg-rose-500' : 
                                  segment.risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
               const glowClass = segment.risk === 'high' ? 'shadow-[0_0_20px_rgba(244,63,94,0.6)]' : 
                                 segment.risk === 'medium' ? 'shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'shadow-[0_0_10px_rgba(16,185,129,0.3)]';
               
               return (
                 <motion.div 
                   key={segment.id}
                   className={`flex-1 ${colorClass} ${glowClass} opacity-20 hover:opacity-40 transition-opacity cursor-crosshair border border-white/20`}
                   initial={{ opacity: 0, scaleY: 0 }}
                   animate={{ opacity: 0.2, scaleY: 1 }}
                   transition={{ delay: 0.5 + (idx * 0.1), duration: 0.5 }}
                   title={`${segment.type} - Risk: ${segment.risk.toUpperCase()}`}
                 />
               );
             })}
          </div>

        </div>

        {/* Real-time scanning effect */}
        <motion.div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent blur-sm z-20 pointer-events-none"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        {/* Data overlay legend */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-4 z-10">
          {data.segments.map((segment: any) => (
            <div key={segment.id} className="flex-1 glass-panel px-3 py-2 rounded-lg border border-white/5 flex flex-col hover:border-white/20 transition-colors">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest">{segment.type}</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-white font-mono text-xs">{segment.weight}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    segment.risk === 'high' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 
                    segment.risk === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  }`}></span>
                  <span className="text-[10px] text-slate-300">Score: {segment.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
