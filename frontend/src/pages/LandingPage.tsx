import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Users,
  Gift,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Award,
  BookOpen,
  Shield,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

/* ─── Animation Variants ─────────────────────────────────── */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

/* ─── Data ───────────────────────────────────────────────── */
const features = [
  {
    icon: Search,
    emoji: '🔍',
    title: 'Lost & Found',
    description: 'AI-powered item matching, image recognition, and instant notifications to recover your belongings fast.',
    glow: 'rgba(37,99,235,0.22)',
  },
  {
    icon: MapPin,
    emoji: '🗺️',
    title: 'Campus Map',
    description: 'Interactive campus navigation with building locations, live directions, and important campus landmarks.',
    glow: 'rgba(79,70,229,0.22)',
  },
  {
    icon: Users,
    emoji: '👥',
    title: 'Community',
    description: 'Connect with students through announcements, discussions, and private messaging all in one place.',
    glow: 'rgba(30,58,138,0.22)',
  },
  {
    icon: Gift,
    emoji: '🏆',
    title: 'Rewards',
    description: 'Earn and claim secure rewards after successful item verification and handover on campus.',
    glow: 'rgba(59,130,246,0.22)',
  },
];

const steps = [
  {
    number: '01',
    title: 'Explore Features',
    description:
      'Browse all the smart tools CampusConnect offers for reporting lost items, exploring the campus map, connecting with the community, and earning rewards.',
    icon: BookOpen,
  },
  {
    number: '02',
    title: 'Sign Up Instantly',
    description:
      'Create your account in seconds using your college email and personalize your experience.',
    icon: Zap,
  },
  {
    number: '03',
    title: 'Enjoy Campus Life',
    description:
      'Recover lost items, stay connected, explore the campus, and earn rewards—all from one platform.',
    icon: Award,
  },
];

/* ─── Main Component ─────────────────────────────────────── */

