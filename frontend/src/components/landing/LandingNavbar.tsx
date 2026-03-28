"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Home',         id: 'hero'         },
    { label: 'Services',     id: 'services'     },
    { label: 'Solutions',    id: 'solutions'    },
    { label: 'Testimonials', id: 'testimonials' },
    { label: 'About',        id: 'about'        },
    { label: 'FAQ',          id: 'faq'          },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }} animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm shadow-black/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => scrollTo('hero')}>
            <div className="w-8 h-8 bg-[#1B2A4A] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className={`text-lg font-bold tracking-tight transition-colors ${scrolled ? 'text-[#1B2A4A]' : 'text-white'}`}>
              CONTAIN&apos;<span className={scrolled ? 'text-[#2563eb]' : 'text-blue-400'}>A&apos;RISK</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)}
                className={`px-4 py-2 text-[14px] font-medium transition-colors duration-200 ${
                  scrolled ? 'text-[#4B5563] hover:text-[#1B2A4A]' : 'text-white/80 hover:text-white'
                }`}>
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center space-x-3">
            <button onClick={() => router.push('/login')}
              className={`px-5 py-2 text-[14px] font-medium transition-colors ${
                scrolled ? 'text-[#4B5563] hover:text-[#1B2A4A]' : 'text-white/80 hover:text-white'
              }`}>
              Sign In
            </button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/login')}
              className={`px-6 py-2.5 text-[14px] font-semibold rounded-full transition-colors ${
                scrolled ? 'text-white bg-[#1B2A4A] hover:bg-[#243656]' : 'text-[#1B2A4A] bg-white hover:bg-gray-100'
              }`}>
              Sign Up
            </motion.button>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 transition-colors ${scrolled ? 'text-[#1B2A4A]' : 'text-white'}`}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-4 space-y-1">
              {links.map(link => (
                <button key={link.id} onClick={() => scrollTo(link.id)}
                  className="block w-full text-left px-4 py-3 text-[14px] text-[#4B5563] hover:text-[#1B2A4A] hover:bg-gray-50 rounded-lg transition-colors">
                  {link.label}
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

export default LandingNavbar;
