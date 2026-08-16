import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Bot,
  ChevronRight,
  FilePlus2,
  MapPinned,
  MessageCircle,
  MessageSquare,
  Megaphone,
  PackageSearch,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  foundItemsApi,
  lostItemsApi,
  matchesApi,
  notificationsApi,
  chatsApi,
  communityApi,
  type FoundItemType,
  type LostItemType,
  type MatchType,
  type ChatType,
  type PostType,
} from '../lib/api';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import { DashboardBackdrop, HeroImageSlideshow, AnimatedCount } from '../components/dashboard/DashboardMotion';

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
const getFirstName = (name?: string) => name?.trim().split(/\s+/)[0] || 'there';

const isResolvedMatch = (match: MatchType) =>
  Boolean(
    match.completed ||
      match.rewardPaid ||
      match.paymentStatus === 'PAID' ||
      match.matchStatus === 'Completed' ||
      match.matchStatus === 'HANDOVER_COMPLETED',
  );

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────────────────────────────────────── */
type StatCardProps = {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  iconBg: string;
  suffix?: string;
};

function StatCard({ label, value, detail, icon: Icon, iconBg, suffix }: StatCardProps) {
  return (
    <div className="glass-stat-card flex flex-col justify-between p-4 sm:p-4.5">
      <div className="flex items-start justify-between">
        <div
          className="action-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] shadow-sm"
          style={{ background: iconBg }}
        >
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-1">
          <span className="text-[1.85rem] font-black leading-none tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
            <AnimatedCount value={value} duration={850} />
          </span>
          {suffix && (
            <span className="text-[1rem] font-bold" style={{ color: 'var(--dash-accent)' }}>
              {suffix}
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] font-bold leading-tight" style={{ color: 'var(--dash-text-primary)' }}>
          {label}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Quick Action Card
───────────────────────────────────────────────────────────────────────────── */
type ActionCardProps = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  badge?: string;
};

function ActionCard({ to, label, description, icon: Icon, iconBg, badge }: ActionCardProps) {
  return (
    <Link to={to} className="group block no-underline">
      <div className="glass-action-card flex items-center gap-3 p-3">
        <div
          className="action-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] shadow-sm"
          style={{ background: iconBg }}
        >
          <Icon size={16} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold leading-tight" style={{ color: 'var(--dash-text-primary)' }}>
              {label}
            </span>
            {badge && (
              <span className="rounded-full px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
            {description}
          </p>
        </div>
        <ChevronRight size={14} className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" style={{ color: 'var(--dash-text-muted)' }} />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Activity Item
───────────────────────────────────────────────────────────────────────────── */
type ActivityItemProps = {
  name: string;
  location: string;
  type: 'lost' | 'found';
  status: string;
  date: string;
  reporter?: string;
  icon: LucideIcon;
  iconBg: string;
};

function ActivityItem({ name, location, type, status, date, reporter, icon: Icon, iconBg }: ActivityItemProps) {
  const badgeClass =
    type === 'found'
      ? 'activity-badge activity-badge-found'
      : status === 'Matched'
        ? 'activity-badge activity-badge-matched'
        : 'activity-badge activity-badge-lost';

  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <div
        className="action-icon mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] shadow-xs"
        style={{ background: iconBg }}
      >
        <Icon size={14} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <p className="truncate text-[12.5px] font-bold" style={{ color: 'var(--dash-text-primary)' }}>
            {name}
          </p>
          <span className={badgeClass}>
            {type === 'found' ? 'Found' : status === 'Matched' ? 'Matched' : 'Lost'}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
          {location}
        </p>
        <p className="mt-0.5 text-[10.5px]" style={{ color: 'var(--dash-text-muted)' }}>
          {reporter ? `by ${reporter} · ` : ''}{date}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Message Item
───────────────────────────────────────────────────────────────────────────── */
function MessageItem({ chat, currentUserId }: { chat: ChatType; currentUserId: string }) {
  const otherParticipant = chat.participants.find((p) => p.id !== currentUserId && (p as unknown as { _id?: string })._id !== currentUserId) ?? chat.participants[0];
  const displayName = otherParticipant?.name ?? 'Unknown';
  const initials = getInitials(displayName);
  const preview = chat.lastMessage?.text ?? (chat.itemPreview?.itemName ? `Re: ${chat.itemPreview.itemName}` : 'New conversation');
  const time = chat.updatedAt ? formatRelativeTime(chat.updatedAt) : '';
  const unread = chat.unreadCount ?? 0;

  return (
    <Link to={`/messages/${chat._id}`} className="group block no-underline">
      <div className="glass-action-card flex items-center gap-2.5 p-2.5">
        <div className="dash-avatar-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs">
          {otherParticipant?.avatar ? (
            <img src={otherParticipant.avatar} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <p className="truncate text-[12.5px] font-bold" style={{ color: 'var(--dash-text-primary)' }}>
              {displayName}
            </p>
            <span className="shrink-0 text-[10.5px]" style={{ color: 'var(--dash-text-muted)' }}>
              {time}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-1.5">
            <p className="truncate text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
              {preview}
            </p>
            {unread > 0 && <span className="unread-badge shrink-0">{unread}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Match Visualization
───────────────────────────────────────────────────────────────────────────── */
function MatchVisualization({ match }: { match: MatchType }) {
  const lostUser = match.lostUserId;
  const foundUser = match.foundUserId;
  const pct = Math.round(match.matchPercentage ?? 85);
  const chatId = typeof match.chatId === 'string' ? match.chatId : match.chatId?._id;

  const lostUserName = lostUser?.name?.split(' ')[0] || 'Owner';
  const foundUserName = foundUser?.name?.split(' ')[0] || 'Finder';

  return (
    <div className="flex flex-col gap-3.5">
      {/* Verified Badge Header */}
      <div className="flex items-center justify-center">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-black uppercase tracking-wider text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <ShieldCheck size={13} />
          VERIFIED
        </span>
      </div>

      {/* Circular Glowing Match Indicator & User Pair */}
      <div className="flex items-center justify-between px-2">
        {/* Lost user */}
        <div className="flex flex-col items-center gap-1">
          <div className="dash-avatar-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white shadow-md">
            {lostUser?.avatar ? (
              <img src={lostUser.avatar} alt={lostUserName} className="h-11 w-11 rounded-full object-cover" />
            ) : (
              getInitials(lostUser?.name ?? 'O')
            )}
          </div>
          <span className="max-w-[70px] truncate text-center text-[11px] font-bold" style={{ color: 'var(--dash-text-primary)' }}>
            {lostUserName}
          </span>
        </div>

        {/* Center Circular Ring */}
        <div className="flex flex-col items-center gap-1">
          <div className="match-ring flex h-16 w-16 items-center justify-center">
            <div className="match-ring-inner flex h-[calc(100%-6px)] w-[calc(100%-6px)] flex-col items-center justify-center bg-white dark:bg-slate-900">
              <span className="text-[17px] font-black leading-none" style={{ color: 'var(--dash-accent)' }}>
                {pct}%
              </span>
              <span className="text-[8.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>
                MATCH
              </span>
            </div>
          </div>
        </div>

        {/* Found user */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
          >
            {foundUser?.avatar ? (
              <img src={foundUser.avatar} alt={foundUserName} className="h-11 w-11 rounded-full object-cover" />
            ) : (
              getInitials(foundUser?.name ?? 'F')
            )}
          </div>
          <span className="max-w-[70px] truncate text-center text-[11px] font-bold" style={{ color: 'var(--dash-text-primary)' }}>
            {foundUserName}
          </span>
        </div>
      </div>

      {/* Item pair info */}
      <div
        className="rounded-[14px] p-2.5 text-center shadow-xs"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)' }}
      >
        <p className="text-[12.5px] font-bold" style={{ color: 'var(--dash-text-primary)' }}>
          {match.lostItemId?.itemName ?? 'Item'}{' '}
          <span style={{ color: 'var(--dash-accent)' }}>↔</span>{' '}
          {match.foundItemId?.itemName ?? 'Item'}
        </p>
        <p className="mt-0.5 text-[10.5px]" style={{ color: 'var(--dash-text-muted)' }}>
          {formatRelativeTime(match.createdAt)}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Link to={`/matches/${match._id}`} className="dash-btn-primary flex-1 text-center text-[12px] py-2">
          Review Match
        </Link>
        <Link
          to={chatId ? `/messages/${chatId}` : '/messages'}
          className="dash-btn-secondary flex-1 text-center text-[12px] py-2"
        >
          Go to Messages
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Announcement Item
───────────────────────────────────────────────────────────────────────────── */
function AnnouncementItem({ post }: { post: PostType }) {
  return (
    <Link to="/community" className="block no-underline">
      <div className="glass-action-card p-2.5">
        <div className="flex items-start gap-2">
          <div
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]"
            style={{ background: 'rgba(99,102,241,0.12)' }}
          >
            <Megaphone size={12} style={{ color: 'var(--dash-accent)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[11.5px] font-medium leading-snug" style={{ color: 'var(--dash-text-primary)' }}>
              {post.content}
            </p>
            <p className="mt-1 text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>
              {post.author.name} · {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const [lostItems, setLostItems] = useState<LostItemType[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItemType[]>([]);
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [announcements, setAnnouncements] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [lostRes, foundRes, matchRes, notifRes, chatRes, postRes] = await Promise.all([
          lostItemsApi.getAll().catch(() => ({ data: { items: [] } })),
          foundItemsApi.getAll().catch(() => ({ data: { items: [] } })),
          matchesApi.getAll().catch(() => ({ data: { matches: [] } })),
          notificationsApi.getAll().catch(() => ({ data: { notifications: [], unreadCount: 0 } })),
          chatsApi.getAll().catch(() => ({ data: { chats: [] } })),
          communityApi.getPosts({ category: 'Announcement', limit: 5 }).catch(() => ({ data: { posts: [] } })),
        ]);

        setLostItems(lostRes.data.items || []);
        setFoundItems(foundRes.data.items || []);
        setMatches(matchRes.data.matches || []);
        setNotificationUnreadCount(notifRes.data.unreadCount || 0);
        setChats(chatRes.data.chats || []);
        setAnnouncements(postRes.data.posts || []);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [location.state?.refreshLostFound]);

  /* ── Derived stats ────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalReports = lostItems.length + foundItems.length;
    const resolvedMatches = matches.filter(isResolvedMatch).length;
    const activeMatches = matches.filter((m) => !isResolvedMatch(m)).length;
    const pendingVerification = Math.max(totalReports - matches.length, 0);
    const impactScore = totalReports > 0 ? Math.round((resolvedMatches / totalReports) * 100) : 0;

    return {
      totalReports,
      lostCount: lostItems.length,
      foundCount: foundItems.length,
      resolvedMatches,
      impactScore,
      activeMatches,
      pendingVerification,
      unreadNotifications: notificationUnreadCount,
    };
  }, [foundItems.length, lostItems.length, matches, notificationUnreadCount]);

  /* ── Recent Activity: merge + sort ───────────────────────────── */
  const recentActivity = useMemo(() => {
    type ActivityItem = {
      id: string;
      name: string;
      location: string;
      type: 'lost' | 'found';
      status: string;
      date: string;
      reporter?: string;
    };

    const lost: ActivityItem[] = lostItems.slice(0, 10).map((item) => ({
      id: item._id,
      name: item.itemName,
      location: item.lostLocation,
      type: 'lost' as const,
      status: item.status,
      date: item.createdAt,
      reporter: item.postedBy?.name,
    }));

    const found: ActivityItem[] = foundItems.slice(0, 10).map((item) => ({
      id: item._id,
      name: item.itemName,
      location: item.foundLocation,
      type: 'found' as const,
      status: item.status,
      date: item.createdAt,
      reporter: item.postedBy?.name,
    }));

    return [...lost, ...found]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [lostItems, foundItems]);

  /* ── Top AI match ─────────────────────────────────────────────── */
  const topMatch = useMemo(
    () =>
      matches
        .filter((m) => !isResolvedMatch(m))
        .sort((a, b) => (b.matchPercentage ?? 0) - (a.matchPercentage ?? 0))[0] ?? null,
    [matches],
  );

  /* ── Recent chats (top 4) ─────────────────────────────────────── */
  const recentChats = useMemo(
    () =>
      [...chats]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [chats],
  );

  const displayName = getFirstName(user?.name);

  /* ── Quick Actions (Exactly ONE Campus Map) ─────────────────────── */
  const quickActions: ActionCardProps[] = [
    {
      to: '/lost-items/new',
      label: 'Report Lost Item',
      description: 'Submit a new lost item report',
      icon: FilePlus2,
      iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    {
      to: '/found-items/new',
      label: 'Report Found Item',
      description: 'Tell us what you found on campus',
      icon: PackageSearch,
      iconBg: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    },
    {
      to: '/matches',
      label: 'AI Matches',
      description: 'Review AI-suggested item pairs',
      icon: Bot,
      iconBg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      badge: stats.activeMatches > 0 ? String(stats.activeMatches) : undefined,
    },
    {
      to: '/messages',
      label: 'Messages',
      description: 'Continue your conversations',
      icon: MessageCircle,
      iconBg: 'linear-gradient(135deg, #10b981, #059669)',
      badge: notificationUnreadCount > 0 ? String(notificationUnreadCount) : undefined,
    },
    {
      to: '/campus-map',
      label: 'Campus Map',
      description: 'Navigate the live campus layout',
      icon: MapPinned,
      iconBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    },
  ];

  /* ── Stat card definitions ────────────────────────────────────── */
  const statCards: StatCardProps[] = [
    {
      label: 'Total Reports',
      value: stats.totalReports,
      detail: 'Lost & found combined',
      icon: FilePlus2,
      iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    {
      label: 'Lost Items',
      value: stats.lostCount,
      detail: 'Active missing reports',
      icon: Search,
      iconBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    },
    {
      label: 'Found Items',
      value: stats.foundCount,
      detail: 'Items waiting for owners',
      icon: PackageSearch,
      iconBg: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    },
    {
      label: 'Resolved Matches',
      value: stats.resolvedMatches,
      detail: 'Successful reunions',
      icon: ShieldCheck,
      iconBg: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      label: 'Impact Score',
      value: stats.impactScore,
      detail: 'Resolution percentage',
      icon: TrendingUp,
      iconBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
      suffix: '%',
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <PageTransition>
      {/* ── Ambient background ────────────────────────────────────── */}
      <DashboardBackdrop />

      {/* ── Page wrapper ──────────────────────────────────────────── */}
      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-4.5 pb-8">

        {/* ════════════════════════════════════════════════════════════
            1. COMPACT GLASS HERO SECTION (Height ~220–280px desktop)
        ════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[22px] min-h-[220px] lg:min-h-[250px] lg:h-[260px]"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.85))',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 20px 50px rgba(15,23,42,0.25)',
          }}
        >
          {/* Realistic Campus Image Slideshow with smooth crossfade & overlay */}
          <HeroImageSlideshow />

          {/* Hero Content: Wide horizontal layout */}
          <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-between p-5 sm:p-6 lg:min-h-[260px] lg:flex-row lg:items-center lg:gap-8">
            {/* Left Column: Welcome & CTAs */}
            <div className="flex flex-1 flex-col justify-center">
              {/* Badge */}
              <div
                className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/90 shadow-sm"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}
              >
                <Sparkles size={11} className="text-cyan-300" />
                CampusConnect · Lost &amp; Found Intelligence
              </div>

              {/* Headline */}
              <h1 className="text-[1.85rem] font-black leading-tight tracking-tight text-white sm:text-[2.2rem]">
                Welcome back,{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #f5d0fe, #a78bfa, #67e8f9)' }}
                >
                  {displayName}
                </span>
              </h1>

              <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-white/80">
                Track live lost and found activity, move verified matches faster, and keep every campus update in one polished workspace.
              </p>

              {/* Action Buttons */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <Link
                  to="/lost-items/new"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold text-white transition hover:-translate-y-0.5 shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                  }}
                >
                  <FilePlus2 size={15} />
                  Report Lost Item
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/found-items/new"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20 shadow-sm"
                  style={{
                    background: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <PackageSearch size={15} />
                  Report Found Item
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Compact Floating Glass Status Panel */}
            <div className="mt-4 shrink-0 lg:mt-0">
              <div
                className="flex flex-col gap-2 rounded-2xl p-3.5 shadow-lg backdrop-blur-xl sm:min-w-[230px]"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))',
                  border: '1px solid rgba(255,255,255,0.22)',
                }}
              >
                {/* Active Matches */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/40 text-indigo-200">
                      <ShieldCheck size={13} />
                    </span>
                    <span className="font-semibold text-[11.5px]">Active Matches</span>
                  </div>
                  <span className="font-black text-white text-[13.5px]">
                    <AnimatedCount value={stats.activeMatches} />
                  </span>
                </div>

                <div className="h-px bg-white/10" />

                {/* Pending Verification */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/40 text-cyan-200">
                      <FilePlus2 size={13} />
                    </span>
                    <span className="font-semibold text-[11.5px]">Pending Verification</span>
                  </div>
                  <span className="font-black text-white text-[13.5px]">
                    <AnimatedCount value={stats.pendingVerification} />
                  </span>
                </div>

                <div className="h-px bg-white/10" />

                {/* Unread Notifications */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/40 text-pink-200">
                      <Bell size={13} />
                    </span>
                    <span className="font-semibold text-[11.5px]">Unread Notifications</span>
                  </div>
                  <span className="font-black text-white text-[13.5px]">
                    <AnimatedCount value={stats.unreadNotifications} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════════════════════
            2. FIVE STATISTICS CARDS
        ════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
        >
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </motion.section>

        {/* ════════════════════════════════════════════════════════════
            3. MAIN 4-COLUMN DASHBOARD (Quick Actions, Recent Activity, AI Matches, Messages)
        ════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="dash-4col-grid"
        >

          {/* ── Column 1: Quick Actions ───────────────────────────── */}
          <div className="glass-panel p-4.5 flex flex-col justify-between">
            <div>
              <div className="dash-section-header">
                <h2 className="dash-section-title">Quick Actions</h2>
              </div>
              <div className="flex flex-col gap-2">
                {quickActions.map((action) => (
                  <ActionCard key={action.to} {...action} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Column 2: Recent Activity ─────────────────────────── */}
          <div className="glass-panel p-4.5 flex flex-col justify-between">
            <div>
              <div className="dash-section-header">
                <h2 className="dash-section-title">Recent Activity</h2>
                <Link to="/my-reports" className="dash-section-link">
                  View all <ChevronRight size={13} />
                </Link>
              </div>

              {recentActivity.length > 0 ? (
                <div className="flex flex-col divide-y divide-[rgba(148,163,184,0.12)]">
                  {recentActivity.map((item) => (
                    <ActivityItem
                      key={`${item.type}-${item.id}`}
                      name={item.name}
                      location={item.location}
                      type={item.type}
                      status={item.status}
                      date={formatRelativeTime(item.date)}
                      reporter={item.reporter}
                      icon={item.type === 'found' ? PackageSearch : Search}
                      iconBg={
                        item.type === 'found'
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #f59e0b, #ef4444)'
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="dash-empty-state">
                  <div className="dash-empty-icon">
                    <Search size={18} />
                  </div>
                  <p className="text-[12.5px] font-semibold" style={{ color: 'var(--dash-text-secondary)' }}>
                    No activity yet
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                    Reports and found items will appear here
                  </p>
                  <Link to="/lost-items/new" className="dash-btn-primary mt-1 text-[11.5px] py-1.5 px-3">
                    Report Lost Item
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Column 3: AI Matches Centerpiece ──────────────────── */}
          <div
            className="glass-panel p-4.5 flex flex-col justify-between"
            style={{
              boxShadow: '0 8px 32px rgba(31,38,135,0.08), 0 0 32px rgba(99,102,241,0.06)',
            }}
          >
            <div>
              <div className="dash-section-header">
                <div className="flex items-center gap-2">
                  <h2 className="dash-section-title">AI Matches</h2>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  >
                    {stats.activeMatches}
                  </span>
                </div>
                <Link to="/matches" className="dash-section-link">
                  View all <ChevronRight size={13} />
                </Link>
              </div>

              {topMatch ? (
                <MatchVisualization match={topMatch} />
              ) : (
                <div className="dash-empty-state">
                  <div className="dash-empty-icon" style={{ background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.25)' }}>
                    <Bot size={18} style={{ color: 'var(--dash-accent)' }} />
                  </div>
                  <p className="text-[12.5px] font-semibold" style={{ color: 'var(--dash-text-secondary)' }}>
                    No active matches
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                    Our AI will match your reports automatically
                  </p>
                  <Link to="/lost-items/new" className="dash-btn-primary mt-1 text-[11.5px] py-1.5 px-3">
                    Report an Item
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Column 4: Recent Messages + Campus Announcements ──── */}
          <div className="glass-panel flex flex-col gap-0 overflow-hidden p-0">
            {/* Recent Messages */}
            <div className="p-4.5">
              <div className="dash-section-header">
                <h2 className="dash-section-title">Recent Messages</h2>
                <Link to="/messages" className="dash-section-link">
                  View all <ChevronRight size={13} />
                </Link>
              </div>

              {recentChats.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {recentChats.map((chat) => (
                    <MessageItem key={chat._id} chat={chat} currentUserId={user?.id ?? ''} />
                  ))}
                </div>
              ) : (
                <div className="dash-empty-state py-4">
                  <div className="dash-empty-icon">
                    <MessageSquare size={18} />
                  </div>
                  <p className="text-[11.5px]" style={{ color: 'var(--dash-text-muted)' }}>
                    No messages yet
                  </p>
                  <Link to="/messages" className="dash-btn-secondary mt-1 text-[11.5px] py-1 px-3">
                    Open Messages
                  </Link>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="dash-divider mx-4.5" />

            {/* Campus Announcements (inside right column) */}
            <div className="p-4.5 pt-3.5">
              <div className="dash-section-header">
                <h2 className="dash-section-title flex items-center gap-1.5">
                  <Megaphone size={14} style={{ color: 'var(--dash-accent)' }} />
                  Campus Announcements
                </h2>
                <Link to="/community" className="dash-section-link">
                  View all <ChevronRight size={13} />
                </Link>
              </div>

              {announcements.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {announcements.slice(0, 3).map((post) => (
                    <AnnouncementItem key={post._id} post={post} />
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-[14px] p-4 text-center"
                  style={{
                    background: 'rgba(99,102,241,0.03)',
                    border: '1px dashed rgba(99,102,241,0.22)',
                  }}
                >
                  <div className="dash-empty-icon h-8 w-8 rounded-lg">
                    <Megaphone size={14} style={{ color: 'var(--dash-text-muted)' }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: 'var(--dash-text-secondary)' }}>
                      No campus announcements yet
                    </p>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed" style={{ color: 'var(--dash-text-muted)' }}>
                      When the community feed publishes announcements, they will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </PageTransition>
  );
}

