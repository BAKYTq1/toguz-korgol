/**
 * Toguz Korgool — WebSocket relay server
 *
 * A room holds exactly 2 players. The server only forwards messages,
 * never validates game logic (both clients run the same deterministic engine).
 *
 * Protocol:
 *   client → server:  { type: 'join',    room: string }
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

const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ port: Number(PORT) });

/** @type {Map<string, { sockets: WebSocket[], slots: (WebSocket|null)[] }>} */
const rooms = new Map();

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', (ws) => {
  let currentRoom = null;
  let mySlot = -1;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === 'join') {
      const roomId = String(msg.room || '').trim().toUpperCase().slice(0, 20);
      if (!roomId) { send(ws, { type: 'error', message: 'Invalid room code.' }); return; }

      let room = rooms.get(roomId);
      if (!room) {
        room = { sockets: [], slots: [null, null] };
        rooms.set(roomId, room);
      }

      // Assign a slot
      if (room.slots[0] === null) {
        room.slots[0] = ws;
        mySlot = 0;
      } else if (room.slots[1] === null) {
        room.slots[1] = ws;
        mySlot = 1;
      } else {
        send(ws, { type: 'error', message: 'Room is full.' });
        return;
      }

      room.sockets.push(ws);
      currentRoom = roomId;
      send(ws, { type: 'joined', youAre: mySlot });

      // Both players present → start
      if (room.slots[0] !== null && room.slots[1] !== null) {
        send(room.slots[0], { type: 'start' });
        send(room.slots[1], { type: 'start' });
      }

      return;
    }

    // All other messages: forward to peer
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const peerSlot = mySlot === 0 ? 1 : 0;
    const peer = room.slots[peerSlot];
    if (peer && peer !== ws) {
      send(peer, msg);
    }
  });

  ws.on('close', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    // Notify peer
    const peerSlot = mySlot === 0 ? 1 : 0;
    const peer = room.slots[peerSlot];
    if (peer) send(peer, { type: 'peer-left' });

    // Clear slot
    room.slots[mySlot] = null;
    room.sockets = room.sockets.filter(s => s !== ws);

    // Clean up empty room
    if (room.slots[0] === null && room.slots[1] === null) {
      rooms.delete(currentRoom);
    }
  });

  ws.on('error', () => ws.terminate());
});

console.log(`Toguz Korgool WS server running on ws://0.0.0.0:${PORT}`);
