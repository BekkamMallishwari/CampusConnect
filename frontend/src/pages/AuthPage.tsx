import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Sparkles, Mail, Lock, User as UserIcon, Phone, GraduationCap, ShieldCheck } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
  } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isLogin) {
        const res = await authApi.login({
          email: data.email,
          password: data.password,
        });
        login(res.data.token, res.data.user);
        toast.success('Welcome back to CampusConnect!');
        navigate('/dashboard');
      } else {
        const res = await authApi.signup({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          collegeName: data.collegeName,
        });
        login(res.data.token, res.data.user);
        toast.success('Registration successful! Welcome to CampusConnect.');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const email = `oauth_${provider}_${Math.random().toString(36).slice(2, 7)}@college.edu`;
      const name = provider === 'google' ? 'Google Student' : 'Apple Student';
      
      let res;
      if (provider === 'google') {
        res = await authApi.googleLogin({
          googleId: `google_${Date.now()}`,
          email,
          name,
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
        });
      } else {
        res = await authApi.appleLogin({
          appleId: `apple_${Date.now()}`,
          email,
          name,
        });
      }
      login(res.data.token, res.data.user);
      toast.success(`Logged in with ${provider === 'google' ? 'Google' : 'Apple'} successfully!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('OAuth connection failed. Please try email sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-slate-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/10 shadow-2xl shadow-cyan-950/20 backdrop-blur-md lg:grid lg:grid-cols-2">
        
        {/* Info Column (Desktop only) */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 to-indigo-950 p-12 lg:flex">
          <div>
            <div className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white">
                <Sparkles size={16} />
              </div>
              <span>CampusConnect</span>
            </div>
            <h2 className="mt-20 text-3xl font-extrabold leading-tight text-white xl:text-4xl">
              The smartest way to recover your items.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-350">
              CampusConnect brings text/image similarity matching, real-time chats, and secure reward escrows into a single platform for college students.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="rounded-lg bg-cyan-500/10 p-1.5 text-cyan-400">
                <ShieldCheck size={16} />
              </div>
              Secure end-to-end communication
            </div>
            <div className="text-xs text-slate-550">
              © 2026 CampusConnect. Made for production-grade security.
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="p-8 sm:p-12 lg:border-l lg:border-slate-900">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {isLogin ? 'Sign in to access your dashboard' : 'Join your campus recovery network'}
              </p>
            </div>

            {/* Simulated OAuth Options */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSimulatedOAuth('google')}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114c-3.155 0-5.714-2.56-5.714-5.714c0-3.155 2.56-5.714 5.714-5.714c1.372 0 2.63.486 3.623 1.291l3.057-3.057C18.823 3.652 15.753 2.5 12.24 2.5C6.429 2.5 1.714 7.214 1.714 13s4.715 10.5 10.526 10.5c5.966 0 10.505-4.226 10.505-10.5c0-.67-.06-1.31-.17-1.929H12.24z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSimulatedOAuth('apple')}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M17.05 20.28c-.98.95-2.05.88-3.08.4c-1.09-.5-2.08-.48-3.24 0c-1.44.62-2.2.44-3.06-.4C4.7 17.2 4.12 11.75 6.64 8.04c1.23-1.8 2.92-1.92 3.86-1.92c1.33.02 2.3.62 3.12.58c.84-.04 1.7-.58 3.22-.44c1.55.15 2.76.76 3.4 1.84c-3.12 1.8-2.6 5.86.5 7.12c-.75 1.94-1.6 3.08-3.69 5.06M15.4 3.02c.9-1.12.78-2.6-.32-3.52c-1.15-1-2.58-.66-3.4.15c-.9 1.1-.75 2.74.34 3.52c1.1.8 2.6.48 3.38-.15"
                  />
                </svg>
                Apple
              </button>
            </div>

            <div className="relative mt-8 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-900"></div>
              </div>
              <span className="relative bg-slate-950 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Or connect with email
              </span>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {!isLogin && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm text-slate-350">Full Name</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        {...register('name', { required: true, minLength: 2 })}
                        placeholder="Aarav Singh"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-slate-350">Phone Number</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                        <Phone size={16} />
                      </div>
                      <input
                        type="tel"
                        required
                        {...register('phone', { required: true })}
                        placeholder="+1 (555) 019-2834"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-slate-350">College Name (Optional)</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                        <GraduationCap size={16} />
                      </div>
                      <input
                        type="text"
                        {...register('collegeName')}
                        placeholder="Stanford University"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </>
              )}

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
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-slate-350">Password</label>
                  {isLogin && (
                    <Link to="/forgot-password" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                      Forgot Password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    {...register('password', { required: true, minLength: 8 })}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-cyan-500 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-400">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-cyan-400 hover:text-cyan-300 transition"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
