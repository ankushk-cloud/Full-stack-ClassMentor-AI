# Masterclass 2 — The Brain
## RESTful APIs & LLM Integration with Groq

---

## Slide 1 — Welcome Back

**What we built in Masterclass 1 → The Face**
We created the entire React frontend: 7 pages, 9 reusable components, two context providers (Auth + Theme), an API service layer with Axios interceptors, and a working voice input using the browser's MediaRecorder API. The UI looks great — but if you click Login, nothing happens yet because there is no server to receive the request.

**Today's focus → THE BRAIN**
We are going to build the Express.js backend that powers everything. By the end of this masterclass, you'll have a fully working server that:
- Authenticates users with real JWT tokens
- Stores and retrieves conversations
- Calls Groq's Llama 3.1 model to generate AI responses
- Transcribes voice audio using Groq's Whisper model
- Validates all incoming request data to reject bad input early

---

## Slide 2 — The 4 Masterclass Journey

| # | Name | What We Build |
|---|------|---------------|
| 1 | The Face | React UI — pages, components, routing |
| **2** | **The Brain** ← *You are here* | Express server, REST APIs, Groq AI integration |
| 3 | The Memory | MongoDB, Mongoose schemas, data persistence |
| 4 | The Launch | Cloud deployment to Vercel + Render |

> **Note:** In this masterclass, the controllers will have placeholder/mock logic for the database calls since we haven't set up MongoDB yet. We'll wire it to a real database in Masterclass 3.

---

## Slide 3 — Tech Stack for Today

| Tool | Role | Why we use it |
|------|------|---------------|
| **Node.js** | JavaScript runtime on the server | Lets us write server-side code in the same language as the frontend — no context switching |
| **Express 4** | HTTP web framework | Minimal, flexible, and the most widely used Node.js framework; handles routing and middleware |
| **jsonwebtoken** | Generate and verify JWTs | Industry-standard library for creating signed tokens that prove identity |
| **bcryptjs** | Password hashing | Converts plain passwords into a secure hash so we never store raw passwords in the database |
| **express-validator** | Validate request data | Checks that required fields exist, emails are valid, passwords are long enough — before any logic runs |
| **multer** | Handle file uploads | Middleware that processes `multipart/form-data` requests; used for receiving audio files from the browser |
| **openai SDK** | Call Groq API | Groq is fully compatible with OpenAI's API format, so we use the official OpenAI SDK with a custom base URL |
| **nodemailer** | Send emails | Used to send the password-reset email with a clickable link |
| **dotenv** | Load environment variables | Reads the `.env` file and makes all secrets available as `process.env.VARIABLE_NAME` |
| **nodemon** | Auto-restart on changes | Watches your files and restarts the server automatically when you save — essential for development |

---

## Slide 4 — Server Folder Structure

Before writing any code, let's understand the purpose of each file and folder in the server. This structure follows the **MVC pattern** (Model-View-Controller), which is a widely used architectural pattern for organising server-side code:

```
server/
├── server.js           ← Entry point — starts the HTTP server and wires everything together
├── .env                ← Secret configuration values — NEVER commit this to Git
├── .env.example        ← A template showing what variables are needed (safe to commit)
│
├── config/
│   ├── db.js           ← Mongoose connection to MongoDB (used in Masterclass 3)
│   └── email.js        ← Nodemailer transporter for sending emails
│
├── routes/             ← URL → Controller mapping (like a table of contents for the API)
│   ├── auth.js         ← All /api/auth/* routes (register, login, profile, passwords)
│   ├── chat.js         ← All /api/chats/* routes (create, list, get, message, delete)
│   └── voice.js        ← The /api/voice/transcribe route with file upload handling
│
├── controllers/        ← Business logic — receives the request, does the work, sends the response
│   ├── authController.js    ← All user authentication operations
│   ├── chatController.js    ← All conversation and messaging operations
│   └── voiceController.js   ← Audio file → text transcription
│
├── middleware/         ← Functions that run between receiving a request and reaching a controller
│   ├── auth.js         ← The "protect" middleware: verifies JWT and attaches user to request
│   └── validate.js     ← Reads express-validator results and returns 400 if anything is invalid
│
├── services/           ← External API integrations — isolated from the rest of the code
│   ├── aiService.js    ← Groq chat completions (Llama 3.1) and Whisper transcription
│   └── emailService.js ← Welcome email and password-reset email sending
│
├── validators/         ← Rules for validating incoming request bodies
│   ├── authValidators.js    ← Validation rules for register, login, profile, forgot/reset
│   └── chatValidators.js    ← Validation rules for sending a message
│
└── tmp/                ← Temporary storage for audio files during transcription (auto-created)
```

