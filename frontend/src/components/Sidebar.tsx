import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Bell,
  MessageSquare,
  Gift,
  User,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Report Lost Item', path: '/lost-items/new', icon: PlusCircle },
    { name: 'Report Found Item', path: '/found-items/new', icon: PlusCircle },
    { name: 'My Reports', path: '/my-posts', icon: FileText },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Messages', path: '/chats', icon: MessageSquare },
    { name: 'Rewards', path: '/rewards', icon: Gift },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-950 p-4 border-r border-slate-900 lg:w-64">
      <div className="flex-1 space-y-1.5 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-255 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-400 border-l-4 border-cyan-500 pl-3'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white border-l-4 border-transparent'
                }`
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );
        })}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-255 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-400 border-l-4 border-purple-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-purple-300 border-l-4 border-transparent'
              }`
            }
          >
            <Shield size={18} />
            Admin Dashboard
          </NavLink>
        )}
      </div>

      <div className="border-t border-slate-900 py-4">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold text-rose-450 transition hover:bg-rose-950/20 hover:text-rose-400 border-l-4 border-transparent"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden h-[calc(100vh-73px)] w-64 shrink-0 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-slate-950 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-900 px-6 py-4.5">
            <span className="text-lg font-bold text-white">Menu Navigation</span>
            <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      </aside>
    </>
  );
}
