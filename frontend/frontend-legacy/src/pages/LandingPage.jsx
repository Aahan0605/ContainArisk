import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import LogoStripSection from '../components/landing/LogoStripSection';
import ServicesSection from '../components/landing/ServicesSection';
import SolutionsSection from '../components/landing/FeaturesSection';
import TestimonialSection from '../components/landing/TestimonialSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white text-[#1B2A4A] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            <LandingNavbar />
            <HeroSection />
            <LogoStripSection />
            <ServicesSection />
            <SolutionsSection />
            <TestimonialSection />
            <CTASection />
            <LandingFooter />
        </div>
    );
};

export default LandingPage;
