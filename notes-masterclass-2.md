# Masterclass 2 — The Brain
## RESTful APIs & LLM Integration with Groq
### Quick Reference Notes — Files & What We're Building

---

> **Note:** In this masterclass the controllers contain **placeholder/mock logic** for database calls.
> Real MongoDB integration happens in Masterclass 3.

---

## Project Setup

```bash
cd server
npm install express cors jsonwebtoken bcryptjs express-validator multer openai nodemailer dotenv
npm install --save-dev nodemon
npm run dev   # starts Express server at http://localhost:5000
```

---

## Entry Point

### `server/server.js`
- **Starting point** of the entire backend — Node.js runs this first.
- Loads env variables via `import 'dotenv/config'` (must be the FIRST import).
- Creates the Express app.
- Sets up **global middleware**: `cors()` (allow cross-origin requests) and `express.json()` (parse JSON request bodies).
- Mounts the three routers: `/api/auth`, `/api/chats`, `/api/voice`.
- Exposes a `/api/health` endpoint for monitoring.
- Calls `connectDB()` to connect to MongoDB.
- Starts listening on `process.env.PORT || 5000`.

---

## Config

### `server/config/db.js`
- Contains `connectDB()` — connects to MongoDB via Mongoose.
- Logs success or exits the process on failure (`process.exit(1)`).

### `server/config/email.js`
- Creates and exports the **Nodemailer transporter** (SMTP connection object).
- Checks if SMTP env vars are configured; exports `isConfigured` boolean.

---

## Routes

> Routes map incoming HTTP requests to the correct controller function.
> They chain middleware (validators → validate → protect → controller) in order.

### `server/routes/auth.js`
- Maps all `/api/auth/*` endpoints:
  - `POST /register` → `registerValidator` → `validate` → `register`
  - `POST /login` → `loginValidator` → `validate` → `login`
  - `POST /forgot-password` → `forgotPasswordValidator` → `validate` → `forgotPassword`
  - `POST /reset-password` → `resetPasswordValidator` → `validate` → `resetPassword`
  - `GET /me` → `protect` → `getMe`
  - `PUT /profile` → `protect` → `updateProfileValidator` → `validate` → `updateProfile`
  - `DELETE /me` → `protect` → `deleteAccount`

### `server/routes/chat.js`
- Maps all `/api/chats/*` endpoints:
  - `POST /` → `protect` → `createChat`
  - `GET /` → `protect` → `getChats` (supports `?search=query`)
  - `GET /:id` → `protect` → `getChat`
  - `POST /:id/messages` → `protect` → `messageValidator` → `validate` → `sendMessage`
  - `DELETE /:id` → `protect` → `deleteChat`

### `server/routes/voice.js`
- Maps `/api/voice/transcribe`:
  - `POST /transcribe` → `protect` → `multer upload middleware` → `transcribe`
- Configures multer: `memoryStorage()`, 25MB file size limit, audio MIME type filter.

---

## Controllers

> Controllers contain the business logic — receive the request, do the work, send the response.

### `server/controllers/authController.js`
- `register` — Sanitises inputs, checks for duplicate email, creates user, returns user data + JWT.
- `login` — Finds user by email, compares password with bcrypt, returns user data + JWT.
- `getMe` — Returns the currently authenticated user's data (from `req.user` set by `protect`).
- `updateProfile` — Updates the user's display name in the database.
- `deleteAccount` — Deletes all user's chats first, then deletes the user account.
- `forgotPassword` — Finds user by email, generates a 1-hour reset JWT, sends the email via `emailService`. Always returns the same response whether email exists or not (prevents email enumeration).
- `resetPassword` — Verifies the reset JWT, finds the user, sets the new password (pre-save hook hashes it), saves.
- Helper: `generateToken(id)` — Creates a JWT signed with `JWT_SECRET`, expires in 30 days.

### `server/controllers/chatController.js`
- `createChat` — Creates a new empty chat document for the logged-in user.
- `getChats` — Retrieves all chats for the user, sorted by `updatedAt` descending. Supports regex search across `title` and `messages.content`.
- `getChat` — Retrieves a single chat with all its messages (verifies ownership).
- `sendMessage` — **Core of the app**: verifies chat ownership → pushes user message → builds full conversation history → calls `getAIResponse()` → pushes AI message → auto-generates title on first exchange (first 50 chars of first user message) → saves → returns both new messages.
- `deleteChat` — Finds a chat by `_id` and `user` (ownership check) → deletes it.

