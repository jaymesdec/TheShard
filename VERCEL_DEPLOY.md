# Vercel Deploy Guide (TheShard)

You switched this project to a Vercel deployment experiment.

## What I changed
- Added root `vercel.json` configured for the web app at `apps/web`.
- Kept OAuth env wiring in `apps/web/.env.example`.

## Deploy steps (Vercel)

## 1) Import repo
1. Go to Vercel → **Add New Project**
2. Import `jaymesdec/TheShard`
3. Keep project at repo root (the `vercel.json` handles app paths)

## 2) Environment Variables (Vercel Project Settings)
Set these in Vercel for Production (and Preview if desired):

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NODE_ENV=production`

Optional:
- `DATABASE_URL` (without this, app may use local/mock adapter behavior)
- `NEXT_PUBLIC_APP_URL` (if needed in your app logic)

## 3) Google OAuth redirect setup
In Google Cloud Console:

Authorized JavaScript origin:
- `https://<your-vercel-domain>`

Authorized redirect URI:
- `https://<your-vercel-domain>/api/auth/callback/google`

## 4) Deploy
- Trigger deploy from Vercel UI, or push commits to `main` for auto-deploy.

## CLI flow (optional)
If you want command-line deploys:

```bash
npm i -g vercel
cd /Users/jdec/Code/TheShard
vercel login
vercel                # preview deploy
vercel --prod         # production deploy
```

## Important caveat
This Vercel config currently treats the web output as build client output (`apps/web/build/client`).
If you need full SSR + server-auth behavior end-to-end and any auth routes fail at runtime, we should switch to a server-capable deployment path for this app runtime.

For your experiment, this is the fastest Vercel-compatible starting point.
