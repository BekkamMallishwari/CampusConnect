import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Clock3,
  FileText,
  LayoutGrid,
  MapPin,
  MessageCircle,
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImg from '../assets/homepage/hero.png';
import ContactFooter from '../components/ContactFooter';

type NavItem = {
  label: string;
  icon: LucideIcon;
  to: string;
};

type ListItem = {
  title: string;
  subtitle: string;
  meta: string;
  badge?: string;
  badgeClass?: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, to: '/signup' },
  { label: 'Lost Items', icon: FileText, to: '/signup' },
  { label: 'Found Items', icon: PackageSearch, to: '/signup' },
  { label: 'Messages', icon: MessageCircle, to: '/signup' },
  { label: 'Rewards', icon: Trophy, to: '/signup' },
  { label: 'Community', icon: Users, to: '/signup' },
];

const quickActions = [
  {
    title: 'Lost Item',
    description: 'Report something that went missing',
    icon: FileText,
    to: '/signup',
    accent: 'bg-gradient-to-br from-pink-500 to-rose-500',
  },
  {
    title: 'Found Item',
    description: 'Log an item found on campus',
    icon: PackageSearch,
    to: '/signup',
    accent: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  },
  {
    title: 'Messages',
    description: 'Continue item conversations',
    icon: MessageCircle,
    to: '/signup',
    accent: 'bg-gradient-to-br from-blue-500 to-indigo-600',
  },
  {
    title: 'Rewards',
    description: 'Check points and payout flow',
    icon: Trophy,
    to: '/signup',
    accent: 'bg-gradient-to-br from-amber-400 to-orange-500',
  },
];

const recentActivity: ListItem[] = [
  {
    title: 'Leather Key Ring',
    subtitle: 'Cafeteria',
    meta: 'by QA User B (Finder) · Aug 4, 2026',
    badge: 'Found',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    icon: Clock3,
  },
  {
    title: 'Leather Key Ring',
    subtitle: 'Cafeteria',
    meta: 'by QA User A (Owner) · Aug 4, 2026',
    badge: 'Lost',
    badgeClass: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
    icon: Clock3,
  },
];

const aiMatches = [
  {
    title: 'Mobile ↔ Mobile',
    subtitle: '85% match',
    meta: 'Bekkam Mallishwari • Nature Clicks',
  },
];

