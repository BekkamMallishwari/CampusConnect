import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Sparkles, LogOut, ShieldAlert, User, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../lib/api';

type NavbarProps = {
  toggleSidebar?: () => void;
};

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await notificationsApi.getAll();
        setUnreadCount(res.data.unreadCount);
      } catch (err) {
        console.error('Failed to load notifications count', err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="mr-1 rounded-full p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
            >
              <Menu size={20} />
            </button>
          )}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20">
              <Sparkles size={16} />
            </div>
            <span>Campus<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Connect</span></span>
            <span className="hidden rounded-full bg-cyan-950/80 px-2 py-0.5 text-[10px] font-medium tracking-wider text-cyan-300 border border-cyan-800/30 sm:inline-block uppercase">Lost & Found</span>
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <Link
              to="/notifications"
              className="relative rounded-full border border-slate-800 bg-slate-900/50 p-2 text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 ring-2 ring-slate-950">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/30 p-1 pr-3 outline-none transition hover:border-slate-700"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-950 text-xs font-semibold text-cyan-400 uppercase">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="hidden text-xs font-medium text-slate-200 sm:block">{user.name.split(' ')[0]}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-52 origin-top-right rounded-2xl border border-slate-850 bg-slate-900 p-1.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-left text-sm text-cyan-300 transition hover:bg-slate-950 hover:text-cyan-200"
                    >
                      <ShieldAlert size={15} />
                      Admin Control Panel
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-left text-sm text-slate-350 transition hover:bg-slate-950 hover:text-white"
                  >
                    <User size={15} />
                    My Profile Settings
                  </Link>
                  <hr className="my-1 border-slate-850" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-left text-sm text-rose-450 transition hover:bg-rose-950/20 hover:text-rose-400"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-full border border-slate-800 px-4 py-1.5 text-sm font-medium text-slate-300 transition hover:border-cyan-500/50 hover:text-white">
              Log In
            </Link>
            <Link to="/signup" className="rounded-full bg-cyan-500 px-4 py-1.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
