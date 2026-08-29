import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import {
  createRoom,
  joinRoom,
  findRoomByPlayerId,
  removeRoom,
} from "./rooms.js";
import { logger } from "./logger.js";

type Msg = { type: string; [key: string]: unknown };

function send(ws: WebSocket, msg: Msg) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function attachWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let playerId: string | null = null;

    ws.on("message", (data) => {
      let msg: Msg;
      try {
        msg = JSON.parse(data.toString()) as Msg;
      } catch {
        return;
      }

      switch (msg.type) {
        case "create_room": {
          const { room, hostId } = createRoom(ws);
          playerId = hostId;
          send(ws, { type: "room_created", roomId: room.id, playerId: hostId, role: "host" });
          logger.info({ roomId: room.id }, "Room created");
          break;
        }

        case "join_room": {
          const roomId = String(msg.roomId ?? "").toUpperCase().trim();
          const result = joinRoom(roomId, ws);
          if (!result) {
            send(ws, { type: "error", code: "ROOM_NOT_FOUND", message: "Room not found or already full." });
            return;
          }
          const { room, guestId } = result;
          playerId = guestId;
          send(ws, { type: "room_joined", roomId: room.id, playerId: guestId, role: "guest" });
          if (room.host?.ws) {
            send(room.host.ws, { type: "opponent_joined" });
          }
          logger.info({ roomId: room.id }, "Guest joined");
          break;
        }

        case "start_game": {
          if (!playerId) return;
          const room = findRoomByPlayerId(playerId);
          if (!room || room.host?.id !== playerId || room.phase !== "waiting") return;
          if (!room.guest) {
            send(ws, { type: "error", code: "NO_OPPONENT", message: "No opponent in room yet." });
            return;
          }
          room.settings = msg.settings as Record<string, unknown>;
          room.phase = "playing";
          room.setterIsHost = true;
          room.round = 1;
          const startMsg = {
            type: "game_started",
            settings: room.settings,
            setterIsHost: true,
            hostLetters: 0,
            guestLetters: 0,
            round: 1,
          };
          send(room.host.ws, startMsg);
          send(room.guest.ws, startMsg);
          logger.info({ roomId: room.id }, "Game started");
          break;
        }

        case "set_pattern": {
          if (!playerId) return;
          const room = findRoomByPlayerId(playerId);
          if (!room || room.phase !== "playing") return;
          const isHost = room.host?.id === playerId;
          if (isHost !== room.setterIsHost) return;

          const pattern = msg.pattern as number[];
          const repeaterWs = room.setterIsHost ? room.guest?.ws : room.host?.ws;
          if (repeaterWs) send(repeaterWs, { type: "pattern_received", pattern });
          send(ws, { type: "pattern_sent" });
          break;
        }

        case "round_result": {
          if (!playerId) return;
          const room = findRoomByPlayerId(playerId);
          if (!room || room.phase !== "playing") return;
          const isHost = room.host?.id === playerId;
          const repeaterIsHost = !room.setterIsHost;
          if (isHost !== repeaterIsHost) return;

          const success = Boolean(msg.success);
          if (!success) {
            if (repeaterIsHost) room.host!.letters++;
            else room.guest!.letters++;
          }

          const hostLetters = room.host?.letters ?? 0;
          const guestLetters = room.guest?.letters ?? 0;

          if (hostLetters >= 5 || guestLetters >= 5) {
            const winner = hostLetters < 5 ? "host" : "guest";
            room.phase = "done";
            const overMsg = { type: "game_over", winner, hostLetters, guestLetters };
            if (room.host?.ws) send(room.host.ws, overMsg);
            if (room.guest?.ws) send(room.guest.ws, overMsg);
            removeRoom(room.id);
            logger.info({ roomId: room.id, winner }, "Game over");
          } else {
            room.setterIsHost = !room.setterIsHost;
            room.round++;
            const outcomeMsg = {
              type: "round_outcome",
              success,
              hostLetters,
              guestLetters,
              nextSetterIsHost: room.setterIsHost,
              round: room.round,
            };
            if (room.host?.ws) send(room.host.ws, outcomeMsg);
            if (room.guest?.ws) send(room.guest.ws, outcomeMsg);
          }
          break;
        }

        case "ping": {
          send(ws, { type: "pong" });
          break;
        }
      }
    });

    ws.on("close", () => {
      if (!playerId) return;
      const room = findRoomByPlayerId(playerId);
      if (room) {
        const opponentWs =
          room.host?.id === playerId ? room.guest?.ws : room.host?.ws;
        if (opponentWs) send(opponentWs, { type: "opponent_disconnected" });
        removeRoom(room.id);
        logger.info({ roomId: room.id }, "Room closed — player disconnected");
      }
    });
  });

  logger.info("WebSocket server attached at /ws");
  return wss;
}
