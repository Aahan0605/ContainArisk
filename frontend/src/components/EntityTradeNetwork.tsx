"use client";

import { useMemo } from 'react';
import { Network } from 'lucide-react';

interface EntityTradeNetworkProps {
  nodes?: any[];
  edges?: any[];
}

const POSITIONS = [
  { x: 50, y: 12 },
  { x: 82, y: 35 },
  { x: 82, y: 68 },
  { x: 50, y: 88 },
  { x: 18, y: 68 },
  { x: 18, y: 35 },
];

const FALLBACK_NODES = [
  { id: 'ABC Imports', group: 'Importer', val: 8,  risk: 82 },
  { id: 'XYZ Exports', group: 'Exporter', val: 6,  risk: 55 },
  { id: 'Global Co',   group: 'Importer', val: 10, risk: 30 },
  { id: 'Ocean Frt',   group: 'Exporter', val: 4,  risk: 75 },
  { id: 'Asia Port',   group: 'Importer', val: 7,  risk: 45 },
  { id: 'Euro Cargo',  group: 'Exporter', val: 5,  risk: 20 },
];

const FALLBACK_EDGES = [
  { source: 'XYZ Exports', target: 'ABC Imports', val: 3, risk: 82 },
  { source: 'XYZ Exports', target: 'Global Co',   val: 2, risk: 30 },
  { source: 'Ocean Frt',   target: 'ABC Imports', val: 2, risk: 75 },
  { source: 'Ocean Frt',   target: 'Asia Port',   val: 1, risk: 55 },
  { source: 'Euro Cargo',  target: 'Global Co',   val: 3, risk: 20 },
  { source: 'Euro Cargo',  target: 'Asia Port',   val: 1, risk: 45 },
  { source: 'XYZ Exports', target: 'Asia Port',   val: 2, risk: 60 },
  { source: 'Ocean Frt',   target: 'Global Co',   val: 1, risk: 40 },
];

const EDGE_COLOR: Record<string, string> = {
  high:   '#f43f5e',
  medium: '#f59e0b',
  low:    '#334155',
};

export default function EntityTradeNetwork({ nodes = [], edges = [] }: EntityTradeNetworkProps) {
  const useReal = nodes.length >= 2;
  const rawNodes = useReal ? nodes.slice(0, 6) : FALLBACK_NODES;
  const rawEdges = useReal ? edges.slice(0, 8)  : FALLBACK_EDGES;

  // Map each node to a fixed hexagon position
  const displayNodes = useMemo(() =>
    POSITIONS.map((pos, i) => {
      const real = rawNodes[i];
      const riskNum = real ? (typeof real.risk === 'number' ? real.risk : parseFloat(real.risk) || 0) : 0;
      const riskLevel = riskNum >= 70 ? 'high' : riskNum >= 40 ? 'medium' : 'low';
      const color = real
        ? (riskLevel === 'high' ? '#f43f5e' : riskLevel === 'medium' ? '#f59e0b' : '#10b981')
        : ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e'][i];
      return {
        ...pos,
        id: i,
        color,
        label: real
          ? (real.id || real.label || `Node ${i + 1}`).slice(0, 9)
          : ['ABC Imports', 'XYZ Exports', 'Global Co', 'Ocean Frt', 'Asia Port', 'Euro Cargo'][i],
        size: real ? 5 + Math.min((real.val || 1) * 0.3, 2) : 5.5,
        riskLevel: real ? riskLevel : ['high', 'medium', 'low', 'high', 'medium', 'low'][i],
      };
    }), [rawNodes]);

  // Build a lookup from node id string → position index
  const nodeIdToIdx = useMemo(() => {
    const map: Record<string, number> = {};
    rawNodes.forEach((n, i) => { if (n?.id) map[n.id] = i; });
    return map;
  }, [rawNodes]);

  // Map real edges to display node indices
  const displayEdges = useMemo(() => {
    const mapped = rawEdges
      .map(e => {
        const si = nodeIdToIdx[e.source];
        const ti = nodeIdToIdx[e.target];
        if (si === undefined || ti === undefined) return null;
        const risk = typeof e.risk === 'number' ? e.risk : 0;
        return { si, ti, risk, riskLevel: risk >= 70 ? 'high' : risk >= 40 ? 'medium' : 'low' };
      })
      .filter(Boolean) as { si: number; ti: number; risk: number; riskLevel: string }[];

    // If no real edges matched (e.g. edges reference nodes outside top-6), use fallback
    if (mapped.length === 0) {
      return [
        { si: 0, ti: 1, riskLevel: 'high',   risk: 80 },
        { si: 1, ti: 2, riskLevel: 'medium',  risk: 50 },
        { si: 2, ti: 3, riskLevel: 'low',     risk: 20 },
        { si: 3, ti: 4, riskLevel: 'high',    risk: 75 },
        { si: 4, ti: 5, riskLevel: 'medium',  risk: 45 },
        { si: 5, ti: 0, riskLevel: 'low',     risk: 15 },
        { si: 0, ti: 3, riskLevel: 'high',    risk: 85 },
        { si: 1, ti: 4, riskLevel: 'medium',  risk: 55 },
      ];
    }
    return mapped;
  }, [rawEdges, nodeIdToIdx]);

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <h2 className="panel-title">
          <Network className="w-4 h-4 text-emerald-400" />
          Entity Trade Network
        </h2>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> High
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Med
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Low
          </span>
        </div>
      </div>

      <div
        className="flex-1 rounded-xl overflow-hidden"
        style={{ background: 'rgba(6,9,18,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="etn-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#etn-grid)" />

          {/* Edges with animated particles */}
          {displayEdges.map(({ si, ti, riskLevel, risk }, idx) => {
            const src = displayNodes[si];
            const tgt = displayNodes[ti];
            if (!src || !tgt) return null;
            const dur  = `${1.8 + idx * 0.4}s`;
            const path = `M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`;
            return (
              <g key={`e-${idx}`}>
                {/* Static dotted red base line */}
                <line
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke="#f43f5e"
                  strokeWidth="0.6"
                  opacity="0.3"
                  strokeDasharray="2 3"
                />
                {/* Animated red dot travelling along the line */}
                <circle r="1.1" fill="#f43f5e" opacity="0.95"
                  style={{ filter: 'drop-shadow(0 0 2px #f43f5e)' }}>
                  <animateMotion dur={dur} repeatCount="indefinite" path={path} />
                </circle>
              </g>
            );
          })}

          {/* Nodes */}
          {displayNodes.map((node) => (
            <g key={`n-${node.id}`} transform={`translate(${node.x},${node.y})`}>
              {/* Outer pulse ring */}
              <circle r={node.size + 3} fill="none" stroke={node.color} strokeWidth="0.4" opacity="0.15">
                <animate
                  attributeName="r"
                  values={`${node.size + 2};${node.size + 5};${node.size + 2}`}
                  dur={`${3 + node.id * 0.6}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.15;0.04;0.15"
                  dur={`${3 + node.id * 0.6}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Node circle */}
              <circle
                r={node.size}
                fill={node.color}
                opacity="0.9"
                style={{ filter: `drop-shadow(0 0 4px ${node.color})` }}
              />
              {/* Label */}
              <text
                y={node.size + 5}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="3.2"
                fontWeight="500"
                fontFamily="sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
