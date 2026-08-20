# The Undertow — Backend

API for player profiles, character sheets, news, rules, and gallery uploads.
Node.js + Express + MySQL (mysql2).

## 1. Hostinger side — allow Railway to reach the database

Hostinger MySQL databases block remote connections by default. In hPanel:

1. Go to **Databases → Remote MySQL**.
2. Add a remote access entry. Railway's outbound IPs aren't fixed, so if
   Hostinger only accepts specific IPs (rather than a wildcard `%`), you'll
   need to either use `%` (any host — fine for a small hobby server, but
   loosest option) or check Railway's docs for their current static egress
   IP range and add that.
3. Confirm your database name and user match what you gave me:
   - DB: `s69327556_underflow`
   - User: `u69327556_dCZge0v49l`
4. In **phpMyAdmin** for that database, run `schema.sql` (SQL tab → paste
   the contents → Go). This creates all the tables and seeds a few starter
   rules sections.

## 2. Generate the admin password hash

Don't put a plain password in `.env` — generate a bcrypt hash once, locally:

```bash
node -e "require('bcrypt').hash('your-chosen-password', 10).then(console.log)"
```

Paste the output into `ADMIN_PASSWORD_HASH` (in `.env` locally, and as a
Railway variable in production). `ADMIN_USERNAME` can just be plain text.

## 3. Environment variables

Copy `.env.example` to `.env` locally and fill in the real values. On
Railway: **Project → Variables**, add each key from `.env.example` with
your real values (paste your DB password there — never into `.env` if
you're committing this repo, and never here in chat).

Also generate a `JWT_SECRET`:

```bash
openssl rand -hex 32
```

## 4. Local install & run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/api/health` — should return `{"ok":true}`.
If it fails to connect to the database, check the console output for the
mysql2 error (wrong host, remote access not enabled yet, etc.).

## 5. Deploy to Railway

1. Push this backend to its own GitHub repo (or a `/backend` folder in your
   existing one — either works, just point Railway at the right root).
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Add all the variables from step 3 in Railway's Variables tab.
4. **Important — image uploads:** Railway's filesystem is wiped on every
   redeploy. Add a **Volume** (Railway → your service → Settings →
   Volumes), mount it at e.g. `/data/uploads`, and set `UPLOAD_DIR=/data/uploads`
   in your variables. Without this, every profile picture, character
   portrait, and gallery upload disappears the next time you deploy.
5. Railway auto-detects `npm start` from `package.json` — no extra config
   needed.

## API overview

| Feature | Endpoints |
|---|---|
| Profiles | `GET /api/profiles`, `GET /api/profiles/:id`, `POST /api/profiles`, `PATCH /api/profiles/:id`, `POST /api/profiles/:id/avatar` |
| Character sheets | `GET /api/characters`, `GET /api/characters/:id`, `POST /api/characters`, `PATCH /api/characters/:id`, `DELETE /api/characters/:id`, `POST /api/characters/:id/portrait` |
| Gallery | `GET /api/gallery`, `POST /api/gallery`, `DELETE /api/gallery/:id` (admin) |
| News | `GET /api/news`, `GET /api/news/:slug`, `POST /api/news` (admin), `DELETE /api/news/:id` (admin) |
| Rules | `GET /api/rules`, `GET /api/rules/:key`, `PUT /api/rules/:key` (admin) |
| Admin login | `POST /api/auth/admin-login` → `{ token }`, send as `Authorization: Bearer <token>` on admin routes |

## What's not built yet

This covers profiles + character sheets (with picture upload), news, and
rules — what you asked for this round. Still stubbed in the schema but not
wired up: whitelist requests, banking/daily redeem, minigames, and the full
admin console UI. The `whitelist_requests` and `wallets` tables already
exist in `schema.sql` so we're not restructuring the database later — just
add routes for them when you're ready.

Auth is currently a single hardcoded admin login. Once Discord OAuth
account linking is built (matching the plan from the Halloweentown site),
swap `requireAdmin` in `src/middleware/auth.js` for real per-resident
sessions checked against `users.role`.
