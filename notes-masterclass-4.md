# Masterclass 4 — The Launch
## Deployment: Vercel & Render Cloud Configuration
### Quick Reference Notes — Files & What We're Building

---

> **Big picture for MC4:** The app is fully working end-to-end after MC3. In MC4 we first join frontend + backend, verify end-to-end locally, then deploy frontend → Vercel and backend → Render.

---

## Phase 1 — Join Frontend & Backend (Local Verification)

Before deploying, confirm everything works together on your machine.

### `client/vite.config.js`
- **Vite Dev Proxy** — in development, any request to `/api` from the React app is automatically forwarded to `http://localhost:5000` (the Express server).
- This is why `api.js` uses `baseURL: '/api'` and it works in dev even though no `/api` route exists on `localhost:3000`.
- Config added:
  ```js
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
  ```

### `client/src/services/api.js`
- **Update the base URL** to use a Vite environment variable so it works in both dev and production:
  ```js
  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const api = axios.create({ baseURL: API_URL });
  ```
- In dev → `VITE_API_URL` is not set → falls back to `'/api'` → Vite proxy forwards to Express.
- In production → `VITE_API_URL` is set to the Render backend URL in Vercel's dashboard.

### End-to-End Local Test Checklist
- [ ] Start the backend: `cd server && npm run dev` (port 5000)
- [ ] Start the frontend: `cd client && npm run dev` (port 3000)
- [ ] Register a new account
- [ ] Log in — verify JWT is stored in `localStorage`
- [ ] Create a chat and send a message — verify AI response is returned
- [ ] Test voice recording (if `GROQ_API_KEY` is set)
- [ ] Test forgot/reset password (if SMTP is configured)
- [ ] Test theme toggle (dark/light) — verify it persists on refresh
- [ ] Log out — verify redirect to `/login`

---

## Phase 2 — Backend Deployment (Render)

### `server/server.js` — CORS Update for Production
- Update CORS config to **restrict which origins can call the API** in production:
  ```js
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.CLIENT_URL,   // e.g. 'https://classmentor-ai.vercel.app'
  ].filter(Boolean);

  app.use(cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true); // Postman / curl / mobile
      if (allowedOrigins.includes(requestOrigin)) callback(null, requestOrigin);
      else callback(new Error(`CORS: Origin ${requestOrigin} not allowed`));
    },
    credentials: true,
  }));
  ```

### `server/package.json`
- The `"start"` script should be: `"node server.js"` — Render uses this in production (NOT `nodemon`).

### Render Dashboard Configuration
| Setting | Value |
|---------|-------|
| Service type | Web Service |
| Root directory | `server` |
| Runtime | Node |
| Build command | `npm install` |
| Start command | `node server.js` |

### Render Environment Variables (set in dashboard → Environment tab)
| Variable | What to set |
|---------|------------|
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | Long random string (32+ chars) — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | Render sets this automatically — do NOT hardcode |
| `GROQ_API_KEY` | From `console.groq.com` |
| `USE_MOCK_AI` | `false` |
| `NODE_ENV` | `production` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `your@gmail.com` |
| `SMTP_PASS` | 16-character Gmail App Password (NOT your Gmail password) |
| `EMAIL_FROM` | `classMentor AI <your@gmail.com>` |
| `APP_URL` | `https://classmentor-ai.vercel.app` (your Vercel URL) |
| `CLIENT_URL` | `https://classmentor-ai.vercel.app` (used for CORS) |

### MongoDB Atlas — Network Access
- Add `0.0.0.0/0` to the Atlas Network Access allowlist.
- Render uses **dynamic IPs** that change on restart — allowing all IPs is the standard solution.
- The real security is the database username + password in the URI.

### Gmail App Password (for password-reset email)
1. Go to `myaccount.google.com` → Security → enable **2-Step Verification**.
2. Search for **"App Passwords"** → Mail → Other → type "classmentor" → Generate.
3. Copy the 16-character token → paste as `SMTP_PASS` in Render.

---

## Phase 3 — Frontend Deployment (Vercel)

### Vercel Dashboard Configuration
| Setting | Value |
|---------|-------|
| Root directory | `client` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

### Vercel Environment Variable
| Variable | Value |
|---------|-------|
| `VITE_API_URL` | `https://classmentor-api.onrender.com/api` |

> Must start with `VITE_` — Vite only exposes env vars with this prefix to the browser at build time.

