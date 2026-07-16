import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { User, Phone, GraduationCap, Save, Upload, Shield } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    if (!user) return;
    setValue('name', user.name);
    setValue('phone', user.phone || '');
    setValue('collegeName', user.collegeName || '');
    if (user.avatar) setAvatarPreview(user.avatar);
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
    if (avatarFile) {
      fd.append('avatar', avatarFile);
    }

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Profile Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Update your student coordinates and contact details</p>
      </div>

      <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-8 backdrop-blur-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="h-24 w-24 rounded-full object-cover border border-slate-800" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-950 text-3xl font-bold text-cyan-400 uppercase">
                  {user?.name.charAt(0)}
                </div>
              )}
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-md transition hover:bg-cyan-400">
                <Upload size={14} />
                <input type="file" onChange={handleAvatarChange} accept="image/*" className="hidden" />
              </label>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Profile Picture</h3>
              <p className="mt-1 text-xs text-slate-405">PNG, JPG or WEBP up to 5MB. Matches automatically scan this photo.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-350">Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  {...register('name', { required: true })}
                  placeholder="Aarav Singh"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Phone Number (For coordinate handovers)</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  required
                  {...register('phone', { required: true })}
                  placeholder="+1 (555) 019-2834"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">College Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <GraduationCap size={16} />
                </div>
                <input
                  type="text"
                  {...register('collegeName')}
                  placeholder="Stanford University"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Role Privileges</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <Shield size={16} />
                </div>
                <input
                  type="text"
                  disabled
                  value={user?.role === 'admin' ? 'Administrator' : 'Standard Student Account'}
                  className="w-full rounded-2xl border border-slate-900 bg-slate-950/20 py-3 pl-11 pr-4 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-75 shadow-lg shadow-cyan-500/15"
          >
            <Save size={16} />
            {loading ? 'Saving details...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
