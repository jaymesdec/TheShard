import { neon } from '@neondatabase/serverless';

// Use Neon Postgres when DATABASE_URL is set (production/Vercel),
// fall back to local JSON file for local development.
const DATABASE_URL = process.env.DATABASE_URL;

let db;

if (DATABASE_URL) {
  const sql = neon(DATABASE_URL);

  db = {
    groups: {
      create: async (name, userId) => {
        const rows = await sql`
          WITH new_group AS (
            INSERT INTO groups (name, created_by) VALUES (${name}, ${userId}) RETURNING *
          ), new_member AS (
            INSERT INTO group_members (group_id, user_id)
            SELECT id, ${userId} FROM new_group
          )
          SELECT * FROM new_group
        `;
        return rows[0];
      },
      findMemberGroups: async (userId) => {
        return sql`
          SELECT g.* FROM groups g
          INNER JOIN group_members gm ON gm.group_id = g.id
          WHERE gm.user_id = ${userId}
        `;
      },
    },
    members: {
      add: async (groupId, userId) => {
        await sql`
          INSERT INTO group_members (group_id, user_id)
          VALUES (${groupId}, ${userId})
          ON CONFLICT (group_id, user_id) DO NOTHING
        `;
      },
      list: async (groupId) => {
        return sql`
          SELECT u.id, u.name, u.email, u.image, gm.joined_at
          FROM auth_users u
          INNER JOIN group_members gm ON gm.user_id = u.id
          WHERE gm.group_id = ${groupId}
        `;
      },
    },
    users: {
      search: async (emailQuery) => {
        const pattern = `%${emailQuery.toLowerCase()}%`;
        return sql`
          SELECT id, name, email, image FROM auth_users
          WHERE LOWER(email) LIKE ${pattern}
        `;
      },
    },
    todos: {
      list: async (userId, groupId) => {
        if (groupId === 'personal') {
          return sql`
            SELECT * FROM todos
            WHERE group_id IS NULL AND created_by = ${userId}
            ORDER BY created_at DESC
          `;
        }
        if (groupId) {
          return sql`
            SELECT * FROM todos WHERE group_id = ${groupId}
            ORDER BY created_at DESC
          `;
        }
        // Dashboard: all todos for user (personal + group member)
        return sql`
          SELECT t.*, g.name AS group_name
          FROM todos t
          LEFT JOIN groups g ON g.id = t.group_id
          LEFT JOIN group_members gm ON gm.group_id = t.group_id
          WHERE (gm.user_id = ${userId} OR (t.group_id IS NULL AND t.created_by = ${userId}))
          ORDER BY t.created_at DESC
        `;
      },
      create: async (userId, data) => {
        const groupId = data.groupId === 'personal' ? null : data.groupId || null;
        const rows = await sql`
          INSERT INTO todos (created_by, title, group_id, due_date, assigned_to, completed)
          VALUES (${userId}, ${data.title}, ${groupId}, ${data.dueDate || null}, ${data.assignedTo || [userId]}, false)
          RETURNING *
        `;
        return rows[0];
      },
      update: async (todoId, data) => {
        // Build dynamic update
        const rows = await sql`
          UPDATE todos SET
            completed = COALESCE(${data.completed ?? null}, completed),
            title = COALESCE(${data.title ?? null}, title),
            due_date = COALESCE(${data.dueDate ?? null}, due_date),
            assigned_to = COALESCE(${data.assignedTo ?? null}, assigned_to)
          WHERE id = ${todoId}
          RETURNING *
        `;
        return rows[0] || null;
      },
      delete: async (todoId) => {
        await sql`DELETE FROM todos WHERE id = ${todoId}`;
        return true;
      },
      checkAccess: async (userId, todoId) => {
        const rows = await sql`
          SELECT t.* FROM todos t
          LEFT JOIN group_members gm ON gm.group_id = t.group_id
          WHERE t.id = ${todoId}
            AND (t.created_by = ${userId} OR gm.user_id = ${userId})
          LIMIT 1
        `;
        return rows.length > 0;
      },
    },
    notes: {
      list: async (userId, groupId) => {
        if (groupId === 'personal') {
          return sql`
            SELECT * FROM notes
            WHERE group_id IS NULL AND created_by = ${userId}
            ORDER BY created_at DESC
          `;
        }
        if (groupId) {
          return sql`
            SELECT * FROM notes WHERE group_id = ${groupId}
            ORDER BY created_at DESC
          `;
        }
        return [];
      },
      create: async (userId, data) => {
        const groupId = data.groupId === 'personal' ? null : data.groupId || null;
        const rows = await sql`
          INSERT INTO notes (created_by, content, group_id)
          VALUES (${userId}, ${data.content}, ${groupId})
          RETURNING *
        `;
        return rows[0];
      },
      delete: async (noteId) => {
        await sql`DELETE FROM notes WHERE id = ${noteId}`;
        return true;
      },
    },
    messages: {
      list: async (groupId) => {
        return sql`
          SELECT m.*, COALESCE(u.name, u.email, 'Unknown') AS user_name
          FROM messages m
          LEFT JOIN auth_users u ON u.id = m.user_id
          WHERE m.group_id = ${groupId}
          ORDER BY m.created_at ASC
        `;
      },
      create: async (userId, groupId, content) => {
        const rows = await sql`
          INSERT INTO messages (group_id, user_id, content)
          VALUES (${groupId}, ${userId}, ${content})
          RETURNING *
        `;
        return rows[0];
      },
    },
  };
} else {
  // Local development fallback using JSON file
  const fs = await import('fs');
  const path = await import('path');

  const DB_PATH = path.join(process.cwd(), 'local-db.json');

  const readDb = () => {
    if (!fs.existsSync(DB_PATH)) return { users: [], groups: [], group_members: [], todos: [], notes: [], messages: [] };
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  };

  const writeDb = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  };

  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  db = {
    groups: {
      create: async (name, userId) => {
        const store = readDb();
        const newGroup = { id: generateId(), name, created_by: userId, created_at: new Date().toISOString() };
        store.groups = store.groups || [];
        store.groups.push(newGroup);
        const newMember = { id: generateId(), group_id: newGroup.id, user_id: userId, joined_at: new Date().toISOString() };
        store.group_members = store.group_members || [];
        store.group_members.push(newMember);
        writeDb(store);
        return newGroup;
      },
      findMemberGroups: async (userId) => {
        const store = readDb();
        const memberRecords = (store.group_members || []).filter(m => m.user_id === userId);
        const groupIds = memberRecords.map(m => m.group_id);
        return (store.groups || []).filter(g => groupIds.includes(g.id));
      },
    },
    members: {
      add: async (groupId, userId) => {
        const store = readDb();
        const exists = (store.group_members || []).find(m => m.group_id === groupId && m.user_id === userId);
        if (exists) return;
        store.group_members = store.group_members || [];
        store.group_members.push({ id: generateId(), group_id: groupId, user_id: userId, joined_at: new Date().toISOString() });
        writeDb(store);
      },
      list: async (groupId) => {
        const store = readDb();
        const memberRecords = (store.group_members || []).filter(m => m.group_id === groupId);
        const userIds = memberRecords.map(m => m.user_id);
        const users = (store.users || []).filter(u => userIds.includes(u.id));
        return users.map(u => ({ ...u, joined_at: memberRecords.find(m => m.user_id === u.id)?.joined_at }));
      },
    },
    users: {
      search: async (emailQuery) => {
        const store = readDb();
        return (store.users || []).filter(u => u.email && u.email.toLowerCase().includes(emailQuery.toLowerCase()));
      },
    },
    todos: {
      list: async (userId, groupId) => {
        const store = readDb();
        if (groupId === 'personal') return (store.todos || []).filter(t => !t.group_id && t.created_by === userId);
        if (groupId) return (store.todos || []).filter(t => t.group_id === groupId);
        const memberGroups = (store.group_members || []).filter(m => m.user_id === userId).map(m => m.group_id);
        return (store.todos || []).filter(t => memberGroups.includes(t.group_id) || (!t.group_id && t.created_by === userId))
          .map(t => {
            const g = (store.groups || []).find(grp => grp.id === t.group_id);
            return { ...t, group_name: g ? g.name : null };
          });
      },
      create: async (userId, data) => {
        const store = readDb();
        const newTodo = {
          id: generateId(), created_by: userId, title: data.title,
          group_id: data.groupId === 'personal' ? null : data.groupId,
          due_date: data.dueDate, assigned_to: data.assignedTo, completed: false,
          created_at: new Date().toISOString(),
        };
        store.todos = store.todos || [];
        store.todos.push(newTodo);
        writeDb(store);
        return newTodo;
      },
      update: async (todoId, data) => {
        const store = readDb();
        const index = (store.todos || []).findIndex(t => t.id === todoId);
        if (index === -1) return null;
        store.todos[index] = { ...store.todos[index], ...data };
        writeDb(store);
        return store.todos[index];
      },
      delete: async (todoId) => {
        const store = readDb();
        store.todos = (store.todos || []).filter(t => t.id !== todoId);
        writeDb(store);
        return true;
      },
      checkAccess: async (userId, todoId) => {
        const store = readDb();
        const todo = (store.todos || []).find(t => t.id === todoId);
        if (!todo) return false;
        if (!todo.group_id) return todo.created_by === userId;
        return !!(store.group_members || []).find(m => m.group_id === todo.group_id && m.user_id === userId);
      },
    },
    notes: {
      list: async (userId, groupId) => {
        const store = readDb();
        if (groupId === 'personal') return (store.notes || []).filter(n => !n.group_id && n.created_by === userId);
        if (groupId) return (store.notes || []).filter(n => n.group_id === groupId);
        return [];
      },
      create: async (userId, data) => {
        const store = readDb();
        const newNote = {
          id: generateId(), created_by: userId, content: data.content,
          group_id: data.groupId === 'personal' ? null : data.groupId,
          created_at: new Date().toISOString(),
        };
        store.notes = store.notes || [];
        store.notes.push(newNote);
        writeDb(store);
        return newNote;
      },
      delete: async (noteId) => {
        const store = readDb();
        store.notes = (store.notes || []).filter(n => n.id !== noteId);
        writeDb(store);
        return true;
      },
    },
    messages: {
      list: async (groupId) => {
        const store = readDb();
        const msgs = (store.messages || []).filter(m => m.group_id === groupId);
        const users = store.users || [];
        return msgs.map(m => {
          const user = users.find(u => u.id === m.user_id);
          return { ...m, user_name: user ? (user.name || user.email) : 'Unknown' };
        }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      },
      create: async (userId, groupId, content) => {
        const store = readDb();
        const newMessage = { id: generateId(), group_id: groupId, user_id: userId, content, created_at: new Date().toISOString() };
        store.messages = store.messages || [];
        store.messages.push(newMessage);
        writeDb(store);
        return newMessage;
      },
    },
  };
}

export { db };
