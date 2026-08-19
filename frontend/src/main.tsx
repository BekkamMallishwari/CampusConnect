import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';
import App from './App.tsx';
import { getOptionalFrontendEnv } from './lib/env';

// Automatic suppression of any dynamic third-party Test Mode ribbons / badges
if (typeof window !== 'undefined') {
  const removeTestRibbons = () => {
    const elements = document.querySelectorAll('div, span, a, p, iframe, [class*="ribbon"], [id*="ribbon"]');
    elements.forEach((el) => {
      const text = el.textContent?.trim();
      const style = window.getComputedStyle(el);
      const isRotated = style.transform && style.transform !== 'none';
      const isFixed = style.position === 'fixed' || style.position === 'absolute';

      if (
        text === 'Test Mode' ||
        text === 'TEST MODE' ||
        text === 'Test mode' ||
        text === 'DEMO MODE' ||
        text === 'Demo Mode' ||
        text === 'TEST' ||
        text === 'DEMO' ||
        (isFixed && isRotated && text?.toLowerCase().includes('test'))
      ) {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
        (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
        (el as HTMLElement).style.setProperty('opacity', '0', 'important');
        (el as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
        (el as HTMLElement).style.setProperty('z-index', '-99999', 'important');
        try {
          el.remove();
        } catch (_) {}
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeTestRibbons);
  } else {
    removeTestRibbons();
  }

  const observer = new MutationObserver(() => {
    removeTestRibbons();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  setInterval(removeTestRibbons, 250);
}

const queryClient = new QueryClient();
const googleClientId =
  getOptionalFrontendEnv('VITE_GOOGLE_CLIENT_ID') ||
  '';
const AppProviders = ({ children }: { children: ReactNode }) =>
  googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider> : <>{children}</>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'color-mix(in srgb, var(--card) 94%, transparent)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    boxShadow: 'var(--shadow-lg)',
                    backdropFilter: 'blur(18px)',
                  },
                }}
              />
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </AppProviders>
  </StrictMode>,
);
