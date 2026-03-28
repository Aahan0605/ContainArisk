import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Globe, Truck, Shield } from 'lucide-react';

const features = [
    { icon: Shield, title: 'AI Risk Engine', desc: 'Predictive ML models analyzing container origin, importer history, and HS codes.' },
    { icon: Globe, title: 'Route Intelligence', desc: 'Real-time monitoring of high-risk shipping lanes and active vessels.' },
    { icon: BarChart3, title: 'Anomaly Detection', desc: 'Automated identification of suspicious declarations, weights, and values.' },
    { icon: Truck, title: 'Trade Insights', desc: 'Deep analytics on global trade patterns, delays, and supply chain disruptions.' },
];

const SolutionsSection = () => {
    return (
        <section id="solutions" className="py-24 bg-[#F8F9FB]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left text */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800 text-[#1B2A4A] dark:text-slate-100 border border-gray-200 dark:border-slate-700 tracking-wide uppercase mb-6">
                            Our Solutions
                        </span>

                        <h2 className="text-3xl md:text-[44px] font-extrabold text-[#1B2A4A] dark:text-slate-100 leading-tight tracking-tight mt-4">
                            Advanced Container Risk Analysis Engine
                        </h2>

                        <p className="text-gray-500 dark:text-gray-400 mt-5 text-[15px] leading-relaxed max-w-md">
                            Leverage AI-driven intelligence to predict shipping delays, detect anomalies, and analyze global threat vectors in real time.
                        </p>

                    </motion.div>

                    {/* Right: Feature grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {features.map((feat, i) => {
                            const Icon = feat.icon;
                            return (
                                <motion.div
                                    key={feat.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08, duration: 0.5 }}
                                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[#1B2A4A]/5 flex items-center justify-center mb-4">
                                        <Icon className="w-5 h-5 text-[#1B2A4A] dark:text-slate-100" />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-[#1B2A4A] dark:text-slate-100">{feat.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{feat.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SolutionsSection;
