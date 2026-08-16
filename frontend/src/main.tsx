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

const queryClient = new QueryClient();
const googleClientId = getOptionalFrontendEnv('VITE_GOOGLE_CLIENT_ID');
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

