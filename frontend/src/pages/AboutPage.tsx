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
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the AI Matching Engine work?',
      a: 'CampusConnect AI combines natural language processing (Jaccard tokenization & Sentence Transformers) and Computer Vision feature extraction to match reported lost items against found items in real time with accuracy confidence scores.',
    },
    {
      q: 'Is my personal contact information safe?',
      a: 'Yes! Contact details are hidden by default. Phone numbers and personal info are only revealed after both parties accept an AI match verification or confirm ownership.',
    },
    {
      q: 'How do reward transactions work?',
      a: 'Reward amounts proposed by finders or item owners can be negotiated transparently within the app. Handover completions are verified before payment settlements are executed.',
    },
    {
      q: 'Can administrators manage malicious or fake reports?',
      a: 'Absolutely. University administrators have access to an Admin Panel to review flagged posts, audit analytics, and resolve disputes.',
    },
  ];

  const techStack = [
    { name: 'React 19 & TypeScript', desc: 'Modern frontend framework with strict type safety', icon: Globe },
    { name: 'Node.js & Express', desc: 'High-performance REST API server', icon: Zap },
    { name: 'MongoDB & Mongoose', desc: 'NoSQL document database with index optimization', icon: Building2 },
    { name: 'PyAI Engine (FastAPI)', desc: 'FastAPI microservice running PyTorch & Transformers', icon: Cpu },
    { name: 'Socket.IO Real-time', desc: 'Bi-directional web socket communication for live chat', icon: Users },
    { name: 'Leaflet & OpenStreetMap', desc: 'Interactive campus map and building navigation', icon: MapPin },
  ];

  const featuresList = [
    { label: 'AI Similarity Matching', desc: 'Auto-scans title, description, category, and visual attributes to connect finders and owners.', icon: Search },
    { label: 'Interactive Campus Map', desc: 'Pin exact lost and found locations on the university interactive building map.', icon: MapPin },
    { label: 'Real-time Chat', desc: 'Integrated messaging system for safe handover coordination.', icon: Users },
    { label: 'Admin Moderation', desc: 'Comprehensive moderation tools to ensure safety and report accuracy.', icon: ShieldCheck },
  ];

  return (
    <PageTransition>
      <div className="space-y-12 py-4 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-blue-900 p-8 sm:p-12 lg:p-16 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-200">
              <Sparkles size={14} /> University Lost & Found Platform
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Reconnecting Students with What Matters Most.
            </h1>
            <p className="text-base sm:text-lg text-blue-100 leading-relaxed font-semibold">
              CampusConnect is a production-ready university Lost & Found platform designed specifically for academic campuses. It combines real-time search, intelligent matching, and campus mapping.
            </p>
          </div>
        </section>

        {/* Core Features Grid */}
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
                className="rounded-2xl border border-slate-300 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{item.label}</h3>
                <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </section>

        {/* Mission & Vision */}
        <section className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="rounded-3xl border border-slate-300 bg-white p-8 space-y-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold">
              <Heart size={24} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Our Mission</h2>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
              To build a seamless, secure digital platform where students, faculty, and campus staff can effortlessly recover misplaced items while fostering honesty and community collaboration across campus.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="rounded-3xl border border-slate-300 bg-white p-8 space-y-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold">
              <Zap size={24} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Our Vision</h2>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
              To transform university lost-and-found management into a zero-friction system driven by intelligent search, interactive campus mapping, and verified peer-to-peer handovers.
            </p>
          </motion.div>
        </section>

        {/* Technology Stack */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Architecture & Technology Stack</h2>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">Built with modern, production-grade tools</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div key={idx} className="rounded-2xl border border-slate-300 bg-white p-6 flex items-start gap-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-blue-400">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{tech.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{tech.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="rounded-3xl border border-slate-300 bg-white p-8 sm:p-12 space-y-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <HelpCircle size={24} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left font-bold text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`transform transition-transform ${openFaq === idx ? 'rotate-180 text-blue-600' : 'text-slate-500'}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
