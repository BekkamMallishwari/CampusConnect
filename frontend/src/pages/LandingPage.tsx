import { motion } from 'framer-motion';
import { ArrowRight, Search, ShieldCheck, Sparkles, MessageSquare, Gift, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Sparkles,
    title: 'Smart Similarity Scan',
    description: 'Automatic text and tag scans compare brand, color, category, name, and description when found items are uploaded.',
  },
  {
    icon: Bell,
    title: 'Immediate Alerts',
    description: 'Instant notification badges and Nodemailer HTML email alerts sent to both users when matching items overlap.',
  },
  {
    icon: MessageSquare,
    title: 'Verified Chat Rooms',
    description: 'Private message threads unlock instantly when both sides accept the match, letting users secure coordinate handovers.',
  },
  {
    icon: Gift,
    title: 'Stripe Escrow Rewards',
    description: 'Ensures finder reward claims are paid safely using Stripe payment flows before unlocking private contact coordinates.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3 text-xl font-bold tracking-tight text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white">
            <Sparkles size={18} />
          </div>
          CampusConnect
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-full border border-slate-800 bg-slate-950/50 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-700 hover:text-white">
            Log In
          </Link>
          <Link to="/signup" className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">
            Sign Up
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-1 text-sm text-cyan-300">
              <Sparkles size={14} />
              Reunite lost items across college campuses
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                Lost it. Found it. <br/>
                <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Matched instantly.</span>
              </h1>
              <p className="max-w-xl text-lg text-slate-350 leading-relaxed">
                CampusConnect is a dedicated Lost & Found portal featuring smart similarity matching, real-time chats, and Stripe-backed reward handovers.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-400">
                Get Started <ArrowRight size={16} />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 px-6 py-3.5 font-bold text-slate-200 transition hover:border-slate-700">
                Explore Features
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-cyan-400" /> Automated matching engine
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-cyan-400" /> Stripe Payment Gateway
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 shadow-2xl">
              <div className="text-sm font-semibold text-cyan-400">Scan scanner</div>
              <div className="mt-6 text-3xl font-bold text-white">40%+ confidence matches</div>
            </div>
            <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 shadow-2xl">
              <div className="text-sm font-semibold text-cyan-400">Verification</div>
              <div className="mt-6 text-3xl font-bold text-white">Locked chats & details</div>
            </div>
            <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 shadow-2xl sm:col-span-2">
              <div className="text-sm font-semibold text-cyan-400">Escrow reward</div>
              <div className="mt-6 text-3xl font-bold text-white">Funds released on successful handbook returns.</div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">Platform Features</p>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Dedicated campus recovery workflow.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="rounded-3xl border border-slate-900 bg-slate-900/25 p-6 backdrop-blur-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-12 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-8 border-t border-slate-900 mt-12">
        <p>© 2026 CampusConnect. A dedicated college Lost & Found system.</p>
        <a href="mailto:support@campusconnect.app" className="text-cyan-400 hover:text-cyan-300 transition">
          support@campusconnect.app
        </a>
      </footer>
    </div>
  );
}
