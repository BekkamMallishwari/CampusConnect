import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  User,
  Save,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Shield,
  Bell,
  Star,
  Award,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from '../components/PageTransition';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'achievements'>('profile');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      collegeName: '',
      department: '',
      year: '',
    },
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    sms: false,
  });

  useEffect(() => {
    if (!user) return;
    setValue('name', user.name || '');
    setValue('phone', user.phone || '');
    setValue('collegeName', user.collegeName || 'School of Computer Science');
    setValue('department', user.department || 'Computer Science & Engineering');
    setValue('year', user.year || '3rd Year');
    if (user.avatar) setAvatarPreview(user.avatar);
    if (user.notificationPreferences) {
      setNotificationPrefs(user.notificationPreferences);
    }
  }, [user, setValue]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('phone', data.phone);
    fd.append('collegeName', data.collegeName);
    fd.append('department', data.department);
    fd.append('year', data.year);
    fd.append('notificationPreferences', JSON.stringify(notificationPrefs));
    if (avatarFile) fd.append('avatar', avatarFile);

    try {
      const res = await authApi.updateProfile(fd);
      updateUser(res.data.user);
      toast.success('Profile settings updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-6 py-2 pb-24">
      {/* 1. Hero Profile Banner */}
      <div className="glass-hero-banner relative p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative group shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user?.name}
                  className="h-20 w-20 rounded-2xl border-2 object-cover shadow-md"
                  style={{ borderColor: 'var(--glass-border)' }}
                />
              ) : (
                <div className="dash-avatar-gradient flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700">
                <Camera size={13} />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>{user?.name}</h1>
                {user?.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-600">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-600">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>{user?.email}</p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <span className="rounded-md px-2 py-0.5" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--dash-accent)' }}>
                  {user?.department || 'Computer Science'}
                </span>
                <span className="rounded-md px-2 py-0.5" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--dash-accent)' }}>
                  {user?.year || '3rd Year'}
                </span>
                <span className="rounded-md px-2 py-0.5" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  {user?.reputation || 100} Karma Score
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="glass-panel px-4 py-2.5 text-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Reward Points</p>
              <p className="text-lg font-black" style={{ color: 'var(--dash-accent)' }}>{user?.points || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'profile', label: 'Profile Settings', icon: User },
          { id: 'security', label: 'Security & Sessions', icon: Shield },
          { id: 'preferences', label: 'Notifications', icon: Bell },
          { id: 'achievements', label: 'Reputation & Badges', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`glass-tab-pill flex items-center gap-1.5 px-4 py-2 text-xs font-bold ${
                isActive ? 'active' : ''
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile Settings */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit(onSubmit)} className="glass-panel p-6 space-y-5">
          <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Personal & Academic Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Full Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="Your full name"
                className="glass-input h-10 w-full px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Phone Number</label>
              <input
                type="text"
                {...register('phone')}
                placeholder="+91 9876543210"
                className="glass-input h-10 w-full px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>University / College</label>
              <input
                type="text"
                {...register('collegeName')}
                placeholder="Your college name"
                className="glass-input h-10 w-full px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Department</label>
              <input
                type="text"
                {...register('department')}
                placeholder="e.g. Computer Science"
                className="glass-input h-10 w-full px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Academic Year</label>
              <select
                {...register('year')}
                className="glass-input h-10 w-full px-3 text-xs font-semibold"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Faculty/Staff">Faculty / Staff</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button type="submit" disabled={loading} className="dash-btn-primary inline-flex items-center gap-2 py-2.5 px-6 text-xs font-bold shadow-md">
              <Save size={14} />
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Login Activity Log */}
      {activeTab === 'security' && (
        <div className="glass-panel p-6 space-y-5">
          <div>
            <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Recent Account Logins</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--dash-text-secondary)' }}>
              Security audit log tracking devices, IP addresses, and browsers used to access your account.
            </p>
          </div>

          <div className="space-y-3">
            {(!user?.loginHistory || user.loginHistory.length === 0) ? (
              <div className="rounded-xl p-4 text-center text-xs" style={{ background: 'var(--glass-bg)', color: 'var(--dash-text-muted)' }}>
                Current session active. New login sessions will be recorded here.
              </div>
            ) : (
              user.loginHistory.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="glass-action-card flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                      {item.device?.toLowerCase().includes('mobile') || item.os === 'iOS' || item.os === 'Android' ? (
                        <Smartphone size={18} />
                      ) : (
                        <Laptop size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{item.device}</p>
                        {item.isNewDevice && (
                          <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                            New Device
                          </span>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                        IP: {item.ip} • Browser: {item.browser}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold" style={{ color: 'var(--dash-text-primary)' }}>
                      {new Date(item.loggedInAt).toLocaleDateString()}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>
                      {new Date(item.loggedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Notification Preferences */}
      {activeTab === 'preferences' && (
        <div className="glass-panel p-6 space-y-5">
          <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Notification Alert Settings</h2>

          <div className="space-y-4">
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive email alerts for login, match detection, and claim updates.' },
              { key: 'push', label: 'Mobile Push Notifications', desc: 'Receive FCM push alerts for new messages, matches, and reward claims.' },
              { key: 'sms', label: 'SMS Alerts (Twilio)', desc: 'Receive instant SMS text messages for critical campus handover alerts.' },
            ].map((item) => (
              <div key={item.key} className="flex flex-col gap-3 border-b pb-3.5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--glass-border)' }}>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{item.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--dash-text-secondary)' }}>{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(notificationPrefs as any)[item.key]}
                  onChange={(e) =>
                    setNotificationPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className="dash-btn-primary py-2.5 px-6 text-xs font-bold shadow-md"
          >
            Save Notification Preferences
          </button>
        </div>
      )}

      {/* Tab 4: Reputation & Badges */}
      {activeTab === 'achievements' && (
        <div className="glass-panel p-6 space-y-5">
          <div>
            <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Community Reputation & Badges</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--dash-text-secondary)' }}>Your campus trust score builds as you safely log items and return lost belongings.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-stat-card p-5 text-center">
              <Star size={24} className="mx-auto text-amber-500" />
              <p className="mt-2 text-xl font-black" style={{ color: 'var(--dash-text-primary)' }}>{user?.reputation || 100}</p>
              <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Reputation Score</p>
            </div>

            <div className="glass-stat-card p-5 text-center">
              <Award size={24} className="mx-auto text-indigo-500" />
              <p className="mt-2 text-xl font-black" style={{ color: 'var(--dash-text-primary)' }}>{user?.badges?.length || 1}</p>
              <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Earned Badges</p>
            </div>

            <div className="glass-stat-card p-5 text-center">
              <BadgeCheck size={24} className="mx-auto text-emerald-500" />
              <p className="mt-2 text-xl font-black" style={{ color: 'var(--dash-text-primary)' }}>Level 2</p>
              <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Trusted Member</p>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
