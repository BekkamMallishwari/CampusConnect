import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  Bell,

  ChevronDown,
  LogOut,
  Menu,
  Shield,
  UserCircle,
  Search,
  Settings,
  PackageSearch,
  MessageCircle,
  Trophy,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { notificationsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { AvatarBadge } from './portal';
import CampusBrandMark from './CampusBrandMark';
import { ThemeToggle } from './ui/ThemeToggle';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('campusconnect-theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(getInitialTheme);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!user) {
        setUnreadCount(0);
        return;
      }
      try {
        const res = await notificationsApi.getAll();
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    fetchUnread();
    const interval = window.setInterval(fetchUnread, 30000);
    return () => window.clearInterval(interval);
  }, [user, location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    localStorage.setItem('campusconnect-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Lost Items', path: '/lost-items', icon: Search },
    { name: 'Found Items', path: '/found-items', icon: PackageSearch },
    { name: 'Messages', path: '/messages', icon: MessageCircle },
    { name: 'Rewards', path: '/rewards', icon: Trophy },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition hover:bg-[var(--surface)] xl:hidden"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>

            <Link to="/dashboard" className="flex items-center gap-2 rounded-lg py-1">
              <CampusBrandMark compact />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} />
                      <span>{item.name}</span>
                      {!!item.badge && item.badge > 0 && (
                        <span
                          className={`ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold ${
                            isActive ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                          }`}
                        >
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden max-w-xs flex-1 lg:block xl:max-w-xs">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="h-8.5 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-xs text-[var(--text)] placeholder:text-[var(--placeholder)] transition outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode((prev) => !prev)} />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 pr-2 transition hover:bg-[var(--surface)]"
                aria-expanded={dropdownOpen}
                aria-label="User account menu"
              >
                <AvatarBadge name={user?.name} avatar={user?.avatar} size="sm" />
                <span className="hidden max-w-[100px] truncate text-xs font-semibold text-[var(--text)] sm:block">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown size={14} className="text-[var(--secondary)]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-11 z-50 w-60 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1.5 shadow-lg">
                  <div className="border-b border-[var(--border)] px-3 py-2">
                    <p className="truncate text-xs font-bold text-[var(--text)]">{user?.name}</p>
                    <p className="truncate text-[11px] text-[var(--secondary)]">{user?.email}</p>
                  </div>

                  <div className="space-y-0.5 py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition"
                    >
                      <UserCircle size={15} className="text-[var(--primary)]" />
                      My Profile
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition"
                    >
                      <Settings size={15} className="text-[var(--secondary)]" />
                      Settings
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 transition"
                      >
                        <Shield size={15} />
                        Admin Console
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex xl:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative flex w-full max-w-xs flex-col justify-between border-r border-[var(--border)] bg-[var(--card)] p-4 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <CampusBrandMark compact />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1 text-[var(--secondary)] hover:bg-[var(--surface)]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary)]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-xs text-[var(--text)] placeholder:text-[var(--placeholder)] outline-none"
                  />
                </div>
              </form>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-[var(--primary)] text-white'
                            : 'text-[var(--text)] hover:bg-[var(--surface)]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} />
                        <span>{item.name}</span>
                      </div>
                      {!!item.badge && item.badge > 0 && (
                        <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-[var(--border)] pt-3">
              <div className="mb-3 flex items-center gap-3 px-1">
                <AvatarBadge name={user?.name} avatar={user?.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[var(--text)]">{user?.name}</p>
                  <p className="truncate text-[11px] text-[var(--secondary)]">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
