import "express-async-errors"; // MUST be imported before routes are defined — without this,
                                // errors thrown inside async route handlers become unhandled
                                // promise rejections in Express 4 instead of reaching errorHandler,
                                // which can crash the whole process on a single bad request.
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

import connectDB from "./config/db.js";
import admin from "./config/firebaseAdmin.js";
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";
import ChatMessage from "./models/ChatMessage.js";
import Meeting from "./models/Meeting.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

// Trust the first proxy hop (needed on Render/Railway/Heroku/etc. for correct
// client IPs in rate limiting and logging — harmless locally).
app.set("trust proxy", 1);

// CORS: in production this MUST be your real frontend origin, never "*" —
// wildcard + credentials is both invalid per spec and a real security hole.
const allowedOrigin = process.env.CLIENT_URL;
if (!allowedOrigin && process.env.NODE_ENV === "production") {
  console.warn("[security] CLIENT_URL is not set — refusing all cross-origin requests in production.");
}
app.use(cors({ origin: allowedOrigin || false, credentials: true }));

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(mongoSanitize()); // strips any $ / . keys from req.body, req.query, req.params
app.use(morgan("dev"));

// Global rate limit — generous enough for normal use, tight enough to blunt scripted abuse.
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
// Meeting codes are short; slow down anyone trying to brute-force one.
app.use("/api/meetings", rateLimit({ windowMs: 5 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/uploads", uploadRoutes);

// --- Optional: serve the frontend's build output from this same server ---
// Only activates if frontend/dist exists (i.e. you built it and it's sitting
// next to this backend folder) — for a COMBINED single-service deployment.
// If you deploy the frontend separately (Vercel/Netlify), this block simply
// never finds the folder and does nothing; no effect on local dev either.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
console.log("Looking for frontend build at:", frontendDistPath, "— found:", fs.existsSync(frontendDistPath));
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api|\/ws).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

/* ---------------------------------------------------------------------- *
 * WebSocket server — one connection per browser tab, used for:
 *   - conversation chat (direct + group), persisted to MongoDB
 *   - meeting chat/comments, ephemeral (not persisted)
 *   - WebRTC signaling for both 1:1 calls (inside a conversation) and
 *     multi-person instant meetings (simple mesh: each pair of peers gets
 *     its own RTCPeerConnection, negotiated via targeted signaling)
 *
 * Client connects to  ws://<host>/ws?token=<firebaseIdToken>
 *
 * Message shapes (all JSON):
 *   { type: "join",   room }
 *   { type: "leave",  room }
 *   { type: "chat",   room, text?, attachment?, clientId? }
 *   { type: "signal", room, to, payload }   // targeted at one peer's user id
 *
 * Server -> client:
 *   { type: "joined-room", room, members: [{id,name}] }   // sent to the joiner only
 *   { type: "presence", event: "peer-joined"|"left", user }
 *   { type: "chat", message, clientId? }
 *   { type: "signal", from: {id,name}, payload }
 * ---------------------------------------------------------------------- */
const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 256 * 1024 }); // 256KB per frame — plenty for chat text; file bytes go via HTTP upload, never over the socket

// room -> Set of { ws, user, rooms }
const rooms = new Map();

// userId (string) -> Set of client objects — EVERY open socket for that user,
// regardless of which room(s) they've joined. This is deliberately separate
// from `rooms`: joining a room means "I'm actively viewing/calling in here"
// (and triggers mesh call signaling), whereas this registry is just "this
// person has a tab open" — used only to push lightweight unread-count
// notifications for conversations they haven't opened yet. Keeping these
// two concepts separate avoids a passive background tab being mistaken for
// someone joining an active call.
const userConnections = new Map();

const isMember = async (room, user) => {
  if (room.startsWith("conversation:")) {
    const id = room.split(":")[1];
    const convo = await Conversation.findOne({ _id: id, members: user._id });
    return !!convo;
  }
  if (room.startsWith("meeting:")) {
    const code = room.split(":")[1];
    const meeting = await Meeting.findOne({ code, workspace: user.workspace });
    return !!meeting;
  }
  return false;
};

const joinRoom = (room, client) => {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(client);
};

const leaveRoom = (room, client) => {
  rooms.get(room)?.delete(client);
  if (rooms.get(room)?.size === 0) rooms.delete(room);
};

const broadcast = (room, data, exceptClient) => {
  const payload = JSON.stringify(data);
  for (const client of rooms.get(room) || []) {
    if (client !== exceptClient && client.ws.readyState === client.ws.OPEN) {
      client.ws.send(payload);
    }
  }
};

