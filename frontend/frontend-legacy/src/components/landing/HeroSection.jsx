import { motion } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const [tracking, setTracking] = useState('');
    const navigate = useNavigate();

    const handleAnalyze = () => {
        navigate('/login');
    };

    return (
        <section id="hero" className="relative min-h-screen overflow-hidden">
            {/* Hero background video */}
            <div className="absolute inset-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src="/images/hero-video.mp4" type="video/mp4" />
                </video>
                {/* Dark overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B33]/90 via-[#0F1B33]/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B33]/60 via-transparent to-[#0F1B33]/30" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-40 pb-32 min-h-screen flex flex-col justify-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[12px] font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 tracking-wide uppercase">
                        Expedition Global Reach
                    </span>
                </motion.div>

                {/* Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mt-8 max-w-2xl"
                >
                    Safety In{' '}
                    <br />
                    Every Shipment
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-[16px] text-white/70 max-w-lg mt-6 leading-relaxed"
                >
                    Our system does not just predict risk. It builds a full customs
                    intelligence platform that prioritizes inspections, detects trade
                    fraud networks, and explains suspicious shipments.
                </motion.p>

                {/* Tracking search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="mt-10 max-w-md"
                >
                    <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full overflow-hidden pl-5 pr-1.5 py-1.5">
                        <input
                            type="text"
                            value={tracking}
                            onChange={(e) => setTracking(e.target.value)}
                            placeholder="Enter Container ID"
                            className="flex-1 bg-transparent text-sm text-white placeholder-white/50 outline-none py-2"
                        />
                        <motion.button
                            onClick={handleAnalyze}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-[#1B2A4A] hover:bg-[#243656] text-white text-sm font-semibold rounded-full transition-colors"
                        >
                            <Search className="w-4 h-4" />
                            <span>Analyze</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex flex-col items-center text-white/40"
                    >
                        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
                            <motion.div
                                animate={{ y: [0, 12, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-1.5 h-1.5 bg-white/50 rounded-full"
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
