import { useCallback, useRef, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Player } from '../game/engine';
import { firebaseAuth, firebaseConfigured, firestore } from '../lib/firebase';
import { t } from '../i18n/translations';
import type { Lang } from '../i18n/translations';

export type MPStatus = 'idle' | 'connecting' | 'waiting' | 'playing' | 'disconnected' | 'error';

export interface MPState {
  status: MPStatus;
  myPlayer: Player | null;
  room: string | null;
  message: string;
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
  turn: Player;
  revision: number;
  event?: { type: 'move' | 'restart'; idx?: number; from: string; revision: number };
  createdAt?: { toMillis?: () => number };
  lastSeen0?: { toMillis?: () => number };
  lastSeen1?: { toMillis?: () => number };
  closedBy?: string;
}

export function useMultiplayer(callbacks: MPCallbacks, lang: Lang) {
  const [mp, setMp] = useState<MPState>({ status: 'idle', myPlayer: null, room: null, message: '' });
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const roomRef = useRef<DocumentReference | null>(null);
  const uidRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<Player | null>(null);
  const lastRevisionRef = useRef(0);
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

  const watchRoom = useCallback((roomRefValue: DocumentReference, uid: string, slot: Player) => {
    clearListener();
    roomRef.current = roomRefValue;
    uidRef.current = uid;
    playerRef.current = slot;
    lastRevisionRef.current = 0;
    peerTimedOutRef.current = false;
    updateMp({ status: 'waiting', myPlayer: slot, room: roomRefValue.id, message: t(lang, 'waitingOpponent') });

    const ownHeartbeat = slot === 0 ? 'lastSeen0' : 'lastSeen1';
    const peerHeartbeat = slot === 0 ? 'lastSeen1' : 'lastSeen0';
    heartbeatRef.current = setInterval(() => {
      void updateDoc(roomRefValue, { [ownHeartbeat]: serverTimestamp() }).catch(() => undefined);
    }, 20_000);

    unsubscribeRef.current = onSnapshot(roomRefValue, snapshot => {
      if (!snapshot.exists()) {
        updateMp({ status: 'disconnected', message: t(lang, 'opponentLeft') });
        callbacksRef.current.onPeerLeft();
        return;
      }

      const room = snapshot.data() as RoomData;
      if (room.status === 'closed') {
        updateMp({ status: 'disconnected', message: t(lang, 'opponentLeft') });
        callbacksRef.current.onPeerLeft();
        return;
      }
      if (room.status === 'playing') {
        updateMp({ status: 'playing', message: '' });
        const peerLastSeen = room[peerHeartbeat]?.toMillis?.();
        if (peerLastSeen && Date.now() - peerLastSeen > 75_000 && !peerTimedOutRef.current) {
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

  const findMatch = useCallback(async () => {
    if (!firebaseConfigured || !firebaseAuth || !firestore) {
      updateMp({ status: 'error', message: 'Firebase не настроен для этого сайта.' });
      return;
    }

    clearListener();
    updateMp({ status: 'connecting', message: 'Подключаемся к онлайн-игре…', room: null, myPlayer: null });
    try {
      const credential = firebaseAuth.currentUser
        ? { user: firebaseAuth.currentUser }
        : await signInAnonymously(firebaseAuth);
      const uid = credential.user.uid;
      uidRef.current = uid;

      const waitingQuery = query(collection(firestore, 'rooms'), where('status', '==', 'waiting'), limit(20));
      const waitingRooms = await getDocs(waitingQuery);
      const staleBefore = Date.now() - 75_000;

      for (const candidate of waitingRooms.docs) {
        const candidateData = candidate.data() as RoomData;
        if (candidateData.player0 === uid) continue;
        const lastSeen = candidateData.lastSeen0?.toMillis?.() ?? candidateData.createdAt?.toMillis?.();
        if (lastSeen && lastSeen < staleBefore) {
          await runTransaction(firestore, async transaction => {
            const fresh = await transaction.get(candidate.ref);
            if (!fresh.exists()) return;
            const current = fresh.data() as RoomData;
            const currentLastSeen = current.lastSeen0?.toMillis?.() ?? current.createdAt?.toMillis?.();
            if (current.status === 'waiting' && currentLastSeen && currentLastSeen < staleBefore) {
              transaction.delete(candidate.ref);
            }
          });
          continue;
        }

        const candidateRef = doc(firestore, 'rooms', candidate.id);
        const paired = await runTransaction(firestore, async transaction => {
          const fresh = await transaction.get(candidateRef);
          if (!fresh.exists()) return false;
          const current = fresh.data() as RoomData;
          if (current.status !== 'waiting' || current.player1 || current.player0 === uid) return false;
          transaction.update(candidateRef, { player1: uid, status: 'playing', lastSeen1: serverTimestamp(), updatedAt: serverTimestamp() });
          return true;
        });
        if (paired) {
          watchRoom(candidateRef, uid, 1);
          return;
        }
      }

      const newRoom = doc(collection(firestore, 'rooms'));
      await setDoc(newRoom, {
        status: 'waiting', player0: uid, player1: null, turn: 0, revision: 0,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(), lastSeen0: serverTimestamp(),
      });
      watchRoom(newRoom, uid, 0);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      updateMp({ status: 'error', message: `Не удалось подключиться к Firebase: ${detail}` });
    }
  }, [clearListener, updateMp, watchRoom]);

  const sendMove = useCallback(async (idx: number) => {
    const roomRefValue = roomRef.current;
    const uid = uidRef.current;
    const player = playerRef.current;
    if (!roomRefValue || !uid || player === null || !firestore) return;
    try {
      await runTransaction(firestore, async transaction => {
        const snapshot = await transaction.get(roomRefValue);
        if (!snapshot.exists()) return;
        const room = snapshot.data() as RoomData;
        if (room.status !== 'playing' || room.turn !== player) return;
        const revision = room.revision + 1;
        transaction.update(roomRefValue, {
          turn: player === 0 ? 1 : 0,
          revision,
          event: { type: 'move', idx, from: uid, revision },
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      updateMp({ status: 'error', message: `Не удалось отправить ход: ${detail}` });
    }
  }, [updateMp]);

  const sendRestart = useCallback(async () => {
    const roomRefValue = roomRef.current;
    const uid = uidRef.current;
    if (!roomRefValue || !uid || !firestore) return;
    try {
      await runTransaction(firestore, async transaction => {
        const snapshot = await transaction.get(roomRefValue);
        if (!snapshot.exists()) return;
        const room = snapshot.data() as RoomData;
        if (room.status !== 'playing' || (room.player0 !== uid && room.player1 !== uid)) return;
        const revision = room.revision + 1;
        transaction.update(roomRefValue, {
          turn: 0,
          revision,
          event: { type: 'restart', from: uid, revision },
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      updateMp({ status: 'error', message: `Не удалось перезапустить игру: ${detail}` });
    }
  }, [updateMp]);

  const disconnect = useCallback(async () => {
    clearListener();
    const roomRefValue = roomRef.current;
    const uid = uidRef.current;
    roomRef.current = null;
    playerRef.current = null;
    if (roomRefValue && uid && firestore) {
      try {
        await runTransaction(firestore, async transaction => {
          const snapshot = await transaction.get(roomRefValue);
          if (!snapshot.exists()) return;
          const room = snapshot.data() as RoomData;
          if (room.status === 'waiting' && room.player0 === uid) transaction.delete(roomRefValue);
          else if (room.status === 'playing') transaction.update(roomRefValue, { status: 'closed', closedBy: uid });
        });
      } catch {
        // The local session still resets if the network is already gone.
      }
    }
    updateMp({ status: 'idle', myPlayer: null, room: null, message: '' });
  }, [clearListener, updateMp]);

  const randomRoom = useCallback((): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }, []);

  return { mp, findMatch, sendMove, sendRestart, disconnect, randomRoom };
}