const messages = [
  {
    name: 'Bekkam Mallishwari',
    preview: 'hey, did you find my id card?',
    time: '1d ago',
    count: '1',
  },
  {
    name: 'Student Support',
    preview: 'lets meet at the library desk',
    time: '4d ago',
    count: '2',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col justify-between" style={{ color: 'var(--dash-text-primary)' }}>
      <div className="mx-auto max-w-[1760px] w-full px-3 pb-8 pt-3 sm:px-5 lg:px-8 flex-1">
        {/* Top Navbar */}
        <header className="glass-panel sticky top-3 z-40 rounded-2xl shadow-sm backdrop-blur-xl">
          <div className="grid h-[64px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-5">

            {/* LEFT — Logo */}
            <Link to="/login" className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
                <Sparkles size={17} className="fill-white" />
              </div>
              <div className="leading-none hidden sm:block">
                <div className="text-[15px] font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                  Campus<span className="text-indigo-500">Connect</span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.25em] mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>
                  University Portal
                </div>
              </div>
            </Link>

            {/* CENTER — Navigation */}
            <nav className="hidden lg:flex items-center justify-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isFirst = item.label === 'Dashboard';
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`inline-flex h-8.5 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-all whitespace-nowrap ${
                      isFirst
                        ? 'glass-tab-pill active'
                        : 'glass-tab-pill'
                    }`}
                  >
                    <Icon size={13} className="shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT — Search + Icons + CTA */}
            <div className="flex items-center justify-end gap-2.5 shrink-0">
              <div className="hidden lg:flex h-9 w-[180px] items-center gap-2 overflow-hidden rounded-xl border px-3 transition-all" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
                <Search size={13} style={{ color: 'var(--dash-text-muted)' }} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: 'var(--dash-text-muted)' }}>Search...</span>
                <span className="shrink-0 rounded border px-1 py-0.5 text-[9px] font-bold" style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-text-muted)' }}>
                  ⌘K
                </span>
              </div>

              <Link
                to="/login"
                className="dash-btn-primary py-2 px-4 text-xs font-bold shadow-sm"
              >
                Log In
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mt-4 space-y-5">
          {/* Hero Banner Section */}
          <section className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel relative overflow-hidden rounded-[30px] border shadow-2xl"
              style={{ background: '#10245D', borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <div className="absolute inset-0">
                <motion.img
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  src={heroImg}
                  alt="Campus banner"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,17,46,0.88)_0%,rgba(17,24,39,0.58)_48%,rgba(17,24,39,0.3)_100%)]" />
              </div>

              <div className="relative grid min-h-[400px] gap-8 p-6 sm:p-8 xl:min-h-[480px] xl:grid-cols-[1fr_360px] xl:items-end xl:p-8 z-10">
                <div className="w-full max-w-[640px] pb-2 pt-6 text-white sm:pt-8 xl:pt-0 relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-md">
                    University Lost & Found
                    <span className="text-amber-300">👋</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black leading-[1.02] tracking-tight text-white">
                    CampusConnect <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">Lost & Found</span>
                  </h1>

                  <p className="max-w-[44ch] text-xs sm:text-sm leading-relaxed text-slate-200">
                    Track live lost and found reports, surface multimodal AI matches faster, and coordinate secure handovers with escrow rewards.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to="/signup"
                      className="dash-btn-primary py-2.5 px-5 text-xs font-bold shadow-lg"
                    >
                      <FileText size={15} />
                      Report Lost Item
                    </Link>
                    <Link
                      to="/signup"
                      className="dash-btn-secondary py-2.5 px-5 text-xs font-bold bg-white text-slate-900 shadow-lg hover:bg-slate-100"
                    >
                      <PackageSearch size={15} />
                      Report Found Item
                    </Link>
                  </div>
                </div>

                <motion.aside
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 0.08 }}
                  className="glass-panel rounded-2xl p-4 text-white shadow-2xl backdrop-blur-xl border border-white/10"
                  style={{ background: 'rgba(15, 23, 42, 0.65)' }}
                >
                  {[
                    {
                      title: 'Active AI Matches',
                      value: '12',
                      note: 'High confidence matches',
                      icon: Sparkles,
                      color: 'bg-indigo-500/20 text-indigo-300',
                    },
                    {
                      title: 'Pending Verifications',
                      value: '3',
                      note: 'Ownership claim checks',
                      icon: Clock3,
                      color: 'bg-amber-500/20 text-amber-300',
                    },
                    {
                      title: 'Handover Completed',
                      value: '48',
                      note: 'Items returned safely',
                      icon: Bell,
                      color: 'bg-emerald-500/20 text-emerald-300',
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className={`flex items-center gap-3 rounded-xl p-3 ${index !== 2 ? 'border-b border-white/10 pb-4' : 'pb-1'}`}
                      >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white">{item.title}</p>
                          <p className="text-2xl font-black leading-none mt-0.5">{item.value}</p>
                          <p className="text-[11px] text-slate-300 mt-0.5">{item.note}</p>
                        </div>
                        <ArrowRight size={15} className="text-white/70" />
                      </div>
                    );
                  })}
                </motion.aside>
              </div>
            </motion.div>
          </section>

          {/* 4 Dashboard Widgets Grid */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)_minmax(0,1fr)_420px]"
          >
            {/* Quick Actions */}
            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" />
                <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      to={action.to}
                      className="glass-action-card p-3.5 transition hover:-translate-y-0.5"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.accent} text-white shadow-md`}>
                        <Icon size={18} />
                      </div>
                      <h3 className="mt-3 text-xs font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>{action.title}</h3>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--dash-text-secondary)' }}>{action.description}</p>
                    </Link>
                  );
                })}
              </div>
              <Link
                to="/signup"
                className="glass-action-card flex items-center gap-3 p-3 mt-1 block"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>Campus Map Navigation</p>
                  <p className="text-[11px]" style={{ color: 'var(--dash-text-secondary)' }}>Explore interactive building directory</p>
                </div>
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock3 size={16} className="text-indigo-500" />
                  <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Recent Reports</h2>
                </div>
                <Link to="/signup" className="text-xs font-bold text-indigo-500 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {recentActivity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={`${item.title}-${item.subtitle}`} className="glass-action-card flex items-start gap-3 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{item.title}</p>
                              {item.badge && (
                                <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${item.badgeClass}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px]" style={{ color: 'var(--dash-text-secondary)' }}>{item.subtitle}</p>
                          </div>
                        </div>
                        <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>{item.meta}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Matches */}
            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-500" />
                  <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>AI Matches</h2>
                </div>
                <Link to="/signup" className="text-xs font-bold text-indigo-500 hover:underline">View all</Link>
              </div>
              {aiMatches.map((match) => (
                <div key={match.title} className="glass-action-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600">
                      Verified
                    </span>
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-500">
                      {match.subtitle}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3 py-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-base font-black text-indigo-600">
                      L
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-indigo-500 text-center" style={{ background: 'var(--glass-bg)' }}>
                      <div>
                        <div className="text-lg font-black text-indigo-500">85%</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Match</div>
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-base font-black text-indigo-600">
                      F
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{match.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--dash-text-secondary)' }}>{match.meta}</p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Link
                      to="/signup"
                      className="dash-btn-secondary flex-1 py-2 text-center text-xs font-bold"
                    >
                      Review Match
                    </Link>
                    <Link
                      to="/signup"
                      className="dash-btn-primary flex-1 py-2 text-center text-xs font-bold"
                    >
                      Messages
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Messages & Announcements */}
            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-indigo-500" />
                  <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Recent Messages</h2>
                </div>
                <Link to="/signup" className="text-xs font-bold text-indigo-500 hover:underline">View all</Link>
              </div>
              <div className="space-y-2.5">
                {messages.map((message) => (
                  <div key={message.name + message.preview} className="glass-action-card flex items-center gap-3 p-3">
                    <div className="dash-avatar-gradient flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white">
                      B
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{message.name}</p>
                        <span className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>{message.time}</span>
                      </div>
                      <p className="truncate text-xs" style={{ color: 'var(--dash-text-secondary)' }}>{message.preview}</p>
                    </div>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                      {message.count}
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-action-card p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Campus Alerts</h3>
                  <Link to="/signup" className="text-[11px] font-bold text-indigo-500 hover:underline">Community</Link>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 shrink-0">
                    <Megaphone size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>Campus Community Feed</p>
                    <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
                      Connect with students to find lost keys, electronics, or share campus events.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </main>
      </div>

      <div className="mx-auto max-w-[1760px] w-full px-3 pb-8 sm:px-5 lg:px-8">
        <ContactFooter />
      </div>
    </div>
  );
}