const sendTo = (room, targetUserId, data) => {
  const payload = JSON.stringify(data);
  for (const client of rooms.get(room) || []) {
    if (String(client.user._id) === String(targetUserId) && client.ws.readyState === client.ws.OPEN) {
      client.ws.send(payload);
    }
  }
};

// Push to every open tab a given user has, regardless of room membership —
// used for unread-count notifications on conversations they haven't opened.
const notifyUser = (userId, data) => {
  const payload = JSON.stringify(data);
  for (const client of userConnections.get(String(userId)) || []) {
    if (client.ws.readyState === client.ws.OPEN) client.ws.send(payload);
  }
};

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  let user;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) throw new Error("No linked workspace account");
  } catch (err) {
    ws.close(4001, "Unauthorized");
    return;
  }

  const client = { ws, user, rooms: new Set() };

  // Simple sliding-window throttle: max 30 messages/second per connection.
  // Cheap protection against a compromised or malicious client flooding the
  // server with chat writes or signaling spam.
  let messageTimestamps = [];
  const isRateLimited = () => {
    const now = Date.now();
    messageTimestamps = messageTimestamps.filter((t) => now - t < 1000);
    messageTimestamps.push(now);
    return messageTimestamps.length > 30;
  };

  const uid = String(user._id);
  if (!userConnections.has(uid)) userConnections.set(uid, new Set());
  userConnections.get(uid).add(client);

  ws.on("message", async (raw) => {
    if (isRateLimited()) return; // silently drop — no need to tell a spammer why

    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "join" && msg.room) {
      const allowed = await isMember(msg.room, user);
      if (!allowed) return;

      const existingMembers = [...(rooms.get(msg.room) || [])].map((c) => ({ id: c.user._id, name: c.user.name }));
      joinRoom(msg.room, client);
      client.rooms.add(msg.room);

      ws.send(JSON.stringify({ type: "joined-room", room: msg.room, members: existingMembers }));
      broadcast(msg.room, { type: "presence", event: "peer-joined", user: { id: user._id, name: user.name } }, client);
      return;
    }

    if (msg.type === "leave" && msg.room) {
      leaveRoom(msg.room, client);
      client.rooms.delete(msg.room);
      broadcast(msg.room, { type: "presence", event: "left", user: { id: user._id, name: user.name } }, client);
      return;
    }

    if (msg.type === "chat" && msg.room) {
      if (msg.room.startsWith("conversation:")) {
        const conversationId = msg.room.split(":")[1];
        const convo = await Conversation.findOne({ _id: conversationId, members: user._id });
        if (!convo) return;

        const saved = await ChatMessage.create({
          conversation: conversationId,
          workspace: user.workspace,
          sender: user._id,
          text: msg.text || "",
          attachment: msg.attachment || undefined,
        });
        convo.lastMessageAt = new Date();
        await convo.save();

        const populated = await saved.populate("sender", "name photoURL");
        broadcast(msg.room, { type: "chat", room: msg.room, message: populated, clientId: msg.clientId }, null);

        // Push a lightweight unread notification to members who aren't
        // currently viewing this conversation (i.e. not joined to its room),
        // so their sidebar badge updates even if they're elsewhere in the app.
        const viewingUserIds = new Set([...(rooms.get(msg.room) || [])].map((c) => String(c.user._id)));
        for (const memberId of convo.members) {
          const memberIdStr = String(memberId);
          if (memberIdStr === String(user._id) || viewingUserIds.has(memberIdStr)) continue;
          notifyUser(memberIdStr, { type: "unread", room: msg.room, conversationId });
        }
      } else if (msg.room.startsWith("meeting:")) {
        // Ephemeral meeting comments — not persisted, just relayed live.
        broadcast(
          msg.room,
          {
            type: "chat",
            message: {
              _id: `${Date.now()}-${Math.random()}`,
              sender: { _id: user._id, name: user.name, photoURL: user.photoURL },
              text: msg.text || "",
              attachment: msg.attachment || undefined,
              createdAt: new Date(),
            },
            clientId: msg.clientId,
          },
          null
        );
      }
      return;
    }

    if (msg.type === "signal" && msg.room && msg.to) {
      sendTo(msg.room, msg.to, { type: "signal", from: { id: user._id, name: user.name }, payload: msg.payload });
      return;
    }
  });

  ws.on("close", () => {
    userConnections.get(uid)?.delete(client);
    if (userConnections.get(uid)?.size === 0) userConnections.delete(uid);

    for (const room of client.rooms) {
      leaveRoom(room, client);
      broadcast(room, { type: "presence", event: "left", user: { id: user._id, name: user.name } }, client);
    }
  });
});

const start = async () => {
  await connectDB();
  server.listen(PORT, () => console.log(`Server (HTTP + WebSocket) running on http://localhost:${PORT}`));
};

start();