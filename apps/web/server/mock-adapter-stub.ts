/**
 * No-op stubs for local JSON mock database files on Vercel.
 * DATABASE_URL is always set on Vercel, so these are never called.
 * This avoids writeFileSync at module load crashing on Vercel's read-only fs.
 */
export default function MockAdapter() {
  throw new Error('MockAdapter is not available on Vercel. Set DATABASE_URL.');
}

export const db = new Proxy({}, {
  get() {
    return () => { throw new Error('Local db not available on Vercel'); };
  },
});

export function sql() {
  throw new Error('Local SQL mock not available on Vercel');
}
