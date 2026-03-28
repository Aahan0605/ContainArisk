import { motion } from 'framer-motion';
import { Lock, Zap, Eye } from 'lucide-react';

const pillars = [
    { icon: Eye, title: 'Visibility', text: 'Every container scored, every anomaly surfaced, every pattern documented.' },
    { icon: Zap, title: 'Speed', text: 'Sub-second risk assessment. Alerts dispatched before containers reach port.' },
    { icon: Lock, title: 'Security', text: 'SOC 2 compliant infrastructure. Data encrypted at rest and in transit.' },
];

const AboutSection = () => {
    return (
        <section id="about" className="py-28 bg-[#080C18]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-[0.15em]">About</span>
                        <h2 className="text-3xl md:text-[40px] font-bold text-white mt-3 tracking-tight leading-tight">
                            Why Container Risk{' '}
                            <span className="text-emerald-400">Matters</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-5 text-sm leading-relaxed">
                            Millions of shipping containers cross borders daily. Less than 2% are physically inspected.
                            CONTAIN'A'RISK uses machine learning to identify which containers warrant scrutiny —
                            catching weight mismatches, value anomalies, and suspicious trade patterns that human reviewers miss.
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm leading-relaxed">
                            Built for customs agencies, port authorities, and trade compliance teams who need
                            to make faster, better-informed security decisions at scale.
                        </p>

                        <div className="mt-8 space-y-4">
                            {pillars.map((p, i) => {
                                const Icon = p.icon;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -15 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        className="flex items-start space-x-3"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Icon className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white">{p.title}</h4>
                                            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{p.text}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Visual: Threat network */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="bg-[#111827]/60 border border-white/[0.04] rounded-2xl p-8 aspect-square max-w-sm mx-auto flex items-center justify-center relative overflow-hidden">
                            {/* Grid */}
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px)',
                                backgroundSize: '30px 30px'
                            }} />

                            {/* Central node */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center z-10"
                            >
                                <span className="text-emerald-400 font-bold text-sm">AI</span>
                            </motion.div>

                            {/* Orbiting threat nodes */}
                            {[0, 72, 144, 216, 288].map((angle, i) => {
                                const colors = ['bg-emerald-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-red-500'];
                                return (
                                    <motion.div
                                        key={i}
                                        className="absolute"
                                        style={{
                                            top: `${50 + 35 * Math.sin(angle * Math.PI / 180)}%`,
                                            left: `${50 + 35 * Math.cos(angle * Math.PI / 180)}%`,
                                        }}
                                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                                    >
                                        <div className={`w-3 h-3 rounded-sm ${colors[i]} shadow-lg`} />
                                    </motion.div>
                                );
                            })}

                            {/* Connecting lines */}
                            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }}>
                                {[0, 72, 144, 216, 288].map((angle, i) => (
                                    <line
                                        key={i}
                                        x1="50%" y1="50%"
                                        x2={`${50 + 35 * Math.cos(angle * Math.PI / 180)}%`}
                                        y2={`${50 + 35 * Math.sin(angle * Math.PI / 180)}%`}
                                        stroke="#22c55e" strokeWidth="1"
                                    />
                                ))}
                            </svg>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
