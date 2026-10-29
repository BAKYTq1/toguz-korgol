import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBc9B0ob_sB6BArRfqqsi1ac2sNC46Qbd0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'toguz-korgo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'toguz-korgo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'toguz-korgo.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '747782052780',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:747782052780:web:4bfbb1144132e1dea8f809',
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
const app = firebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null;

export const firebaseAuth = app ? getAuth(app) : null;
export const firestore = app ? getFirestore(app) : null;