---

## Slide 5 — Server Entry: server.js

`server.js` is the **starting point** of the entire backend. When you run `npm run dev`, Node.js starts here. Let's look at every line and understand what it does:

```js
// server/server.js

import 'dotenv/config';  
// This MUST be the first import. It reads the .env file and loads all variables
// into process.env. If this runs after other imports, those imports won't have
// access to environment variables and will fail silently.

import express from 'express';   // The web framework
import cors from 'cors';          // Middleware to allow cross-origin requests
import connectDB from './config/db.js';  // Our MongoDB connection function
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import voiceRoutes from './routes/voice.js';

connectDB(); // Connect to MongoDB immediately when the server starts

const app = express(); // Create the Express application
const PORT = process.env.PORT || 5000; // Use env var if set, otherwise default to 5000

// ─── GLOBAL MIDDLEWARE ────────────────────────────────────────
// These run on EVERY incoming request before reaching any route

app.use(cors()); 
// Allows browsers from other origins (e.g. localhost:3000) to make requests to this server.
// In development, we allow all origins. In production, we'll restrict this.

app.use(express.json()); 
// Parses incoming request bodies with Content-Type: application/json
// and makes the data available as req.body. Without this, req.body is undefined.

// ─── ROUTES ─────────────────────────────────────────────────
// Each router handles all routes starting with its prefix
app.use('/api/auth',  authRoutes);   // e.g. POST /api/auth/login
app.use('/api/chats', chatRoutes);   // e.g. GET  /api/chats
app.use('/api/voice', voiceRoutes);  // e.g. POST /api/voice/transcribe

// Health check route — quick way to verify the server is running
// Useful for monitoring and deployment platforms
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'classMentor AI API is running' });
});

// Start listening for incoming HTTP connections
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Slide 6 — What is REST?

**REST (Representational State Transfer)** is an architectural style for designing APIs. It defines a set of conventions for how clients and servers should communicate over HTTP. Our entire backend follows RESTful design principles.

**The core idea:** Each URL (called an "endpoint" or "resource") represents a thing. HTTP methods describe what to do with that thing.

| HTTP Method | What it means | Our example |
|-------------|---------------|-------------|
| `GET` | Read/retrieve data | `GET /api/chats` — get list of conversations |
| `POST` | Create something new | `POST /api/auth/register` — create a new account |
| `PUT` | Update/replace data | `PUT /api/auth/profile` — update display name |
| `DELETE` | Remove something | `DELETE /api/auth/me` — delete the account |

**Status codes — how the server communicates the result:**

| Code | Meaning | When we use it |
|------|---------|----------------|
| `200 OK` | Everything worked | Successful GET, PUT, DELETE |
| `201 Created` | Resource created | After successful register or createChat |
| `400 Bad Request` | Client sent invalid data | Missing field, invalid email format |
| `401 Unauthorized` | No valid auth token | Missing or expired JWT |
| `404 Not Found` | Resource doesn't exist | Chat with that ID not found |
| `500 Internal Server Error` | Something crashed on the server | Database error, unexpected exception |

---

## Slide 7 — Auth Routes

Routes are like a **menu for the API**. They map incoming HTTP requests to the correct controller function. They also chain middleware in between — validators and the protect middleware.

```js
// server/routes/auth.js
import express from 'express';
import {
  register, login, getMe, updateProfile, deleteAccount,
  forgotPassword, resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidator, loginValidator, updateProfileValidator,
  forgotPasswordValidator, resetPasswordValidator
} from '../validators/authValidators.js';

const router = express.Router();

// Public routes — no authentication needed
router.post('/register',        registerValidator, validate, register);
router.post('/login',           loginValidator,    validate, login);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password',  resetPasswordValidator,  validate, resetPassword);

