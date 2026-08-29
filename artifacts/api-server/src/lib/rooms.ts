import type { WebSocket } from "ws";

export type RoomId = string;
export type PlayerId = string;

export interface RemotePlayer {
  id: PlayerId;
  role: "host" | "guest";
  ws: WebSocket;
  letters: number;
}

export interface RoomState {
  id: RoomId;
  host: RemotePlayer | null;
  guest: RemotePlayer | null;
  setterIsHost: boolean;
  settings: Record<string, unknown> | null;
  phase: "waiting" | "playing" | "done";
  round: number;
}

const rooms = new Map<RoomId, RoomState>();

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateRoomId(): RoomId {
  return Array.from(
    { length: 6 },
    () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
  ).join("");
}

export function createRoom(hostWs: WebSocket): {
  room: RoomState;
  hostId: PlayerId;
} {
  let id: RoomId;
  do {
    id = generateRoomId();
  } while (rooms.has(id));

  const hostId = crypto.randomUUID();
  const room: RoomState = {
    id,
    host: { id: hostId, role: "host", ws: hostWs, letters: 0 },
    guest: null,
    setterIsHost: true,
    settings: null,
    phase: "waiting",
    round: 1,
  };
  rooms.set(id, room);
  return { room, hostId };
}

export function joinRoom(
  roomId: RoomId,
  guestWs: WebSocket,
): { room: RoomState; guestId: PlayerId } | null {
  const room = rooms.get(roomId.toUpperCase().trim());
  if (!room || room.guest !== null || room.phase !== "waiting") return null;

  const guestId = crypto.randomUUID();
  room.guest = { id: guestId, role: "guest", ws: guestWs, letters: 0 };
  return { room, guestId };
}

export function getRoom(roomId: RoomId): RoomState | undefined {
  return rooms.get(roomId);
}

export function removeRoom(roomId: RoomId): void {
  rooms.delete(roomId);
}

export function findRoomByPlayerId(
  playerId: PlayerId,
): RoomState | undefined {
  for (const room of rooms.values()) {
    if (room.host?.id === playerId || room.guest?.id === playerId) return room;
  }
  return undefined;
}
