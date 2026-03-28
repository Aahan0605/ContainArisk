import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package } from 'lucide-react';

const TrackingSearch = () => {
    const [trackingId, setTrackingId] = useState('');

    return (
        <section className="relative z-20 -mt-6 pb-16">
            <div className="max-w-3xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/20"
                >
                    <div className="flex items-center space-x-2 mb-4">
                        <Package className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Track Your Shipment</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <input
                                type="text"
                                value={trackingId}
                                onChange={(e) => setTrackingId(e.target.value)}
                                placeholder="Enter tracking number (e.g. SC-2024-001)"
                                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors whitespace-nowrap"
                        >
                            Track Now
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TrackingSearch;
