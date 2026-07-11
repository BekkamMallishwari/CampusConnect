import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Compass, Megaphone, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';

const features = [
  {
    icon: Compass,
    title: 'Campus Map',
    description: 'Navigate departments, hostels, labs, and student hotspots in one modern view.',
  },
  {
    icon: Megaphone,
    title: 'Announcements',
    description: 'Keep everyone updated with live college news, events, and alerts.',
  },
  {
    icon: ShieldCheck,
    title: 'Smart Complaints',
    description: 'Submit, track, and resolve complaints with transparent admin workflows.',
  },
  {
    icon: BookOpen,
    title: 'Marketplace',
    description: 'Discover books, gadgets, and hostel essentials from fellow students.',
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3 text-xl font-semibold tracking-wide">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
            <Sparkles size={18} />
          </div>
          CampusConnect
        </div>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#about" className="transition hover:text-white">About</a>
          <a href="#contact" className="transition hover:text-white">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-white">
            Login
          </Link>
          <Link to="/signup" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Sign up
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
              <Sparkles size={14} />
              Build stronger campus connections
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Everything campus, one connected platform.
              </h1>
              <p className="max-w-xl text-lg text-slate-300">
                CampusConnect brings students, faculty, clubs, admin, and campus services together through one premium digital experience.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
                Get Started <ArrowRight size={16} />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-slate-500">
                Explore Features
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Users size={16} /> 10k+ active students
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} /> Secure by design
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30">
              <div className="text-sm text-cyan-300">Live updates</div>
              <div className="mt-6 text-3xl font-semibold text-white">24/7 campus pulse</div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30">
              <div className="text-sm text-cyan-300">Student tools</div>
              <div className="mt-6 text-3xl font-semibold text-white">All essentials</div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30 sm:col-span-2">
              <div className="text-sm text-cyan-300">Community-first</div>
              <div className="mt-6 text-3xl font-semibold text-white">From lost items to placements, everything is connected.</div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform features</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Built for students, faculty, and admins.</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Why CampusConnect</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">A premium experience for every campus touchpoint.</h2>
            <p className="mt-4 max-w-2xl text-slate-300">
              From announcements and lost & found to marketplace and complaints, CampusConnect turns campus life into a beautifully organized ecosystem.
            </p>
          </div>
        </section>
      </main>

      <footer id="contact" className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-10 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>© 2026 CampusConnect. Built for modern colleges.</p>
        <a href="mailto:hello@campusconnect.com" className="text-cyan-300 transition hover:text-cyan-200">
          hello@campusconnect.com
        </a>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}

export default App;
