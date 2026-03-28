import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const TestimonialSection = () => {
    return (
        <section id="testimonials" className="py-24 bg-white dark:bg-slate-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Quote */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-semibold bg-gray-100 text-[#1B2A4A] dark:text-slate-100 border border-gray-200 dark:border-slate-700 tracking-wide uppercase mb-8">
                            Customers Say
                        </span>

                        <blockquote className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1B2A4A] dark:text-slate-100 leading-snug mt-6">
                            "<span className="bg-[#E8F0FE] px-1">CONTAIN'A'RISK</span> transformed how we
                            analyze container shipment risks. Real-time risk analysis and automated alerts
                            keep our operations running smoothly."
                        </blockquote>

                        <div className="mt-8">
                            <p className="font-semibold text-[#1B2A4A] dark:text-slate-100">James Anderson</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Head of Logistics, Pacific Freight Co.</p>
                        </div>

                        <div className="flex items-center space-x-1 mt-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Photo */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="rounded-3xl overflow-hidden aspect-[4/5] max-w-md ml-auto">
                            <img
                                src="/images/testimonial-person.png"
                                alt="James Anderson"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default TestimonialSection;
