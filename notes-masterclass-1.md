# Masterclass 1 — The Face
## Component Design & UI Logic with React
### Quick Reference Notes — Files & What We're Building

---

## Project Setup

| Command | Purpose |
|---------|---------|
| `npm create vite@latest client -- --template react` | Create the React project |
| `npm install react-router-dom axios react-markdown` | Install core dependencies |
| `npm run dev` | Start local dev server at `http://localhost:3000` |

---

## Entry & Routing

### `client/index.html`
- The root HTML file. Has a single `<div id="root">` where the entire React app is injected.

### `client/src/main.jsx`
- **Entry point** of the entire React application.
- Wraps the app with `<BrowserRouter>`, `<AuthProvider>`, `<ThemeProvider>`.
- Mounts `<App />` into `index.html`'s `#root` div.

### `client/src/App.jsx`
- **Router / Traffic Director** — maps URLs to page components.
- Defines public routes (`/login`, `/register`, `/forgot-password`, `/reset-password`).
- Defines protected routes (`/`, `/chat`, `/profile`) wrapped in `<ProtectedRoute>`.
- Catch-all redirect for unknown URLs → `/`.

### `client/src/index.css`
- Global base styles — body reset, default font, layout defaults.

---

## Context (Global State)

### `client/src/context/AuthContext.jsx`
- Manages **who is logged in** across the entire app.
- Tracks: `user` object and `loading` boolean.
- Provides functions: `login()`, `register()`, `logout()`, `updateProfile()`, `deleteAccount()`.
- On app startup: checks `localStorage` for a saved token and validates it with the server.
- Exports the `useAuth()` custom hook.

### `client/src/context/ThemeContext.jsx`
- Manages **light / dark mode** across the entire app.
- Stores the full colour token object (`bg`, `surface`, `text`, `accent`, etc.) for both dark and light themes.
- Persists the chosen theme to `localStorage` so it survives page refresh.
- Uses `useLayoutEffect` (not `useEffect`) to prevent flash of wrong theme on load.
- Exports the `useTheme()` custom hook.

---

## Pages

### `client/src/pages/Login.jsx`
- Sign-in screen with **email + password form**.
- Shows inline error messages on failed login.
- Has a "Forgot password?" link → `/forgot-password`.
- On success: stores JWT in `localStorage` and navigates to `/`.

### `client/src/pages/Register.jsx`
- Sign-up screen with **name + email + password form**.
- Calls the register API; auto-logs the user in on success.
- Navigates to home after registration.

### `client/src/pages/ForgotPassword.jsx`
- Single **email field** — user enters their email to request a password reset link.
- Shows a generic success message whether or not the email exists (security: no email enumeration).

### `client/src/pages/ResetPassword.jsx`
- Reads the reset **token from the URL query string** (`?token=...`).
- Shows a new password form.
- Calls the reset-password API; redirects to `/login` on success.

### `client/src/pages/Home.jsx`
- **Landing page** after login.
- Shows a personalised greeting with the user's name.
- Has a "+ New Chat" button and suggestion cards (e.g. "Explain React hooks").

### `client/src/pages/Chat.jsx`
- **Main chat interface** — the most complex page.
- Acts as the **orchestrator/parent** component.
- Manages state: `chats[]`, `activeChat`, `loading`, `sidebarOpen`.
- Handles: `fetchChats()`, `fetchChat(id)`, `createChat()`, `sendMessage(content)`, `deleteChat(id)`.
- Composes three child components: `<ChatSidebar>`, `<MessageList>`, `<MessageInput>`.

### `client/src/pages/Profile.jsx`
- Screen to **edit display name** and manage account settings.
- Has a "Delete Account" button with a confirmation modal that requires the user to type "DELETE".

---

## Reusable Components

### `client/src/components/ProtectedRoute.jsx`
- **Security wrapper** — blocks unauthenticated access to protected pages.
- If `loading` → shows a loading indicator (prevents false redirect during token check).
- If no `user` → redirects to `/login` with `replace` (can't go back).
- If authenticated → renders the wrapped page normally.

### `client/src/components/PasswordInput.jsx`
- A text input with a **👁️ show/hide toggle button**.
- Manages `showPassword` state (boolean); switches `type` between `"password"` and `"text"`.

### `client/src/components/LogoutButton.jsx`
- A button that shows a **"Are you sure?" modal** before logging out.
- Manages `modalOpen` state; calls `logout()` from `AuthContext` only after user confirms.

### `client/src/components/UserAvatar.jsx`
- A coloured circle showing the **user's initials** (e.g. "AK" for Ankush Kumar).
- Extracts first letter of first and last name; applies accent colour background.

### `client/src/components/ThemeToggle.jsx`
- A ☀️ / 🌙 icon button that **switches between light and dark mode**.
- Calls `toggleTheme()` from `ThemeContext`; displays the icon for the current active mode.

### `client/src/components/ChatSidebar.jsx`
- **Left panel** showing all conversations.
- Has a search input that filters the chat list locally (no extra API call).
- Each chat item has an × button with a "Are you sure?" confirmation.
- "+ New Chat" button at the top.

### `client/src/components/MessageList.jsx`
- **Scrollable message feed** showing all messages in the active conversation.
- Uses `useEffect` + `useRef` to auto-scroll to the bottom when a new message is added.
- Shows an animated "AI is thinking..." indicator when `loading` is `true`.

### `client/src/components/MessageInput.jsx`
- **Bottom input bar** with text area, mic button, and send button.
- Manages `inputText`, `isRecording`, and `mediaRecorder` state.
- `Enter` sends the message; `Shift+Enter` inserts a new line.
- **Voice recording flow** using the browser's `MediaRecorder` API:
  1. Request mic access → `navigator.mediaDevices.getUserMedia()`
  2. Collect audio chunks → `MediaRecorder.ondataavailable`
  3. On stop → assemble chunks into a `Blob`
  4. Wrap in `FormData` → POST to `/api/voice/transcribe`
  5. Insert returned transcription text into the input field.

### `client/src/components/ChatBubble.jsx`
- Renders **one single message**.
- User messages → right-aligned, green background, plain text.
- AI messages → left-aligned, grey background, rendered with `<ReactMarkdown>` (supports bold, code, lists, headers).
- Different `border-radius` on each side creates the speech-bubble "tail" effect.

---

## API Service Layer

### `client/src/services/api.js`
- **Single Axios instance** for all backend communication.
- Base URL: `/api` (proxied to `localhost:5000` in dev via `vite.config.js`).
- **Request interceptor** → attaches `Authorization: Bearer <token>` on every request; deletes `Content-Type` for `FormData` uploads (lets browser set the multipart boundary).
- **Response interceptor** → if `401` received → clears token from `localStorage` and forces redirect to `/login`.
- Exports namespaced API functions:
  - `authAPI` — login, register, getMe, updateProfile, deleteAccount, forgotPassword, resetPassword
  - `chatAPI` — createChat, getChats (with search), getChat, sendMessage, deleteChat
  - `voiceAPI` — transcribe (audio file upload)

---

## Key Concepts Covered
- **React Context API** — global state without prop-drilling (AuthContext, ThemeContext)
- **React Router v6** — `<Routes>`, `<Route>`, `<Navigate>`, `useNavigate`
- **Protected Routes** — auth check before rendering any protected page
- **Controlled Inputs** — `value={state}` + `onChange={setState}` for form fields
- **Axios Interceptors** — attach auth token + handle 401 globally
- **MediaRecorder API** — browser built-in voice recording without external library
- **Component Composition** — building pages by assembling small, focused components
- **localStorage Persistence** — JWT token, user object, and theme survive page refresh
