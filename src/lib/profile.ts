import type { User } from 'firebase/auth';
import {
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { Lang } from '../i18n/translations';
import { t } from '../i18n/translations';
import { firestore } from './firebase';

export interface ProfileStats {
  wins: number;
  losses: number;
  draws: number;
}

export interface UserProfile {
  displayName: string;
  bio: string;
  stats: ProfileStats;
  migratedGuestUids?: string[];
  legacyStatsImported?: boolean;
}

export const emptyProfileStats = (): ProfileStats => ({ wins: 0, losses: 0, draws: 0 });

export function guestDisplayName(uid: string, lang: Lang) {
  return `${t(lang, 'guestName')} ${uid.slice(-5).toUpperCase()}`;
}

export async function ensureUserProfile(user: User, lang: Lang, legacyStats?: ProfileStats): Promise<void> {
  if (!firestore) throw new Error('Firestore is not configured.');
  const ref = doc(firestore, 'profiles', user.uid);
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      transaction.set(ref, {
        displayName: user.isAnonymous
          ? guestDisplayName(user.uid, lang)
          : (user.displayName || user.email?.split('@')[0] || t(lang, 'player1')).slice(0, 28),
        bio: '',
        stats: legacyStats ?? emptyProfileStats(),
        legacyStatsImported: Boolean(legacyStats),
        migratedGuestUids: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }
    const data = snapshot.data();
    if (!legacyStats || data.legacyStatsImported) return;
    const current = (data.stats ?? emptyProfileStats()) as ProfileStats;
    transaction.update(ref, {
      stats: {
        wins: Math.max(current.wins, legacyStats.wins),
        losses: Math.max(current.losses, legacyStats.losses),
        draws: Math.max(current.draws, legacyStats.draws),
      },
      legacyStatsImported: true,
      updatedAt: serverTimestamp(),
    });
  });
}

// Default names given to guests in every language (see guestDisplayName / recordProfileGame).
const DEFAULT_NAME = /^(Конок|Гость|Guest|Player) [A-Z0-9]{5}$/;

/** After registration, replaces the automatic guest name with the account's own name. */
export async function adoptAccountName(user: User): Promise<void> {
  if (!firestore || user.isAnonymous) return;
  const name = (user.displayName || user.email?.split('@')[0] || '').trim().slice(0, 28);
  if (!name) return;
  const ref = doc(firestore, 'profiles', user.uid);
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists() || !DEFAULT_NAME.test(String(snapshot.data().displayName ?? ''))) return;
    transaction.update(ref, { displayName: name, updatedAt: serverTimestamp() });
  });
}

const LOCAL_STATS_IMPORTED_KEY = 'tk_stats_imported';

/**
 * Device statistics are imported into a profile only once per device; otherwise every new
 * guest session would carry them again and they would be counted twice after a merge.
 */
export function localStatsAlreadyImported(): boolean {
  try {
    return localStorage.getItem(LOCAL_STATS_IMPORTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markLocalStatsImported() {
  try {
    localStorage.setItem(LOCAL_STATS_IMPORTED_KEY, '1');
  } catch {
    // Storage may be unavailable (private mode); the profile flag still prevents repeats.
  }
}

export async function saveUserProfile(uid: string, displayName: string, bio: string) {
  if (!firestore) throw new Error('Firestore is not configured.');
  await updateDoc(doc(firestore, 'profiles', uid), {
    displayName: displayName.trim().slice(0, 28),
    bio: bio.trim().slice(0, 160),
    updatedAt: serverTimestamp(),
  });
}

export async function recordProfileGame(uid: string, result: keyof ProfileStats) {
  if (!firestore) return;
  const ref = doc(firestore, 'profiles', uid);
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      const stats = emptyProfileStats();
      stats[result] = 1;
      transaction.set(ref, {
        displayName: `Player ${uid.slice(-5).toUpperCase()}`,
        bio: '', stats, migratedGuestUids: [], updatedAt: serverTimestamp(),
      });
      return;
    }
    const data = snapshot.data();
    const current = (data.stats ?? emptyProfileStats()) as ProfileStats;
    transaction.update(ref, {
      [`stats.${result}`]: (current[result] ?? 0) + 1,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function mergeGuestProfile(targetUid: string, guestUid: string, guest: UserProfile | null) {
  if (!firestore || !guest || targetUid === guestUid) return;
  const targetRef = doc(firestore, 'profiles', targetUid);
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(targetRef);
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const migrated = (data.migratedGuestUids ?? []) as string[];
    if (migrated.includes(guestUid)) return;

    const current = (data.stats ?? emptyProfileStats()) as ProfileStats;
    transaction.update(targetRef, {
      stats: {
        wins: current.wins + guest.stats.wins,
        losses: current.losses + guest.stats.losses,
        draws: current.draws + guest.stats.draws,
      },
      migratedGuestUids: [...migrated, guestUid],
      updatedAt: serverTimestamp(),
    });
  });
}
