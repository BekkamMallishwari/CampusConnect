import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { requireFrontendEnv } from '../lib/env';

const firebaseConfig = {
  apiKey: requireFrontendEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireFrontendEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireFrontendEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireFrontendEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireFrontendEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireFrontendEnv('VITE_FIREBASE_APP_ID'),
  measurementId: requireFrontendEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
