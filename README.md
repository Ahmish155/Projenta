# Projenta — Team Workspace Platform (MERN + Firebase Auth + WebRTC)

A multi-tenant workspace platform: anyone creates a workspace and becomes its admin,
builds teams, appoints team leads, and assigns work down a real chain of command —
with time tracking, a personal to-do list, group chat with file sharing, a simple
video-call room, and a calendar. Sign-in is handled entirely by **Firebase
Authentication** (email/password, Google, Facebook, GitHub).

UI is a glassmorphism take on the dark 3D-art reference you shared — translucent,
blurred panels over a soft slate-teal gradient, rather than a flat dark theme.

**A note on the font**: you asked for Object Sans, which is a paid commercial font
(Alright Studio) not available on any free CDN. I used **General Sans** (free, via
Fontshare) instead — same geometric-grotesque family, visually very close. If you buy
an Object Sans license later, drop the `.woff2` files in `frontend/public/fonts/` and
swap in an `@font-face` rule in `frontend/src/index.css` in place of the Fontshare link.

---

## 1. What's inside

| Area | How it's built |
|---|---|
| Auth | Firebase Authentication (email/password + Google/Facebook/GitHub OAuth) |
| Backend | Node/Express + MongoDB, verifies Firebase ID tokens via `firebase-admin` |
| Roles | `admin → teamlead → member`, scoped to one workspace. Task-assignment visibility is org-chart-restricted server-side (a team lead only ever sees their own team when assigning work) — but **messaging is open**: anyone can chat with anyone, via a separate unrestricted contacts endpoint. |
| Messaging | Unified **Messages** module: direct 1:1 chats with anyone in the workspace, plus group chats (creatable only by admins/team leads, but open to any members). Each conversation supports text, file/image/video sharing, an inline audio/video call, and unread badges (per-conversation and a total on the nav item). |
| Meetings | Separate **instant meeting** rooms (shareable code), independent of any conversation — video grid, screen sharing, mic/cam toggle, and a live (non-persisted) comments box |
| Realtime | A **single shared WebSocket connection per tab** (via `SocketContext`) powers chat, unread notifications, and WebRTC signaling together — not a separate connection per component |
| Video calls | Vanilla `RTCPeerConnection` in the browser, no WebRTC library, free public STUN, mesh signaling for small groups |
| File sharing | `multer` → local disk, served back only through an **authenticated, workspace-scoped route** — never publicly reachable |
| Calendar | Self-built month grid, no external calendar service |
| Performance | Route-based code splitting (`React.lazy`), MongoDB indexes + `.lean()` on read paths, aggregation instead of N+1 queries for team/task stats |
| Security | `helmet`, `express-mongo-sanitize`, `express-rate-limit`, async-error handling, upload allow-list, tightened CORS — see section 9 |
| UI | React + Tailwind, glassmorphism, General Sans (a free equivalent of Object Sans) + JetBrains Mono |

---

## 2. Firebase setup (do this first — it's free, ~10 minutes)

### 2.1 Create the project
1. Go to https://console.firebase.google.com → **Add project** → name it anything (e.g. `projenta-app`) → finish the wizard (Google Analytics is optional, you can skip it).

### 2.2 Register a web app
1. In your new project, click the **Web** icon (`</>`) to add a web app.
2. Give it a nickname, skip Firebase Hosting for now.
3. Copy the `firebaseConfig` object it shows you — you'll need these values for the frontend `.env`.

### 2.3 Enable sign-in providers
Go to **Build → Authentication → Sign-in method** and enable:
- **Email/Password** — just toggle it on.
- **Google** — toggle on, pick a support email, save.
- **GitHub**:
  1. Go to https://github.com/settings/developers → **New OAuth App**.
  2. Application name: anything. Homepage URL: `http://localhost:5173` (update later for production).
  3. Authorization callback URL: Firebase shows you the exact URL to paste here (it looks like `https://<project-id>.firebaseapp.com/__/auth/handler`) — copy it from the Firebase GitHub provider setup screen.
  4. Register the app, copy the **Client ID** and generate a **Client Secret**, paste both into Firebase's GitHub provider dialog, save.