// Protected routes — must have a valid JWT token
router.get('/me',     protect, getMe);
router.put('/profile', protect, updateProfileValidator, validate, updateProfile);
router.delete('/me',  protect, deleteAccount);

export default router;
```

**Understanding the middleware chain pattern:**
When Express processes `POST /api/auth/register`, it runs through a pipeline:
1. **`registerValidator`** — An array of express-validator rules. Checks that name, email, and password are present and valid. Attaches error results to the request object.
2. **`validate`** — A middleware that reads those error results. If there are any, it immediately stops and responds with `400 Bad Request`. If no errors, it calls `next()` to continue.
3. **`register`** — The actual controller function. By the time it runs, we're guaranteed the data is valid.

For protected routes (`/me`, `/profile`, `/me DELETE`), the `protect` middleware runs first to verify the JWT before the controller even sees the request.

---

## Slide 8 — Auth Controller: Register & Login

The auth controller handles the most fundamental operations — creating accounts and authenticating users. Let's look at register and login in detail:

```js
// server/controllers/authController.js

// Helper function: creates a JWT token containing the user's ID
// The token expires after 30 days — after that the user must log in again
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─── REGISTER ────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    // Sanitise the inputs — trim whitespace, lowercase the email
    const name  = String(req.body?.name  ?? '').trim();
    const email = String(req.body?.email ?? '').toLowerCase();
    const password = req.body?.password;

    // Double-check required fields (validators should catch this, but be safe)
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if a user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create the user — the Mongoose pre-save hook will auto-hash the password
    const user = await User.create({ name, email, password });

    // Respond with the user's info AND a JWT token so they're immediately logged in
    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      token: generateToken(user._id), // The client stores this and sends it with every request
    });
  } catch (error) {
    // Handle MongoDB duplicate key error (email already exists at DB level)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const email    = String(req.body?.email ?? '').toLowerCase();
    const password = req.body?.password;

    // Find the user — must use .select('+password') because the schema has select:false
    // select:false means password is EXCLUDED from queries by default for security
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Don't say "email not found" — that would tell an attacker which emails exist
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // bcrypt.compare hashes the input and compares to the stored hash
    // You can NEVER unhash a password — you can only compare
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Successful login — return user info and a fresh JWT
    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};
```

---

## Slide 9 — JWT: How It Works

**JWT (JSON Web Token)** is the mechanism we use for authentication. It is a compact, self-contained token that proves the holder's identity. Understanding JWTs is critical because they are used in almost every modern web application.

**What a JWT looks like:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YWJjMTIzIiwiaWF0IjoxNzA1MDAwMDAwLCJleHAiOjE3MDc1OTIwMDB9.HsV7y2a3...
```
This is three Base64-encoded sections joined by dots:
- **Header** — algorithm used (HS256) and token type (JWT)
- **Payload** — the data stored inside (our `{ id: user._id }`, plus `iat` = issued-at and `exp` = expiry)
- **Signature** — `HMAC(header + payload, JWT_SECRET)` — proves the token hasn't been tampered with

**The complete authentication flow:**

```
Step 1: User logs in
  Client → POST /api/auth/login { email, password }

Step 2: Server verifies and issues token
  Server checks password → correct
  Server calls jwt.sign({ id: '64abc...' }, 'mySecret', { expiresIn: '30d' })
  Server returns token to client

Step 3: Client stores the token
  Client: localStorage.setItem('token', 'eyJhbG...')
  Client: AuthContext.setUser(userData)

Step 4: Client uses the token on every request
  Axios interceptor: config.headers.Authorization = 'Bearer eyJhbG...'

Step 5: Server verifies the token
  protect middleware: jwt.verify('eyJhbG...', 'mySecret')
  → returns { id: '64abc...', iat: ..., exp: ... }
  → Server loads user: User.findById('64abc...')
  → Attaches to request: req.user = user
  → Calls next() → controller runs with req.user available
```

**Why JWT instead of sessions?**
Sessions store data on the server (in memory or a database). JWTs are **stateless** — all the information is in the token itself. The server doesn't need to remember anything between requests. This makes JWTs perfect for APIs that scale across multiple servers.

---

## Slide 10 — Protect Middleware

