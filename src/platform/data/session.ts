import type { User } from 'firebase/auth';
import { loadFirebase, type FirebaseKit } from '../../lib/firebase';

/** The signed-in player, signing in as a guest when needed (as online play does). */
export async function ensureUser(): Promise<{ fb: FirebaseKit; user: User }> {
  const fb = await loadFirebase();
  await fb.auth.authStateReady();
  const user = fb.auth.currentUser ?? (await fb.authApi.signInAnonymously(fb.auth)).user;
  return { fb, user };
}

/** The current user without signing anyone in; null for visitors without a session. */
export async function currentUser(): Promise<{ fb: FirebaseKit; user: User | null }> {
  const fb = await loadFirebase();
  await fb.auth.authStateReady();
  return { fb, user: fb.auth.currentUser };
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomCode(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, byte => CODE_CHARS[byte % CODE_CHARS.length]).join('');
}

export function normalizeCode(raw: string, length: number) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length);
}
