import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { authApi } from '../lib/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    if (!token || !email) {
      toast.error('Invalid password reset session.');
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        email,
        password: data.password,
      });
      toast.success('Password updated successfully! You can now sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-slate-100">
        <div className="w-full max-w-md rounded-3xl border border-slate-900 bg-slate-900/10 p-8 text-center shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold text-white">Invalid Reset Session</h2>
          <p className="mt-2 text-sm text-slate-400">
            The password reset link is invalid or has expired. Please request a new link.
          </p>
          <Link to="/forgot-password" className="mt-6 inline-block rounded-2xl bg-cyan-500 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-900 bg-slate-900/10 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-md">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Reset Password</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your new password below. Must be at least 8 characters.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1.5 block text-sm text-slate-350">New Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                {...register('password', { required: true, minLength: 8 })}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-350">Confirm Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                {...register('confirmPassword', { required: true, minLength: 8 })}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-500 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-75"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