### `server/controllers/voiceController.js`
- `transcribe` — Receives the uploaded audio buffer from multer → writes it to a temp file in `/tmp` → calls `transcribeAudio()` from `aiService` → returns transcribed text → always deletes the temp file in `finally` block.

---

## Middleware

### `server/middleware/auth.js`
- `protect` — **JWT security checkpoint** for all protected routes.
  1. Checks for `Authorization: Bearer <token>` header.
  2. Verifies the token signature with `jwt.verify()`.
  3. Loads the actual user from DB using the ID from the decoded token (excludes password).
  4. Attaches user to `req.user`.
  5. Calls `next()` to pass control to the controller.
  6. Returns `401` if token is missing, expired, or tampered.

### `server/middleware/validate.js`
- `validate` — Reads `express-validator` results attached to the request.
- If any errors exist → returns `400 Bad Request` with the first error's message.
- If no errors → calls `next()` to proceed to the controller.

---

## Validators

### `server/validators/authValidators.js`
- `registerValidator` — Checks: `name` (not empty), `email` (valid format), `password` (min 6 chars).
- `loginValidator` — Checks: `email` (valid format), `password` (not empty).
- `updateProfileValidator` — Checks: `name` (not empty).
- `forgotPasswordValidator` — Checks: `email` (valid format).
- `resetPasswordValidator` — Checks: `token` (not empty), `password` (min 6 chars).

### `server/validators/chatValidators.js`
- `messageValidator` — Checks: `content` (not empty after trimming).

---

## Services

### `server/services/aiService.js`
- Initialises the **Groq client** using the official OpenAI SDK with Groq's base URL (`https://api.groq.com/openai/v1`).
- `getAIResponse(messages)` — Sends the full conversation history to Groq's `llama-3.1-8b-instant` model. Uses `Promise.race()` with a 45-second timeout to prevent hanging requests. Returns the AI's text response.
- **Mock AI mode** (when `USE_MOCK_AI=true` in `.env`):
  - Never creates the Groq client.
  - Returns keyword-matched responses (hi, mern/react, thank, etc.).
  - Simulates 800ms network delay so the UI loading state is visible.
- `transcribeAudio(filePath)` — Sends an audio file to Groq's Whisper model for speech-to-text transcription. Returns the transcribed text string.

### `server/services/emailService.js`
- `sendMail({ to, subject, text, html })` — Generic mail-sending function. If SMTP is not configured → logs `[Email mock]` and returns without crashing.
- `sendWelcomeEmail(email, name)` — Sends a welcome email on registration.
- `sendPasswordResetEmail(email, resetToken)` — Sends an email with a clickable reset link (`APP_URL/reset-password?token=...`). Link is valid for 1 hour.

---

## Environment Variables

### `server/.env`
- **All secrets** — never commit this file to Git.
- Key variables:
  - `MONGODB_URI` — MongoDB Atlas connection string
  - `JWT_SECRET` — Secret for signing JWTs (32+ characters, random)
  - `PORT` — Express server port (default: 5000)
  - `GROQ_API_KEY` — From `console.groq.com`
  - `USE_MOCK_AI` — `true` for demo mode, `false` for real Groq AI
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Gmail SMTP config
  - `EMAIL_FROM` — Sender display name + address
  - `APP_URL` — Frontend URL (used in reset email link)

### `server/.env.example`
- Safe-to-commit template showing what variables are required (no real values).

---

## Key Concepts Covered
- **REST principles** — HTTP methods (GET/POST/PUT/DELETE) + status codes (200/201/400/401/404/500)
- **JWT Authentication** — sign on login, verify on every protected request, stateless (no server sessions)
- **bcrypt** — passwords are hashed, never stored in plain text; compare with `bcrypt.compare()`
- **Middleware chain** — validators → validate → protect → controller (each step is a gate)
- **Groq / LLM integration** — full conversation history sent on every request for AI "memory"
- **Mock AI mode** — teaches concepts without needing a live API key
- **Multer** — handles `multipart/form-data` file uploads; memory storage for audio
- **Nodemailer** — SMTP email with graceful fallback if not configured
- **Express-validator** — validates request data at the HTTP layer before any DB operations
