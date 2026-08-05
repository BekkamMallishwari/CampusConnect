import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { authApi } from '../lib/api';
import PageTransition from '../components/PageTransition';

const inputCls = `w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 
  py-3 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100 
  placeholder:text-slate-400 dark:placeholder:text-slate-500 
  outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]`;

const cardCls = `w-full max-w-md rounded-[1.75rem] border border-slate-200 dark:border-slate-700 
  bg-white dark:bg-slate-900 p-8 
  shadow-[0_24px_90px_rgba(15,23,42,0.12)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.5)]`;

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
      await authApi.resetPassword({ token, email, password: data.password });
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
      <PageTransition className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 bg-slate-50 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_28%)]" />
        <div className={`${cardCls} text-center`}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invalid Reset Session</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The password reset link is invalid or has expired. Please request a new link.
          </p>
          <Link to="/forgot-password" className="cc-button-primary mt-6 inline-block rounded-xl px-6 py-2.5 text-sm font-black uppercase tracking-wider text-white">
            Request New Link
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_28%)]" />
      <div className={cardCls}>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Reset Password</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter your new password below. Must be at least 8 characters.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200">New Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                {...register('password', { required: true, minLength: 8 })}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200">Confirm Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                {...register('confirmPassword', { required: true, minLength: 8 })}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cc-button-primary w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