/* ─── Main Component ─────────────────────────────────────── */
export default function LandingPage() {
  const { scrollYProgress, scrollY } = useScroll();

  const navBg = useTransform(
    scrollYProgress,
    [0, 0.05],
    ['rgba(30, 58, 138, 0)', 'rgba(255, 255, 255, 0.97)']
  );
  const navShadow = useTransform(
    scrollYProgress,
    [0, 0.05],
    ['0 0 0 0 transparent', '0 2px 20px rgba(30,58,138,0.1)']
  );
  const navBlur = useTransform(
    scrollYProgress,
    [0, 0.05],
    ['blur(0px)', 'blur(20px)']
  );
  const navTextColor = useTransform(
    scrollYProgress,
    [0, 0.05],
    ['#ffffff', '#0F172A']
  );

  const heroParallax = useTransform(scrollY, [0, 500], [0, -60]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'community', label: 'Community' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'how-it-works', 'community'];
      const pos = window.scrollY + 120;
      for (const s of sections) {
        const el = document.getElementById(s);
        if (el && pos >= el.offsetTop && pos < el.offsetTop + el.offsetHeight) {
          setActiveSection(s);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 72, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ════ NAVBAR ════ */}
      <motion.nav
        style={{ backgroundColor: navBg, boxShadow: navShadow, backdropFilter: navBlur }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => scrollTo('home')}
              className="flex items-center gap-2.5 group"
              aria-label="CampusConnect – Go to top"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[14px] shadow-md transition-transform duration-300 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
              >
                <Sparkles size={17} className="text-white fill-white" />
              </div>
              <motion.span style={{ color: navTextColor }} className="text-lg font-black tracking-tight">
                Campus<span>Connect</span>
              </motion.span>
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="relative text-sm font-semibold py-1"
                  id={`nav-link-${link.id}`}
                >
                  <motion.span style={{ color: navTextColor }}>
                    {link.label}
                  </motion.span>
                  {activeSection === link.id && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: '#2563EB' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                id="nav-login-btn"
                to="/login"
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-300"
                style={{ color: '#2563EB' }}
              >
                Log In
              </Link>
              <Link
                id="nav-signup-btn"
                to="/signup"
                className="text-sm font-bold px-5 py-2.5 rounded-[14px] text-white transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                }}
              >
                Sign Up Free
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl"
              style={{ color: '#1E3A8A' }}
              aria-label="Toggle navigation menu"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t"
              style={{ backgroundColor: 'white', borderColor: '#E2E8F0' }}
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200"
                    style={{
                      color: activeSection === link.id ? '#1E3A8A' : '#64748B',
                      backgroundColor: activeSection === link.id ? '#EFF6FF' : 'transparent',
                    }}
                  >
                    {link.label}
                  </button>
                ))}
                <div className="flex gap-3 pt-3 border-t mt-2" style={{ borderColor: '#E2E8F0' }}>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-3 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: '#CBD5E1', color: '#475569' }}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
                  >
                    Sign Up Free
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ════ HERO SECTION ════ */}
      <section
        id="home"
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0C1E5A 0%, #1E3A8A 40%, #2563EB 80%, #3B82F6 100%)' }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-dots" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-dots)" />
          </svg>
          <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.18] blur-[120px]" style={{ background: '#3B82F6' }} />
          <div className="absolute -bottom-20 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.14] blur-[100px]" style={{ background: '#60A5FA' }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute top-16 right-16 w-72 h-72 border border-white/[0.08] rounded-full hidden lg:block" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute top-28 right-28 w-44 h-44 border border-white/[0.06] rounded-full hidden lg:block" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-24 left-12 w-36 h-36 border border-white/[0.06] rounded-full hidden lg:block" />
        </div>

        <motion.div
          style={{ y: heroParallax }}
          className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8 w-full pt-28 pb-24"
        >
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left: hero copy (45%) */}
            <motion.div initial="hidden" animate="show" variants={stagger} className="lg:col-span-5 space-y-7">
              {/* Badge */}
              <motion.div variants={fadeUp}>
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm"
                  style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)', color: '#BFDBFE', backdropFilter: 'blur(8px)' }}
                >
                  <Sparkles size={12} className="fill-current text-blue-300" />
                  Your Campus, Simplified
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-[56px] font-black leading-[1.08] tracking-tight text-white">
                Lost &amp; Found
                <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #93C5FD, #FBBF24)' }}>
                  Made Smarter
                </span>
                <br />
                for Your Campus
              </motion.h1>

              {/* Subtitle */}
              <motion.p variants={fadeUp} className="text-base sm:text-lg leading-relaxed font-medium max-w-xl text-slate-300">
                Helping students quickly report, discover, and recover lost belongings while staying connected with the campus community.
              </motion.p>

              {/* Buttons */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
                <Link
                  id="hero-report-lost-btn"
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-extrabold text-white transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-blue-500/30"
                  style={{ background: '#2563EB' }}
                >
                  Report Lost Item <ArrowRight size={15} />
                </Link>
                <Link
                  id="hero-report-found-btn"
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-extrabold text-slate-900 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                  style={{ background: '#10B981' }}
                >
                  Report Found Item <CheckCircle size={15} />
                </Link>
                <Link
                  id="hero-explore-community-btn"
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-extrabold text-white border border-white/20 transition-all duration-300 hover:-translate-y-1 backdrop-blur-md"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  Explore Community <ChevronRight size={15} />
                </Link>
              </motion.div>

              {/* Feature Badges */}
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-5 pt-2">
                {[
                  { icon: Shield, text: 'Secure & Private' },
                  { icon: CheckCircle, text: 'AI Powered Matching' },
                  { icon: Zap, text: 'Instant Notifications' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md" style={{ color: '#E2E8F0' }}>
                    <Icon size={14} style={{ color: '#34D399' }} />
                    <span className="text-xs font-semibold">{text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Realistic Campus Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="lg:col-span-7 w-full relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl group">
                <img
                  src="/campus_hero_bg.png"
                  alt="Modern University Campus"
                  className="w-full h-[480px] lg:h-[540px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                
                {/* Floating Glass Overlay Cards */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">AI Similarity Engine Active</p>
                      <p className="text-[10px] text-slate-300">Live vector matching across campus</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    Online
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L60 70C120 60 240 40 360 38C480 36 600 46 720 50C840 54 960 52 1080 48C1200 44 1320 38 1380 35L1440 32V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="#F8FAFC" />
          </svg>
        </div>
      </section>



      {/* ════ FEATURES SECTION ════ */}
      <section id="features" className="py-24 lg:py-32" style={{ backgroundColor: 'white' }}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16 lg:mb-20"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              Core Features
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight mb-5 leading-[1.1]" style={{ color: '#0F172A' }}>
              Everything you need.
              <br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #1E3A8A, #2563EB)' }}>
                Nothing you don't.
              </span>
            </h2>
            <p className="text-lg font-medium max-w-2xl mx-auto" style={{ color: '#64748B' }}>
              Designed specifically for modern university life — CampusConnect brings all
              essential student tools into one premium, easy-to-use experience.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  whileHover={{ y: -8, boxShadow: `0 24px 48px ${feature.glow}`, borderColor: '#BFDBFE' }}
                  transition={{ duration: 0.22 }}
                  className="group rounded-[24px] p-7 border cursor-pointer"
                  style={{ backgroundColor: 'white', borderColor: '#E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                  id={`feature-card-${feature.title.toLowerCase().replace(/[\s&]+/g, '-')}`}
                >
                  <div
                    className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', boxShadow: '0 6px 18px rgba(37,99,235,0.28)' }}
                  >
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="text-2xl mb-3 transition-transform duration-300 group-hover:scale-110 origin-left">
                    {feature.emoji}
                  </div>
                  <h3 className="text-lg font-black mb-3 tracking-tight" style={{ color: '#0F172A' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed font-medium" style={{ color: '#64748B' }}>
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-5 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ color: '#2563EB' }}>
                    Learn more <ArrowRight size={12} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ════ HOW IT WORKS — Simple by Design ════ */}
      <section id="how-it-works" className="py-24 lg:py-32" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              Simple by Design
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight mb-4 leading-[1.1]" style={{ color: '#0F172A' }}>
              Here's how it works
            </h2>
            <p className="text-xl font-medium" style={{ color: '#64748B' }}>
              More living, less searching.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div
              className="hidden lg:block absolute top-[80px] left-[calc(16.67%+56px)] right-[calc(16.67%+56px)] h-px z-0"
              style={{ background: 'linear-gradient(90deg, transparent, #BFDBFE 20%, #BFDBFE 80%, transparent)' }}
            />

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
              className="grid lg:grid-cols-3 gap-8 relative z-10"
            >
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    variants={fadeUp}
                    whileHover={{ y: -6, boxShadow: '0 20px 44px rgba(30,58,138,0.1)' }}
                    transition={{ duration: 0.22 }}
                    className="rounded-[28px] p-8 border text-center relative"
                    style={{ backgroundColor: 'white', borderColor: '#E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                    id={`step-card-${step.number}`}
                  >
                    {/* Step badge */}
                    <div
                      className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black border-2 border-white shadow-md"
                      style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white' }}
                    >
                      Step {step.number}
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 mt-5" style={{ background: '#EFF6FF' }}>
                      <Icon size={28} style={{ color: '#2563EB' }} />
                    </div>

                    <h3 className="text-xl font-black mb-4 tracking-tight" style={{ color: '#0F172A' }}>{step.title}</h3>
                    <p className="text-sm leading-relaxed font-medium" style={{ color: '#64748B' }}>{step.description}</p>

                    {/* Arrow connector */}
                    {i < steps.length - 1 && (
                      <div
                        className="hidden lg:flex absolute -right-4 top-[80px] w-8 h-8 rounded-full items-center justify-center z-20 border-2 border-white shadow-md"
                        style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
                      >
                        <ArrowRight size={14} className="text-white" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="text-center mt-14"
          >
            <Link
              id="how-it-works-signup-btn"
              to="/signup"
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-[20px] text-base font-bold text-white transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', boxShadow: '0 8px 28px rgba(37,99,235,0.35)' }}
            >
              Sign Up Free <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>





      {/* ════ CTA BANNER ════ */}
      <section className="py-20 lg:py-28" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[32px] p-12 lg:p-20 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0C1E5A 0%, #1E3A8A 48%, #2563EB 100%)', boxShadow: '0 24px 64px rgba(30,58,138,0.32)' }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08]">
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="cta-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cta-dots)" />
              </svg>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-[80px] pointer-events-none" style={{ background: '#60A5FA' }} />

            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-white tracking-tight mb-5 leading-[1.1]">
                Join Your Campus
                <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #93C5FD, #FBBF24)' }}>
                  Community Today
                </span>
              </h2>
              <p className="text-lg font-medium mb-10 max-w-2xl mx-auto" style={{ color: '#CBD5E1' }}>
                Experience university life the way it was meant to be. Connect,
                discover, and thrive with CampusConnect.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  id="cta-get-started-btn"
                  to="/signup"
                  className="inline-flex items-center gap-2.5 px-10 py-4 rounded-[20px] text-sm font-bold transition-all duration-300 hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#0F172A', boxShadow: '0 8px 28px rgba(251,191,36,0.32)' }}
                >
                  Get Started Free <ArrowRight size={16} />
                </Link>
                <Link
                  id="cta-login-btn"
                  to="/login"
                  className="inline-flex items-center gap-2.5 px-10 py-4 rounded-[20px] text-sm font-bold border transition-all duration-300 hover:bg-white/10"
                  style={{ borderColor: 'rgba(255,255,255,0.28)', color: 'white', backdropFilter: 'blur(8px)' }}
                >
                  Already a member? Log In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="border-t pt-14 pb-10" style={{ backgroundColor: '#0F172A', borderColor: '#1E293B' }}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px]" style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
                  <Sparkles size={18} className="text-white fill-white" />
                </div>
                <span className="text-xl font-black text-white">
                  Campus<span style={{ color: '#93C5FD' }}>Connect</span>
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed max-w-xs" style={{ color: '#475569' }}>
                The ultimate platform to simplify your campus experience,
                built by students for students.
              </p>
              <div className="flex gap-5 mt-6">
                {['Twitter', 'Instagram', 'LinkedIn'].map((s) => (
                  <a key={s} href="#" className="text-xs font-semibold transition-colors duration-300 hover:text-white" style={{ color: '#475569' }}>
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#94A3B8' }}>Platform</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollTo('features')} className="text-sm font-medium transition-colors duration-200 hover:text-white" style={{ color: '#475569' }}>Features</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium transition-colors duration-200 hover:text-white" style={{ color: '#475569' }}>How It Works</button></li>
                <li><Link to="/signup" className="text-sm font-medium transition-colors duration-200 hover:text-white" style={{ color: '#475569' }}>Sign Up</Link></li>
                <li><Link to="/login" className="text-sm font-medium transition-colors duration-200 hover:text-white" style={{ color: '#475569' }}>Log In</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#94A3B8' }}>Legal &amp; Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm font-medium transition-colors duration-200 hover:text-white" style={{ color: '#475569' }}>Privacy Policy</a></li>
                <li><a href="#" className="text-sm font-medium transition-colors duration-200 hover:text-white" style={{ color: '#475569' }}>Terms of Service</a></li>
                <li><a href="#" className="text-sm font-medium transition-colors duration-200 hover:text-white" style={{ color: '#475569' }}>Contact Us</a></li>
                <li><a href="mailto:support@campusconnect.app" className="text-sm font-medium transition-colors duration-200 hover:text-white" style={{ color: '#475569' }}>support@campusconnect.app</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: '#1E293B' }}>
            <p className="text-xs font-medium" style={{ color: '#334155' }}>
              © {new Date().getFullYear()} CampusConnect. All rights reserved. Built with ❤️ for students.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
              <span className="text-xs font-medium" style={{ color: '#334155' }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
