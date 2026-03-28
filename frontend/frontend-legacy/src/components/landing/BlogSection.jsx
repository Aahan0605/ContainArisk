import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const blogs = [
    {
        image: '/images/service-maritime.png',
        date: 'July 22, 2025',
        tag: 'News',
        title: 'CONTAIN\'A\'RISK Platform introduces new leadership to accelerate innovation and growth across European operations.',
    },
    {
        image: '/images/service-aerial.png',
        date: 'July 20, 2025',
        tag: 'News',
        title: 'New platform policy streamlines operations and ensures service continuity — while also uncovering areas for improvement.',
    },
    {
        image: '/images/service-ground.png',
        date: 'July 18, 2025',
        tag: 'News',
        title: 'Revolutionizing Liquid Transport: How Smart SaaS FlexiTech Optimizes Bulk Supply Chain Efficiency.',
    },
];

const BlogSection = () => {
    return (
        <section id="blog" className="py-24 bg-white dark:bg-slate-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-end justify-between mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-semibold bg-gray-100 text-[#1B2A4A] dark:text-slate-100 border border-gray-200 dark:border-slate-700 tracking-wide uppercase mb-4">
                            Blog
                        </span>
                        <h2 className="text-3xl md:text-[40px] font-extrabold text-[#1B2A4A] dark:text-slate-100 tracking-tight mt-3">
                            Latest Insights and Trends
                        </h2>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="hidden md:flex items-center space-x-2 px-5 py-2.5 bg-[#1B2A4A] text-white text-sm font-semibold rounded-full"
                    >
                        <span>See more</span>
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </div>

                {/* Blog grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {blogs.map((blog, i) => (
                        <motion.article
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="group cursor-pointer"
                        >
                            {/* Image */}
                            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] mb-4">
                                <img
                                    src={blog.image}
                                    alt={blog.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[11px] font-medium text-[#1B2A4A] dark:text-slate-100">
                                        {blog.date}
                                    </span>
                                </div>
                            </div>

                            {/* Meta */}
                            <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-[#4B5563] border border-gray-200 dark:border-slate-700 mb-3">
                                {blog.tag}
                            </span>

                            <h3 className="text-[15px] font-semibold text-[#1B2A4A] dark:text-slate-100 leading-snug group-hover:text-[#2563eb] transition-colors">
                                {blog.title}
                            </h3>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BlogSection;
