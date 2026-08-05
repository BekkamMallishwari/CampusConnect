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

const fieldCls = `mt-1.5 h-11 w-full rounded-xl border px-3 text-sm font-medium transition-all duration-200 outline-none
  bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  border-slate-200 dark:border-slate-600
  focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]`;

const labelCls = 'block text-xs font-semibold text-slate-700 dark:text-slate-300';

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
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 py-4 pb-16">
        {/* Profile Banner */}
        <div className="saas-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user?.name}
                    className="h-20 w-20 rounded-2xl border-2 border-slate-200 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-2xl font-bold text-white shadow-md">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-white shadow-md transition hover:bg-blue-600">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{user?.name}</h1>
                  {user?.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      Unverified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                    {user?.department || 'Computer Science'}
                  </span>
                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                    {user?.year || '3rd Year'}
                  </span>
                  <span className="rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-blue-600 dark:text-blue-400">
                    {user?.reputation || 100} Reputation
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">Reward Points</p>
                <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{user?.points || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile Settings', icon: User },
            { id: 'security', label: 'Security & Login Log', icon: Shield },
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
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Profile Settings */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit(onSubmit)} className="saas-card p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Personal & Academic Details</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Full Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Your full name"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>Phone Number</label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="+91 9876543210"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>University / College</label>
                <input
                  type="text"
                  {...register('collegeName')}
                  placeholder="Your college name"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>Department</label>
                <input
                  type="text"
                  {...register('department')}
                  placeholder="e.g. Computer Science"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>Academic Year</label>
                <select
                  {...register('year')}
                  className={fieldCls}
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
              <button type="submit" disabled={loading} className="cc-button-primary inline-flex items-center gap-2 text-sm">
                <Save size={15} />
                <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Login Activity Log */}
        {activeTab === 'security' && (
          <div className="saas-card p-6 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Account Logins</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Security audit log tracking devices, IP addresses, and browsers used to access your account.
              </p>
            </div>

            <div className="space-y-3">
              {(!user?.loginHistory || user.loginHistory.length === 0) ? (
                <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Current session active. New login sessions will be recorded here.
                </div>
              ) : (
                user.loginHistory.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        {item.device?.toLowerCase().includes('mobile') || item.os === 'iOS' || item.os === 'Android' ? (
                          <Smartphone size={18} />
                        ) : (
                          <Laptop size={18} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.device}</p>
                          {item.isNewDevice && (
                            <span className="rounded bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                              New Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          IP: {item.ip} • Browser: {item.browser}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {new Date(item.loggedInAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
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
          <div className="saas-card p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Notification Alert Settings</h2>

            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive email alerts for login, match detection, and claim updates.' },
                { key: 'push', label: 'Mobile Push Notifications', desc: 'Receive FCM push alerts for new messages, matches, and reward claims.' },
                { key: 'sms', label: 'SMS Alerts (Twilio)', desc: 'Receive instant SMS text messages for critical campus handover alerts.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3.5">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(notificationPrefs as any)[item.key]}
                    onChange={(e) =>
                      setNotificationPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="cc-button-primary text-sm"
            >
              Save Notification Preferences
            </button>
          </div>
        )}

        {/* Tab 4: Reputation & Badges */}
        {activeTab === 'achievements' && (
          <div className="saas-card p-6 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Community Reputation & Badges</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your campus trust score builds as you safely log items and return lost belongings.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-center">
                <Star size={24} className="mx-auto text-amber-500" />
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{user?.reputation || 100}</p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Reputation Score</p>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-center">
                <Award size={24} className="mx-auto text-blue-600 dark:text-blue-400" />
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{user?.badges?.length || 1}</p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Earned Badges</p>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-center">
                <BadgeCheck size={24} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Level 2</p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Trusted Member</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
