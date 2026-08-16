import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User as UserIcon, Phone, GraduationCap } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  AuthCard,
  Input,
  PasswordInput,
  PasswordStrengthMeter,
  Button,
  OAuthButton,
  AuthBrand,
} from '../components/AuthComponents';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  // Handle URL callback parameters from Google OAuth
  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const errorParam = searchParams.get('error');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        login(token, user);
        toast.success('Successfully authenticated!');
        navigate('/dashboard', { replace: true });
      } catch (err) {
        toast.error('Sign In failed. Please try again.');
        navigate(isLogin ? '/login' : '/signup', { replace: true });
      }
    } else if (errorParam) {
      toast.error(decodeURIComponent(errorParam));
      navigate(isLogin ? '/login' : '/signup', { replace: true });
    }
  }, [searchParams, login, navigate, isLogin]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      toast.error(custom.detail || 'Google Sign-In is unavailable right now.');
    };
    window.addEventListener('campusconnect:oauth-error', handler as EventListener);
    return () => window.removeEventListener('campusconnect:oauth-error', handler as EventListener);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    mode: 'onChange',
  });

  const passwordVal = watch('password', '');

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isLogin) {
        const res = await authApi.login({
          email: data.email,
          password: data.password,
        });
        login(res.data.token, res.data.user);
        if (rememberMe) {
          localStorage.setItem('campusconnect_remember_email', data.email);
        } else {
          localStorage.removeItem('campusconnect_remember_email');
        }
        toast.success('Welcome back to CampusConnect!');
        navigate('/dashboard');
      } else {
        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        const res = await authApi.signup({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          collegeName: data.collegeName,
        });
        login(res.data.token, res.data.user);
        toast.success('Registration successful! Welcome.');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    console.log('[Google Auth] Initiating token verification with backend...');
    try {
      const res = await authApi.googleTokenLogin(credential);
      console.log('[Google Auth] Verification success:', res.data);
      login(res.data.token, res.data.user);
      toast.success(`Welcome ${res.data.user?.name || 'User'}! Successfully signed in with Google.`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('[Google Auth Error] Token verification failed:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMsg = err.response?.data?.message || err.message || 'Google Sign In failed. Please try again.';
      toast.error(`Google Sign-In Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.warn('[Google Auth] GIS popup or prompt was dismissed');
    toast.error('Google Sign In was canceled or closed.');
  };

  const handleAppleSignIn = () => {
    toast('Apple Sign In Coming Soon');
  };

  const toggleMode = () => {
    reset();
    if (isLogin) {
      navigate('/signup');
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('campusconnect_remember_email');
    if (savedEmail) {
      setRememberMe(true);
      setValue('email', savedEmail);
    }
  }, [setValue]);

  return (
    <div className="relative flex min-h-[calc(100vh-140px)] items-center justify-center overflow-hidden px-4 py-12">
      <AuthCard>
        {/* Logo and Header */}
        <div className="mb-6 flex flex-col items-center gap-5">
          <AuthBrand />

          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? 'Sign in to continue to CampusConnect.' : 'Join CampusConnect and keep your campus connected.'}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-2.5 mb-5">
          <OAuthButton
            provider="google"
            onGoogleSuccess={handleGoogleSuccess}
            onGoogleError={handleGoogleError}
            loading={loading}
          />
          <OAuthButton provider="apple" onClick={handleAppleSignIn} disabled={true} />
        </div>

        {/* Divider */}
        <div className="relative flex py-3 items-center justify-center mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">OR</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <AnimatePresence mode="wait">
            {!isLogin ? (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 overflow-hidden"
              >
                <Input
                  label="Full Name"
                  placeholder="Aarav Singh"
                  icon={<UserIcon size={16} />}
                  error={errors.name?.message as string}
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />

                <Input
                  label="Phone Number"
                  placeholder="+91 9876543210"
                  type="tel"
                  icon={<Phone size={16} />}
                  error={errors.phone?.message as string}
                  {...register('phone', {
                    required: 'Phone number is required',
                  })}
                />

                <Input
                  label="College Name"
                  placeholder="Stanford University"
                  icon={<GraduationCap size={16} />}
                  error={errors.collegeName?.message as string}
                  {...register('collegeName', {
                    required: 'College name is required',
                  })}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Input
            label="Email"
            placeholder="student@college.edu"
            type="email"
            icon={<Mail size={16} />}
            error={errors.email?.message as string}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            showForgotPassword={isLogin}
            error={errors.password?.message as string}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                message: 'Use at least one uppercase letter, one lowercase letter, and one number',
              },
            })}
          />

          {!isLogin && (
            <>
              <PasswordStrengthMeter password={passwordVal} />

              <PasswordInput
                label="Confirm Password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={errors.confirmPassword?.message as string}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === passwordVal || 'Passwords do not match',
                })}
              />
            </>
          )}

          {isLogin && (
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Remember Me</span>
              </label>
            </div>
          )}

          <Button type="submit" loading={loading} className="mt-4">
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={toggleMode}
            className="ml-1 font-bold text-blue-600 dark:text-blue-400 transition hover:text-blue-700 dark:hover:text-blue-300 hover:underline focus:outline-none"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </AuthCard>
    </div>
  );
}
