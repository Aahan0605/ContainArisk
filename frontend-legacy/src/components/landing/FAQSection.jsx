import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: 'What is container risk analysis?',
        answer: 'Container risk analysis is the process of evaluating shipping containers for potential security threats using data-driven scoring. Our AI analyzes weight, declared value, origin, importer history, HS codes, and trade patterns to assign risk scores from 0 to 1, flagging containers that warrant inspection.'
    },
    {
        question: 'How does the AI detect anomalies?',
        answer: 'Our models identify deviations from expected patterns — weight mismatches between declared and measured values, unusual value-to-weight ratios for given product codes, suspicious origin-destination combinations, and importers with prior enforcement flags. Each anomaly contributes to the overall risk score with explainable reasoning.'
    },
    {
        question: 'Who uses this platform?',
        answer: 'CONTAIN\'A\'RISK is designed for customs officers, port security analysts, trade compliance teams, and border protection agencies. It augments human decision-making by surfacing the highest-risk containers from thousands of daily entries.'
    },
    {
        question: 'Is the data secure?',
        answer: 'All container manifest data is encrypted at rest and in transit. The platform is deployed on SOC 2 compliant infrastructure with role-based access controls. No container data is stored beyond the analysis window unless explicitly retained by your organization.'
    },
    {
        question: 'What data formats are supported?',
        answer: 'The platform accepts CSV manifests, API integrations from port management systems, and common EDI formats. Required fields include container ID, importer, exporter, origin, destination, weight, declared value, and HS code.'
    }
];

const FAQItem = ({ faq, isOpen, onToggle }) => (
    <div className="border-b border-white/[0.04] last:border-0">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between py-5 text-left group"
        >
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors pr-4">
                {faq.question}
            </span>
            <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
            >
                <ChevronDown className="w-4 h-4 text-gray-600" />
            </motion.div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                >
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed pb-5">
                        {faq.answer}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section id="faq" className="py-28 bg-[#0B0F19]">
            <div className="max-w-3xl mx-auto px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-14"
                >
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-[0.15em]">FAQ</span>
                    <h2 className="text-3xl md:text-[40px] font-bold text-white mt-3 tracking-tight">
                        Questions & Answers
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-[#111827]/40 border border-white/[0.04] rounded-2xl px-7"
                >
                    {faqs.map((faq, i) => (
                        <FAQItem
                            key={i}
                            faq={faq}
                            isOpen={openIndex === i}
                            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FAQSection;
