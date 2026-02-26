/**
 * No-op stub for argon2 on Vercel.
 * server/app.ts uses bcryptjs instead. This stubs out imports from
 * src/auth.js and __create/index.ts which still reference argon2.
 */
export async function hash(password: string): Promise<string> {
  throw new Error('argon2 is not available on Vercel. Use bcryptjs.');
}

export async function verify(hash: string, password: string): Promise<boolean> {
  throw new Error('argon2 is not available on Vercel. Use bcryptjs.');
}

export default { hash, verify };
