# classMentor AI – Project Map by Masterclass

A ChatGPT-like full-stack app (MERN, JavaScript only). This README explains **where everything lives** and **what each part does**, so you can follow along while coding in the masterclasses.

---

## Masterclass Map

| # | Masterclass | What it covers in this project |
|---|-------------|--------------------------------|
| 1 | **The Face** (UI & Components) | React pages, reusable components, theme, layout |
| 2 | **The Brain** (Node & API) | Express server, routes, controllers, services, middleware |
| 3 | **The Connection** (Integration) | API client, auth flow, frontend–backend wiring |
| 4 | **The Memory** (Database) | MongoDB, Mongoose models, persistence |
| 5 | **The Launch** (Deployment) | Env config, run scripts, production notes |

---

# 1. The Face (UI & Components)

*Where the user looks and clicks. All React UI and components.*

## Entry & layout

| File | What happens here |
|------|--------------------|
| `client/index.html` | HTML shell; script sets `data-theme` from `localStorage` before React loads (avoids theme flash). |
| `client/src/main.jsx` | Renders the app into `#root`; wraps with `AuthProvider` and `ThemeProvider`. |
| `client/src/App.jsx` | **Routing**: defines all routes (login, register, forgot/reset password, home, chat, profile). Wraps protected routes with `<ProtectedRoute>`. |
| `client/src/index.css` | Global styles; base layout and CSS variables if any. |

## Pages (screens)

| File | What happens here |
|------|--------------------|
| `client/src/pages/Login.jsx` | Login form: email, password, “Forgot password?” link. Calls auth API, stores token/user, redirects to home. |
| `client/src/pages/Register.jsx` | Register form: name, email, password. Calls register API, then redirects to login or home. |
| `client/src/pages/ForgotPassword.jsx` | Asks for email; calls forgot-password API; shows success or error (e.g. “Email service not configured”). |
| `client/src/pages/ResetPassword.jsx` | Reads token from URL; form for new password; calls reset-password API. |
| `client/src/pages/Home.jsx` | Landing after login: welcome text, “New Chat” button, “What you can do” suggestion cards. Header: logo, theme toggle, user avatar/name, Profile, Logout. |
| `client/src/pages/Chat.jsx` | Main chat: sidebar (chats list, search, new chat, delete with confirm) + main area (header, message list, message input). Fetches chats, creates/selects chat, sends messages, handles errors. |
| `client/src/pages/Profile.jsx` | Edit name, change password (future), delete account with confirmation modal. |

## Reusable components

| File | What happens here |
|------|--------------------|
| `client/src/components/ProtectedRoute.jsx` | Wraps routes that need login; redirects to `/login` if not authenticated. |
| `client/src/components/PasswordInput.jsx` | Password field with show/hide toggle (eye icon). |
| `client/src/components/LogoutButton.jsx` | “Logout” button; opens “Are you sure?” modal; on confirm, clears token/user and redirects to login. |
| `client/src/components/UserAvatar.jsx` | Circle with user initials (e.g. “AK”); used in header/sidebar. |
| `client/src/components/ThemeToggle.jsx` | Sun/moon button; toggles light/dark theme (uses `ThemeContext`). |
| `client/src/components/ChatSidebar.jsx` | Left sidebar: “+ New Chat”, search, list of chats (click to open, × to delete with “Are you sure?” modal). Renders optional `footer` (e.g. theme, Home, user, Logout). |
| `client/src/components/MessageList.jsx` | Scrollable list of messages; renders each with `ChatBubble`; shows loading state when AI is responding. |
| `client/src/components/MessageInput.jsx` | Textarea + **mic button** (record → stop → transcribe via API, text inserted into input) + Send button. Handles submit and Enter key. |
| `client/src/components/ChatBubble.jsx` | One message: user (green, right) vs AI (left). Uses SVG icons; user text is white on green. Renders markdown for AI messages. |

## Context (global UI state)

| File | What happens here |
|------|--------------------|
| `client/src/context/ThemeContext.jsx` | Holds `theme` (colors), `themeMode` (light/dark), `toggleTheme`. Persists in `localStorage` as `classmentor-theme`. |
| `client/src/context/AuthContext.jsx` | Holds `user`, `login`, `register`, `logout`, `updateProfile`, `deleteAccount`. Loads user from token on mount. |

---

# 2. The Brain (Node & API)

*Server logic: Express app, routes, controllers, and external services.*

## Server entry & config

