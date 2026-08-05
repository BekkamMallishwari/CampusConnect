import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
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
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'rgba(255, 255, 255, 0.96)',
                  color: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.24)',
                  borderRadius: '16px',
                  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)',
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppProviders>
  </StrictMode>,
);
