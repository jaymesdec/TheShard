# Replit Deploy Guide (TheShard)

This project can run on Replit using Google OAuth login.

## 1) Replit project setup
1. Create a new Replit from this GitHub repo (`jaymesdec/TheShard`).
2. Open Shell and run:
   ```bash
   cd apps/web
   npm install --legacy-peer-deps
   ```
3. Confirm local run:
   ```bash
   npm run dev
   ```

## 2) Set Replit Secrets
In Replit → **Secrets**, add:

- `AUTH_SECRET` = long random string
- `GOOGLE_CLIENT_ID` = OAuth client ID
- `GOOGLE_CLIENT_SECRET` = OAuth client secret
- `NODE_ENV` = `production`

Optional (if you want real DB instead of local mock):
- `DATABASE_URL`

## 3) Google OAuth configuration
In Google Cloud Console (Credentials):

Authorized JavaScript origins:
- `https://<your-replit-domain>`

Authorized redirect URIs:
- `https://<your-replit-domain>/api/auth/callback/google`

> Replace `<your-replit-domain>` with your Replit app URL.

## 4) Deploy from Replit UI
1. Click **Deploy** in Replit.
2. Deployment command uses `.replit` config:
   - build: `cd apps/web && npm run build`
   - start: `cd apps/web && PORT=$PORT npm run start`

## 5) Command-line workflow (push/publish)
Use git locally:
```bash
# create branch
git checkout -b feature/replit-oauth

# commit changes
git add .
git commit -m "chore: replit deploy + oauth setup"

# push
git push -u origin feature/replit-oauth
```

Then in Replit:
- Pull latest changes from GitHub (or Re-import if needed)
- Redeploy

## 6) Smoke test checklist
After deployment:
1. Open app URL
2. Click Google sign-in
3. Complete OAuth
4. Verify authenticated session works
5. Verify protected app pages render

## Notes
- App already includes Google provider wiring in `apps/web/__create/index.ts`.
- If `DATABASE_URL` is not set, app uses `local-db.json` mock adapter.