| File | What happens here |
|------|--------------------|
| `server/server.js` | Loads `dotenv`, creates Express app, CORS + `express.json()`, connects DB, mounts routes (`/api/auth`, `/api/chats`, `/api/voice`), health check at `/api/health`, starts server. |
| `server/config/db.js` | Connects to MongoDB using `MONGODB_URI`; exported for use in `server.js`. |

## Routes (URL → controller)

| File | What happens here |
|------|--------------------|
| `server/routes/auth.js` | Auth routes: register, login, getMe, updateProfile, deleteAccount, forgot-password, reset-password. All use `protect` except register/login/forgot/reset. Validators + `validate` where needed. |
| `server/routes/chat.js` | Chat routes: create chat, list chats, get one chat, send message (with validator), delete chat. All protected. |
| `server/routes/voice.js` | `POST /transcribe`: multer accepts one `audio` file (memory storage, 25 MB, audio types). Protected. Calls voice controller. |

## Controllers (request → response)

| File | What happens here |
|------|--------------------|
| `server/controllers/authController.js` | Register (hash password, save user, optional welcome email), login (compare password, return JWT + user), getMe, updateProfile, deleteAccount. Forgot-password: find user, generate reset token, send email (catches SMTP errors, returns 503 with clear message). Reset-password: verify token, update password. |
| `server/controllers/chatController.js` | createChat, getChats (with search), getChat, sendMessage (append user message, call AI service, append assistant message, save), deleteChat. |
| `server/controllers/voiceController.js` | Writes uploaded audio buffer to a temp file, calls `transcribeAudio` (Groq Whisper), returns `{ text }`; deletes temp file. Handles missing file and errors. |

## Middleware

| File | What happens here |
|------|--------------------|
| `server/middleware/auth.js` | `protect`: reads `Authorization: Bearer <token>`, verifies JWT, loads user into `req.user`; 401 if invalid/missing. |
| `server/middleware/validate.js` | Runs express-validator; if errors, returns 400 with message; else `next()`. |

## Services (business / external APIs)

| File | What happens here |
|------|--------------------|
| `server/services/aiService.js` | **Chat AI**: `getAIResponse(messages)` – calls Groq chat API (e.g. llama-3.1-8b-instant) or mock if `USE_MOCK_AI=true`. **Voice**: `transcribeAudio(filePath)` – streams file to Groq Whisper, returns text (or mock message). |
| `server/services/emailService.js` | Sends emails via Nodemailer (SMTP): welcome email, password-reset link. Uses env: SMTP_*, EMAIL_FROM, APP_URL. |
| `server/config/email.js` | Nodemailer transport config from env (SMTP_HOST, PORT, USER, PASS, etc.). |

## Validators

| File | What happens here |
|------|--------------------|
| `server/validators/authValidators.js` | Validation rules for register, login, forgot-password, reset-password (e.g. email, password length). |
| `server/validators/chatValidators.js` | Validation for send message (e.g. content required). |

---

# 3. The Connection (Integration)

*How the frontend talks to the backend: API client, auth flow, and wiring.*

## API client

| File | What happens here |
|------|--------------------|
| `client/src/services/api.js` | Axios instance: `baseURL /api`, timeout, default `Content-Type: application/json`. Interceptor: adds `Authorization: Bearer <token>` from `localStorage`. For `FormData`, removes `Content-Type` so browser sends multipart (for voice). 401 handler: clear token/user, redirect to login. Exposes `authAPI`, `chatAPI`, `voiceAPI` (login, register, getMe, profile, forgot/reset, createChat, getChats, getChat, sendMessage, deleteChat, transcribe). |

## Auth flow (connection in practice)

- **Login/Register**: Pages call `authAPI.login` / `authAPI.register` → server returns JWT + user → client stores token and user in `localStorage`, `AuthContext` updates.
- **Protected routes**: `ProtectedRoute` reads auth from `AuthContext`; if not logged in, redirects to `/login`.
- **Every API call**: `api.js` interceptor attaches the token; server `protect` middleware validates it and sets `req.user`.

## Frontend–backend mapping (quick ref)

| Feature | Frontend (Face) | Connection (api.js) | Backend (Brain) |
|--------|------------------|---------------------|-----------------|
| Login | `Login.jsx` | `authAPI.login` | `POST /api/auth/login` |
| Chats list | `Chat.jsx` → `ChatSidebar` | `chatAPI.getChats` | `GET /api/chats` |
| Send message | `MessageInput` → `Chat.jsx` | `chatAPI.sendMessage` | `POST /api/chats/:id/messages` |
| Voice input | `MessageInput.jsx` (mic) | `voiceAPI.transcribe` | `POST /api/voice/transcribe` |
| Profile | `Profile.jsx` | `authAPI.updateProfile`, `deleteAccount` | `PUT /api/auth/profile`, `DELETE /api/auth/me` |

