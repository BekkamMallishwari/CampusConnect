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
    <PageTransition className="relative flex min-h-[calc(100vh-140px)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="glass-panel w-full max-w-md p-8 shadow-2xl">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-500 hover:underline">
          <ArrowLeft size={14} /> Back to Login
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>Forgot Password?</h1>
        <p className="mt-2 text-xs sm:text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
          Enter your registered email address and we will send you instructions to reset your password.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
            <h3 className="text-base font-bold text-emerald-600">Check your email</h3>
            <p className="mt-2 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
              We have sent a password reset link to your registered email address.
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-1.5 block text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--dash-text-muted)' }}>
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  {...register('email', { required: true })}
                  placeholder="student@college.edu"
                  className="glass-input h-11 w-full pl-10 pr-4 text-xs font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="dash-btn-primary w-full py-3 text-xs font-bold shadow-md disabled:opacity-50"
            >
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </PageTransition>
  );
}
