import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../lib/api';

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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-900 bg-slate-900/10 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-md">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Forgot Password?</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6 text-center">
            <h3 className="text-lg font-bold text-white">Check your email</h3>
            <p className="mt-2 text-sm text-slate-350">
              We have sent a password reset link to your registered email address. Please follow the instructions to reset your password.
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-1.5 block text-sm text-slate-350">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  {...register('email', { required: true })}
                  placeholder="student@college.edu"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-500 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
