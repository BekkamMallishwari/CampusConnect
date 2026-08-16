import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  HelpCircle,
  ShieldCheck,
  MapPin,
  Sparkles,
  X,
  Info,
  Layers,
  Cpu,
} from 'lucide-react';
import UniversityCrest from '../components/UniversityCrest';
import CampusHeroVisual from '../components/CampusHeroVisual';
import { authApi, getApiOrigin } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  initialMode?: 'login' | 'signup';
}

type ModalType =
  | null
  | 'about'
  | 'features'
  | 'how-it-works'
  | 'campus-map'
  | 'security'
  | 'privacy'
  | 'terms'
  | 'help'
  | 'campus-services'
  | 'forgot-password'
  | 'signup';

export default function LandingPage({ initialMode = 'login' }: LandingPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sign up modal state
  const [activeModal, setActiveModal] = useState<ModalType>(initialMode === 'signup' ? 'signup' : null);
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    collegeName: '',
    password: '',
    confirmPassword: '',
  });

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Direct Google OAuth Redirect
  const handleGoogleSignIn = () => {
    const apiOrigin = getApiOrigin();
    window.location.href = `${apiOrigin}/api/auth/google`;
  };

  // Handle URL Google OAuth params if redirected here
  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const errorParam = searchParams.get('error');

    if (token && userParam) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userParam));
        login(token, parsedUser);
        toast.success('Successfully authenticated with Google!');
        navigate('/dashboard', { replace: true });
      } catch (err) {
        toast.error('Authentication failed. Please log in again.');
      }
    } else if (errorParam) {
      toast.error(decodeURIComponent(errorParam));
    }
  }, [searchParams, login, navigate]);

  // Handle Login Submission
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your campus email or student ID');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        email: identifier.trim(),
        password,
      });
      login(res.data.token, res.data.user);
      toast.success('Welcome back to CampusConnect!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Please verify your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup Submission
  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signupData.name || !signupData.email || !signupData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.signup({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        collegeName: signupData.collegeName || 'Stanford University',
        password: signupData.password,
      });
      login(res.data.token, res.data.user);
      toast.success('Registration successful! Welcome to CampusConnect.');
      setActiveModal(null);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Account registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your registered email address');
      return;
    }
    setForgotLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail.trim());
      toast.success('Password reset instructions sent to your email!');
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unable to send reset instructions.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col justify-between bg-[#071F46] font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 selection:bg-cyan-500 selection:text-white antialiased overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────
          MAIN 16:9 SPLIT VIEWPORT AREA (Hero Left 55% + Login Right 45%)
      ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* ── LEFT SECTION — CAMPUSCONNECT BRAND / HERO (55% Width) ── */}
        <div className="lg:col-span-7 bg-[#071F46] text-white flex flex-col justify-between p-6 sm:p-8 lg:px-12 xl:px-16 lg:py-8 relative overflow-hidden">
          {/* Subtle geometric & light grid overlay */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Top Brand Logo & Header */}
          <div className="relative z-10 flex items-center gap-3.5">
            <UniversityCrest size={46} className="drop-shadow-md" />
            <div>
              <div className="text-2xl sm:text-[25px] font-black tracking-tight text-white leading-none">
                CampusConnect
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-slate-300 uppercase mt-1 leading-none">
                UNIVERSITY PORTAL
              </div>
            </div>
          </div>

          {/* Center Hero Area: Typography + Floating Lost & Found Illustration */}
          <div className="relative z-10 my-auto py-4 sm:py-6 grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-center">
            {/* Main Headline Typography (Left Column of Hero) */}
            <div className="xl:col-span-6 space-y-4 sm:space-y-5 max-w-lg">
              <div className="space-y-1 sm:space-y-1.5">
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl sm:text-5xl xl:text-[52px] font-black tracking-tight text-[#1E90FF] leading-[1.02] uppercase font-sans"
                >
                  REUNITE
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-2xl sm:text-3xl xl:text-[40px] font-serif text-white font-normal leading-[1.12]"
                >
                  <span className="italic font-normal">with your</span>
                  <br />
                  <span className="font-['Playfair_Display',serif] font-black tracking-wide text-white uppercase text-3xl sm:text-4xl xl:text-[46px] leading-tight block">
                    CAMPUS
                  </span>
                  <span className="font-['Playfair_Display',serif] font-black tracking-wide text-white uppercase text-3xl sm:text-4xl xl:text-[46px] leading-tight block">
                    ESSENTIALS.
                  </span>
                </motion.div>
              </div>

              {/* Sub-headline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-sm sm:text-base text-slate-200/95 font-normal leading-relaxed max-w-md"
              >
                Report lost items, track <strong className="font-bold text-white underline decoration-cyan-400 decoration-2 underline-offset-4">live matches</strong>, and connect with your university community securely.
              </motion.p>
            </div>

            {/* Floating 3D-Style Illustration (Right Column of Left Hero) */}
            <div className="xl:col-span-6 flex items-center justify-center pt-2 xl:pt-0">
              <CampusHeroVisual />
            </div>
          </div>

          {/* Left Hero Bottom Status Bar / Trust Indicator */}
          <div className="relative z-10 hidden sm:flex items-center gap-6 text-[11px] text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Matching Engine Active</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>Verified University SSO &amp; Escrow Safe</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT SECTION — LOGIN CARD & PUBLIC DIRECTORY (42% Width) ── */}
        <div className="lg:col-span-5 bg-[#F0F2F5] flex flex-col justify-center items-center p-6 sm:p-8 lg:p-8 xl:p-10 relative overflow-y-auto min-h-screen lg:min-h-0">
          <div className="w-full max-w-[420px] mx-auto my-auto flex flex-col items-center">
            {/* White Login Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="w-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border border-slate-200/90"
            >
              {/* Card Header */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-5 font-sans">
                LOG IN to CampusConnect
              </h2>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Email / Student ID Input */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Campus Email address or student ID"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-3.5 pr-11 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Primary Button: Log In */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[50px] py-3.5 px-4 rounded-xl bg-[#0084FF] hover:bg-[#0073E6] active:bg-[#0062C4] text-white font-bold text-base shadow-sm hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Log In'
                  )}
                </button>

                {/* Centered OR Divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="shrink-0 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    OR
                  </span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                {/* Secondary Button: Continue with Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full min-h-[52px] py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-[#071F46] font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Forgotten Password Link */}
                <div className="text-center pt-1.5 pb-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveModal('forgot-password')}
                    className="text-sm font-semibold text-[#0084FF] hover:underline focus:outline-none transition-colors"
                  >
                    Forgotten password?
                  </button>
                </div>

                {/* Divider Line */}
                <div className="w-full border-t border-slate-200 my-1" />

                {/* Secondary Button: Create New Account */}
                <button
                  type="button"
                  onClick={() => setActiveModal('signup')}
                  className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Create new account
                </button>

                {/* Campus Services Link / Badge */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveModal('campus-services')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1 px-3 rounded-full hover:bg-slate-100"
                  >
                    <GraduationCap size={16} className="text-slate-600" />
                    <span>Campus Services</span>
                  </button>
                </div>
              </form>
            </motion.div>

            {/* ── RIGHT SECTION FOOTER NAVIGATION LINKS & COPYRIGHT ── */}
            <div className="w-full mt-6 text-center space-y-2">
              {/* Row 1 */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setActiveModal('about')}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => setActiveModal('features')}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  Features
                </button>
                <button
                  onClick={() => setActiveModal('how-it-works')}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  How It Works
                </button>
                <button
                  onClick={() => setActiveModal('campus-map')}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  Campus Map
                </button>
                <button
                  onClick={() => setActiveModal('security')}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  Security
                </button>
              </div>

              {/* Row 2 */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                <button
                  onClick={() => setActiveModal('privacy')}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setActiveModal('terms')}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => setActiveModal('help')}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  Help Center
                </button>
              </div>

              {/* Copyright */}
              <div className="pt-2 text-[11px] sm:text-xs text-slate-400 font-normal leading-relaxed text-center">
                © 2026 CampusConnect · University Lost &amp; Found Intelligence Platform. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          INTERACTIVE MODAL OVERLAYS (Pre-Login Experience Only)
      ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    {activeModal === 'signup' && <UserIcon size={16} />}
                    {activeModal === 'forgot-password' && <Lock size={16} />}
                    {activeModal === 'about' && <Info size={16} />}
                    {activeModal === 'features' && <Sparkles size={16} />}
                    {activeModal === 'how-it-works' && <Layers size={16} />}
                    {activeModal === 'campus-map' && <MapPin size={16} />}
                    {activeModal === 'security' && <ShieldCheck size={16} />}
                    {activeModal === 'campus-services' && <GraduationCap size={16} />}
                    {(activeModal === 'privacy' || activeModal === 'terms' || activeModal === 'help') && (
                      <HelpCircle size={16} />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 capitalize">
                    {activeModal === 'signup' && 'Create University Account'}
                    {activeModal === 'forgot-password' && 'Reset Portal Password'}
                    {activeModal === 'about' && 'About CampusConnect'}
                    {activeModal === 'features' && 'Platform Intelligence & Features'}
                    {activeModal === 'how-it-works' && 'How CampusConnect Works'}
                    {activeModal === 'campus-map' && 'Campus Building Map Directory'}
                    {activeModal === 'security' && 'Security & Ownership Verification'}
                    {activeModal === 'campus-services' && 'Campus Services & Student Life'}
                    {activeModal === 'privacy' && 'Privacy Policy'}
                    {activeModal === 'terms' && 'Terms of Service'}
                    {activeModal === 'help' && 'CampusConnect Help Center'}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600">
                {/* ─── Sign Up Form Modal ─── */}
                {activeModal === 'signup' && (
                  <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                    <p className="text-xs text-slate-500 mb-2">
                      Join your verified campus network to report missing items, match found articles, and safely connect with fellow students.
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          placeholder="Aarav Sharma"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Campus Email Address</label>
                      <input
                        type="email"
                        required
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        placeholder="student@university.edu"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={signupData.phone}
                          onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          placeholder="+91 9876543210"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">University / College</label>
                        <input
                          type="text"
                          value={signupData.collegeName}
                          onChange={(e) => setSignupData({ ...signupData, collegeName: e.target.value })}
                          placeholder="Stanford University"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                        <input
                          type="password"
                          required
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition cursor-pointer disabled:opacity-70"
                    >
                      {loading ? 'Creating Account...' : 'Register & Enter Portal'}
                    </button>
                  </form>
                )}

                {/* ─── Forgot Password Modal ─── */}
                {activeModal === 'forgot-password' && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-xs text-slate-500">
                      Enter your university email address. We will send you a secure password reset link to regain access to your account.
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email</label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="student@university.edu"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition cursor-pointer disabled:opacity-70"
                    >
                      {forgotLoading ? 'Sending link...' : 'Send Recovery Link'}
                    </button>
                  </form>
                )}

                {/* ─── About Modal ─── */}
                {activeModal === 'about' && (
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      <strong>CampusConnect</strong> is an enterprise-grade university technology platform engineered to reunite students, staff, and faculty with their lost belongings through state-of-the-art multimodal AI matching, live geolocation mapping, and secure peer verification.
                    </p>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2.5">
                      <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                      <div className="text-xs text-blue-900 leading-relaxed">
                        <strong>Privacy-First Architecture:</strong> Contact details are protected and never broadcast publicly. Ownership is verified cryptographically before meeting details or private numbers are shared.
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Features Modal ─── */}
                {activeModal === 'features' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-xs sm:text-sm">
                        <Cpu size={16} className="text-blue-600" />
                        AI Multimodal Similarity Engine
                      </div>
                      <p className="text-xs text-slate-600">
                        Automatically scans descriptions, categories, item colors, and image features to calculate live match confidence scores in real-time.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-xs sm:text-sm">
                        <MapPin size={16} className="text-cyan-600" />
                        Interactive Campus Zone Pins
                      </div>
                      <p className="text-xs text-slate-600">
                        Precise geotagging across university lecture halls, cafeterias, libraries, and athletic facilities.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-xs sm:text-sm">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        Multi-Factor Ownership Verification
                      </div>
                      <p className="text-xs text-slate-600">
                        Unique identifying questions (e.g. lock screens, serial numbers, engravings) guarantee safe item handovers.
                      </p>
                    </div>
                  </div>
                )}

                {/* ─── How It Works Modal ─── */}
                {activeModal === 'how-it-works' && (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">Report Item</div>
                        <p className="text-xs text-slate-600">Submit details or photos of what was lost or found on campus.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">AI Match &amp; Geolocation</div>
                        <p className="text-xs text-slate-600">Our engine detects cross-matches and notifies both parties instantly.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">Verified Handover</div>
                        <p className="text-xs text-slate-600">Confirm ownership through custom verification questions and schedule a safe campus meet.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Campus Map Modal ─── */}
                {activeModal === 'campus-map' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      CampusConnect coordinates with campus security, university student unions, and departmental lost &amp; found desks across all university zones.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">🏛️ Main Library Desk</div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">🍽️ Central Dining Hall</div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">🔬 Science &amp; Tech Quad</div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">🏟️ Athletics Center</div>
                    </div>
                  </div>
                )}

                {/* ─── Security Modal ─── */}
                {activeModal === 'security' && (
                  <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                    <p>
                      Security is built into every layer of CampusConnect. All accounts require verified university credentials, and transactions or handovers adhere to student code of conduct safety standards.
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      <li>End-to-end encryption for peer-to-peer chats</li>
                      <li>Admin moderation panel to flag suspicious reports</li>
                      <li>Automated spam &amp; duplicate detection</li>
                    </ul>
                  </div>
                )}

                {/* ─── Campus Services Modal ─── */}
                {activeModal === 'campus-services' && (
                  <div className="space-y-3 text-xs text-slate-600">
                    <p>
                      Access university student support services, campus lost &amp; found dispatch, university security assistance, and community boards.
                    </p>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-800">Campus Security Emergency Dispatch</div>
                      <div>Dial extension: <strong>(555) 019-2831</strong> (24/7 Helpline)</div>
                    </div>
                  </div>
                )}

                {/* ─── Privacy Policy & Terms Modal ─── */}
                {(activeModal === 'privacy' || activeModal === 'terms' || activeModal === 'help') && (
                  <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                    <p>
                      CampusConnect is committed to protecting student data. No sensitive identifiers or personal contact information are shared with unauthorized third parties.
                    </p>
                    <p>
                      For technical support or institutional deployment inquiries, contact your university portal administrator at <strong>support@campusconnect.edu</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
