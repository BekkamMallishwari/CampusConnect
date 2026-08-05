import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../lib/api';
import PageTransition from '../components/PageTransition';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
      toast.success('Password reset link sent to your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_28%)]" />
      <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.12)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.5)]">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 transition hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft size={14} /> Back to Login
        </Link>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Forgot Password?</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter your registered email address and we will send you instructions to reset your password.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-6 text-center">
            <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300">Check your email</h3>
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
              We have sent a password reset link to your registered email address.
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  {...register('email', { required: true })}
                  placeholder="student@college.edu"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cc-button-primary w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </PageTransition>
  );
}
