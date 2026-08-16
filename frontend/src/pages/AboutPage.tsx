import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Cpu,
  MapPin,
  Users,
  ChevronDown,
  Building2,
  Zap,
  Globe,
  Heart,
  HelpCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the AI Matching Engine work?',
      a: 'CampusConnect AI combines natural language processing (tokenization & semantic embeddings) and visual feature analysis to match reported lost items against found items in real time with accuracy confidence scores.',
    },
    {
      q: 'Is my personal contact information safe?',
      a: 'Yes! Contact details are protected and hidden by default. Phone numbers and email addresses are only revealed after both parties accept an AI match verification or confirm ownership.',
    },
    {
      q: 'How do reward transactions work?',
      a: 'Reward amounts proposed by finders or item owners can be negotiated transparently within the app. Handover completions are verified before escrow settlements are executed.',
    },
    {
      q: 'Can administrators manage malicious or fake reports?',
      a: 'Absolutely. Campus administrators have access to an Admin Moderation Panel to review flagged posts, audit system analytics, manage users, and resolve disputes.',
    },
  ];

  const techStack = [
    { name: 'React 19 & TypeScript', desc: 'Modern frontend with strict type safety', icon: Globe },
    { name: 'Node.js & Express', desc: 'High-performance REST API architecture', icon: Zap },
    { name: 'MongoDB & Mongoose', desc: 'Scalable document database with index optimization', icon: Building2 },
    { name: 'AI Matching Engine', desc: 'Fast multimodal similarity scoring engine', icon: Cpu },
    { name: 'Socket.IO Real-time', desc: 'Bi-directional web socket communication for live chat', icon: Users },
    { name: 'Leaflet & OpenStreetMap', desc: 'Interactive campus map and pedestrian navigation', icon: MapPin },
  ];

  const featuresList = [
    { label: 'AI Similarity Matching', desc: 'Auto-scans title, description, category, and visual attributes to connect finders and owners.', icon: Search },
    { label: 'Interactive Campus Map', desc: 'Pin exact lost and found locations on the university interactive building map.', icon: MapPin },
    { label: 'Real-time Chat', desc: 'Integrated messaging with meeting scheduling and live GPS tracking.', icon: Users },
    { label: 'Admin Moderation', desc: 'Comprehensive moderation tools to ensure campus safety and report accuracy.', icon: ShieldCheck },
  ];

  return (
    <PageTransition className="space-y-8 py-2 pb-24">
      {/* 1. Hero Glass Banner */}
      <div className="glass-hero-banner relative p-8 sm:p-12 lg:p-14">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={12} /> University Lost & Found Platform
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--dash-text-primary)' }}>
            Reconnecting Students with What Matters Most.
          </h1>
          <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
            CampusConnect is a modern university Lost & Found platform designed specifically for academic institutions. It combines real-time search, multimodal AI matching, secure escrow rewards, and interactive campus GPS navigation.
          </p>
        </div>
      </div>

      {/* 2. Core Features Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuresList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="glass-panel p-6 space-y-3 transition hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-xs">
                <Icon size={22} />
              </div>
              <h3 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>{item.label}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
                {item.desc}
              </p>
            </motion.div>
          );
        })}
      </section>

      {/* 3. Mission & Vision */}
      <section className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="glass-panel p-8 space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md">
            <Heart size={22} />
          </div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Our Mission</h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
            To build a seamless, secure digital platform where students, faculty, and campus staff can effortlessly recover misplaced items while fostering honesty, integrity, and community collaboration across campus.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="glass-panel p-8 space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
            <Zap size={22} />
          </div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Our Vision</h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
            To transform university lost-and-found management into a zero-friction system driven by intelligent AI search, interactive campus mapping, and verified peer-to-peer handovers.
          </p>
        </motion.div>
      </section>

      {/* 4. Technology Stack */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--dash-text-primary)' }}>Architecture & Tech Stack</h2>
          <p className="text-xs font-semibold" style={{ color: 'var(--dash-text-secondary)' }}>Built with modern, production-grade tools</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {techStack.map((tech, idx) => {
            const Icon = tech.icon;
            return (
              <div key={idx} className="glass-action-card p-5 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>{tech.name}</h3>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--dash-text-secondary)' }}>{tech.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FAQ Accordion */}
      <section className="glass-panel p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
            <HelpCircle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black" style={{ color: 'var(--dash-text-primary)' }}>Frequently Asked Questions</h2>
            <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>Common questions about security, matching, and rewards</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel overflow-hidden transition"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between p-4 text-left font-bold text-xs sm:text-sm transition"
                style={{ color: 'var(--dash-text-primary)', background: openFaq === idx ? 'rgba(99,102,241,0.06)' : 'transparent' }}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`transform transition-transform ${openFaq === idx ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`}
                />
              </button>
              {openFaq === idx && (
                <div className="p-4 text-xs leading-relaxed border-t" style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-text-secondary)' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