The `protect` middleware is the **security checkpoint** for all protected routes. It runs before any protected controller, verifies the JWT, and attaches the decoded user to the request object.

```js
// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for the Authorization header and that it starts with "Bearer"
  // A valid Authorization header looks like: "Bearer eyJhbGciOiJIUzI1NiJ9..."
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract just the token part (split on space, take the second element)
      token = req.headers.authorization.split(' ')[1];

      // Verify the token's signature using our secret key
      // If the token is expired or tampered with, this throws an error
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // decoded = { id: '64abc123...', iat: 1705000000, exp: 1707592000 }

      // Load the actual user from the database using the ID from the token
      // We exclude the password field from the result for security
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // The token was valid but the user was deleted from the database
        return res.status(401).json({ message: 'User not found' });
      }

      // Everything checks out — pass control to the next middleware or controller
      next();

    } catch (error) {
      // jwt.verify threw an error — token is expired, malformed, or has wrong signature
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If we reach here without setting a token, the Authorization header was missing
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
```

**After `protect` runs successfully:**
Every controller that comes after it has access to `req.user` — the full, database-loaded user object. This means controllers never need to re-fetch the user manually; it's already there.

---

## Slide 11 — Forgot & Reset Password: Full Flow

This feature uses a **short-lived JWT as a one-time password reset link**. Here's the complete two-step flow explained in detail:

**Step 1: Request a reset link (forgotPassword)**
```js
export const forgotPassword = async (req, res) => {
  const email = String(req.body?.email ?? '').toLowerCase();
  const user = await User.findOne({ email });

  // Security: Always return the same message whether the user exists or not.
  // This prevents "email enumeration" attacks where attackers probe which emails are registered.
  if (!user) {
    return res.json({ message: 'If an account exists with this email, you will receive a reset link.' });
  }

  // Create a special reset token — same JWT mechanism as auth, but expires in 1 hour
  const resetToken = generateResetToken(user._id); // jwt.sign({ id }, secret, { expiresIn: '1h' })

  try {
    // Send the email — if this fails, we catch the error and return a helpful message
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (emailError) {
    if (emailError.code === 'EAUTH') {
      // EAUTH = authentication failed — usually wrong SMTP password
      return res.status(503).json({
        message: 'Email service is not configured correctly. Use a Gmail App Password.'
      });
    }
    return res.status(503).json({ message: 'Unable to send email right now.' });
  }

  res.json({ message: 'If an account exists with this email, you will receive a reset link.' });
};
```

**Step 2: Use the link to set a new password (resetPassword)**
```js
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  // Verify the reset token — will throw if expired (after 1 hour) or invalid
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Load the user from the ID inside the token
  const user = await User.findById(decoded.id).select('+password');
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset link' });
  }

  // Set new password — the pre-save hook will automatically hash it
  user.password = password;
  await user.save();

  res.json({ message: 'Password reset successful. You can now sign in.' });
};
```

> 💡 **Why does the reset link expire in 1 hour?** If a user's email was compromised, the attacker should have as little time as possible to use the reset link. 1 hour is long enough for a real user to click it, but short enough to limit damage if intercepted.

---

## Slide 12 — Chat Controller: sendMessage

The `sendMessage` function is the **core of the entire application** — this is where user input becomes an AI response. Let's walk through it step by step:

