/**
 * WebSocket multiplayer client hook.
 * The server is a thin relay — it only forwards {type:'move', idx} messages
 * between two peers in a room. Game logic runs identically on both sides.
 */

import { useCallback, useRef, useState } from 'react';
import type { Player } from '../game/engine';

export type MPStatus =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'playing'
  | 'disconnected'
  | 'error';

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

export function useMultiplayer(callbacks: MPCallbacks) {
  const wsRef = useRef<WebSocket | null>(null);
  const [mp, setMp] = useState<MPState>({
    status: 'idle',
    myPlayer: null,
    room: null,
    message: '',
  });

  const updateMp = useCallback((partial: Partial<MPState>) => {
    setMp(prev => ({ ...prev, ...partial }));
  }, []);

  const connect = useCallback((serverUrl: string, roomId: string) => {
    if (!serverUrl) { updateMp({ message: 'Укажите адрес сервера.' }); return; }
    if (!roomId) { updateMp({ message: 'Укажите код комнаты.' }); return; }

    if (wsRef.current) wsRef.current.close();

    let ws: WebSocket;
    try {
      ws = new WebSocket(serverUrl);
    } catch (e) {
      updateMp({ status: 'error', message: 'Неверный адрес: ' + (e as Error).message });
      return;
    }
    wsRef.current = ws;
    updateMp({ status: 'connecting', room: roomId, message: 'Подключение к серверу...' });

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'join', room: roomId }));
    });

    ws.addEventListener('message', (ev: MessageEvent<string>) => {
      let msg: { type: string; youAre?: number; idx?: number; message?: string };
      try { msg = JSON.parse(ev.data); } catch { return; }

      switch (msg.type) {
        case 'joined':
          updateMp({
            status: 'waiting',
            myPlayer: (msg.youAre ?? 0) as Player,
            message: `Вы — Игрок ${(msg.youAre ?? 0) + 1}. Ждём соперника...`,
          });
          break;
        case 'start':
          updateMp({ status: 'playing', message: 'Соперник подключился!' });
          break;
        case 'move':
          if (msg.idx !== undefined) callbacks.onMove(msg.idx);
          break;
        case 'restart':
          callbacks.onRestart();
          break;
        case 'peer-left':
          updateMp({ status: 'disconnected', message: 'Соперник отключился.' });
          callbacks.onPeerLeft();
          break;
        case 'error':
          updateMp({ status: 'error', message: 'Ошибка: ' + (msg.message ?? '') });
          break;
      }
    });

    ws.addEventListener('close', () => {
      if (wsRef.current === ws) {
        const wasPlaying = mp.status === 'playing';
        updateMp({
          status: wasPlaying ? 'disconnected' : mp.status,
          message: wasPlaying ? 'Соединение потеряно.' : mp.message,
        });
      }
    });

    ws.addEventListener('error', () => {
      updateMp({ status: 'error', message: 'Не удалось подключиться. Проверьте адрес сервера.' });
    });
  }, [callbacks, updateMp]);

  const sendMove = useCallback((idx: number) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'move', idx }));
    }
  }, []);

  const sendRestart = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'restart' }));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    updateMp({ status: 'idle', myPlayer: null, room: null, message: '' });
  }, [updateMp]);

  const randomRoom = useCallback((): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }, []);

  return { mp, connect, sendMove, sendRestart, disconnect, randomRoom };
}
