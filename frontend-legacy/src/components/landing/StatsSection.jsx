import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

// Mini bar chart component
const MiniBarChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value));
    return (
        <div className="flex items-end space-x-1.5 h-20">
            {data.map((d, i) => (
                <motion.div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{ backgroundColor: d.color }}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${(d.value / maxVal) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 + 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
            ))}
        </div>
    );
};

// Animated risk gauge
const RiskGauge = ({ score, label }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const timer = setInterval(() => {
            start += 1;
            if (start >= score) { setCurrent(score); clearInterval(timer); }
            else setCurrent(start);
        }, 20);
        return () => clearInterval(timer);
    }, [isInView, score]);

    const color = score >= 80 ? 'text-red-400' : score >= 50 ? 'text-amber-400' : 'text-emerald-400';

    return (
        <div ref={ref} className="text-center">
            <div className={`text-2xl font-bold ${color} tabular-nums`}>{current}%</div>
            <div className="text-[11px] text-gray-600 mt-1">{label}</div>
        </div>
    );
};

const LiveIntelligenceSection = () => {
    const barData = [
        { value: 45, color: '#22c55e' },
        { value: 30, color: '#22c55e' },
        { value: 60, color: '#f59e0b' },
        { value: 20, color: '#22c55e' },
        { value: 85, color: '#ef4444' },
        { value: 40, color: '#f59e0b' },
        { value: 15, color: '#22c55e' },
        { value: 70, color: '#ef4444' },
        { value: 25, color: '#22c55e' },
        { value: 55, color: '#f59e0b' },
        { value: 90, color: '#ef4444' },
        { value: 35, color: '#22c55e' },
    ];

    const threats = [
        { id: 'C-7823', risk: 'CRITICAL', score: 0.91, reason: 'Weight mismatch + flagged exporter' },
        { id: 'C-5621', risk: 'HIGH', score: 0.87, reason: 'Unusual value-to-weight ratio' },
        { id: 'C-9214', risk: 'HIGH', score: 0.82, reason: 'Previously flagged route' },
    ];

    return (
        <section id="intelligence" className="py-28 bg-[#0B0F19]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-[0.15em]">Live Intelligence</span>
                    <h2 className="text-3xl md:text-[40px] font-bold text-white mt-3 tracking-tight">
                        Real-Time Threat Landscape
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-lg mx-auto text-sm leading-relaxed">
                        A glimpse into the intelligence dashboard powering port security operations.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-[#111827]/60 backdrop-blur-sm border border-white/[0.04] rounded-2xl overflow-hidden"
                >
                    {/* Dashboard header */}
                    <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[12px] font-medium text-gray-400">Intelligence Dashboard — Live Feed</span>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">1,200 containers scanned</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.04]">
                        {/* Risk distribution chart */}
                        <div className="p-6">
                            <h4 className="text-[12px] font-medium text-gray-400 mb-1">Risk Distribution</h4>
                            <p className="text-[10px] text-gray-600 mb-4">Last 24 hours · by container</p>
                            <MiniBarChart data={barData} />
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center space-x-3">
                                    <span className="flex items-center text-[10px] text-gray-500 dark:text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />Low</span>
                                    <span className="flex items-center text-[10px] text-gray-500 dark:text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />Medium</span>
                                    <span className="flex items-center text-[10px] text-gray-500 dark:text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1" />High</span>
                                </div>
                            </div>
                        </div>

                        {/* Threat gauges */}
                        <div className="p-6">
                            <h4 className="text-[12px] font-medium text-gray-400 mb-1">System Metrics</h4>
                            <p className="text-[10px] text-gray-600 mb-5">Active monitoring status</p>
                            <div className="grid grid-cols-3 gap-4">
                                <RiskGauge score={94} label="Detection Rate" />
                                <RiskGauge score={7} label="False Positive" />
                                <RiskGauge score={86} label="Containers Flagged" />
                            </div>
                        </div>

                        {/* Recent threats */}
                        <div className="p-6">
                            <h4 className="text-[12px] font-medium text-gray-400 mb-1">Recent Threats</h4>
                            <p className="text-[10px] text-gray-600 mb-4">Auto-flagged containers</p>
                            <div className="space-y-2.5">
                                {threats.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg border border-white/[0.03]">
                                        <div>
                                            <span className="text-[12px] font-mono text-white">{t.id}</span>
                                            <p className="text-[10px] text-gray-600 mt-0.5">{t.reason}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold ${t.risk === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                                            {t.score.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default LiveIntelligenceSection;