- **Facebook**:
  1. Go to https://developers.facebook.com/apps → **Create App** → type "Consumer" or "None" → name it.
  2. Add the **Facebook Login** product.
  3. In Facebook Login → Settings, set the **Valid OAuth Redirect URI** to the callback URL Firebase shows you on its Facebook provider setup screen.
  4. Copy the **App ID** and **App Secret** from Facebook's app dashboard into Firebase's Facebook provider dialog, save.

### 2.4 Generate a service account key (for the backend)
1. In Firebase Console → ⚙️ **Project settings → Service accounts**.
2. Click **Generate new private key** — this downloads a JSON file.
3. Save it as `backend/serviceAccountKey.json` (already in `.gitignore` — never commit this file).

That's the entire Firebase side. You never need to touch the Firebase console again after this.

---

## 3. Local setup

### Prerequisites
Node.js 18+, npm, MongoDB (local or free Atlas cluster).

### Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/workspace-saas
CLIENT_URL=http://localhost:5173
```
(Firebase credentials come from `serviceAccountKey.json`, which you already placed in step 2.4 — no env var needed for local dev.)

```bash
npm run dev
```
You should see: `Server (HTTP + WebSocket) running on http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
```
Fill in `.env` with the `firebaseConfig` values from step 2.2:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
```bash
npm run dev
```
Open `http://localhost:5173`.

---

## 4. Walkthrough

