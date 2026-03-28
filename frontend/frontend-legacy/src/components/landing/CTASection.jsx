import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
    const navigate = useNavigate();

    return (
        <section className="py-24 bg-[#1B2A4A] relative overflow-hidden">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
            }} />

            <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-[44px] font-extrabold text-white tracking-tight leading-tight">
                        Ready to streamline your{' '}
                        <br className="hidden md:block" />
                        shipping operations?
                    </h2>
                    <p className="text-white/60 mt-5 max-w-lg mx-auto text-[15px] leading-relaxed">
                        Start analyzing container risk in minutes. No setup required. Analyze now.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/login')}
                            className="group flex items-center space-x-2 px-8 py-3.5 bg-white dark:bg-slate-800 text-[#1B2A4A] dark:text-slate-100 text-sm font-bold rounded-full transition-colors hover:bg-gray-100"
                        >
                            <span>Get Started Free</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;
