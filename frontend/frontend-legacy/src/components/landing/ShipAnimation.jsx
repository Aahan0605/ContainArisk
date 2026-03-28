import { motion } from 'framer-motion';

const ShipAnimation = () => {
    return (
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
            {/* Ocean waves */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" className="w-[200%] h-20 md:h-28">
                    <motion.path
                        d="M0,60 C360,120 720,0 1080,60 C1260,90 1350,45 1440,60 L1440,120 L0,120 Z"
                        fill="rgba(59, 130, 246, 0.15)"
                        animate={{ x: [0, -720] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                </svg>
            </div>
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" className="w-[200%] h-16 md:h-24">
                    <motion.path
                        d="M0,80 C360,40 720,100 1080,60 C1260,40 1350,80 1440,60 L1440,120 L0,120 Z"
                        fill="rgba(59, 130, 246, 0.08)"
                        animate={{ x: [-720, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                </svg>
            </div>

            {/* Container ship */}
            <motion.div
                className="absolute bottom-8 md:bottom-12"
                initial={{ x: '-20%' }}
                animate={{ x: '110%' }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            >
                <motion.div
                    animate={{ y: [0, -6, 0, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <svg width="180" height="80" viewBox="0 0 180 80" fill="none" className="md:w-[220px]">
                        {/* Ship hull */}
                        <path d="M10,55 L25,70 L155,70 L170,55 L150,55 L150,35 L30,35 L30,55 Z" fill="#1e3a5f" />
                        {/* Ship deck / containers */}
                        <rect x="40" y="20" width="18" height="15" rx="1" fill="#3b82f6" />
                        <rect x="61" y="20" width="18" height="15" rx="1" fill="#f59e0b" />
                        <rect x="82" y="20" width="18" height="15" rx="1" fill="#ef4444" />
                        <rect x="103" y="20" width="18" height="15" rx="1" fill="#10b981" />
                        <rect x="124" y="20" width="18" height="15" rx="1" fill="#3b82f6" />
                        {/* Stack row 2 */}
                        <rect x="50" y="5" width="18" height="15" rx="1" fill="#8b5cf6" />
                        <rect x="71" y="5" width="18" height="15" rx="1" fill="#f59e0b" />
                        <rect x="92" y="5" width="18" height="15" rx="1" fill="#3b82f6" />
                        <rect x="113" y="5" width="18" height="15" rx="1" fill="#ef4444" />
                        {/* Bridge */}
                        <rect x="35" y="25" width="12" height="30" rx="1" fill="#0f2a4a" />
                        <rect x="37" y="28" width="8" height="6" rx="1" fill="#60a5fa" opacity="0.6" />
                        {/* Smoke stack */}
                        <rect x="38" y="15" width="6" height="10" rx="1" fill="#374151" />
                        {/* Smoke */}
                        <motion.circle
                            cx="41" cy="10" r="3"
                            fill="rgba(156,163,175,0.4)"
                            animate={{ y: [-5, -20], opacity: [0.4, 0], scale: [1, 2.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        <motion.circle
                            cx="41" cy="12" r="2"
                            fill="rgba(156,163,175,0.3)"
                            animate={{ y: [-3, -18], opacity: [0.3, 0], scale: [1, 2] }}
                            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                        />
                    </svg>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ShipAnimation;
