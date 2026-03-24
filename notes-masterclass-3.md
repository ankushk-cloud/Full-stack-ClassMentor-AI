# Masterclass 3 — The Memory
## NoSQL Modeling & Schema Design with MongoDB
### Quick Reference Notes — Files & What We're Building

---

> This masterclass wires up the real MongoDB database. All controller mock/placeholder logic from MC2 is replaced with actual Mongoose queries.

---

## Setup

```bash
npm install mongoose   # Already included in server package.json
```

Update `server/.env`:
```
MONGODB_URI=mongodb+srv://yourUser:yourPassword@cluster0.xxx.mongodb.net/classmentor
```

---

## Config

### `server/config/db.js`
- `connectDB()` — Connects to MongoDB Atlas using `mongoose.connect(process.env.MONGODB_URI)`.
- Logs the connected host on success: `"MongoDB connected: cluster0.xxx.mongodb.net"`.
- Calls `process.exit(1)` on failure — no point running without a database.
- Called at the very start of `server.js` before anything else.

---

## Models

### `server/models/User.js`
- Defines the **User schema** — the blueprint for every user document in the `users` collection.
- **Fields:**
  - `name` — String, required, auto-trimmed.
  - `email` — String, required, must be unique (creates a DB index), auto-lowercased, trimmed.
  - `password` — String, required, min 6 chars, **`select: false`** (excluded from all queries by default for security — must use `.select('+password')` to get it).
  - `timestamps: true` — Mongoose auto-manages `createdAt` and `updatedAt`.
- **Pre-save hook** (`userSchema.pre('save', ...)`) — Runs automatically before every `user.save()`:
  - Only re-hashes if `password` was actually modified — prevents double-hashing on profile name updates.
  - Hashes password with `bcrypt.hash(password, 12)` (cost factor 12 = 4096 iterations).
- Exports: `const User = mongoose.model('User', userSchema)` → creates the `users` collection.

### `server/models/Chat.js`
- Defines the **Chat schema** with an **embedded messages subdocument array**.
- **Message subdocument schema** (not a standalone collection):
  - `role` — String, `enum: ['user', 'assistant']` (rejects any other value).
  - `content` — String, required.
  - `timestamps: true` — each message gets its own `createdAt`.
- **Chat schema fields:**
  - `user` — `mongoose.Schema.Types.ObjectId`, `ref: 'User'` — references the User collection (not embedded). Required.
  - `title` — String, `default: 'New Chat'` — updated after the first message exchange.
  - `messages` — `[messageSchema]` — embedded array of message subdocuments.
  - `timestamps: true` — chat gets `createdAt` and `updatedAt`.
- Exports: `const Chat = mongoose.model('Chat', chatSchema)` → creates the `chats` collection.

---

## Controllers (Updated with Real DB Queries)

### `server/controllers/authController.js`
- `register` — `User.create({ name, email, password })` → Mongoose runs validation + pre-save hook (hashes password) → MongoDB inserts the user document.
- `login` — `User.findOne({ email }).select('+password')` → `bcrypt.compare(input, stored_hash)` → return JWT on match.
- `getMe` — `User.findById(req.user._id)` → returns user object (no password field, since `select: false`).
- `updateProfile` — `User.findByIdAndUpdate(id, { name }, { new: true, runValidators: true })` — `new: true` returns the updated doc.
- `deleteAccount` — **Order matters!** `Chat.deleteMany({ user: id })` first → then `User.findByIdAndDelete(id)`. This avoids orphaned chat documents.
- `forgotPassword` — `User.findOne({ email })` → generate 1-hour reset JWT → call email service.
- `resetPassword` — `jwt.verify(token)` → `User.findById(decoded.id).select('+password')` → set `user.password = newPassword` → `user.save()` (pre-save hook rehashes).

### `server/controllers/chatController.js`
- `createChat` — `Chat.create({ user: req.user._id, title: 'New Chat', messages: [] })`.
- `getChats` — `Chat.find(filter).sort({ updatedAt: -1 }).select('_id title updatedAt')`:
  - Filter always includes `{ user: req.user._id }` (security — user sees only their chats).
  - If `?search=query` provided → builds a case-insensitive regex → adds `$or: [{ title: regex }, { 'messages.content': regex }]`.
  - `.select()` returns only 3 fields — no full message arrays (keeps response small).
- `getChat` — `Chat.findOne({ _id: req.params.id, user: req.user._id })` — ownership check built into the query.
- `sendMessage` — Full flow:
  1. `Chat.findOne({ _id, user })` — verify ownership.
  2. `chat.messages.push({ role: 'user', content })`.
  3. Build `messagesForAI` array (full history for AI "memory").
  4. `await getAIResponse(messagesForAI)` — call Groq.
  5. `chat.messages.push({ role: 'assistant', content: aiResponse })`.
  6. If `chat.messages.length === 2` → auto-set title from first 50 chars of first user message.
  7. `await chat.save()` — persists the entire document.
  8. Return the two new messages (not full history).
- `deleteChat` — `Chat.findOneAndDelete({ _id: req.params.id, user: req.user._id })`.

---

## Database Design Decisions

### Embed vs Reference
| Relationship | Decision | Why |
|---|---|---|
| Messages inside a Chat | **Embedded** (`messages: [messageSchema]`) | Messages are always needed with their chat; exclusively owned; small enough (MongoDB 16MB doc limit) |
| User inside a Chat | **Referenced** (`user: ObjectId`) | One user has many chats — store just the ID reference, not a copy of the entire user object |

### Unique Email Index
- `email: { unique: true }` → MongoDB creates an index on email.
- Index = fast O(log n) lookups by email + enforces no duplicate emails at the database level.
- Duplicate insert throws `MongoServerError: E11000` (`error.code === 11000`).

---

## Database Collections Created

| Collection | Created by `mongoose.model()` | Stores |
|---|---|---|
| `users` | `mongoose.model('User', ...)` | All registered user accounts |
| `chats` | `mongoose.model('Chat', ...)` | All conversations with embedded messages |

---

## Mongoose Operations Used in This App

| Operation | Where Used |
|---|---|
| `Model.create(data)` | Register new user; create new chat |
| `Model.findOne(filter)` | Login by email; get chat with ownership check |
| `Model.findById(id)` | Get current user; verify reset token |
| `Model.findByIdAndUpdate(id, data, opts)` | Update user profile name |
| `Model.findByIdAndDelete(id)` | Delete user account |
| `Model.findOneAndDelete(filter)` | Delete a specific chat (with ownership check) |
| `Model.deleteMany(filter)` | Delete all chats when user deletes account |
| `.sort({ updatedAt: -1 })` | List chats most-recently-updated first |
| `.select('_id title updatedAt')` | Return only needed fields from chat list |
| `.select('+password')` | Override `select: false` to get password for login/reset |

---

## Key Concepts Covered
- **MongoDB document model** — stores data as JSON-like documents in collections (not SQL tables/rows)
- **Mongoose schema** — defines field types, constraints, transformations, and defaults
- **`select: false` for passwords** — password field excluded from all queries; must explicitly opt in
- **Pre-save hooks** — automatic password hashing before every save; the controller just sets the value
- **Embed vs Reference** — messages embedded in chat (always together); user referenced in chat (shared, DRY)
- **Unique index on email** — fast lookups + prevents duplicate accounts at the DB level
- **Cascading deletes** — always delete child documents (chats) before the parent (user)
- **Validation layers** — express-validator at HTTP layer + Mongoose validation at DB layer = two safety nets
