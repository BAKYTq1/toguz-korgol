import { useCallback, useRef, useState } from 'react';
import type { DocumentReference, Unsubscribe } from 'firebase/firestore';
import type { Player } from '../game/engine';
import { loadFirebase, loadedFirebase, type FirebaseKit } from '../lib/firebase';
import { ensureUserProfile, guestDisplayName } from '../lib/profile';
import { t } from '../i18n/translations';
import type { Lang } from '../i18n/translations';

export type MPStatus = 'idle' | 'connecting' | 'waiting' | 'playing' | 'disconnected' | 'error';

export interface MPState {
  status: MPStatus;
  myPlayer: Player | null;
  room: string | null;
  message: string;
  playerNames: [string | null, string | null];
  /** A room created for a friend (joined by its code) rather than a random match. */
  isPrivate: boolean;
}

export const ROOM_CODE_LENGTH = 5;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomRoomCode() {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]).join('');
}

/** Upper-cases a typed or pasted code and drops anything that cannot be part of it. */
export function normalizeRoomCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH);
}

export interface MPCallbacks {
  onMove: (idx: number) => void;
  onRestart: () => void;
  onPeerLeft: () => void;
}

interface RoomData {
  status: 'waiting' | 'playing' | 'closed';
  player0: string;
  player1: string | null;
  name0?: string;
  name1?: string;
  private?: boolean;
  turn: Player;
  revision: number;
  event?: { type: 'move' | 'restart'; idx?: number; from: string; revision: number };
  createdAt?: { toMillis?: () => number };
  lastSeen0?: { toMillis?: () => number };
  lastSeen1?: { toMillis?: () => number };
  closedBy?: string;
}

const STALE_ROOM_MS = 75_000;

function errorCode(error: unknown) {
  return (error as { code?: string } | null)?.code;
}

