/**
 * Toguz Korgool — WebSocket relay server
 *
 * A room holds exactly 2 players. The server only forwards messages,
 * never validates game logic (both clients run the same deterministic engine).
 *
 * Protocol:
 *   client → server:  { type: 'join',    room: string }
 *   client → server:  { type: 'find-match' }
 *   server → client:  { type: 'searching' }
 *   server → client:  { type: 'match-found', youAre: 0|1, room: string }
 *   client → server:  { type: 'cancel-match' }
 *   server → client:  { type: 'joined',  youAre: 0|1 }
 *   server → both:    { type: 'start' }
 *   client → server:  { type: 'move',    idx: number }
 *   server → peer:    { type: 'move',    idx: number }
 *   client → server:  { type: 'restart' }
 *   server → peer:    { type: 'restart' }
 *   server → client:  { type: 'peer-left' }
 *   server → client:  { type: 'error',   message: string }
 */

import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';

const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ port: Number(PORT) });

/** @type {Map<string, { slots: (WebSocket|null)[] }>} */
const rooms = new Map();
/** @type {WebSocket[]} */
const matchmakingQueue = [];
/** @type {Map<WebSocket, { roomId: string|null, slot: number, queued: boolean }>} */
const clients = new Map();

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', (ws) => {
  const client = { roomId: null, slot: -1, queued: false };
  clients.set(ws, client);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === 'find-match') {
      if (client.roomId || client.queued) {
        send(ws, { type: 'error', message: 'You are already in a room or queue.' });
        return;
      }

      let opponent;
      while (matchmakingQueue.length > 0 && !opponent) {
        const candidate = matchmakingQueue.shift();
        const candidateState = candidate && clients.get(candidate);
        if (candidate && candidate.readyState === WebSocket.OPEN && candidateState?.queued) {
          opponent = candidate;
          candidateState.queued = false;
        }
      }

      if (!opponent) {
        client.queued = true;
        matchmakingQueue.push(ws);
        send(ws, { type: 'searching' });
        return;
      }

      const roomId = `match-${randomUUID()}`;
      const room = { slots: [opponent, ws] };
      rooms.set(roomId, room);
      client.roomId = roomId;
      client.slot = 1;
      const opponentState = clients.get(opponent);
      opponentState.roomId = roomId;
      opponentState.slot = 0;

      send(opponent, { type: 'match-found', youAre: 0, room: roomId });
      send(ws, { type: 'match-found', youAre: 1, room: roomId });
      send(opponent, { type: 'start' });
      send(ws, { type: 'start' });
      return;
    }

    if (msg.type === 'cancel-match') {
      if (client.queued) {
        client.queued = false;
        const index = matchmakingQueue.indexOf(ws);
        if (index !== -1) matchmakingQueue.splice(index, 1);
      }
      return;
    }

    if (msg.type === 'join') {
      if (client.roomId || client.queued) {
        send(ws, { type: 'error', message: 'You are already in a room or queue.' });
        return;
      }
      const roomId = String(msg.room || '').trim().toUpperCase().slice(0, 20);
      if (!roomId) { send(ws, { type: 'error', message: 'Invalid room code.' }); return; }

      let room = rooms.get(roomId);
      if (!room) {
        room = { slots: [null, null] };
        rooms.set(roomId, room);
      }

      // Assign a slot
      if (room.slots[0] === null) {
        room.slots[0] = ws;
        client.slot = 0;
      } else if (room.slots[1] === null) {
        room.slots[1] = ws;
        client.slot = 1;
      } else {
        send(ws, { type: 'error', message: 'Room is full.' });
        return;
      }

      client.roomId = roomId;
      send(ws, { type: 'joined', youAre: client.slot });

      // Both players present → start
      if (room.slots[0] !== null && room.slots[1] !== null) {
        send(room.slots[0], { type: 'start' });
        send(room.slots[1], { type: 'start' });
      }

      return;
    }

    // All other messages: forward to peer
    if (!client.roomId) return;
    const room = rooms.get(client.roomId);
    if (!room) return;

    const peerSlot = client.slot === 0 ? 1 : 0;
    const peer = room.slots[peerSlot];
    if (peer && peer !== ws) {
      send(peer, msg);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (client.queued) {
      const index = matchmakingQueue.indexOf(ws);
      if (index !== -1) matchmakingQueue.splice(index, 1);
    }
    if (!client.roomId) return;
    const room = rooms.get(client.roomId);
    if (!room) return;

    // Notify peer
    const peerSlot = client.slot === 0 ? 1 : 0;
    const peer = room.slots[peerSlot];
    if (peer) send(peer, { type: 'peer-left' });

    // Clear slot
    room.slots[client.slot] = null;

    // Clean up empty room
    if (room.slots[0] === null && room.slots[1] === null) {
      rooms.delete(client.roomId);
    }
  });

  ws.on('error', () => ws.terminate());
});

console.log(`Toguz Korgool WS server running on ws://0.0.0.0:${PORT}`);