```js
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const trimmedContent = content?.trim(); // Remove accidental whitespace

    if (!trimmedContent) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Step 1: Find the chat and verify the requesting user owns it
    // The user field check prevents users from accessing other people's chats
    const chat = await Chat.findOne({
      _id: req.params.id,    // The chat ID from the URL
      user: req.user._id,    // Must belong to the logged-in user
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Step 2: Add the user's message to the messages array
    chat.messages.push({ role: 'user', content: trimmedContent });

    // Step 3: Build the full conversation history to send to Groq
    // Groq needs ALL previous messages to maintain context (memory of the conversation)
    const messagesForAI = chat.messages.map((m) => ({
      role: m.role,         // 'user' or 'assistant'
      content: m.content,   // The text of the message
    }));

    // Step 4: Call Groq (Llama 3.1) — this is the async call to the AI
    const aiResponse = await getAIResponse(messagesForAI);

    // Step 5: Add the AI's response to the conversation
    chat.messages.push({ role: 'assistant', content: aiResponse });

    // Step 6: Auto-generate the chat title from the very first user message
    // We wait until messages.length === 2 (1 user + 1 AI response = first exchange)
    if (chat.messages.length === 2) {
      chat.title = trimmedContent.slice(0, 50) + (trimmedContent.length > 50 ? '...' : '');
    }

    // Step 7: Save everything to the database
    await chat.save();

    // Step 8: Return just the two new messages (not the full history)
    // The frontend appends these to its local messages array
    res.json({
      userMessage:      chat.messages[chat.messages.length - 2], // The user's message
      assistantMessage: chat.messages[chat.messages.length - 1], // The AI's response
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

---

## Slide 13 — Groq AI Service

Groq is an AI platform that provides access to large language models (LLMs). We use it for two things: generating chat responses (using Llama 3.1) and transcribing speech (using Whisper). The key advantage of Groq is speed — it uses custom hardware called LPUs (Language Processing Units) that are much faster than traditional GPUs.

```js
// server/services/aiService.js
import OpenAI from 'openai'; // Groq is OpenAI-compatible, so we can reuse this SDK

// Initialise the Groq client by pointing the OpenAI SDK at Groq's API endpoint
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1', // The only change: the URL
});

const TIMEOUT_MS = 45000; // 45 seconds — AI can be slow for complex questions

export const getAIResponse = async (messages) => {
  // messages is the FULL conversation history:
  // [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi!' }, ...]
  // Sending history gives the AI "memory" — it can refer to earlier parts of the chat

  // Create both the API call and a timeout promise
  const apiCall = groqClient.chat.completions.create({
    model: 'llama-3.1-8b-instant', // Fast, capable 8-billion parameter model
    messages: messages,
    max_tokens: 1024, // Maximum length of the AI's response
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out.')), TIMEOUT_MS)
  );

  // Race them — whichever resolves/rejects first wins
  const response = await Promise.race([apiCall, timeoutPromise]);

  // The response structure follows OpenAI's format:
  // response.choices[0].message.content = the text of the AI's reply
  const text = response.choices?.[0]?.message?.content;
  return text || 'Sorry, I could not generate a response.';
};
```

**What `Promise.race` does here:**
If the Groq API takes longer than 45 seconds to reply, `Promise.race` will resolve with the timeout rejection first — giving the user a "timed out" message instead of making them wait indefinitely.

---

## Slide 14 — Mock AI Mode

**No API key yet? That's fine!** We designed the AI service with a mock mode so that students can run the full application during the tutorial without needing a Groq account.

```js
// How to activate mock mode in server/.env:
// USE_MOCK_AI=true

const USE_MOCK = process.env.USE_MOCK_AI === 'true';

// If mock mode is on, we never even create the Groq client
const groqClient = USE_MOCK ? null : new OpenAI({ ... });

const getMockResponse = (userMessage) => {
  const msg = (userMessage || '').toLowerCase();

  // Simple keyword matching to return contextually relevant responses
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    return "Hello! I'm classMentor AI. I'm here to help you learn MERN stack!";
  }
  if (msg.includes('mern') || msg.includes('react') || msg.includes('node')) {
    return "Great question! MERN = MongoDB + Express + React + Node.js. React handles the frontend, Express + Node power the backend, MongoDB stores everything.";
  }
  if (msg.includes('thank')) {
    return "You're welcome! Happy learning. Feel free to ask more.";
  }
  // Default response for anything else
  return `Demo mode: Add GROQ_API_KEY to .env for real AI responses. You asked: "${userMessage}"`;
};

