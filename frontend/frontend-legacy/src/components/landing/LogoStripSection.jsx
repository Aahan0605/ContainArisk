import { motion } from 'framer-motion';

const logos = [
    'DB SCHENKER', 'FedEx', 'DHL', 'CONTAIN\'A\'RISK', 'XPO Logistics', 'Caliber', 'JTL', 'GEODIS'
];

const LogoStripSection = () => {
    return (
        <section className="py-16 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700/50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between gap-8 overflow-hidden">
                    {logos.map((name, i) => (
                        <motion.div
                            key={name}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                            className="flex-shrink-0"
                        >
                            <span className="text-[15px] font-bold text-gray-300 tracking-wide uppercase whitespace-nowrap">
                                {name}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LogoStripSection;
