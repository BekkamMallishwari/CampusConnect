import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Search,
  PackageSearch,
  MapPinned,
  Sparkles,
  Clock,
  Layers,
  Zap,
  BadgeCheck,
  CreditCard,
  Handshake,
  MessageCircle,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  foundItemsApi,
  lostItemsApi,
  matchesApi,
  notificationsApi,
  chatsApi,
  type LostItemType,
  type FoundItemType,
  type MatchType,
  type NotificationType,
  type ChatType,
} from '../lib/api';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  StatsCard,
  MetricCard,
  QuickActionCard,
  Timeline,
  EmptyState,
  Button,
  Badge,
} from '../components/ui';

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [lostItems, setLostItems] = useState<LostItemType[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItemType[]>([]);
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [, setChats] = useState<ChatType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [lostRes, foundRes, matchRes, notifRes, chatsRes] = await Promise.all([
          lostItemsApi.getAll().catch(() => ({ data: { items: [] } })),
          foundItemsApi.getAll().catch(() => ({ data: { items: [] } })),
          matchesApi.getAll().catch(() => ({ data: { matches: [] } })),
          notificationsApi.getAll().catch(() => ({ data: { notifications: [] } })),
          chatsApi.getAll().catch(() => ({ data: { chats: [] } })),
        ]);

        setLostItems(lostRes.data.items || []);
        setFoundItems(foundRes.data.items || []);
        setMatches(matchRes.data.matches || []);
        setNotifications(notifRes.data.notifications || []);
        setChats(chatsRes.data.chats || []);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [location.state?.refreshLostFound]);

  const analytics = useMemo(() => {
    const totalReports = lostItems.length + foundItems.length;
    const lostCount = lostItems.length;
    const foundCount = foundItems.length;
    const activeMatches = matches.filter((m) =>
      ['Pending', 'PossibleMatch', 'LostUserVerified', 'CONFIRMED', 'PENDING_PAYMENT'].includes(m.matchStatus),
    ).length;
    const verificationPending = matches.filter((m) => m.verificationStatus === 'PENDING').length;
    const verified = matches.filter((m) => m.verificationStatus === 'VERIFIED').length;
    const meetingConfirmed = matches.filter((m) => m.meetingStatus === 'CONFIRMED').length;
    const paymentPaid = matches.filter((m) => m.paymentStatus === 'PAID').length;
    const unreadNotifs = notifications.filter((n) => !n.isRead).length;

    return {
      totalReports,
      lostCount,
      foundCount,
      activeMatches,
      verificationPending,
      verified,
      meetingConfirmed,
      paymentPaid,
      unreadNotifs,
    };
  }, [foundItems, lostItems, matches, notifications]);

  const recentActivity = useMemo(() => {
    const items = [
      ...lostItems.map((i) => ({
        type: 'lost' as const,
        id: i._id,
        title: i.itemName,
        date: i.createdAt,
        location: i.lostLocation,
      })),
      ...foundItems.map((i) => ({
        type: 'found' as const,
        id: i._id,
        title: i.itemName,
        date: i.createdAt,
        location: i.foundLocation,
      })),
    ];
    return items.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5);
  }, [foundItems, lostItems]);

  if (loading) return <LoadingSpinner />;

  return (
    <PageTransition className="space-y-8 py-2 pb-16">
      {/* ── DASHBOARD HERO ────────────────────────────────────────── */}
      <div className="glass-panel rounded-[var(--radius-2xl)] p-6 sm:p-8 hover-lift">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left Hero Content */}
          <div className="space-y-3 max-w-xl">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              Welcome back, {user?.name || 'Student'}
            </h1>
            <p className="text-xs text-[var(--secondary)] leading-relaxed">
              Manage lost items, connect securely, and recover belongings faster.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/lost-items/new">
                <Button size="md" variant="primary" className="gap-2">
                  <FileText size={15} />
                  Report Lost Item
                </Button>
              </Link>
              <Link to="/found-items/new">
                <Button size="md" variant="secondary" className="gap-2">
                  <Search size={15} />
                  Report Found Item
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Quick Overview Panel (Real Data Only) */}
          <div className="w-full lg:w-80 space-y-2.5 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-4 glass-panel">
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2">
              Quick Overview
            </h3>
            <MetricCard
              label="Active Matches"
              value={analytics.activeMatches}
              icon={Zap}
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-100/60 dark:bg-blue-950/60"
            />
            <MetricCard
              label="Pending Verification"
              value={analytics.verificationPending}
              icon={Clock}
              color="text-amber-600 dark:text-amber-400"
              bg="bg-amber-100/60 dark:bg-amber-950/60"
            />
            <MetricCard
              label="Unread Notifications"
              value={analytics.unreadNotifs}
              icon={Sparkles}
              color="text-violet-600 dark:text-violet-400"
              bg="bg-violet-100/60 dark:bg-violet-950/60"
            />
          </div>
        </div>
      </div>

      {/* ── STATISTICS SECTION ───────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">
          System Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Total Reports"
            value={analytics.totalReports}
            icon={Layers}
            color="text-blue-600"
            bg="bg-blue-50 dark:bg-blue-950/40"
          />
          <StatsCard
            label="Lost Items"
            value={analytics.lostCount}
            icon={Search}
            color="text-rose-600"
            bg="bg-gradient-to-br from-rose-500/10 to-rose-500/5 dark:from-rose-500/20 dark:to-rose-500/10 backdrop-blur-md"
          />
          <StatsCard
            label="Found Items"
            value={analytics.foundCount}
            icon={PackageSearch}
            color="text-emerald-600"
            bg="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/10 backdrop-blur-md"
          />
          <StatsCard
            label="AI Matches"
            value={analytics.activeMatches}
            icon={Zap}
            color="text-indigo-600"
            bg="bg-indigo-50 dark:bg-indigo-950/40"
          />
          <StatsCard
            label="Pending Verification"
            value={analytics.verificationPending}
            icon={Clock}
            color="text-amber-600"
            bg="bg-amber-50 dark:bg-amber-950/40"
          />
          <StatsCard
            label="Ownership Verified"
            value={analytics.verified}
            icon={BadgeCheck}
            color="text-violet-600"
            bg="bg-gradient-to-br from-violet-500/10 to-violet-500/5 dark:from-violet-500/20 dark:to-violet-500/10 backdrop-blur-md"
          />
          <StatsCard
            label="Meetings Confirmed"
            value={analytics.meetingConfirmed}
            icon={Handshake}
            color="text-cyan-600"
            bg="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 dark:from-cyan-500/20 dark:to-cyan-500/10 backdrop-blur-md"
          />
          <StatsCard
            label="Rewards Paid"
            value={analytics.paymentPaid}
            icon={CreditCard}
            color="text-emerald-600"
            bg="bg-emerald-50 dark:bg-emerald-950/40"
          />
        </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Report Lost Item"
            description="Submit details of an item you misplaced"
            to="/lost-items/new"
            icon={FileText}
            color="text-rose-600"
            bg="bg-rose-50 dark:bg-rose-950/40"
          />
          <QuickActionCard
            title="Report Found Item"
            description="Log an item you discovered on campus"
            to="/found-items/new"
            icon={Search}
            color="text-emerald-600"
            bg="bg-emerald-50 dark:bg-emerald-950/40"
          />
          <QuickActionCard
            title="Messages"
            description="Private secure chat for confirmed matches"
            to="/messages"
            icon={MessageCircle}
            color="text-blue-600"
            bg="bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 backdrop-blur-md"
          />
          <QuickActionCard
            title="Rewards"
            description="Points, badges & student leaderboard"
            to="/rewards"
            icon={Trophy}
            color="text-amber-600"
            bg="bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-amber-500/20 dark:to-amber-500/10 backdrop-blur-md"
          />
          <QuickActionCard
            title="Payments"
            description="Track reward transactions and escrow"
            to="/payments"
            icon={CreditCard}
            color="text-indigo-600"
            bg="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 dark:from-indigo-500/20 dark:to-indigo-500/10 backdrop-blur-md"
          />
          <QuickActionCard
            title="Campus Map"
            description="Interactive map of lost & found spots"
            to="/campus-map"
            icon={MapPinned}
            color="text-teal-600"
            bg="bg-gradient-to-br from-teal-500/10 to-teal-500/5 dark:from-teal-500/20 dark:to-teal-500/10 backdrop-blur-md"
          />
        </div>
      </div>

      {/* ── RECENT ACTIVITY & AI MATCHES ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-xs)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Recent Activity</h2>
            </div>
            <Link to="/lost-items" className="text-xs font-semibold text-[var(--primary)] hover:underline">
              View Catalog
            </Link>
          </div>

          <Timeline items={recentActivity} />
        </div>

        {/* AI Smart Matches */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-xs)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-[var(--text)]">
                AI Matches ({matches.length})
              </h2>
            </div>
            <Link to="/matches" className="text-xs font-semibold text-[var(--primary)] hover:underline">
              All Matches
            </Link>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              title="No matches found yet"
              description="AI matching will appear when compatible items are reported."
              icon={Sparkles}
            />
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 3).map((match) => (
                <div
                  key={match._id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3 transition hover:border-blue-300 dark:hover:border-blue-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--primary)] flex items-center gap-1">
                      <Sparkles size={13} /> {match.matchPercentage}% Confidence
                    </span>
                    <Badge tone={match.matchStatus === 'Rejected' ? 'danger' : match.matchStatus === 'Confirmed' || match.matchStatus === 'CONFIRMED' ? 'success' : 'warning'}>
                      {match.matchStatus}
                    </Badge>
                  </div>

                  <p className="text-xs text-[var(--text)] font-semibold">
                    {match.lostItemId?.itemName || 'Lost Item'} ↔ {match.foundItemId?.itemName || 'Found Item'}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <Link to={`/matches/${match._id}`}>
                      <Button size="sm" variant="primary">
                        Review Match
                      </Button>
                    </Link>
                    {match.chatId && (
                      <Link to={`/messages/${typeof match.chatId === 'string' ? match.chatId : match.chatId._id}`}>
                        <Button size="sm" variant="secondary">
                          Go to Messages
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