1. **Create your workspace** — sign up with email/password or Google/GitHub/Facebook. You're the admin.
2. **Users → Add user** — this creates a *real* Firebase account for them server-side (via `firebase-admin`), so they can log in immediately with that email/password, or with a matching Google/GitHub/Facebook account.
3. **Teams → New team**, appoint a lead, add members.
4. **Tasks → New task** — admin can only assign to a team lead.
5. Log in as that lead (incognito window) → **Tasks** → assign work to their own team members only (enforced server-side — a team lead's user list is filtered to their team at the API level, not just in the UI).
6. **Messages** — click **New message** to start a 1:1 chat with anyone in the workspace, or (if you're an admin/team lead) **New group** to create a group chat with selected members. Inside any conversation, the phone/video icons start an inline call right there — no separate "Call" section to hunt for. Every file/image/video you share has explicit **Open** and **Download** buttons.
7. **Meetings** — click **New meeting** to get an instant, ad-hoc video room with a shareable code, independent of any conversation. Supports screen sharing, mic/cam toggles, and a live comments panel alongside the video grid. Anyone in the workspace who has the code can join — open the same room in a second browser/tab logged in as someone else to test it.
8. **Calendar** — any task with a due date shows up on its day.

---

## 5. WebRTC notes (read this)

Calls use **plain browser WebRTC APIs** (`RTCPeerConnection`, `getUserMedia`,
`getDisplayMedia` for screen share) — no third-party library. Signaling (the
offer/answer/ICE-candidate exchange) travels over a small **Node.js `ws` WebSocket
server** that's part of `backend/server.js`.

- Uses Google's free public STUN server (`stun:stun.l.google.com:19302`) for NAT traversal.
- Both 1:1 conversation calls and multi-person instant meetings use the same **mesh** signaling: when you join a call room, the server tells you who's already there, and you open a direct `RTCPeerConnection` to each of them. This works for small groups (a handful of participants); a very large meeting would need a proper SFU media server instead of mesh, which is a bigger infrastructure change.
- **No TURN server is configured.** STUN alone works for most home networks and same-network testing, but calls can fail to connect across some corporate firewalls or strict NATs — that's a networking limitation of any free WebRTC setup, not a bug. If you need guaranteed connectivity everywhere, add a TURN server (e.g. a self-hosted `coturn`, or a paid service like Twilio's) to the `ICE_SERVERS` array in `frontend/src/hooks/useWebRTCRoom.js`.

---

## 6. Project structure

```
workspace-saas/
├── backend/
│   ├── config/          db.js, firebaseAdmin.js
│   ├── models/          Workspace, User, Team, Task, Todo, Conversation, ChatMessage, Meeting
│   ├── controllers/     auth, user, team, task, todo, conversation, chat, meeting
│   ├── routes/          + uploadRoutes.js
│   ├── middleware/      auth.js (Firebase token verification), errorHandler.js
│   ├── uploads/         shared files land here (gitignored)
│   └── server.js        Express + ws WebSocket server (chat + signaling, mesh calling)
└── frontend/
    ├── src/
    │   ├── firebase.js              client SDK config
    │   ├── hooks/useSocket.js       shared WebSocket connection
    │   ├── hooks/useWebRTCRoom.js   mesh WebRTC engine (calls + meetings)
    │   ├── pages/                   Landing, CreateWorkspace, Login,
    │   │                            admin/, lead/, member/, Messages, Meetings, MeetingRoom, Calendar
    │   ├── components/              DashboardLayout, MessageThread, CallPanel, AttachmentView,
    │   │                            TodoWidget, StatCard, Modal, LiveTimer
    │   └── context/AuthContext.jsx
    └── tailwind.config.js           glassmorphism palette
```

---

## 7. API reference

**Auth**
| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/create-workspace` | body: `{ idToken, workspaceName }` |
| POST | `/api/auth/sync` | body: `{ idToken }` — call after every Firebase sign-in |
| GET | `/api/auth/me` | requires a linked workspace account |

**Users / Teams / Tasks / Todos** — same as before, all requests now authenticate via
`Authorization: Bearer <firebase-id-token>` instead of a custom JWT.
`GET /api/users` is task-assignment scoped (team leads only get their own team's members
back, regardless of query params). For messaging, use `GET /api/users/contacts` instead —
deliberately unrestricted, since anyone can chat with anyone.

**Conversations & chat**
| Method | Route | Notes |
|---|---|---|
| GET | `/api/conversations` | List mine, newest activity first, with last-message preview + unread count |
| POST | `/api/conversations/:id/read` | Marks a conversation read (clears its unread badge) |
| POST | `/api/conversations/direct` | body `{ userId }` — finds or creates the 1:1 thread, works with anyone in the workspace |
| POST | `/api/conversations/group` | admin/teamlead only to create; `memberIds` can include anyone in the workspace |
| GET | `/api/conversations/:id/messages` | History — 404s if you're not a member |

**Meetings**
| Method | Route |
|---|---|
| POST | `/api/meetings` | Creates an instant meeting, returns a shareable `code` |
| GET | `/api/meetings/:code` | Validates the code + confirms same workspace before joining |

**Uploads** — protected, workspace-scoped (see section 9)
| Method | Route |
|---|---|
| POST | `/api/uploads` | multipart `file` field, 25MB cap, allow-listed mimetypes only, returns `{ url, name, type }` |
| GET | `/api/uploads/file/:filename` | Requires auth + same-workspace membership; add `?download=1` to force a download instead of inline |

**WebSocket** — connect to `ws://<host>/ws?token=<firebaseIdToken>`, JSON messages:
`{ type: "join"|"leave", room }` where `room` is `conversation:<id>` or `meeting:<code>`,
`{ type: "chat", room, text?, attachment?, clientId? }`,
`{ type: "signal", room, to, payload }` (targeted at one peer's user id, for mesh calling).
Unread notifications (`{ type: "unread", room, conversationId }`) arrive automatically for
any conversation you're a member of but haven't opened — no need to join its room first.

---

## 8. Design notes

Palette lightened to a translucent slate-teal glassmorphism look — `bg-white/10
backdrop-blur-xl` panels over a fixed gradient background, rather than flat dark
surfaces. Typography: General Sans (display + body, a free equivalent of Object Sans),
JetBrains Mono (timers/timestamps).

Both `npm install` and a production `vite build` were verified while building this,
and every backend file passed a Node syntax check, including a live smoke-test of the
Firebase Admin credential-loading path.

---

## 9. Security — read this before deploying

### What must NEVER be uploaded to GitHub or any public place

| Item | Where it lives | Why |
|---|---|---|
| `backend/.env` | `backend/` | Your Mongo connection string, CORS origin |
| `backend/serviceAccountKey.json` | `backend/` | Full admin access to your Firebase project |
| `frontend/.env` | `frontend/` | Firebase client config (less sensitive, but still don't commit it — keep config changes deliberate per environment) |
| `backend/uploads/` (contents) | `backend/uploads/` | User-uploaded files — real user data, not code |
| `node_modules/` | both | Never needed in version control |

All of the above are already in `.gitignore`. Before your first `git push`, run
`git status` and confirm none of these show up as tracked or staged — if one ever
got committed in the past, deleting it later isn't enough; rotate the credential
(regenerate the Firebase service account key, change the Mongo password) because
it's still in git history.

### Vulnerabilities found and fixed during this build

- **NoSQL injection**: `GET /api/users` was passing `req.query.role` / `req.query.team`
  straight into a MongoDB filter object. A request like `?role[$ne]=null` could have
  altered the query's meaning. Fixed with an explicit whitelist check, plus
  `express-mongo-sanitize` applied globally as a second layer.
- **Unhandled-rejection crash risk**: Express 4 does not automatically catch errors
  thrown inside `async` route handlers. A single malformed request (e.g. an invalid
  MongoDB ObjectId in a URL) could have crashed the entire process for every user.
  Fixed with `express-async-errors` plus a proper error handler that returns clean
  4xx responses for cast/validation errors instead of leaking a stack trace.
- **Publicly readable uploads**: file attachments were served via plain
  `express.static`, reachable by anyone with the URL, logged-in or not. Rewritten as
  an authenticated route (`GET /api/uploads/file/:filename`) that checks the
  requester belongs to the same workspace the file was uploaded in. The frontend now
  fetches attachments as authenticated blobs instead of using plain `<img src>` /
  `<a href>`, which can't carry an auth header.
- **Upload content type**: uploads are now restricted to an explicit allow-list
  (images, common video formats, PDF, Word docs, plain text) — blocks someone
  uploading an HTML or SVG file that could execute script if ever opened directly.
- **CORS**: the previous fallback of `origin: "*"` combined with `credentials: true`
  is both invalid per the CORS spec and a bad default. Production now requires
  `CLIENT_URL` to be set explicitly, and refuses cross-origin requests if it isn't.
- **Meeting code brute-forcing**: codes went from 32 bits of entropy to 64 bits, plus
  a dedicated rate limit on the meeting-lookup endpoint.
- **WebSocket abuse**: added a 256KB per-frame payload cap (prevents memory
  exhaustion from an oversized frame) and a 30-messages/second per-connection
  throttle (blunts a compromised or scripted client flooding chat writes).
- **Standard hardening**: added `helmet` (security headers), a global `express-rate-limit`
  on `/api`, and a JSON body size cap.

### Known limitations worth knowing about (not fixed — by design or out of scope)

- **No TURN server** — calls can fail to connect across some strict corporate
  networks/NATs. See section 5.
- **No file antivirus/content scanning** — the upload allow-list blocks obviously
  dangerous types, but a malicious PDF or image with embedded exploits isn't
  scanned. Consider a service like ClamAV or a cloud scanning API if you'll accept
  uploads from people outside a trusted organization.
- **No per-workspace storage quota** — a workspace could theoretically fill your
  disk with many 25MB uploads. Fine for internal team use; add a quota check in
  `uploadRoutes.js` before opening this to the public.
- **`npm audit` on the backend reports moderate-severity issues** — all of them are
  in `firebase-admin`'s *optional* Firestore/Cloud Storage dependencies, which this
  project never imports or calls. Not exploitable here, but worth re-checking with
  `npm audit` after any future `firebase-admin` upgrade.

### Before you deploy, also do this

1. Set `NODE_ENV=production` and a real `CLIENT_URL` in your hosting platform's env vars — never rely on `.env.example` defaults in production.
2. In the Firebase Console, add your production domain to **Authentication → Settings → Authorized domains**, and update the GitHub/Facebook OAuth app callback URLs to match your real domain.
3. WebRTC (`getUserMedia`) requires a secure context — your production site **must** be served over HTTPS, or camera/mic access will simply fail in the browser.
4. If using MongoDB Atlas, restrict network access to your backend's IP (or use Atlas's private networking) rather than allowing access from anywhere, and use a database user with only the permissions this app needs (read/write on its own database, nothing broader).
5. Keep `backend/serviceAccountKey.json` off the server's filesystem in favor of the `FIREBASE_SERVICE_ACCOUNT` env var on most hosting platforms — it's the more common pattern for platforms like Render/Railway, and avoids a stray file ever being included in a build artifact.
