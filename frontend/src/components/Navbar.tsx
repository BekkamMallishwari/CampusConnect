import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Command,
  Gift,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  PackageSearch,
  Search,
  Shield,
  Sun,
  UserCircle,
  X,
  MapPin,
  Crosshair,
  ExternalLink,
  Loader2,
  Navigation,
  CreditCard,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { notificationsApi, chatsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AvatarBadge } from './portal';
import CampusBrandMark from './CampusBrandMark';
import { useUserLocation } from '../hooks/useUserLocation';
import { getSocket } from '../lib/socket';

type NavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const locationPopoverRef = useRef<HTMLDivElement>(null);
  const searchModalInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const { coordinates, status: geoStatus, errorMessage: geoError, locationInfo, requestLocation } = useUserLocation();

  // Initial & Periodic fetch for notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }
    try {
      const res = await notificationsApi.getAll();
      const notifs = res.data.notifications || [];
      setUnreadNotificationCount(
        typeof res.data.unreadCount === 'number'
          ? res.data.unreadCount
          : notifs.filter((n) => !n.isRead).length
      );
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [user]);

  // Initial & Periodic fetch for unread messages
  const fetchUnreadMessages = useCallback(async () => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }
    try {
      const res = await chatsApi.getAll();
      const chats = res.data.chats || [];
      const totalUnread = chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
      setUnreadMessageCount(totalUnread);
    } catch {
      setUnreadMessageCount(0);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadMessages();
    const interval = window.setInterval(() => {
      fetchNotifications();
      fetchUnreadMessages();
    }, 20000);
    return () => window.clearInterval(interval);
  }, [fetchNotifications, fetchUnreadMessages]);

  // Real-time Socket.IO synchronization for notifications and messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleNewNotification = () => {
      setUnreadNotificationCount((prev) => prev + 1);
    };

    const handleRefresh = () => {
      fetchNotifications();
      fetchUnreadMessages();
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:new-message', handleRefresh);
    socket.on('chat:message', handleRefresh);
    socket.on('message:new', handleRefresh);
    socket.on('chat:read', handleRefresh);
    socket.on('chat:updated', handleRefresh);
    socket.on('match:new', handleRefresh);
    socket.on('match:updated', handleRefresh);
    socket.on('match:accepted', handleRefresh);
    socket.on('reward:offered', handleRefresh);
    socket.on('reward:accepted', handleRefresh);
    socket.on('reward:updated', handleRefresh);
    socket.on('payment:success', handleRefresh);
    socket.on('payment:failed', handleRefresh);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:new-message', handleRefresh);
      socket.off('chat:message', handleRefresh);
      socket.off('message:new', handleRefresh);
      socket.off('chat:read', handleRefresh);
      socket.off('chat:updated', handleRefresh);
      socket.off('match:new', handleRefresh);
      socket.off('match:updated', handleRefresh);
      socket.off('match:accepted', handleRefresh);
      socket.off('reward:offered', handleRefresh);
      socket.off('reward:accepted', handleRefresh);
      socket.off('reward:updated', handleRefresh);
      socket.off('payment:success', handleRefresh);
      socket.off('payment:failed', handleRefresh);
    };
  }, [user, fetchNotifications, fetchUnreadMessages]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setLocationPopoverOpen(false);
    setMobileMenuOpen(false);
    setSearchModalOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (locationPopoverRef.current && !locationPopoverRef.current.contains(event.target as Node)) {
        setLocationPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchModalOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchModalOpen(false);
        setLocationPopoverOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchModalOpen) {
      window.setTimeout(() => searchModalInputRef.current?.focus(), 50);
    }
  }, [searchModalOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      window.setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    }
  }, [mobileMenuOpen]);

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Campus Map', path: '/campus-map', icon: MapPin },
    { name: 'Lost Items', path: '/lost-items', icon: Search },
    { name: 'Found Items', path: '/found-items', icon: PackageSearch },
    { name: 'Rewards', path: '/rewards', icon: Gift },
    { name: 'Messages', path: '/messages', icon: MessageCircle, badge: unreadMessageCount },
    { name: 'Payments', path: '/payments', icon: CreditCard },
  ];

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setSearchModalOpen(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-2 z-50 w-full max-w-[1760px] mx-auto px-2 sm:px-4 lg:px-6 my-1.5">
        <div
          className={`flex h-[56px] sm:h-[60px] w-full items-center justify-between gap-1.5 xl:gap-2 2xl:gap-3 rounded-full border transition-all duration-200 px-3 sm:px-4 lg:px-4.5 xl:px-5 ${
            scrolled
              ? 'border-[rgba(15,23,42,0.10)] bg-[rgba(255,255,255,0.96)] shadow-md dark:border-slate-800 dark:bg-slate-900/95'
              : 'border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.96)] shadow-xs dark:border-slate-800/80 dark:bg-slate-900'
          }`}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* 1. LOGO */}
          <div className="flex items-center shrink-0">
            <Link to="/dashboard" className="flex items-center">
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.18 }}>
                <CampusBrandMark compact />
              </motion.div>
            </Link>
          </div>

          {/* 2. NAVIGATION LINKS */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 2xl:gap-1.5 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `inline-flex h-8 items-center gap-1.5 rounded-full px-2 xl:px-2.5 2xl:px-3 text-[11px] xl:text-[11.5px] 2xl:text-xs font-semibold transition-all duration-150 whitespace-nowrap focus:outline-none ${
                      isActive
                        ? 'bg-slate-100/90 text-slate-900 font-bold dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon size={13.5} className="shrink-0" />
                  <span>{item.name}</span>
                  {!!item.badge && item.badge > 0 ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white leading-none shadow-xs">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>

          {/* 3. RIGHT CONTROLS: [Search] [Location] [Theme] [Security] [Notifications] [Avatar] */}
          <div className="flex items-center gap-1 xl:gap-1.5 2xl:gap-2 shrink-0">
            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden lg:flex h-8 w-[110px] xl:w-[130px] 2xl:w-[150px] items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100/70 px-2.5 transition-all focus-within:w-[160px] xl:focus-within:w-[185px] focus-within:border-purple-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-800/50 dark:focus-within:bg-slate-800"
            >
              <button
                type="submit"
                className="flex items-center justify-center text-slate-400 hover:text-slate-700 transition mr-1.5 shrink-0 dark:hover:text-slate-200"
                aria-label="Search"
              >
                <Search size={13} />
              </button>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[11px] font-medium text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="inline-flex shrink-0 items-center rounded border border-slate-200 bg-white px-1 py-0.2 text-[9px] font-bold text-slate-400 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300"
                title="Open search modal (Ctrl+K or ⌘K)"
              >
                <Command size={8} className="mr-0.5" />
                K
              </button>
            </form>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition lg:hidden dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              aria-label="Open search"
            >
              <Search size={14} />
            </button>

            {/* Location Pill */}
            <div className="relative shrink-0" ref={locationPopoverRef}>
              <button
                type="button"
                onClick={() => {
                  setLocationPopoverOpen((open) => !open);
                  if (geoStatus === 'idle' || geoStatus === 'denied' || geoStatus === 'unavailable') {
                    requestLocation().catch(() => {});
                  }
                }}
                className={`relative inline-flex h-8 items-center gap-1.5 rounded-full border transition px-2.5 text-[11px] font-semibold max-w-[120px] xl:max-w-[140px] 2xl:max-w-[160px] ${
                  geoStatus === 'granted'
                    ? 'border-emerald-300/90 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100/90 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : geoStatus === 'requesting'
                    ? 'border-indigo-200 bg-indigo-50/80 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white'
                }`}
                aria-label="Campus Location"
                title={locationInfo ? `Live Location: ${locationInfo.name}` : 'Access Current Location'}
              >
                {geoStatus === 'requesting' ? (
                  <Loader2 size={13} className="animate-spin text-emerald-600 shrink-0" />
                ) : (
                  <MapPin size={13} className={geoStatus === 'granted' ? 'text-emerald-600 dark:text-emerald-400 shrink-0' : 'text-slate-500 dark:text-slate-400 shrink-0'} />
                )}
                <span className="truncate text-[11px]">
                  {geoStatus === 'granted' && locationInfo ? locationInfo.name : 'Location'}
                </span>
                <ChevronDown size={11} className="text-emerald-600/80 dark:text-emerald-400/80 shrink-0" />
              </button>

              <AnimatePresence>
                {locationPopoverOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
                          <Navigation size={14} />
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Your Live Location</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          geoStatus === 'granted'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : geoStatus === 'requesting'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {geoStatus === 'granted' ? 'Active' : geoStatus === 'requesting' ? 'Locating...' : 'Permission Needed'}
                      </span>
                    </div>

                    <div className="py-3 space-y-2.5">
                      {geoStatus === 'granted' && coordinates ? (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50 space-y-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              Nearest Campus Landmark
                            </p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                              {locationInfo?.name || 'On Campus'}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                            <div>
                              <span className="text-slate-400">Lat: </span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{coordinates.lat.toFixed(5)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Lng: </span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{coordinates.lng.toFixed(5)}</span>
                            </div>
                            {coordinates.accuracy && (
                              <div className="col-span-2 text-slate-400">
                                Accuracy: <span className="font-semibold text-slate-600 dark:text-slate-300">±{coordinates.accuracy} meters</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : geoStatus === 'requesting' ? (
                        <div className="flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300">
                          <Loader2 size={16} className="animate-spin shrink-0" />
                          <span>Requesting browser location permission...</span>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 space-y-1">
                          <p className="font-bold">Location Permission Required</p>
                          <p className="text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-300/80">
                            {geoError || 'Enable browser location permission to automatically detect your campus spot for items & meetups.'}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => requestLocation().catch(() => {})}
                          disabled={geoStatus === 'requesting'}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <Crosshair size={13} className={geoStatus === 'requesting' ? 'animate-spin' : ''} />
                          <span>{geoStatus === 'granted' ? 'Refresh' : 'Allow Access'}</span>
                        </button>
                        <Link
                          to="/campus-map"
                          onClick={() => setLocationPopoverOpen(false)}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
                        >
                          <span>Campus Map</span>
                          <ExternalLink size={11} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Security / Admin Icon Button */}
            <Link
              to="/admin"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              aria-label="Security & Admin"
              title="Security & Admin"
            >
              <Shield size={14} />
            </Link>

            {/* Notifications Button */}
            <Link
              to="/notifications"
              className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={14} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[8.5px] font-black text-white ring-2 ring-white dark:ring-slate-900 shadow-xs">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </Link>

            {/* Compact Profile Avatar Button (No user text in navbar bar) */}
            {user ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white p-0.5 transition hover:ring-2 hover:ring-purple-500/30 focus:outline-none dark:border-slate-800 dark:bg-slate-800"
                  aria-expanded={dropdownOpen}
                  aria-label="User account menu"
                  title={`Account: ${user.name}`}
                >
                  <div className="relative flex items-center justify-center">
                    <AvatarBadge name={user.name} avatar={user.avatar} size="xs" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-white bg-emerald-500 dark:border-slate-900" />
                  </div>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-10 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="border-b border-slate-100 px-3.5 py-3 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <AvatarBadge name={user.name} avatar={user.avatar} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
                            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-1 space-y-0.5">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <UserCircle size={15} className="text-purple-600 dark:text-purple-400" />
                          My Profile
                        </Link>
                        <Link
                          to="/my-reports"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <FileText size={15} className="text-blue-500" />
                          My Item Reports
                        </Link>
                        <Link
                          to="/rewards"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Gift size={15} className="text-indigo-600 dark:text-indigo-400" />
                          Rewards & Points
                        </Link>
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Shield size={15} className="text-amber-500" />
                          Security & Admin
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        >
                          <LogOut size={15} />
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-purple-600 px-3.5 text-xs font-semibold text-white transition hover:bg-purple-700 shadow-sm"
                title="Log In"
              >
                <LogIn size={13} />
                <span>Log In</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Open navigation menu"
            >
              <Menu size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="absolute left-4 right-4 top-16 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <CampusBrandMark />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit}>
                  <label className="sr-only" htmlFor="mobile-search">
                    Search
                  </label>
                  <div className="relative">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="mobile-search"
                      ref={mobileSearchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search anything..."
                      className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </form>

                {/* Mobile Live Location Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300">
                        <MapPin size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Campus Geolocation
                        </p>
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                          {geoStatus === 'granted' && locationInfo ? locationInfo.name : geoStatus === 'requesting' ? 'Locating device...' : 'Detect live position'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => requestLocation().catch(() => {})}
                      disabled={geoStatus === 'requesting'}
                      className="shrink-0 rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-750 dark:text-slate-200"
                    >
                      {geoStatus === 'granted' ? 'Refresh' : 'Enable'}
                    </button>
                  </div>
                </div>

                <nav className="grid gap-1.5 sm:grid-cols-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                            <Icon size={14} />
                          </span>
                          <span>{item.name}</span>
                        </div>
                        {!!item.badge && item.badge > 0 && (
                          <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-black text-white">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Shield size={15} />
                    Security
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="relative inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Bell size={15} />
                    <span>Notifications</span>
                    {unreadNotificationCount > 0 && (
                      <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[9px] font-black text-white shadow-xs">
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </Link>
                </div>

                {user ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarBadge name={user.name} avatar={user.avatar} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="ml-2 inline-flex h-8 items-center gap-1 rounded-lg bg-rose-50 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                    >
                      <LogOut size={14} />
                      Log Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white"
                  >
                    <LogIn size={15} />
                    Log In
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Search Modal Overlay (⌘K / Ctrl+K) */}
      <AnimatePresence>
        {searchModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-md"
          >
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => setSearchModalOpen(false)}
              aria-label="Close search overlay"
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: -12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: -12 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="relative mx-auto mt-20 w-[min(92vw,40rem)] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
                <Search size={18} className="text-slate-400" />
                <input
                  ref={searchModalInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items, matches, messages, rewards..."
                  className="h-11 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </form>
              <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                Press <span className="font-bold text-slate-700 dark:text-slate-200">Esc</span> to close or <span className="font-bold text-slate-700 dark:text-slate-200">⌘K / Ctrl K</span> to reopen.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
