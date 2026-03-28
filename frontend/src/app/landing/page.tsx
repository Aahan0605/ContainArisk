"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, ArrowRight, Shield, Globe, BarChart3, Truck } from 'lucide-react';

/* ── Navbar ─────────────────────────────────────────────────────────── */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'Home', id: 'hero' },
    { label: 'Services', id: 'services' },
    { label: 'Solutions', id: 'solutions' },
    { label: 'Testimonials', id: 'testimonials' },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }} animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#1B2A4A] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className={`text-lg font-bold tracking-tight transition-colors ${scrolled ? 'text-[#1B2A4A]' : 'text-white'}`}>
              CONTAIN'<span className={scrolled ? 'text-[#2563eb]' : 'text-blue-400'}>A'RISK</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {links.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className={`px-4 py-2 text-[14px] font-medium transition-colors ${scrolled ? 'text-[#4B5563] hover:text-[#1B2A4A]' : 'text-white/80 hover:text-white'}`}>
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <button onClick={() => router.push('/login')}
              className={`px-5 py-2 text-[14px] font-medium transition-colors ${scrolled ? 'text-[#4B5563] hover:text-[#1B2A4A]' : 'text-white/80 hover:text-white'}`}>
              Sign In
            </button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/login')}
              className={`px-6 py-2.5 text-[14px] font-semibold rounded-full transition-colors ${scrolled ? 'text-white bg-[#1B2A4A] hover:bg-[#243656]' : 'text-[#1B2A4A] bg-white hover:bg-gray-100'}`}>
              Sign Up
            </motion.button>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 transition-colors ${scrolled ? 'text-[#1B2A4A]' : 'text-white'}`}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-4 space-y-1">
              {links.map(l => (
                <button key={l.id} onClick={() => scrollTo(l.id)}
                  className="block w-full text-left px-4 py-3 text-[14px] text-[#4B5563] hover:text-[#1B2A4A] hover:bg-gray-50 rounded-lg transition-colors">
                  {l.label}
                </button>
              ))}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <button onClick={() => router.push('/login')} className="block w-full px-4 py-3 text-[14px] text-[#4B5563]">Sign In</button>
                <button onClick={() => router.push('/login')} className="block w-full px-4 py-3 text-[14px] font-semibold text-white bg-[#1B2A4A] rounded-full text-center">Sign Up</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

/* ── Hero ────────────────────────────────────────────────────────────── */
const HeroSection = () => {
  const [tracking, setTracking] = useState('');
  const router = useRouter();

  return (
    <section id="hero" className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <video autoPlay loop muted playsInline preload="auto" className="w-full h-full object-cover">
          <source src="/images/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B33]/90 via-[#0F1B33]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B33]/60 via-transparent to-[#0F1B33]/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-40 pb-32 min-h-screen flex flex-col justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[12px] font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 tracking-wide uppercase">
            Expedition Global Reach
          </span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mt-8 max-w-2xl">
          Safety In{' '}<br />Every Shipment
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="text-[16px] text-white/70 max-w-lg mt-6 leading-relaxed">
          Our system does not just predict risk. It builds a full customs intelligence platform that prioritizes inspections, detects trade fraud networks, and explains suspicious shipments.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-10 max-w-md">
          <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full overflow-hidden pl-5 pr-1.5 py-1.5">
            <input type="text" value={tracking} onChange={e => setTracking(e.target.value)}
              placeholder="Enter Container ID"
              className="flex-1 bg-transparent text-sm text-white placeholder-white/50 outline-none py-2" />
            <motion.button onClick={() => router.push('/login')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center space-x-2 px-6 py-2.5 bg-[#1B2A4A] hover:bg-[#243656] text-white text-sm font-semibold rounded-full transition-colors">
              <Search className="w-4 h-4" /><span>Analyze</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-white/40">
            <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
              <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-white/50 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

/* ── Logo Strip ──────────────────────────────────────────────────────── */
const logos = ['DB SCHENKER', 'FedEx', 'DHL', "CONTAIN'A'RISK", 'XPO Logistics', 'Caliber', 'JTL', 'GEODIS'];

const LogoStrip = () => (
  <section className="py-16 bg-white border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="flex items-center justify-between gap-8 overflow-hidden">
        {logos.map((name, i) => (
          <motion.div key={name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }} className="flex-shrink-0">
            <span className="text-[15px] font-bold text-gray-300 tracking-wide uppercase whitespace-nowrap">{name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Services ────────────────────────────────────────────────────────── */
const services = [
  { tag: 'ANALYSIS', title: 'Risk Profiling', description: 'Comprehensive risk assessment of containers based on origin, HS codes, and historical importer data.' },
  { tag: 'TRACKING', title: 'Route Monitoring', description: 'Continuous tracking of maritime routes to detect delays and suspicious deviations.' },
  { tag: 'SECURITY', title: 'Anomaly Detection', description: 'Sophisticated algorithms identify irregular weight, value, or classification declarations instantly.' },
];

const ServicesSection = () => (
  <section id="services" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-full hover:border-[#2563eb]/30 transition-colors">
              <span className="inline-block px-3 py-1 mb-4 rounded-full text-[11px] font-bold bg-[#1B2A4A]/10 text-[#1B2A4A] uppercase tracking-wider">{s.tag}</span>
              <h3 className="text-xl font-bold text-[#1B2A4A]">{s.title}</h3>
              <p className="text-[15px] text-gray-500 mt-3 leading-relaxed">{s.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Solutions ───────────────────────────────────────────────────────── */
const features = [
  { icon: Shield, title: 'AI Risk Engine', desc: 'Predictive ML models analyzing container origin, importer history, and HS codes.' },
  { icon: Globe, title: 'Route Intelligence', desc: 'Real-time monitoring of high-risk shipping lanes and active vessels.' },
  { icon: BarChart3, title: 'Anomaly Detection', desc: 'Automated identification of suspicious declarations, weights, and values.' },
  { icon: Truck, title: 'Trade Insights', desc: 'Deep analytics on global trade patterns, delays, and supply chain disruptions.' },
];

const SolutionsSection = () => (
  <section id="solutions" className="py-24 bg-[#F8F9FB]">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-semibold bg-white text-[#1B2A4A] border border-gray-200 tracking-wide uppercase mb-6">Our Solutions</span>
          <h2 className="text-3xl md:text-[44px] font-extrabold text-[#1B2A4A] leading-tight tracking-tight mt-4">Advanced Container Risk Analysis Engine</h2>
          <p className="text-gray-500 mt-5 text-[15px] leading-relaxed max-w-md">Leverage AI-driven intelligence to predict shipping delays, detect anomalies, and analyze global threat vectors in real time.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#1B2A4A]/5 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#1B2A4A]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1B2A4A]">{f.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

/* ── Testimonial ─────────────────────────────────────────────────────── */
const TestimonialSection = () => (
  <section id="testimonials" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-semibold bg-gray-100 text-[#1B2A4A] border border-gray-200 tracking-wide uppercase mb-8">Customers Say</span>
          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1B2A4A] leading-snug mt-6">
            "<span className="bg-[#E8F0FE] px-1">CONTAIN'A'RISK</span> transformed how we analyze container shipment risks. Real-time risk analysis and automated alerts keep our operations running smoothly."
          </blockquote>
          <div className="mt-8">
            <p className="font-semibold text-[#1B2A4A]">James Anderson</p>
            <p className="text-sm text-gray-500 mt-0.5">Head of Logistics, Pacific Freight Co.</p>
          </div>
          <div className="flex items-center space-x-1 mt-6">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
          <div className="rounded-3xl overflow-hidden aspect-[4/5] max-w-md ml-auto">
            <img src="/images/testimonial-person.png" alt="James Anderson" className="w-full h-full object-cover" />
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

/* ── CTA ─────────────────────────────────────────────────────────────── */
const CTASection = () => {
  const router = useRouter();
  return (
    <section className="py-24 bg-[#1B2A4A] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl md:text-[44px] font-extrabold text-white tracking-tight leading-tight">
            Ready to streamline your{' '}<br className="hidden md:block" />shipping operations?
          </h2>
          <p className="text-white/60 mt-5 max-w-lg mx-auto text-[15px] leading-relaxed">Start analyzing container risk in minutes. No setup required. Analyze now.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/login')}
              className="group flex items-center space-x-2 px-8 py-3.5 bg-white text-[#1B2A4A] text-sm font-bold rounded-full transition-colors hover:bg-gray-100">
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ── Footer ──────────────────────────────────────────────────────────── */
const footerLinks = {
  Platform: ['Dashboard', 'Risk Engine', 'Analytics', 'API'],
  Company: ['About', 'Security', 'Careers', 'Contact'],
  Resources: ['Documentation', 'Changelog', 'Status', 'Support'],
  Legal: ['Privacy', 'Terms', 'Compliance', 'GDPR'],
};

const SocialIcon = ({ d }: { d: string }) => (
  <a href="#" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
    <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d={d} /></svg>
  </a>
);

const Footer = () => (
  <footer className="bg-[#F8F9FB] border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-7 h-7 bg-[#1B2A4A] rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-sm font-bold text-[#1B2A4A] tracking-tight">CONTAIN'<span className="text-[#2563eb]">A'RISK</span></span>
          </div>
          <p className="text-[12px] text-gray-400 leading-relaxed">AI-powered container risk intelligence for port security and customs operations.</p>
          <div className="flex items-center space-x-2 mt-5">
            <SocialIcon d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            <SocialIcon d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </div>
        </div>
        {Object.entries(footerLinks).map(([cat, links]) => (
          <div key={cat}>
            <h4 className="text-[11px] font-bold text-[#1B2A4A] uppercase tracking-[0.12em] mb-4">{cat}</h4>
            <ul className="space-y-2.5">
              {links.map(l => <li key={l}><a href="#" className="text-[13px] text-gray-400 hover:text-[#1B2A4A] transition-colors">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-14 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[12px] text-gray-400">© 2025 CONTAIN'A'RISK. All rights reserved.</p>
        <div className="flex items-center space-x-6">
          <a href="#" className="text-[12px] text-gray-400 hover:text-[#1B2A4A] transition-colors">Privacy Policy</a>
          <a href="#" className="text-[12px] text-gray-400 hover:text-[#1B2A4A] transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
);

/* ── Page ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-[#1B2A4A] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <HeroSection />
      <LogoStrip />
      <ServicesSection />
      <SolutionsSection />
      <TestimonialSection />
      <CTASection />
      <Footer />
    </div>
  );
}
