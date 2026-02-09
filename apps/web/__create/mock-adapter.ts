import type {
    AdapterUser,
    VerificationToken,
    Adapter,
    AdapterSession,
} from '@auth/core/adapters';
import type { ProviderType } from '@auth/core/providers';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'local-db.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], sessions: [], accounts: [], verificationTokens: [] }, null, 2));
}

function getDb() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch {
        return { users: [], sessions: [], accounts: [], verificationTokens: [] };
    }
}

function saveDb(data: any) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export default function MockAdapter(): Adapter {
    return {
        async createVerificationToken(token: VerificationToken): Promise<VerificationToken> {
            const db = getDb();
            db.verificationTokens.push(token);
            saveDb(db);
            return token;
        },
        async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
            const db = getDb();
            const index = db.verificationTokens.findIndex((t: any) => t.identifier === identifier && t.token === token);
            if (index === -1) return null;
            const [t] = db.verificationTokens.splice(index, 1);
            saveDb(db);
            return t;
        },
        async createUser(user: Omit<AdapterUser, 'id'>) {
            const db = getDb();
            const newUser = { id: crypto.randomUUID(), ...user };
            db.users.push(newUser);
            saveDb(db);
            return newUser;
        },
        async getUser(id: string) {
            const db = getDb();
            return db.users.find((u: any) => u.id === id) || null;
        },
        async getUserByEmail(email: string) {
            const db = getDb();
            const user = db.users.find((u: any) => u.email === email);
            if (!user) return null;

            const accounts = db.accounts.filter((a: any) => a.userId === user.id);
            return { ...user, accounts };
        },
        async getUserByAccount({ providerAccountId, provider }) {
            const db = getDb();
            const account = db.accounts.find((a: any) => a.providerAccountId === providerAccountId && a.provider === provider);
            if (!account) return null;
            return db.users.find((u: any) => u.id === account.userId) || null;
        },
        async updateUser(user: Partial<AdapterUser>) {
            const db = getDb();
            const index = db.users.findIndex((u: any) => u.id === user.id);
            if (index === -1) throw new Error('User not found');

            db.users[index] = { ...db.users[index], ...user };
            saveDb(db);
            return db.users[index];
        },
        async linkAccount(account) {
            const db = getDb();
            db.accounts.push(account);
            saveDb(db);
            return account;
        },
        async createSession(session) {
            const db = getDb();
            db.sessions.push(session);
            saveDb(db);
            return session;
        },
        async getSessionAndUser(sessionToken: string | undefined) {
            if (!sessionToken) return null;
            const db = getDb();
            const session = db.sessions.find((s: any) => s.sessionToken === sessionToken);
            if (!session) return null;

            const user = db.users.find((u: any) => u.id === session.userId);
            if (!user) return null;

            return { session, user };
        },
        async updateSession(session) {
            const db = getDb();
            const index = db.sessions.findIndex((s: any) => s.sessionToken === session.sessionToken);
            if (index === -1) return null;

            db.sessions[index] = { ...db.sessions[index], ...session };
            saveDb(db);
            return db.sessions[index];
        },
        async deleteSession(sessionToken) {
            const db = getDb();
            db.sessions = db.sessions.filter((s: any) => s.sessionToken !== sessionToken);
            saveDb(db);
        },
        async unlinkAccount({ provider, providerAccountId }) {
            const db = getDb();
            db.accounts = db.accounts.filter((a: any) => !(a.provider === provider && a.providerAccountId === providerAccountId));
            saveDb(db);
        },
        async deleteUser(userId: string) {
            const db = getDb();
            db.users = db.users.filter((u: any) => u.id !== userId);
            db.sessions = db.sessions.filter((s: any) => s.userId !== userId);
            db.accounts = db.accounts.filter((a: any) => a.userId !== userId);
            saveDb(db);
        },
    };
}
