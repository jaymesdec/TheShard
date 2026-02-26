# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Create.xyz** full-stack application with two apps in a monorepo structure under `apps/`:

- **`apps/web`** — React Router v7 + Vite + Hono server, styled with Tailwind CSS v3 + Chakra UI
- **`apps/mobile`** — Expo (SDK 54) + React Native app with expo-router, also runs on web via react-native-web

The web app is designed to run inside a Create.xyz sandbox (iframe), communicating with the parent via `postMessage`. The `__create/` directories contain platform infrastructure — avoid modifying these files unless necessary.

## Common Commands

### Web App (`apps/web`)
```bash
bun install                    # Install dependencies (preferred over npm)
bun run dev                    # Start dev server on http://localhost:4000
bun run typecheck              # Run TypeScript type checking
npx vitest                     # Run all tests (jsdom environment)
npx vitest run src/path/test   # Run a single test file
npx vitest --config src/app/api/vitest.config.ts  # Run API tests (node environment)
```

### Mobile App (`apps/mobile`)
```bash
npm install                    # Install dependencies (uses patch-package postinstall)
npx expo start                 # Start Expo dev server
```

## Architecture

### Web App Server Stack
The web server uses **Hono** as the HTTP framework, created via `react-router-hono-server`. The entry point is `apps/web/__create/index.ts`, which sets up:
- Auth.js (via `@hono/auth-js`) with Google OAuth + credentials providers
- Neon Postgres database adapter (`__create/adapter.ts`), or a mock JSON adapter when `DATABASE_URL` is absent
- CORS, body limits, request ID tracing via AsyncLocalStorage
- Integration proxy to `create.xyz` at `/integrations/*`

### Web App Routing
- **Pages**: File-based routing under `apps/web/src/app/` — files named `page.jsx`/`page.tsx` become routes. React Router config in `react-router.config.ts` sets `appDirectory: './src/app'` with SSR enabled.
- **API Routes**: Files named `route.js` under `apps/web/src/app/api/` are auto-discovered by `__create/route-builder.ts` and mounted on Hono. They export HTTP method handlers (`GET`, `POST`, etc.) following Next.js-style conventions. Dynamic segments use `[param]` bracket syntax.
- **Layouts**: `layout.jsx`/`layout.tsx` files wrap nested routes.

### Key Path Aliases
- `@/` maps to `apps/web/src/` (configured in tsconfig and vite)
- `@auth/create/react` → `@hono/auth-js/react`
- `stripe` → `src/__create/stripe.ts` wrapper
- `lodash` → `lodash-es`
- Environment variables use `NEXT_PUBLIC_` prefix (accessible via `import.meta.env`)

### Testing
Two vitest configs exist:
- **Component/UI tests**: `apps/web/vitest.config.ts` — jsdom environment, uses `@testing-library/react`
- **API tests**: `apps/web/src/app/api/vitest.config.ts` — node environment

### Mobile App
Uses Expo Router for file-based routing under `apps/mobile/src/app/`. The `polyfills/web/` directory provides web-compatible shims for native modules (maps, haptics, secure store, etc.). Auth is handled via WebView-based flow communicating with the web app's auth endpoints.

### State Management
Both apps use **Zustand** for client state and **TanStack React Query** for server state.

## Environment Variables

Required for full functionality (without `DATABASE_URL`, the app uses a local JSON mock):
- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_SECRET` — Auth.js secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `CORS_ORIGINS` — Comma-separated allowed origins
- `NEXT_PUBLIC_CREATE_BASE_URL` / `NEXT_PUBLIC_CREATE_HOST` / `NEXT_PUBLIC_PROJECT_GROUP_ID` — Create.xyz platform config
