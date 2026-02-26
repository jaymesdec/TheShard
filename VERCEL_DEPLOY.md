# Vercel Deployment Guide (TheShard)

Full SSR deployment with Google OAuth and Vercel Postgres.

## Prerequisites

- A [Vercel](https://vercel.com) account (free Hobby plan works)
- A [Google Cloud](https://console.cloud.google.com) project with OAuth credentials
- Git repo pushed to GitHub

---

## 1. Create a Vercel Postgres database

1. Go to **Vercel Dashboard > Storage > Create Database > Postgres**
2. Name it (e.g. `theshard-db`) and pick a region
3. Once created, copy the `POSTGRES_URL` connection string (you'll need it in step 3)
4. Open the **Query** tab and paste the contents of `apps/web/db/schema.sql`, then run it

## 2. Import the repo

1. Go to **Vercel > Add New Project**
2. Import `jaymesdec/TheShard` (or wherever your repo lives)
3. Keep the root directory as `.` — the `vercel.json` handles paths

## 3. Set environment variables

In **Project Settings > Environment Variables**, add these for **Production** (and Preview if you want):

| Variable | Value |
|---|---|
| `AUTH_SECRET` | Run `openssl rand -base64 32` to generate |
| `AUTH_URL` | `https://your-app.vercel.app` (your Vercel domain) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `DATABASE_URL` | The `POSTGRES_URL` from step 1 |
| `NODE_ENV` | `production` |

## 4. Configure Google OAuth redirect

In [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials), edit your OAuth 2.0 Client:

**Authorized JavaScript origins:**
```
https://your-app.vercel.app
```

**Authorized redirect URIs:**
```
https://your-app.vercel.app/api/auth/callback/google
```

Replace `your-app.vercel.app` with your actual Vercel domain.

## 5. Deploy

Push to `main` for auto-deploy, or trigger manually from the Vercel dashboard.

### CLI alternative

```bash
npm i -g vercel
vercel login
vercel          # preview deploy
vercel --prod   # production deploy
```

---

## Architecture notes

- **Local dev** uses `react-router-hono-server` with a Node HTTP server (`__create/index.ts`)
- **Vercel** uses a separate entry point (`server/app.ts`) that exports a Web API fetch handler via `hono/vercel`. The `@vercel/react-router` preset packages this as a serverless function.
- API routes are statically imported in `server/app.ts` (the filesystem-scanning route-builder from `__create/` doesn't work in serverless)
- The `VERCEL=1` env var controls which code path is used at build time
- Vercel Postgres is Neon under the hood, so the existing `@neondatabase/serverless` adapter works with zero changes

## Adding new API routes

When you add a new API route file (e.g. `src/app/api/foo/route.js`), you also need to add a static import and `mountApiRoute` call in `server/app.ts` for it to work on Vercel.
