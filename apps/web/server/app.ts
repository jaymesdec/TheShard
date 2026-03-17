/**
 * Vercel serverless entry point.
 *
 * This mirrors the middleware stack from __create/index.ts but exports a
 * Web-API-compatible fetch handler instead of starting a long-running Node
 * HTTP server.  react-router-hono-server is NOT used here — Vercel needs
 * a function, not a listening server.
 */

import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { bodyLimit } from 'hono/body-limit';
import { createRequestHandler } from 'react-router';
import ws from 'ws';
import NeonAdapter from '../__create/adapter';
import MockAdapter from '../__create/mock-adapter';
import { isAuthAction } from '../__create/is-auth-action';

neonConfig.webSocketConstructor = ws;

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const adapter = pool ? NeonAdapter(pool) : MockAdapter();

if (!pool) {
  console.warn(
    '⚠️  No DATABASE_URL found. Using local JSON mock database (local-db.json).'
  );
}

// ---------------------------------------------------------------------------
// Hono app
// ---------------------------------------------------------------------------

const app = new Hono();

app.use(contextStorage());

// -- CORS ------------------------------------------------------------------

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    })
  );
}

// -- Body limits -----------------------------------------------------------

for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024,
      onError: (c) => c.json({ error: 'Body size limit exceeded' }, 413),
    })
  );
}

// -- Auth ------------------------------------------------------------------

if (process.env.AUTH_SECRET) {
  app.use(
    '*',
    initAuthConfig(() => ({
      basePath: '/api/auth',
      secret: process.env.AUTH_SECRET,
      trustHost: true,
      pages: {
        signIn: '/account/signin',
        signOut: '/account/logout',
      },
      skipCSRFCheck,
      session: { strategy: 'jwt' },
      callbacks: {
        session({ session, token }) {
          if (token.sub) {
            session.user.id = token.sub;
          }
          return session;
        },
      },
      cookies: {
        csrfToken: {
          options: { secure: true, sameSite: 'lax' },
        },
        sessionToken: {
          options: { secure: true, sameSite: 'lax' },
        },
        callbackUrl: {
          options: { secure: true, sameSite: 'lax' },
        },
      },
      providers: [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
          id: 'credentials-signin',
          name: 'Credentials Sign in',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
          authorize: async (credentials) => {
            const { email, password } = credentials;
            if (
              !email ||
              !password ||
              typeof email !== 'string' ||
              typeof password !== 'string'
            ) {
              return null;
            }
            const user = await adapter.getUserByEmail?.(email);
            if (!user) return null;

            const matchingAccount = (user as any).accounts.find(
              (a: any) => a.provider === 'credentials'
            );
            const accountPassword =
              matchingAccount?.password || matchingAccount?.extraData?.password;
            if (!accountPassword) return null;

            return (await bcrypt.compare(password, accountPassword)) ? user : null;
          },
        }),
        Credentials({
          id: 'credentials-signup',
          name: 'Credentials Sign up',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
            name: { label: 'Name', type: 'text' },
            image: { label: 'Image', type: 'text', required: false },
          },
          authorize: async (credentials) => {
            const { email, password, name, image } = credentials;
            if (
              !email ||
              !password ||
              typeof email !== 'string' ||
              typeof password !== 'string'
            ) {
              return null;
            }
            const user = await adapter.getUserByEmail?.(email);
            if (user) return null;

            const newUser = await adapter.createUser?.({
              id: crypto.randomUUID(),
              emailVerified: null,
              email,
              name:
                typeof name === 'string' && name.length > 0 ? name : undefined,
              image:
                typeof image === 'string' && image.length > 0
                  ? image
                  : undefined,
            });
            if (!newUser) return null;

            await adapter.linkAccount?.({
              extraData: { password: await bcrypt.hash(password, 10) },
              type: 'credentials' as any,
              userId: newUser.id,
              providerAccountId: newUser.id,
              provider: 'credentials',
            });
            return newUser;
          },
        }),
      ],
    }))
  );
}

// -- Auth routes -----------------------------------------------------------

app.use('/api/auth/*', async (c, next) => {
  if (isAuthAction(c.req.path)) {
    return authHandler()(c, next);
  }
  return next();
});

// -- Create.xyz integration proxy ------------------------------------------

app.all('/integrations/:path{.+}', async (c) => {
  const queryParams = c.req.query();
  const base =
    process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz';
  const qs =
    Object.keys(queryParams).length > 0
      ? `?${new URLSearchParams(queryParams).toString()}`
      : '';
  const url = `${base}/integrations/${c.req.param('path')}${qs}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-ignore — required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST!,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST!,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST!,
      'x-createxyz-project-group-id':
        process.env.NEXT_PUBLIC_PROJECT_GROUP_ID!,
    },
  });
});

// -- API routes (statically imported for serverless bundling) --------------

import * as authExpoWebSuccess from '../src/app/api/auth/expo-web-success/route.js';
import * as authToken from '../src/app/api/auth/token/route.js';
import * as groupsRoute from '../src/app/api/groups/route.js';
import * as groupMembersRoute from '../src/app/api/groups/[id]/members/route.js';
import * as groupMessagesRoute from '../src/app/api/groups/[id]/messages/route.js';
import * as notesRoute from '../src/app/api/notes/route.js';
import * as noteByIdRoute from '../src/app/api/notes/[id]/route.js';
import * as todosRoute from '../src/app/api/todos/route.js';
import * as todoByIdRoute from '../src/app/api/todos/[id]/route.js';
import * as usersSearchRoute from '../src/app/api/users/search/route.js';

type RouteModule = Record<string, ((req: Request, ctx: any) => Response | Promise<Response>) | undefined>;

function mountApiRoute(path: string, mod: RouteModule) {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
  for (const method of methods) {
    const handler = mod[method];
    if (!handler) continue;
    const m = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
    app[m](`/api${path}`, async (c) => {
      const params = c.req.param();
      return handler(c.req.raw, { params });
    });
  }
}

mountApiRoute('/auth/expo-web-success', authExpoWebSuccess as RouteModule);
mountApiRoute('/auth/token', authToken as RouteModule);
mountApiRoute('/groups', groupsRoute as RouteModule);
mountApiRoute('/groups/:id/members', groupMembersRoute as RouteModule);
mountApiRoute('/groups/:id/messages', groupMessagesRoute as RouteModule);
mountApiRoute('/notes', notesRoute as RouteModule);
mountApiRoute('/notes/:id', noteByIdRoute as RouteModule);
mountApiRoute('/todos', todosRoute as RouteModule);
mountApiRoute('/todos/:id', todoByIdRoute as RouteModule);
mountApiRoute('/users/search', usersSearchRoute as RouteModule);

// -- React Router SSR handler ----------------------------------------------

app.use(async (c) => {
  // @ts-expect-error — virtual module provided by React Router at build time
  const build = await import('virtual:react-router/server-build');
  const handler = createRequestHandler(build, 'production');
  return handler(c.req.raw);
});

export default app.fetch;
