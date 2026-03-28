import { motion } from 'framer-motion';

const services = [
    {
        tag: 'ANALYSIS',
        title: 'Risk Profiling',
        description: 'Comprehensive risk assessment of containers based on origin, HS codes, and historical importer data.',
    },
    {
        tag: 'TRACKING',
        title: 'Route Monitoring',
        description: 'Continuous tracking of maritime routes to detect delays and suspicious deviations.',
    },
    {
        tag: 'SECURITY',
        title: 'Anomaly Detection',
        description: 'Sophisticated algorithms identify irregular weight, value, or classification declarations instantly.',
    },
];

const ServicesSection = () => {
    return (
        <section id="services" className="py-24 bg-white dark:bg-slate-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {services.map((service, i) => (
                        <motion.div
                            key={service.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group"
                        >
                            {/* Removed Image block - showing text content */}
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 h-full hover:border-[#2563eb]/30 transition-colors">
                                <span className="inline-block px-3 py-1 mb-4 rounded-full text-[11px] font-bold bg-[#1B2A4A]/10 dark:bg-[#1B2A4A]/30 text-[#1B2A4A] dark:text-blue-400 uppercase tracking-wider">
                                    {service.tag}
                                </span>
                                <h3 className="text-xl font-bold text-[#1B2A4A] dark:text-slate-100">{service.title}</h3>
                                <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">{service.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;