---

# 4. The Memory (Database)

*MongoDB and Mongoose: what is stored and how.*

## Models (collections & schemas)

| File | What happens here |
|------|--------------------|
| `server/models/User.js` | Schema: name, email (unique), password (hashed), timestamps. Methods or controller handles password hashing before save. |
| `server/models/Chat.js` | Schema: `user` (ref User), `title`, `messages` (array of subdocuments: role, content, timestamps), timestamps. Represents one conversation. |
| `server/models/Message.js` | If used as a separate model: message schema; otherwise messages are embedded in `Chat`. In this project, messages are typically subdocuments inside `Chat`. |

*Note: Exact schema details (e.g. whether Message is a subdoc or a separate collection) are in the model files; the above is the usual structure for this app.*

## Where data is used

- **Auth**: User document stored/updated by auth controller; JWT payload only contains user id (or similar).
- **Chats**: Created and updated by chat controller; listed/fetched by getChats/getChat; messages appended on sendMessage.
- **Voice**: No DB; audio is temporary (buffer → temp file → transcribe → delete file).

## Env (memory-related)

| Env variable | Purpose |
|--------------|---------|
| `MONGODB_URI` | MongoDB connection string (e.g. Atlas). Used in `server/config/db.js`. |

---

# 5. The Launch (Deployment)

*How the app is configured and run; production-oriented notes.*

## Environment

| File | What happens here |
|------|--------------------|
| `server/.env` | Not in git. Holds: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `GROQ_API_KEY`, `USE_MOCK_AI`, SMTP vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`), `EMAIL_FROM`, `APP_URL`. |
| `server/.env.example` | Template listing all env vars (no real values); copy to `.env` and fill in. |

## Run scripts

| Where | Command | What it does |
|-------|---------|--------------|
| Server | `npm run dev` (in `server/`) | Starts server (e.g. nodemon) so it restarts on file change. |
| Client | `npm run dev` (in `client/`) | Starts Vite dev server (e.g. localhost:3000). |
| Client | `npm run build` | Production build (static files in `dist/`). |

## Production checklist (launch)

- Set `NODE_ENV=production`.
- Use a real MongoDB (e.g. Atlas) and strong `JWT_SECRET`.
- Configure SMTP (e.g. Gmail App Password) for forgot/reset password.
- Set `GROQ_API_KEY` (or keep mock for demo).
- Serve client build from Express or a static host; ensure API base URL points to your backend (e.g. proxy or `VITE_API_URL` if you add it).
- Optional: add rate limiting, helmet, and CORS for your frontend origin.

## Other project docs

| File | Purpose |
|------|---------|
| `MASTERCLASS_PLAN.md` | Step-by-step teaching plan (what to build in each session). |
| `GIT_WORKFLOW.md` | How to tag and push after each masterclass (e.g. `masterclass-1` … `masterclass-5`). |

---

## Quick file tree (project code only)

```
client/src/
├── main.jsx
├── App.jsx
├── index.css
├── context/
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
├── pages/
│   ├── Login.jsx, Register.jsx, ForgotPassword.jsx, ResetPassword.jsx
│   ├── Home.jsx, Chat.jsx, Profile.jsx
├── components/
│   ├── ProtectedRoute.jsx, PasswordInput.jsx, LogoutButton.jsx
│   ├── UserAvatar.jsx, ThemeToggle.jsx
│   ├── ChatSidebar.jsx, MessageList.jsx, MessageInput.jsx, ChatBubble.jsx
└── services/
    └── api.js

server/
├── server.js
├── config/
│   ├── db.js
│   └── email.js
├── models/
│   ├── User.js
│   └── Chat.js
├── routes/
│   ├── auth.js
│   ├── chat.js
│   └── voice.js
├── controllers/
│   ├── authController.js
│   ├── chatController.js
│   └── voiceController.js
├── middleware/
│   ├── auth.js
│   └── validate.js
├── services/
│   ├── aiService.js
│   └── emailService.js
└── validators/
    ├── authValidators.js
    └── chatValidators.js
```

Use this README as your map: open the file for the masterclass you’re on and see exactly what that file does in the project.
