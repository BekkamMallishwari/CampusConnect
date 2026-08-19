import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getOptionalFrontendEnv } from '../lib/env';

const firebaseConfig = {
  apiKey: getOptionalFrontendEnv('VITE_FIREBASE_API_KEY') || '',
  authDomain: getOptionalFrontendEnv('VITE_FIREBASE_AUTH_DOMAIN') || '',
  projectId: getOptionalFrontendEnv('VITE_FIREBASE_PROJECT_ID') || '',
  storageBucket: getOptionalFrontendEnv('VITE_FIREBASE_STORAGE_BUCKET') || '',
  messagingSenderId: getOptionalFrontendEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '',
  appId: getOptionalFrontendEnv('VITE_FIREBASE_APP_ID') || '',
  measurementId: getOptionalFrontendEnv('VITE_FIREBASE_MEASUREMENT_ID') || '',
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => value.trim().length > 0);

export const app: FirebaseApp | null =
  getApps().length > 0 ? getApps()[0] : hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const analytics: Analytics | null = typeof window !== 'undefined' && app ? getAnalytics(app) : null;