export const getAIResponse = async (messages) => {
  if (USE_MOCK) {
    // Simulate network delay so the UI loading state is visible
    await new Promise(r => setTimeout(r, 800));
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    return getMockResponse(lastUserMsg?.content);
  }
  // ... real Groq call ...
};
```

> 💡 **Teaching tip:** Start with `USE_MOCK_AI=true` in class so students can see the full flow without needing an API key. After the concept is clear, switch to `USE_MOCK_AI=false` and add a real Groq key to show the real AI.

---

## Slide 15 — Voice: Whisper Transcription Flow

The voice feature has a three-part chain: the React frontend uses the browser's MediaRecorder to capture audio, sends it to the Express server, and the server forwards it to Groq's Whisper model for transcription.

**Multer — handling file uploads in Express:**
```js
// server/routes/voice.js
const upload = multer({
  storage: multer.memoryStorage(), 
  // memoryStorage means the file is kept in RAM as a Buffer, not written to disk.
  // This is faster for our use case since we're about to write it ourselves anyway.
  
  limits: { fileSize: 25 * 1024 * 1024 }, 
  // 25MB limit — audio recordings are typically much smaller (a few MB),
  // but this prevents someone from uploading huge files to crash the server.

  fileFilter: (req, file, cb) => {
    // Only accept audio file types — reject anything else (images, PDFs, etc.)
    const allowed = /^audio\/(webm|mp3|mpeg|mp4|m4a|ogg|wav|flac)$/;
    if (allowed.test(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid audio type. Use webm, mp3, wav, etc.'));
  },
});
```

**Voice controller — writing to temp file then transcribing:**
```js
// server/controllers/voiceController.js
export const transcribe = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No audio received.' });
  }

  // Determine file extension from the MIME type
  const ext = req.file.mimetype === 'audio/webm' ? '.webm' : '.webm';
  const tmpPath = path.join(__dirname, '..', 'tmp', `audio-${Date.now()}${ext}`);

  try {
    // Write the in-memory buffer to a real file on disk
    // Groq's audio API requires a file stream, not a raw buffer
    fs.writeFileSync(tmpPath, req.file.buffer);

    const text = await transcribeAudio(tmpPath); // Call Groq Whisper
    res.json({ text }); // Return the transcribed text to the frontend

  } catch (error) {
    const status = error.message.includes('API key') ? 503 : 500;
    res.status(status).json({ message: error.message });

  } finally {
    // ALWAYS delete the temp file, even if an error occurred
    // 'finally' runs whether the try succeeded or the catch ran
    try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
  }
};
```

---

## Slide 16 — Request Validation

**Why validate requests?** User input should never be trusted. Without validation, someone could send `{ email: "notanemail", password: "" }` and cause confusing errors deeper in the code. Validation catches bad input at the door and returns a clear error message.

**How express-validator works:**

```js
// server/validators/authValidators.js
import { body } from 'express-validator';

export const registerValidator = [
  // Each rule in the array validates one field
  body('name')
    .trim()                              // Remove surrounding whitespace
    .notEmpty()                          // Fail if empty after trimming
    .withMessage('Name is required'),    // Error message to return

  body('email')
    .trim()
    .isEmail()                           // Must be a valid email format
    .withMessage('Valid email is required')
    .normalizeEmail(),                   // Lowercase, remove dots in Gmail, etc.

  body('password')
    .isLength({ min: 6 })               // Must be at least 6 characters
    .withMessage('Password must be at least 6 characters'),
];
```

```js
// server/middleware/validate.js
import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  // Read all validation results attached to the request
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Return the first error's message — we don't want to overwhelm the user
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  // No errors — pass to the next middleware or controller
  next();
};
```

**The chain in action for `POST /api/auth/register`:**
```
Request received
  → registerValidator runs (checks name, email, password)
  → validate runs (reads results — if bad, returns 400 immediately)
  → register controller runs (guaranteed to receive valid data)
  → Response sent
```

---

## Slide 17 — Email Service

The email service sends two types of emails: a welcome email when someone first registers, and a password-reset email with a clickable link. It uses **Nodemailer**, which is a Node.js library that connects to any SMTP server (including Gmail).

```js
// server/services/emailService.js
import { transporter, isConfigured } from '../config/email.js';

const FROM    = process.env.EMAIL_FROM || 'classmentor@localhost';
const APP_URL = process.env.APP_URL    || 'http://localhost:3000';

// Generic mail-sending function — all other functions call this
export const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter || !isConfigured) {
    // SMTP credentials not set up — silently log instead of crashing
    // This allows the app to work without email during development
    console.log('[Email mock — not actually sent]', { to, subject });
    return { messageId: 'mock-' + Date.now() };
  }
  const info = await transporter.sendMail({ from: FROM, to, subject, text, html });
  return info;
};

