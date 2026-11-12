/**
 * React Native counterpart of ../../../src/lib/firebase.ts with the same exports.
 * metro.config.js swaps it in wherever shared code imports the web module.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as authApi from 'firebase/auth';
import * as fs from 'firebase/firestore';
import type { Auth, Persistence } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Metro picks Firebase's React Native build, which adds this function; the default typings omit it.
const { getReactNativePersistence } = authApi as typeof authApi & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

const config = {
  apiKey: 'AIzaSyBc9B0ob_sB6BArRfqqsi1ac2sNC46Qbd0',
  authDomain: 'toguz-korgo.firebaseapp.com',
  projectId: 'toguz-korgo',
  storageBucket: 'toguz-korgo.firebasestorage.app',
  messagingSenderId: '747782052780',
  appId: '1:747782052780:web:4bfbb1144132e1dea8f809',
};

/** Same named database as the web build (EXPO_PUBLIC_FIRESTORE_DATABASE ↔ VITE_FIRESTORE_DATABASE). */
const databaseId = process.env.EXPO_PUBLIC_FIRESTORE_DATABASE || '(default)';

export const firebaseConfigured = true;

export interface FirebaseKit {
  auth: Auth;
  db: Firestore;
  authApi: typeof import('firebase/auth');
  fs: typeof import('firebase/firestore');
}

let kit: FirebaseKit | null = null;

function init(): FirebaseKit {
  const app = getApps().length ? getApp() : initializeApp(config);
  let auth: Auth;
  try {
    // Keeps the player signed in between launches.
    auth = authApi.initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Already initialised (fast refresh during development).
    auth = authApi.getAuth(app);
  }
  const db = databaseId === '(default)' ? fs.getFirestore(app) : fs.getFirestore(app, databaseId);
  return { auth, db, authApi, fs };
}

export function loadFirebase(): Promise<FirebaseKit> {
  try {
    kit ??= init();
    return Promise.resolve(kit);
  } catch (error) {
    return Promise.reject(error);
  }
}

export function loadedFirebase(): FirebaseKit | null {
  return kit;
}

export function preloadFirebase() {
  void loadFirebase().catch(() => undefined);
}
