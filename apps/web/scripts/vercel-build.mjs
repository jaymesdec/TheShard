/**
 * Manual Vercel Build Output API script.
 *
 * This replaces @vercel/react-router's post-build step. It:
 * 1. Runs `react-router build` (which builds client + SSR bundles)
 * 2. Creates the .vercel/output directory structure:
 *    - static/  ← client assets from build/client
 *    - functions/index.func/  ← serverless function from build/server
 *    - config.json  ← routing rules
 */

import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd(); // apps/web

// Step 1: Build React Router
console.log('→ Building React Router app...');
execSync('npx react-router build', { stdio: 'inherit', cwd: ROOT });

// Step 2: Create .vercel/output structure
const OUTPUT = join(ROOT, '.vercel', 'output');
mkdirSync(OUTPUT, { recursive: true });

// Step 2a: Copy client assets to static/
console.log('→ Copying client assets to .vercel/output/static/');
const staticDir = join(OUTPUT, 'static');
cpSync(join(ROOT, 'build', 'client'), staticDir, { recursive: true });

// Step 2b: Create serverless function
console.log('→ Creating serverless function...');
const funcDir = join(OUTPUT, 'functions', 'index.func');
mkdirSync(funcDir, { recursive: true });

// Copy the server build into the function directory
const serverDir = join(ROOT, 'build', 'server');
const entries = readdirSync(serverDir);

// With the Vercel preset, output goes to nodejs_*/; without it, directly in build/server/
const nodejsDir = entries.find((d) => d.startsWith('nodejs_'));
if (nodejsDir) {
  cpSync(join(serverDir, nodejsDir), funcDir, { recursive: true });
} else {
  for (const entry of entries) {
    if (entry === '.vite') continue;
    cpSync(join(serverDir, entry), join(funcDir, entry), { recursive: true });
  }
}

// Add package.json with "type": "module" so Node.js treats .js as ESM
writeFileSync(
  join(funcDir, 'package.json'),
  JSON.stringify({ type: 'module' }, null, 2)
);

// Copy native modules that can't be bundled by Vite (ssr.external in vite.config.ts).
// argon2 uses prebuilt native binaries (.node files).
console.log('→ Copying native modules (argon2)...');
const funcNodeModules = join(funcDir, 'node_modules');
const srcNodeModules = join(ROOT, 'node_modules');
const nativeModules = ['argon2'];
for (const mod of nativeModules) {
  const src = join(srcNodeModules, mod);
  const dest = join(funcNodeModules, mod);
  try {
    cpSync(src, dest, { recursive: true });
  } catch (e) {
    console.warn(`  Warning: Could not copy ${mod}: ${e.message}`);
  }
}

// Create the adapter entry point that bridges Node.js (req, res) ↔ Web API (Request → Response)
// Our index.js exports app.fetch which is (Request) => Response, but Vercel's Node.js
// runtime expects (IncomingMessage, ServerResponse) => void.
writeFileSync(
  join(funcDir, 'handler.mjs'),
  `import appFetch from './index.js';

export default async function handler(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = new URL(req.url, proto + '://' + host);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  const webRequest = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
    duplex: body ? 'half' : undefined,
  });

  const webResponse = await appFetch(webRequest);

  res.statusCode = webResponse.status;
  for (const [key, value] of webResponse.headers) {
    // Append to handle multiple Set-Cookie headers
    const existing = res.getHeader(key);
    if (existing) {
      res.setHeader(key, Array.isArray(existing) ? [...existing, value] : [existing, value]);
    } else {
      res.setHeader(key, value);
    }
  }

  if (webResponse.body) {
    const reader = webResponse.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  res.end();
}
`
);

// Write .vc-config.json for the function
writeFileSync(
  join(funcDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'handler.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: true,
      shouldAddSourcemapSupport: false,
      supportsResponseStreaming: true,
    },
    null,
    2
  )
);

// Step 2c: Create config.json with routing rules
console.log('→ Writing .vercel/output/config.json');
writeFileSync(
  join(OUTPUT, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Serve static assets first (client build output)
        { handle: 'filesystem' },
        // Everything else goes to our serverless function
        { src: '/(.*)', dest: '/index' },
      ],
    },
    null,
    2
  )
);

console.log('✓ Vercel Build Output created successfully');
