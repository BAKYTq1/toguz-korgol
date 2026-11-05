/**
 * Firebase is loaded on demand: the SDK is most of the bundle, and offline games never need it.
 * Call loadFirebase() before any Firebase work; it downloads and initialises the SDK once.
 */
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBc9B0ob_sB6BArRfqqsi1ac2sNC46Qbd0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'toguz-korgo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'toguz-korgo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'toguz-korgo.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '747782052780',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:747782052780:web:4bfbb1144132e1dea8f809',
};

/** Named Firestore database, e.g. one created in a region closer to the players. */
const databaseId = import.meta.env.VITE_FIRESTORE_DATABASE || '(default)';

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

export interface FirebaseKit {
  auth: Auth;
  db: Firestore;
  authApi: typeof import('firebase/auth');
  fs: typeof import('firebase/firestore');
}

let kit: FirebaseKit | null = null;
let loading: Promise<FirebaseKit> | null = null;

export function loadFirebase(): Promise<FirebaseKit> {
  if (!firebaseConfigured) {
    return Promise.reject(Object.assign(new Error('Firebase is not configured'), { code: 'not-configured' }));
  }
  if (!loading) {
    loading = Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
      .then(([appApi, authApi, fs]) => {
        const app = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(config);
        kit = {
          auth: authApi.getAuth(app),
          db: databaseId === '(default)' ? fs.getFirestore(app) : fs.getFirestore(app, databaseId),
          authApi,
          fs,
        };
        return kit;
      })
      .catch(error => {
        loading = null; // allow a retry, e.g. after the network comes back
        throw error;
      });
  }
  return loading;
}

/** The SDK if it has already been loaded, without triggering a download. */
export function loadedFirebase(): FirebaseKit | null {
  return kit;
}

/** Starts the download in the background, e.g. when the player is about to go online. */
export function preloadFirebase() {
  if (firebaseConfigured) void loadFirebase().catch(() => undefined);
}
