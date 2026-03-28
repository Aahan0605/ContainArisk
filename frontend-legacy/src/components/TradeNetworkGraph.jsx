import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const TradeNetworkGraph = ({ nodes = [], edges = [] }) => {
  const canvasRef = useRef(null);
  
  // A very simple manual force-directed style or static graph rendering 
  // since D3 is not in package.json and we don't want to bloat it. 
  // We'll use a clean canvas rendering loop.
  
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;
    
    let observer;
    let timeoutId;
    
    const drawGraph = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height || 300;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Spread nodes out in a circle for simple visualization
      const radius = Math.min(width, height) / 2.5;
      const centerX = width / 2;
      const centerY = height / 2;
      
      const nodePositions = {};
      
      nodes.forEach((node, idx) => {
        const angle = (idx / nodes.length) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        nodePositions[node.id] = { x, y, risk: node.risk, group: node.group };
      });
      
      // Draw edges
      edges.forEach(edge => {
        const s = nodePositions[edge.source];
        const t = nodePositions[edge.target];
        if (s && t) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = edge.risk > 50 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.2)';
          ctx.lineWidth = Math.min(edge.val, 5);
          ctx.stroke();
        }
      });
      
      // Draw nodes
      nodes.forEach(node => {
        const pos = nodePositions[node.id];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.group === 'Importer' ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = pos.risk > 50 ? '#ef4444' : (node.group === 'Importer' ? '#3b82f6' : '#10b981');
        ctx.fill();
      });
    };

    // Use ResizeObserver to reliably get layout dimensions after Framer Motion/CSS Grid settles
    observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(drawGraph, 50); // debounce
    });
    
    if (canvasRef.current.parentElement) {
      observer.observe(canvasRef.current.parentElement);
    }
    
    drawGraph();

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };

  }, [nodes, edges]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6 bg-gradient-to-br from-backend-800 to-backend-900 border-t border-white/10 shadow-glass"
    >
      <h3 className="text-base font-bold text-white tracking-widest uppercase mb-1">Entity Trade Network</h3>
      <p className="text-xs text-gray-400 mb-6">Mapping suspicious shipment links (Importers & Exporters)</p>
      
      <div className="h-[300px] w-full flex justify-center items-center rounded-xl overflow-hidden relative">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={300} 
          className="max-w-full h-auto"
        />
        {(nodes.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Insufficient network data</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Importer</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Exporter</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">High Risk Node</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TradeNetworkGraph;
