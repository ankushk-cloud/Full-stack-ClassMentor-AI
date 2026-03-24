# 🚀 Deployment Guide — Vercel (Frontend) + Render (Backend)

---

## 📌 What Was Already Done For You (No Action Needed)

Before deploying, two small things were fixed in the code:

### 1. `client/src/services/api.js`
**Why?** Locally your app uses a Vite "proxy" trick to talk to your backend (`/api`). But on Vercel, that trick doesn't exist — Vercel needs the **real full URL** of your backend.
So this one line was changed to read the URL from an environment variable:
```
VITE_API_URL=https://your-render-backend.onrender.com/api
```
You'll set that variable inside Vercel later (Step 2, Step 4).

---

### 2. `client/vercel.json`
**What is it?** A simple settings file I manually created. No installation needed.
**Why does it exist?** Your app uses React Router (for navigation between pages like `/login`, `/chat`). Without this file, if a user refreshes the page on Vercel, they get a **404 error**. This file tells Vercel: "always send all traffic to index.html and let React handle routing."

Contents of the file (just 3 lines of config, nothing scary):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Both files are already committed and pushed to GitHub. ✅

---

## 🔴 PART 1 — Deploy Backend on Render

### Step 1: Create Render Account
1. Open [https://render.com](https://render.com) in your browser
2. Click **Get Started for Free**
3. Click **Continue with GitHub** and sign in with your GitHub account
4. Authorize Render when it asks for GitHub permissions

---

### Step 2: Create a New Web Service
1. Once inside the Render dashboard, click the **New +** button (top right)
2. Select **Web Service** from the dropdown
3. On the next page, you'll see a list of your GitHub repos
4. Find **Masterclass-Project** and click **Connect** next to it

---

### Step 3: Fill in the Settings

You'll see a form. Fill in exactly these values:

| Field | What to type |
|---|---|
| Name | `classmentor-ai-backend` |
| Region | Select **Singapore** (closest for India) |
| Branch | `main` |
| Root Directory | `server` ← Click **Edit** and type this |
| Runtime | `Node` (should auto-detect) |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Select **Free** |

> ⚠️ **Root Directory is the most important field.** Your backend code is inside the `server` folder, so you must tell Render to look there.

---

### Step 4: Add Environment Variables

Scroll down on the same page to find **Environment Variables**. Click **Add Environment Variable** for each one below:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas URL (copy from your local `.env` file) |
| `JWT_SECRET` | Any long random text, e.g. `classMentorSuperSecret2024!` |
| `GROQ_API_KEY` | Your Groq key (copy from local `.env`) |
| `USE_MOCK_AI` | `false` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail App Password (the 16-character one) |
| `EMAIL_FROM` | `classMentor AI <your-email@gmail.com>` |
| `APP_URL` | Leave blank for now — you'll fill this after Vercel is done |

> ❌ Do NOT add `PORT` — Render handles this automatically.

---

### Step 5: Deploy
1. Click **Create Web Service** at the bottom
2. Render will start building your project — you can watch the live logs
3. Wait until you see a green ✅ **Live** status (takes 2–4 minutes)
4. Your backend URL will look like:
   ```
   https://classmentor-ai-backend.onrender.com
   ```
5. **Copy this URL** — you'll need it in the next part

---

### Step 6: Test That the Backend Works
Open this URL in your browser (replace with your actual Render URL):
```
https://classmentor-ai-backend.onrender.com/api/health
```
You should see:
```json
{ "status": "ok", "message": "classMentor AI API is running" }
```
If you see this, your backend is ✅ working.

> 💤 **Note:** The free Render plan puts your service to sleep after 15 minutes of no use. The first request after sleeping takes about 30 seconds. This is completely normal.

---

## 🟢 PART 2 — Deploy Frontend on Vercel

### Step 1: Create Vercel Account
1. Open [https://vercel.com](https://vercel.com) in your browser
2. Click **Sign Up**
3. Click **Continue with GitHub** and sign in
4. Authorize Vercel when asked

---

### Step 2: Import Your Project
1. After logging in you'll land on the dashboard
2. Click **Add New…** → **Project**
3. Find **Masterclass-Project** in the list
4. Click **Import**

---

### Step 3: Configure the Project

You'll see a settings form. Change these fields:

| Field | What to type/select |
|---|---|
| Framework Preset | `Vite` (Vercel usually auto-detects) |
| Root Directory | `client` ← Click **Edit** and type this |
| Build Command | `npm run build` (should be auto-filled) |
| Output Directory | `dist` (should be auto-filled) |
| Install Command | `npm install` (should be auto-filled) |

> ⚠️ **Root Directory is the most important field here too.** Your frontend code is inside the `client` folder.

---

### Step 4: Add Environment Variable
Still on the same settings page, scroll down to **Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://classmentor-ai-backend.onrender.com/api` |

> ⚠️ Use your actual Render URL from Part 1. Make sure it ends with `/api`.

---

### Step 5: Deploy
1. Click **Deploy**
2. Vercel will build your React app (takes 1–2 minutes)
3. Once done, you'll get a URL like:
   ```
   https://classmentor-ai.vercel.app
   ```
4. **Copy this URL** — go back to Render now

---

## 🔁 Final Step — Update Render with the Vercel URL

This step makes password reset emails contain the right link.

1. Go back to [render.com](https://render.com) and open your backend service
2. Click the **Environment** tab on the left
3. Find `APP_URL` and set its value to your Vercel URL:
   ```
   https://classmentor-ai.vercel.app
   ```
4. Click **Save Changes**
5. Render will auto-redeploy (takes ~1 minute)

---

## ✅ Test Everything End-to-End

Open your Vercel URL and check:
- [ ] Can you go to the app without errors?
- [ ] Can you register a new account?
- [ ] Can you log in?
- [ ] Can you create a chat and get an AI reply?
- [ ] Does "Forgot Password" send an email with a working link?

---

## 🔄 How Future Updates Work

After the initial setup, you never need to touch Vercel or Render again. Just push your code:

```bash
git add .
git commit -m "your update"
git push origin main
```
Both Vercel and Render will **automatically redeploy** whenever you push to `main`. ✅

---

## ❗ Troubleshooting

| Problem | Fix |
|---|---|
| Render build fails | Double-check Root Directory is set to `server` |
| Vercel page shows 404 on refresh | Make sure `client/vercel.json` is committed to GitHub |
| API calls fail on Vercel | Check `VITE_API_URL` in Vercel settings — must end with `/api` |
| "Cannot connect to DB" error | Your `MONGODB_URI` on Render must be the Atlas URL, not `localhost` |
| Password reset link is wrong | Update `APP_URL` on Render to your Vercel URL |
| First Render request is slow | Normal — free plan sleeps after 15 min of inactivity |
