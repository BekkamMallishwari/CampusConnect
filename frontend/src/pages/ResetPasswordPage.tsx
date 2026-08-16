import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Lock, ArrowLeft } from 'lucide-react';
import { authApi } from '../lib/api';
import PageTransition from '../components/PageTransition';

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
      <PageTransition className="relative flex min-h-[calc(100vh-140px)] items-center justify-center overflow-hidden px-4 py-16">
        <div className="glass-panel w-full max-w-md p-8 text-center shadow-2xl space-y-4">
          <h2 className="text-xl font-black" style={{ color: 'var(--dash-text-primary)' }}>Invalid Reset Session</h2>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
            The password reset link is invalid or has expired. Please request a new link.
          </p>
          <Link to="/forgot-password" className="dash-btn-primary inline-block py-2.5 px-6 text-xs font-bold shadow-md">
            Request New Link
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="relative flex min-h-[calc(100vh-140px)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="glass-panel w-full max-w-md p-8 shadow-2xl space-y-4">
        <Link to="/login" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-500 hover:underline">
          <ArrowLeft size={14} /> Back to Login
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>Reset Password</h1>
        <p className="text-xs sm:text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
          Enter your new password below. Must be at least 8 characters.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1.5 block text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>New Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--dash-text-muted)' }}>
                <Lock size={15} />
              </div>
              <input
                type="password"
                required
                {...register('password', { required: true, minLength: 8 })}
                placeholder="••••••••"
                className="glass-input h-11 w-full pl-10 pr-4 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>Confirm Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--dash-text-muted)' }}>
                <Lock size={15} />
              </div>
              <input
                type="password"
                required
                {...register('confirmPassword', { required: true, minLength: 8 })}
                placeholder="••••••••"
                className="glass-input h-11 w-full pl-10 pr-4 text-xs font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="dash-btn-primary w-full py-3 text-xs font-bold shadow-md disabled:opacity-50"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