### What Vite produces in `client/dist/`
- `index.html` — short entry HTML file.
- `assets/index-[hash].js` — all React code, components, and libraries (minified).
- `assets/index-[hash].css` — all styles (minified).
- Content-hash in filenames = cache busting (new deploy → new filename → browser fetches fresh copy).

---

## Security Additions

### `server/server.js` — helmet (HTTP security headers)
```bash
npm install helmet
```
- Add `app.use(helmet())` **before all other middleware**.
- Automatically sets: `X-XSS-Protection`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`.

### `server/server.js` — express-rate-limit (brute-force protection)
```bash
npm install express-rate-limit
```
- Auth routes: max 20 requests per IP per 15 minutes (prevents password guessing).
- Other API routes: max 200 requests per IP per 15 minutes.

---

## Handling Render Cold Starts

### `client/src/pages/Login.jsx` (optional UX improvement)
- Render free tier spins down after 15 minutes of inactivity.
- First request after that takes 30–60 seconds (cold start).
- Add a slow-load detection: if loading takes > 5 seconds, show a message:
  > "Server is waking up — this may take up to 60 seconds on first load..."

---

## Auto-Deploy Pipeline (How CI/CD Works)

```
git add . && git commit -m "..." && git push origin main
                ↓
GitHub notifies Vercel AND Render via webhook
                ↙            ↘
Vercel: npm install        Render: npm install
        npm run build              node server.js
        uploads dist/         new server is live
        live in ~30s          live in ~2 min
```

---

## Deployment Checklist

### ✅ Backend (Render)
- [ ] Service type: Web Service
- [ ] Root directory: `server`
- [ ] Build: `npm install` / Start: `node server.js`
- [ ] All env vars set (MONGODB_URI, JWT_SECRET, GROQ_API_KEY, SMTP_*, APP_URL, CLIENT_URL)
- [ ] `NODE_ENV=production`, `USE_MOCK_AI=false`
- [ ] Health check passes: `GET /api/health` → `{ status: 'ok' }`

### ✅ Database (MongoDB Atlas)
- [ ] M0 free cluster created
- [ ] Database user with read/write access
- [ ] Network Access → `0.0.0.0/0` added

### ✅ Frontend (Vercel)
- [ ] Root directory: `client`, Framework: Vite, Output: `dist`
- [ ] `VITE_API_URL` env var set to Render URL
- [ ] Re-deploy triggered after setting the env var

### ✅ End-to-End Test (on live production URLs)
- [ ] Register a new account
- [ ] Login → get AI chat response
- [ ] Voice input works
- [ ] Forgot/reset password email received
- [ ] Logout → redirected to login
- [ ] Refresh on `/chat` doesn't show a blank page (check Vercel rewrite rule if it does)

---

## Common Deployment Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `CORS error` | `CLIENT_URL` env var missing on Render | Add `CLIENT_URL` in Render env vars and redeploy |
| `Cannot connect to MongoDB` | Atlas blocking Render's IP | Add `0.0.0.0/0` to Atlas Network Access |
| `Invalid API key` | `GROQ_API_KEY` not set | Add it in Render → Environment tab |
| `Application error` | Server crashed on startup | Check Render → Logs tab for the actual error |
| `Blank page on Vercel` | Wrong output directory or build failed | Check Vercel → Deployments → Build Logs |
| `404 on page refresh` | SPA routing not set up | Add rewrite rule in Vercel: `/.*` → `/index.html` |
| `Slow first request` | Render free tier cold start | Expected — show user a friendly message |
| `Email not received` | Wrong `SMTP_PASS` | Use the 16-char App Password, not your Gmail password |

---

## Key Concepts Covered
- **Vite proxy** — dev-only forwarding from `/api` to Express server
- **`VITE_API_URL` env var** — switches API base URL between dev and production without code changes
- **Vercel** — deploys static React builds to global CDN, auto-deploys on `git push`
- **Render** — runs the Node.js/Express server as a live process, auto-deploys on `git push`
- **CORS in production** — restrict allowed origins to only the Vercel frontend URL
- **Environment variables** — secrets never in code; set in platform dashboards
- **Gmail App Password** — 16-char token for SMTP; regular Gmail password doesn't work in code
- **Render cold starts** — free tier spins down after 15 min inactivity; first request takes 30–60s
- **`helmet`** — sets HTTP security headers; add before all other middleware
- **`express-rate-limit`** — prevents brute-force attacks on auth routes
- **Git tags** — `git tag masterclass-4` + `git push origin masterclass-4` marks the deploy milestone
