import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getOptionalFrontendEnv } from '../lib/env';

const firebaseConfig = {
  apiKey: getOptionalFrontendEnv('VITE_FIREBASE_API_KEY') || 'AIzaSyA0TZ-WplP37QdSMxEIpB0TvyjW0XY1kIk',
  authDomain: getOptionalFrontendEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'campusconnect-361b7.firebaseapp.com',
  projectId: getOptionalFrontendEnv('VITE_FIREBASE_PROJECT_ID') || 'campusconnect-361b7',
  storageBucket: getOptionalFrontendEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'campusconnect-361b7.firebasestorage.app',
  messagingSenderId: getOptionalFrontendEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '518715623725',
  appId: getOptionalFrontendEnv('VITE_FIREBASE_APP_ID') || '1:518715623725:web:4a7d0aca5b46a08b476ba4',
  measurementId: getOptionalFrontendEnv('VITE_FIREBASE_MEASUREMENT_ID') || 'G-ZGVXG5C8NS',
};

export const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const analytics: Analytics | null = typeof window !== 'undefined' ? getAnalytics(app) : null;