// Password reset email — the most important one
export const sendPasswordResetEmail = async (email, resetToken) => {
  // Build the full reset URL that the user clicks in the email
  // The token is in the query string: /reset-password?token=eyJhbG...
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  return sendMail({
    to: email,
    subject: 'Reset your classMentor AI password',
    text: `Reset link (valid 1 hour): ${resetUrl}`, // Plain text fallback
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to set a new password (valid for 1 hour):</p>
      <p><a href="${resetUrl}" style="background:#238636;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none">Reset Password</a></p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
};
```

---

## Slide 18 — Environment Variables

All configuration values that change between environments (development vs production) or that are secret must live in `.env`. Never hardcode API keys or passwords directly in source code.

```bash
# server/.env — this file is in .gitignore and never shared

# Database — the connection string to your MongoDB cluster
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/classmentor

# Security — sign your JWTs with this secret; must be long and random in production
JWT_SECRET=use_a_long_random_string_here_at_least_32_characters

# Server
PORT=5000  # Which port Express listens on

# Groq AI
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx  # From console.groq.com
USE_MOCK_AI=false  # Set to true to skip Groq and use mock responses

# Email (optional — app works without it)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465       # Use 465 for SSL or 587 for TLS
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Gmail App Password (NOT your real password!)
EMAIL_FROM=classMentor <your@gmail.com>
APP_URL=http://localhost:3000  # Used to build the reset password link in emails
```

**Copy the example file to create your own:**
```bash
cp .env.example .env
# Then edit .env with your real values
```

> ⚠️ **`.gitignore` is critical here.** The server folder has a `.gitignore` that lists `.env`. If you accidentally push `.env` to GitHub, your API keys are exposed to the world. Always verify `.env` is ignored before your first commit.

---

## Slide 19 — Key Concepts Covered Today

**✅ RESTful API design** — HTTP methods map to CRUD operations; status codes communicate the result clearly; resources are URLs that represent things (users, chats, messages).

**✅ JWT authentication** — Stateless tokens that prove identity; signed with a secret key; clients store and send them with every request; servers verify without needing a session store.

**✅ bcrypt password hashing** — Passwords are irreversibly hashed before storage; `bcrypt.compare` re-hashes the input and compares; salt rounds control security vs speed.

**✅ Middleware pattern** — Functions that sit between request and controller; can validate input, check auth, or handle file uploads; call `next()` to continue or `res.json()` to stop.

**✅ Groq API integration** — OpenAI-compatible; Llama 3.1 for chat; Whisper for speech-to-text; mock mode allows teaching without live API access.

**✅ Multer for file uploads** — Parses `multipart/form-data`; memoryStorage keeps files in RAM as buffers; fileFilter restricts accepted types.

**✅ express-validator** — Declarative validation rules per field; chained with a validate middleware; only trusted input reaches controllers.

**✅ Nodemailer** — SMTP-based email sending; graceful fallback to console log if not configured.

---

## Slide 20 — What's Next?

Today you built **The Brain** — a fully working REST API that the React frontend can now talk to. If you run both `npm run dev` (in server/) and `npm run dev` (in client/), you have a complete working app — except data disappears every time the server restarts.

**Next → Masterclass 3: The Memory**

We fix that by connecting to MongoDB:
- Setting up a cloud MongoDB Atlas cluster
- Defining Mongoose schemas for User and Chat
- Making all data persist across restarts
- Understanding when to embed vs reference data

```bash
git add .
git commit -m "Masterclass 2 complete"
git tag masterclass-2
git push origin main
git push origin masterclass-2
```

---

## Slide 21 — Q&A / Recap

> What did we build in this masterclass?

1. **Express server** with CORS, JSON body parsing, health check, and clean route mounting
2. **7 auth endpoints** — register, login, getMe, updateProfile, deleteAccount, forgot/reset password
3. **5 chat endpoints** — create, list (with search), get, send message with real AI, delete
4. **1 voice endpoint** — audio upload → Groq Whisper → transcribed text returned
5. **JWT protect middleware** — verifies tokens and attaches user to every protected request
6. **Groq AI integration** — Llama 3.1 for chat responses, Whisper for voice, with timeout and error handling
7. **express-validator pipeline** — clean validation before controllers run
8. **Nodemailer email service** — password reset emails with a graceful fallback

**Questions?** 🚀
