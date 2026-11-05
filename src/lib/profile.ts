import type { User } from 'firebase/auth';
import type { Lang } from '../i18n/translations';
import { t } from '../i18n/translations';
import { loadFirebase } from './firebase';

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

/** Creates the profile if needed and resolves to the player's display name. */
export async function ensureUserProfile(user: User, lang: Lang, legacyStats?: ProfileStats): Promise<string> {
  const { db, fs } = await loadFirebase();
  const ref = fs.doc(db, 'profiles', user.uid);
  return fs.runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      const displayName = user.isAnonymous
        ? guestDisplayName(user.uid, lang)
        : (user.displayName || user.email?.split('@')[0] || t(lang, 'player1')).slice(0, 28);
      transaction.set(ref, {
        displayName,
        bio: '',
        stats: legacyStats ?? emptyProfileStats(),
        legacyStatsImported: Boolean(legacyStats),
        migratedGuestUids: [],
        createdAt: fs.serverTimestamp(),
        updatedAt: fs.serverTimestamp(),
      });
      return displayName;
    }
    const data = snapshot.data();
    const displayName = String(data.displayName || guestDisplayName(user.uid, lang));
    if (!legacyStats || data.legacyStatsImported) return displayName;
    const current = (data.stats ?? emptyProfileStats()) as ProfileStats;
    transaction.update(ref, {
      stats: {
        wins: Math.max(current.wins, legacyStats.wins),
        losses: Math.max(current.losses, legacyStats.losses),
        draws: Math.max(current.draws, legacyStats.draws),
      },
      legacyStatsImported: true,
      updatedAt: fs.serverTimestamp(),
    });
    return displayName;
  });
}

// Default names given to guests in every language (see guestDisplayName / recordProfileGame).
const DEFAULT_NAME = /^(Конок|Гость|Guest|Player) [A-Z0-9]{5}$/;

/** After registration, replaces the automatic guest name with the account's own name. */
export async function adoptAccountName(user: User): Promise<void> {
  if (user.isAnonymous) return;
  const name = (user.displayName || user.email?.split('@')[0] || '').trim().slice(0, 28);
  if (!name) return;
  const { db, fs } = await loadFirebase();
  const ref = fs.doc(db, 'profiles', user.uid);
  await fs.runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists() || !DEFAULT_NAME.test(String(snapshot.data().displayName ?? ''))) return;
    transaction.update(ref, { displayName: name, updatedAt: fs.serverTimestamp() });
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
  const { db, fs } = await loadFirebase();
  await fs.updateDoc(fs.doc(db, 'profiles', uid), {
    displayName: displayName.trim().slice(0, 28),
    bio: bio.trim().slice(0, 160),
    updatedAt: fs.serverTimestamp(),
  });
}

export async function recordProfileGame(uid: string, result: keyof ProfileStats) {
  const { db, fs } = await loadFirebase();
  const ref = fs.doc(db, 'profiles', uid);
  // One write in the common case; the transaction below only creates a missing profile.
  try {
    await fs.updateDoc(ref, { [`stats.${result}`]: fs.increment(1), updatedAt: fs.serverTimestamp() });
    return;
  } catch (error) {
    if ((error as { code?: string }).code !== 'not-found') throw error;
  }
  await fs.runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      const stats = emptyProfileStats();
      stats[result] = 1;
      transaction.set(ref, {
        displayName: `Player ${uid.slice(-5).toUpperCase()}`,
        bio: '', stats, migratedGuestUids: [], updatedAt: fs.serverTimestamp(),
      });
      return;
    }
    transaction.update(ref, { [`stats.${result}`]: fs.increment(1), updatedAt: fs.serverTimestamp() });
  });
}

export async function mergeGuestProfile(targetUid: string, guestUid: string, guest: UserProfile | null) {
  if (!guest || targetUid === guestUid) return;
  const { db, fs } = await loadFirebase();
  const targetRef = fs.doc(db, 'profiles', targetUid);
  await fs.runTransaction(db, async transaction => {
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
      updatedAt: fs.serverTimestamp(),
    });
  });
}
