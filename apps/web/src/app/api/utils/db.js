import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const DB_PATH = path.join(process.cwd(), 'local-db.json');
const usePostgres = !!process.env.DATABASE_URL;
const sql = usePostgres ? neon(process.env.DATABASE_URL) : null;

let schemaReady = false;

const ensureSchema = async () => {
  if (!usePostgres || schemaReady) return;

  await sql`CREATE TABLE IF NOT EXISTS app_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS app_group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES app_groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS app_todos (
    id TEXT PRIMARY KEY,
    created_by TEXT NOT NULL,
    title TEXT NOT NULL,
    group_id TEXT NULL REFERENCES app_groups(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ NULL,
    assigned_to JSONB NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS app_notes (
    id TEXT PRIMARY KEY,
    created_by TEXT NOT NULL,
    content TEXT NOT NULL,
    group_id TEXT NULL REFERENCES app_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS app_messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES app_groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  schemaReady = true;
};

const readDb = () => {
  if (!fs.existsSync(DB_PATH)) return { users: [], groups: [], group_members: [], todos: [], notes: [], messages: [] };
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

const writeDb = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const mapPgGroup = (r) => ({
  id: r.id,
  name: r.name,
  created_by: r.created_by,
  created_at: r.created_at,
});

const mapPgTodo = (r) => ({
  id: r.id,
  created_by: r.created_by,
  title: r.title,
  group_id: r.group_id,
  due_date: r.due_date,
  assigned_to: r.assigned_to,
  completed: r.completed,
  created_at: r.created_at,
  group_name: r.group_name ?? null,
});

export const db = {
  groups: {
    create: async (name, userId) => {
      if (usePostgres) {
        await ensureSchema();
        const id = generateId();
        const [group] = await sql`
          INSERT INTO app_groups (id, name, created_by)
          VALUES (${id}, ${name}, ${userId})
          RETURNING *
        `;

        await sql`
          INSERT INTO app_group_members (id, group_id, user_id)
          VALUES (${generateId()}, ${id}, ${userId})
          ON CONFLICT (group_id, user_id) DO NOTHING
        `;

        return mapPgGroup(group);
      }

      const store = readDb();
      const newGroup = {
        id: generateId(),
        name,
        created_by: userId,
        created_at: new Date().toISOString()
      };
      store.groups = store.groups || [];
      store.groups.push(newGroup);

      const newMember = {
        id: generateId(),
        group_id: newGroup.id,
        user_id: userId,
        joined_at: new Date().toISOString()
      };
      store.group_members = store.group_members || [];
      store.group_members.push(newMember);

      writeDb(store);
      return newGroup;
    },

    findMemberGroups: async (userId) => {
      if (usePostgres) {
        await ensureSchema();
        const rows = await sql`
          SELECT g.*
          FROM app_groups g
          JOIN app_group_members gm ON gm.group_id = g.id
          WHERE gm.user_id = ${userId}
          ORDER BY g.created_at DESC
        `;
        return rows.map(mapPgGroup);
      }

      const store = readDb();
      const memberRecords = (store.group_members || []).filter(m => m.user_id === userId);
      const groupIds = memberRecords.map(m => m.group_id);
      return (store.groups || []).filter(g => groupIds.includes(g.id));
    }
  },

  members: {
    add: async (groupId, userId) => {
      if (usePostgres) {
        await ensureSchema();
        await sql`
          INSERT INTO app_group_members (id, group_id, user_id)
          VALUES (${generateId()}, ${groupId}, ${userId})
          ON CONFLICT (group_id, user_id) DO NOTHING
        `;
        return;
      }

      const store = readDb();
      const exists = (store.group_members || []).find(m => m.group_id === groupId && m.user_id === userId);
      if (exists) return;

      store.group_members = store.group_members || [];
      store.group_members.push({
        id: generateId(),
        group_id: groupId,
        user_id: userId,
        joined_at: new Date().toISOString()
      });
      writeDb(store);
    },

    list: async (groupId) => {
      if (usePostgres) {
        await ensureSchema();
        // Try Auth.js users table if present; fallback to IDs-only
        try {
          const rows = await sql`
            SELECT u.id, u.name, u.email, u.image, gm.joined_at
            FROM app_group_members gm
            LEFT JOIN users u ON u.id = gm.user_id
            WHERE gm.group_id = ${groupId}
            ORDER BY gm.joined_at ASC
          `;
          return rows.map(r => ({
            id: r.id ?? null,
            user_id: r.id ?? null,
            name: r.name ?? null,
            email: r.email ?? null,
            image: r.image ?? null,
            joined_at: r.joined_at,
          }));
        } catch {
          const rows = await sql`
            SELECT user_id, joined_at
            FROM app_group_members
            WHERE group_id = ${groupId}
            ORDER BY joined_at ASC
          `;
          return rows.map(r => ({
            id: r.user_id,
            user_id: r.user_id,
            name: r.user_id,
            email: null,
            image: null,
            joined_at: r.joined_at,
          }));
        }
      }

      const store = readDb();
      const memberRecords = (store.group_members || []).filter(m => m.group_id === groupId);
      const userIds = memberRecords.map(m => m.user_id);
      const users = (store.users || []).filter(u => userIds.includes(u.id));
      return users.map(u => ({ ...u, joined_at: memberRecords.find(m => m.user_id === u.id)?.joined_at }));
    }
  },

  users: {
    search: async (emailQuery) => {
      if (usePostgres) {
        await ensureSchema();
        try {
          const rows = await sql`
            SELECT id, name, email, image
            FROM users
            WHERE email ILIKE ${'%' + emailQuery + '%'}
            LIMIT 20
          `;
          return rows;
        } catch {
          return [];
        }
      }

      const store = readDb();
      return (store.users || []).filter(u => u.email && u.email.toLowerCase().includes(emailQuery.toLowerCase()));
    }
  },

  todos: {
    list: async (userId, groupId) => {
      if (usePostgres) {
        await ensureSchema();

        if (groupId === 'personal') {
          const rows = await sql`
            SELECT *
            FROM app_todos
            WHERE group_id IS NULL AND created_by = ${userId}
            ORDER BY created_at DESC
          `;
          return rows.map(mapPgTodo);
        }

        if (groupId) {
          const rows = await sql`
            SELECT t.*, g.name AS group_name
            FROM app_todos t
            LEFT JOIN app_groups g ON g.id = t.group_id
            WHERE t.group_id = ${groupId}
            ORDER BY t.created_at DESC
          `;
          return rows.map(mapPgTodo);
        }

        const rows = await sql`
          SELECT t.*, g.name AS group_name
          FROM app_todos t
          LEFT JOIN app_groups g ON g.id = t.group_id
          LEFT JOIN app_group_members gm ON gm.group_id = t.group_id
          WHERE (t.group_id IS NULL AND t.created_by = ${userId})
             OR (gm.user_id = ${userId})
          ORDER BY t.created_at DESC
        `;
        return rows.map(mapPgTodo);
      }

      const store = readDb();
      if (groupId === 'personal') {
        return (store.todos || []).filter(t => !t.group_id && t.created_by === userId);
      }
      if (groupId) {
        return (store.todos || []).filter(t => t.group_id === groupId);
      }

      const memberGroups = (store.group_members || []).filter(m => m.user_id === userId).map(m => m.group_id);
      return (store.todos || [])
        .filter(t => memberGroups.includes(t.group_id) || (!t.group_id && t.created_by === userId))
        .map(t => {
          const g = (store.groups || []).find(grp => grp.id === t.group_id);
          return { ...t, group_name: g ? g.name : null };
        });
    },

    create: async (userId, data) => {
      if (usePostgres) {
        await ensureSchema();
        const id = generateId();
        const [row] = await sql`
          INSERT INTO app_todos (id, created_by, title, group_id, due_date, assigned_to, completed)
          VALUES (
            ${id},
            ${userId},
            ${data.title},
            ${data.groupId === 'personal' ? null : data.groupId},
            ${data.dueDate || null},
            ${JSON.stringify(data.assignedTo || [])}::jsonb,
            false
          )
          RETURNING *
        `;
        return mapPgTodo(row);
      }

      const store = readDb();
      const newTodo = {
        id: generateId(),
        created_by: userId,
        title: data.title,
        group_id: data.groupId === 'personal' ? null : data.groupId,
        due_date: data.dueDate,
        assigned_to: data.assignedTo,
        completed: false,
        created_at: new Date().toISOString()
      };
      store.todos = store.todos || [];
      store.todos.push(newTodo);
      writeDb(store);
      return newTodo;
    },

    update: async (todoId, data) => {
      if (usePostgres) {
        await ensureSchema();
        const updates = [];
        const values = [];

        if (typeof data.completed === 'boolean') {
          updates.push('completed = $1');
          values.push(data.completed);
        }

        if (updates.length === 0) {
          const rows = await sql`SELECT * FROM app_todos WHERE id = ${todoId} LIMIT 1`;
          return rows[0] ? mapPgTodo(rows[0]) : null;
        }

        // simple single-field update path
        if (typeof data.completed === 'boolean') {
          const rows = await sql`
            UPDATE app_todos
            SET completed = ${data.completed}
            WHERE id = ${todoId}
            RETURNING *
          `;
          return rows[0] ? mapPgTodo(rows[0]) : null;
        }
      }

      const store = readDb();
      const index = (store.todos || []).findIndex(t => t.id === todoId);
      if (index === -1) return null;

      const task = store.todos[index];
      const updated = { ...task, ...data };
      store.todos[index] = updated;
      writeDb(store);
      return updated;
    },

    delete: async (todoId) => {
      if (usePostgres) {
        await ensureSchema();
        await sql`DELETE FROM app_todos WHERE id = ${todoId}`;
        return true;
      }

      const store = readDb();
      store.todos = (store.todos || []).filter(t => t.id !== todoId);
      writeDb(store);
      return true;
    },

    checkAccess: async (userId, todoId) => {
      if (usePostgres) {
        await ensureSchema();
        const rows = await sql`
          SELECT t.id, t.created_by, t.group_id,
                 EXISTS(
                   SELECT 1 FROM app_group_members gm
                   WHERE gm.group_id = t.group_id AND gm.user_id = ${userId}
                 ) AS is_member
          FROM app_todos t
          WHERE t.id = ${todoId}
          LIMIT 1
        `;
        const todo = rows[0];
        if (!todo) return false;
        if (!todo.group_id) return todo.created_by === userId;
        return !!todo.is_member;
      }

      const store = readDb();
      const todo = (store.todos || []).find(t => t.id === todoId);
      if (!todo) return false;
      if (!todo.group_id) return todo.created_by === userId;
      const membership = (store.group_members || []).find(m => m.group_id === todo.group_id && m.user_id === userId);
      return !!membership;
    }
  },

  notes: {
    list: async (userId, groupId) => {
      if (usePostgres) {
        await ensureSchema();

        if (groupId === 'personal') {
          return await sql`
            SELECT * FROM app_notes
            WHERE group_id IS NULL AND created_by = ${userId}
            ORDER BY created_at DESC
          `;
        }

        if (groupId) {
          return await sql`
            SELECT * FROM app_notes
            WHERE group_id = ${groupId}
            ORDER BY created_at DESC
          `;
        }

        return [];
      }

      const store = readDb();
      if (groupId === 'personal') {
        return (store.notes || []).filter(n => !n.group_id && n.created_by === userId);
      }
      if (groupId) {
        return (store.notes || []).filter(n => n.group_id === groupId);
      }
      return [];
    },

    create: async (userId, data) => {
      if (usePostgres) {
        await ensureSchema();
        const id = generateId();
        const rows = await sql`
          INSERT INTO app_notes (id, created_by, content, group_id)
          VALUES (${id}, ${userId}, ${data.content}, ${data.groupId === 'personal' ? null : data.groupId})
          RETURNING *
        `;
        return rows[0];
      }

      const store = readDb();
      const newNote = {
        id: generateId(),
        created_by: userId,
        content: data.content,
        group_id: data.groupId === 'personal' ? null : data.groupId,
        created_at: new Date().toISOString()
      };
      store.notes = store.notes || [];
      store.notes.push(newNote);
      writeDb(store);
      return newNote;
    },

    delete: async (noteId) => {
      if (usePostgres) {
        await ensureSchema();
        await sql`DELETE FROM app_notes WHERE id = ${noteId}`;
        return true;
      }

      const store = readDb();
      store.notes = (store.notes || []).filter(n => n.id !== noteId);
      writeDb(store);
      return true;
    }
  },

  messages: {
    list: async (groupId) => {
      if (usePostgres) {
        await ensureSchema();
        try {
          return await sql`
            SELECT m.*, COALESCE(u.name, u.email, m.user_id) AS user_name
            FROM app_messages m
            LEFT JOIN users u ON u.id = m.user_id
            WHERE m.group_id = ${groupId}
            ORDER BY m.created_at ASC
          `;
        } catch {
          return await sql`
            SELECT m.*, m.user_id AS user_name
            FROM app_messages m
            WHERE m.group_id = ${groupId}
            ORDER BY m.created_at ASC
          `;
        }
      }

      const store = readDb();
      const msgs = (store.messages || []).filter(m => m.group_id === groupId);
      const users = store.users || [];
      return msgs.map(m => {
        const user = users.find(u => u.id === m.user_id);
        return { ...m, user_name: user ? (user.name || user.email) : 'Unknown' };
      }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    },

    create: async (userId, groupId, content) => {
      if (usePostgres) {
        await ensureSchema();
        const id = generateId();
        const rows = await sql`
          INSERT INTO app_messages (id, group_id, user_id, content)
          VALUES (${id}, ${groupId}, ${userId}, ${content})
          RETURNING *
        `;
        return rows[0];
      }

      const store = readDb();
      const newMessage = {
        id: generateId(),
        group_id: groupId,
        user_id: userId,
        content,
        created_at: new Date().toISOString()
      };
      store.messages = store.messages || [];
      store.messages.push(newMessage);
      writeDb(store);
      return newMessage;
    }
  }
};
