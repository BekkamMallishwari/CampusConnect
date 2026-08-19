import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { getApiOrigin } from '../lib/api';
import { getOptionalFrontendEnv } from '../lib/env';
import CampusBrandMark from './CampusBrandMark';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full mb-4 text-left">
        <label className="mb-1.5 block text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{label}</label>
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--dash-text-muted)' }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`glass-input w-full h-11 px-4 text-xs font-medium outline-none transition-all duration-200 ${icon ? 'pl-10' : 'pl-3.5'} ${
              error ? 'border-rose-500' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs font-bold text-rose-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  showForgotPassword?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, icon, showForgotPassword, className = '', ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="w-full mb-4 text-left">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{label}</label>
          {showForgotPassword && (
            <Link
              to="/forgot-password"
              className="text-xs font-bold transition-colors hover:underline"
              style={{ color: 'var(--dash-accent)' }}
            >
              Forgot Password?
            </Link>
          )}
        </div>
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: 'var(--dash-text-muted)' }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={show ? 'text' : 'password'}
            className={`glass-input w-full h-11 px-4 text-xs font-medium outline-none transition-all duration-200 ${icon ? 'pl-10' : 'pl-3.5'} pr-10 ${
              error ? 'border-rose-500' : ''
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 transition focus:outline-none"
            style={{ color: 'var(--dash-text-muted)' }}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs font-bold text-rose-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

interface PasswordStrengthProps {
  password?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
  if (!password) return null;

  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);

  const getLabelAndColor = (str: number) => {
    switch (str) {
      case 0:
      case 1:
        return { label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { label: 'Fair', color: 'bg-orange-500' };
      case 3:
        return { label: 'Good', color: 'bg-amber-500' };
      case 4:
      case 5:
        return { label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { label: 'Weak', color: 'bg-rose-500' };
    }
  };

  const { label, color } = getLabelAndColor(strength);

  const requirements = [
    { label: 'Minimum 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 mb-4 text-left">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-bold" style={{ color: 'var(--dash-text-muted)' }}>Password Strength</span>
        <span className="text-[11px] font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>{label}</span>
      </div>
      <div className="mb-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className={`flex-1 transition-all duration-300 ${
              idx <= strength ? color : 'bg-transparent'
            } border-r border-white/20 last:border-0`}
          />
        ))}
      </div>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2 text-[11px]">
            <span
              className={`h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors ${
                req.met ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span
              className={`transition-colors ${
                req.met
                  ? 'text-slate-400 line-through decoration-slate-300'
                  : ''
              }`}
              style={{ color: req.met ? undefined : 'var(--dash-text-secondary)' }}
            >
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface ButtonProps extends HTMLMotionProps<'button'> {
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, loading, className = '', ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`dash-btn-primary flex w-full items-center justify-center gap-2 py-3 px-5 text-xs font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        children
      )}
    </motion.button>
  );
};

interface OAuthButtonProps extends HTMLMotionProps<'button'> {
  provider: 'google' | 'apple';
  loading?: boolean;
  onGoogleSuccess?: (credential: string) => void;
  onGoogleError?: () => void;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  loading,
  onGoogleSuccess,
  onGoogleError,
  className = '',
  ...props
}) => {
  const isGoogle = provider === 'google';
  const googleClientId =
    getOptionalFrontendEnv('VITE_GOOGLE_CLIENT_ID') ||
    '';

  const innerContent = (
    <>
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : isGoogle ? (
        <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
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
      ) : (
        <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4c-1.09-.5-2.08-.48-3.24 0c-1.44.62-2.2.44-3.06-.4C4.7 17.2 4.12 11.75 6.64 8.04c1.23-1.8 2.92-1.92 3.86-1.92c1.33.02 2.3.62 3.12.58c.84-.04 1.7-.58 3.22-.44c1.55.15 2.76.76 3.4 1.84c-3.12 1.8-2.6 5.86.5 7.12c-.75 1.94-1.6 3.08-3.69 5.06M15.4 3.02c.9-1.12.78-2.6-.32-3.52c-1.15-1-2.58-.66-3.4.15c-.9 1.1-.75 2.74.34 3.52c1.1.8 2.6.48 3.38-.15" />
        </svg>
      )}
      <span>{loading ? 'Connecting...' : `Continue with ${isGoogle ? 'Google' : 'Apple'}`}</span>
    </>
  );

  const baseClass = `dash-btn-secondary flex w-full items-center justify-center gap-2.5 py-3 text-xs font-bold shadow-xs transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

  const handleDirectGoogleRedirect = () => {
    const apiOrigin = getApiOrigin();
    console.log('[Google OAuth] Triggering direct Passport OAuth redirect to:', `${apiOrigin}/api/auth/google`);
    window.location.href = `${apiOrigin}/api/auth/google`;
  };

  if (isGoogle && onGoogleSuccess && googleClientId) {
    return (
      <div className="w-full space-y-2">
        <div className="glass-panel flex w-full items-center justify-center overflow-hidden p-1">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              console.log('[Google GIS Success] Credential received:', !!credentialResponse.credential);
              if (credentialResponse.credential) {
                onGoogleSuccess(credentialResponse.credential);
              }
            }}
            onError={() => {
              console.warn('[Google GIS Error] Sign In dismissed or error occurred');
              if (onGoogleError) onGoogleError();
            }}
            useOneTap={false}
            type="standard"
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="380"
          />
        </div>

        <button
          type="button"
          onClick={handleDirectGoogleRedirect}
          className="w-full py-1 text-center text-xs font-bold underline transition"
          style={{ color: 'var(--dash-accent)' }}
        >
          Having trouble? Sign in via Google Browser Redirect
        </button>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      type="button"
      className={baseClass}
      disabled={loading || props.disabled}
      onClick={
        isGoogle
          ? (googleClientId ? handleDirectGoogleRedirect : () => {
              window.dispatchEvent(new CustomEvent('campusconnect:oauth-error', {
                detail: 'Google Sign-In is not configured in this environment.',
              }));
            })
          : props.onClick
      }
      {...props}
    >
      {innerContent}
    </motion.button>
  );
};

export const AuthCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="glass-panel w-full max-w-[460px] p-7 sm:p-8 text-center shadow-2xl"
    >
      {children}
    </motion.div>
  );
};

export const AuthBrand = () => <CampusBrandMark className="justify-center" />;