export function useMultiplayer(callbacks: MPCallbacks, lang: Lang) {
  const [mp, setMp] = useState<MPState>({ status: 'idle', myPlayer: null, room: null, message: '', playerNames: [null, null], isPrivate: false });
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const roomRef = useRef<DocumentReference | null>(null);
  const uidRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<Player | null>(null);
  const lastRevisionRef = useRef(0);
  // Latest room state seen (including our own pending writes), used to write without a transaction.
  const roomRevisionRef = useRef(0);
  const roomStatusRef = useRef<RoomData['status'] | null>(null);
  const peerTimedOutRef = useRef(false);

  const clearListener = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
  }, []);

  const updateMp = useCallback((partial: Partial<MPState>) => {
    setMp(previous => ({ ...previous, ...partial }));
  }, []);

  const watchRoom = useCallback((fb: FirebaseKit, roomRefValue: DocumentReference, uid: string, slot: Player, isPrivate: boolean) => {
    const { fs } = fb;
    clearListener();
    roomRef.current = roomRefValue;
    uidRef.current = uid;
    playerRef.current = slot;
    lastRevisionRef.current = 0;
    roomRevisionRef.current = 0;
    roomStatusRef.current = 'waiting';
    peerTimedOutRef.current = false;
    updateMp({
      status: 'waiting', myPlayer: slot, room: roomRefValue.id, isPrivate,
      message: t(lang, isPrivate && slot === 0 ? 'waitingFriend' : 'waitingOpponent'),
    });

    const ownHeartbeat = slot === 0 ? 'lastSeen0' : 'lastSeen1';
    const peerHeartbeat = slot === 0 ? 'lastSeen1' : 'lastSeen0';
    heartbeatRef.current = setInterval(() => {
      void fs.updateDoc(roomRefValue, { [ownHeartbeat]: fs.serverTimestamp() }).catch(() => undefined);
    }, 20_000);

    unsubscribeRef.current = fs.onSnapshot(roomRefValue, snapshot => {
      if (!snapshot.exists()) {
        roomStatusRef.current = null;
        updateMp({ status: 'disconnected', message: t(lang, 'opponentLeft') });
        callbacksRef.current.onPeerLeft();
        return;
      }

      const room = snapshot.data() as RoomData;
      roomRevisionRef.current = room.revision ?? 0;
      roomStatusRef.current = room.status;
      updateMp({ playerNames: [room.name0 ?? null, room.name1 ?? null] });
      if (room.status === 'closed') {
        updateMp({ status: 'disconnected', message: t(lang, 'opponentLeft') });
        callbacksRef.current.onPeerLeft();
        return;
      }
      if (room.status === 'playing') {
        updateMp({ status: 'playing', message: '' });
        const peerLastSeen = room[peerHeartbeat]?.toMillis?.();
        if (peerLastSeen && Date.now() - peerLastSeen > STALE_ROOM_MS && !peerTimedOutRef.current) {
          peerTimedOutRef.current = true;
          updateMp({ status: 'disconnected', message: t(lang, 'opponentLeft') });
          callbacksRef.current.onPeerLeft();
        }
      }

      const event = room.event;
      if (!event || event.revision <= lastRevisionRef.current) return;
      lastRevisionRef.current = event.revision;
      if (event.from === uid) return;
      if (event.type === 'move' && event.idx !== undefined) callbacksRef.current.onMove(event.idx);
      if (event.type === 'restart') callbacksRef.current.onRestart();
    }, error => {
      updateMp({ status: 'error', message: `${t(lang, 'connectError')} ${error.message}` });
    });
  }, [clearListener, lang, updateMp]);

  /**
   * Signs in (as a guest if needed). The display name is resolved in the background so the
   * caller can look for a room at the same time instead of waiting for the profile first.
   */
  const preparePlayer = useCallback(async () => {
    const fb = await loadFirebase();
    const { auth, authApi } = fb;
    await auth.authStateReady();
    const user = auth.currentUser ?? (await authApi.signInAnonymously(auth)).user;
    uidRef.current = user.uid;
    const fallbackName = guestDisplayName(user.uid, lang);
    // The profile only provides a display name; playing online must not depend on it.
    const displayName = ensureUserProfile(user, lang).catch(error => {
      console.warn('Could not load the player profile, playing as a guest', error);
      return fallbackName;
    });
    return { fb, uid: user.uid, displayName };
  }, [lang]);

  /** Takes the free second seat of a waiting room. Resolves to false if the room is no longer free. */
  const claimSeat = useCallback(async (fb: FirebaseKit, roomRefValue: DocumentReference, uid: string, displayName: string) => {
    const { db, fs } = fb;
    const claim = (withName: boolean) => fs.runTransaction(db, async transaction => {
      const fresh = await transaction.get(roomRefValue);
      if (!fresh.exists()) return false;
      const current = fresh.data() as RoomData;
      if (current.status !== 'waiting' || current.player1 || current.player0 === uid) return false;
      transaction.update(roomRefValue, {
        player1: uid,
        ...(withName ? { name1: displayName } : {}),
        status: 'playing',
        lastSeen1: fs.serverTimestamp(),
        updatedAt: fs.serverTimestamp(),
      });
      return true;
    });
    try {
      return await claim(true);
    } catch (error) {
      // Older deployed security rules do not allow the name field yet.
      if (errorCode(error) !== 'permission-denied') throw error;
      return claim(false);
    }
  }, []);

  const reportError = useCallback((error: unknown) => {
    const detail = errorCode(error) === 'not-configured' ? '' : ` ${error instanceof Error ? error.message : String(error)}`;
    updateMp({ status: 'error', message: `${t(lang, 'connectError')}${detail}` });
  }, [lang, updateMp]);

  const startConnecting = useCallback(() => {
    clearListener();
    updateMp({
      status: 'connecting', message: t(lang, 'onlineConnecting'), room: null, myPlayer: null,
      playerNames: [null, null], isPrivate: false,
    });
  }, [clearListener, lang, updateMp]);

  /** Quick match with a random opponent. */
  const findMatch = useCallback(async () => {
    startConnecting();
    try {
      const { fb, uid, displayName } = await preparePlayer();
      const { db, fs } = fb;

      const waitingQuery = fs.query(fs.collection(db, 'rooms'), fs.where('status', '==', 'waiting'), fs.limit(20));
      const [waitingRooms, name] = await Promise.all([fs.getDocs(waitingQuery), displayName]);
      const staleBefore = Date.now() - STALE_ROOM_MS;

      for (const candidate of waitingRooms.docs) {
        const candidateData = candidate.data() as RoomData;
        if (candidateData.player0 === uid) continue;
        const lastSeen = candidateData.lastSeen0?.toMillis?.() ?? candidateData.createdAt?.toMillis?.();
        if (lastSeen && lastSeen < staleBefore) {
          // Abandoned queue entry: tidy it up in the background, without delaying the search.
          void fs.runTransaction(db, async transaction => {
            const fresh = await transaction.get(candidate.ref);
            if (!fresh.exists()) return;
            const current = fresh.data() as RoomData;
            const currentLastSeen = current.lastSeen0?.toMillis?.() ?? current.createdAt?.toMillis?.();
            if (current.status === 'waiting' && currentLastSeen && currentLastSeen < staleBefore) {
              transaction.delete(candidate.ref);
            }
          }).catch(() => undefined);
          continue;
        }
        // Rooms made for a friend are only joined by their code.
        if (candidateData.private) continue;

        if (await claimSeat(fb, candidate.ref, uid, name)) {
          watchRoom(fb, candidate.ref, uid, 1, false);
          return;
        }
      }

      const newRoom = fs.doc(fs.collection(db, 'rooms'));
      await fs.setDoc(newRoom, {
        status: 'waiting', player0: uid, player1: null, turn: 0, revision: 0,
        name0: name, name1: null, private: false,
        createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp(), lastSeen0: fs.serverTimestamp(),
      });
      watchRoom(fb, newRoom, uid, 0, false);
    } catch (error) {
      reportError(error);
    }
  }, [startConnecting, preparePlayer, claimSeat, watchRoom, reportError]);

  /** Creates a private room whose document id is the short code shared with a friend. */
  const createRoom = useCallback(async () => {
    startConnecting();
    try {
      const { fb, uid, displayName } = await preparePlayer();
      const { db, fs } = fb;
      const name = await displayName;
      for (let attempt = 0; attempt < 5; attempt++) {
        const roomRefValue = fs.doc(db, 'rooms', randomRoomCode());
        const created = await fs.runTransaction(db, async transaction => {
          const existing = await transaction.get(roomRefValue);
          if (existing.exists()) return false;
          transaction.set(roomRefValue, {
            status: 'waiting', player0: uid, player1: null, turn: 0, revision: 0,
            name0: name, name1: null, private: true,
            createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp(), lastSeen0: fs.serverTimestamp(),
          });
          return true;
        });
        if (created) {
          watchRoom(fb, roomRefValue, uid, 0, true);
          return;
        }
      }
      throw new Error('Could not pick a free room code');
    } catch (error) {
      reportError(error);
    }
  }, [startConnecting, preparePlayer, watchRoom, reportError]);

  /** Joins a friend's room by its code. */
  const joinRoom = useCallback(async (rawCode: string) => {
    const code = normalizeRoomCode(rawCode);
    if (code.length !== ROOM_CODE_LENGTH) {
      updateMp({ status: 'error', message: t(lang, 'roomCodeInvalid') });
      return;
    }
    startConnecting();
    try {
      const { fb, uid, displayName } = await preparePlayer();
      const { db, fs } = fb;
      const roomRefValue = fs.doc(db, 'rooms', code);
      const [snapshot, name] = await Promise.all([fs.getDoc(roomRefValue), displayName]);
      if (!snapshot.exists()) {
        updateMp({ status: 'error', message: t(lang, 'roomNotFound') });
        return;
      }
      const room = snapshot.data() as RoomData;
      if (room.player0 === uid) {
        // Re-opening your own invite link: keep waiting in that room.
        if (room.status === 'waiting') watchRoom(fb, roomRefValue, uid, 0, true);
        else updateMp({ status: 'error', message: t(lang, 'roomFull') });
        return;
      }
      if (room.status !== 'waiting' || room.player1) {
        updateMp({ status: 'error', message: t(lang, room.status === 'closed' ? 'roomNotFound' : 'roomFull') });
        return;
      }
      if (await claimSeat(fb, roomRefValue, uid, name)) watchRoom(fb, roomRefValue, uid, 1, true);
      else updateMp({ status: 'error', message: t(lang, 'roomFull') });
    } catch (error) {
      reportError(error);
    }
  }, [lang, updateMp, startConnecting, preparePlayer, claimSeat, watchRoom, reportError]);

  /**
   * Writes the next game event. A single write is enough: the security rules only accept
   * revision + 1 (and check whose turn it is), so a stale write is rejected rather than applied.
   * Only then do we fall back to reading the room in a transaction.
   */
  const sendEvent = useCallback(async (
    build: (room: { revision: number }) => Record<string, unknown> | null,
    failureMessage: string,
  ) => {
    const roomRefValue = roomRef.current;
    const fb = loadedFirebase();
    if (!roomRefValue || !fb) return;
    const { db, fs } = fb;
    const fast = build({ revision: roomRevisionRef.current });
    try {
      if (!fast) return;
      await fs.updateDoc(roomRefValue, { ...fast, updatedAt: fs.serverTimestamp() });
      return;
    } catch (error) {
      if (errorCode(error) !== 'permission-denied') {
        updateMp({ status: 'error', message: `${failureMessage}: ${error instanceof Error ? error.message : String(error)}` });
        return;
      }
    }
    try {
      await fs.runTransaction(db, async transaction => {
        const snapshot = await transaction.get(roomRefValue);
        if (!snapshot.exists()) return;
        const room = snapshot.data() as RoomData;
        if (room.status !== 'playing') return;
        const update = build({ revision: room.revision });
        if (update) transaction.update(roomRefValue, { ...update, updatedAt: fs.serverTimestamp() });
      });
    } catch (error) {
      updateMp({ status: 'error', message: `${failureMessage}: ${error instanceof Error ? error.message : String(error)}` });
    }
  }, [updateMp]);

  const sendMove = useCallback(async (idx: number) => {
    const uid = uidRef.current;
    const player = playerRef.current;
    if (!uid || player === null) return;
    await sendEvent(({ revision }) => ({
      turn: player === 0 ? 1 : 0,
      revision: revision + 1,
      event: { type: 'move', idx, from: uid, revision: revision + 1 },
    }), t(lang, 'connectError'));
  }, [lang, sendEvent]);

  const sendRestart = useCallback(async () => {
    const uid = uidRef.current;
    if (!uid) return;
    await sendEvent(({ revision }) => ({
      turn: 0,
      revision: revision + 1,
      event: { type: 'restart', from: uid, revision: revision + 1 },
    }), t(lang, 'connectError'));
  }, [lang, sendEvent]);

  const disconnect = useCallback(async () => {
    clearListener();
    const roomRefValue = roomRef.current;
    const uid = uidRef.current;
    const status = roomStatusRef.current;
    const fb = loadedFirebase();
    roomRef.current = null;
    playerRef.current = null;
    roomStatusRef.current = null;
    updateMp({ status: 'idle', myPlayer: null, room: null, message: '', playerNames: [null, null], isPrivate: false });
    if (!roomRefValue || !uid || !fb) return;
    const { fs } = fb;
    try {
      // A single write based on the last state we saw; the rules decide whether it is allowed.
      if (status === 'waiting') await fs.deleteDoc(roomRefValue);
      else if (status === 'playing') await fs.updateDoc(roomRefValue, { status: 'closed', closedBy: uid });
    } catch {
      // The local session is already reset; an abandoned room is pruned by the next search.
    }
  }, [clearListener, updateMp]);

  return { mp, findMatch, createRoom, joinRoom, sendMove, sendRestart, disconnect };
}
