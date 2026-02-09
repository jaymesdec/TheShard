import fs from 'fs';
import path from 'path';

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

export const db = {
    groups: {
        create: async (name, userId) => {
            const store = readDb();
            const newGroup = {
                id: generateId(),
                name,
                created_by: userId,
                created_at: new Date().toISOString()
            };
            store.groups = store.groups || [];
            store.groups.push(newGroup);

            // Add creator as member
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
            const store = readDb();
            const memberRecords = (store.group_members || []).filter(m => m.user_id === userId);
            const groupIds = memberRecords.map(m => m.group_id);
            return (store.groups || []).filter(g => groupIds.includes(g.id));
        }
    },
    members: {
        add: async (groupId, userId) => {
            const store = readDb();
            // Check existence
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
            const store = readDb();
            const memberRecords = (store.group_members || []).filter(m => m.group_id === groupId);
            const userIds = memberRecords.map(m => m.user_id);
            const users = (store.users || []).filter(u => userIds.includes(u.id));
            return users.map(u => ({ ...u, joined_at: memberRecords.find(m => m.user_id === u.id)?.joined_at }));
        }
    },
    users: {
        search: async (emailQuery) => {
            const store = readDb();
            return (store.users || []).filter(u => u.email && u.email.toLowerCase().includes(emailQuery.toLowerCase()));
        }
    },
    todos: {
        list: async (userId, groupId) => {
            const store = readDb();
            if (groupId === 'personal') {
                return (store.todos || []).filter(t => !t.group_id && t.created_by === userId);
            }
            if (groupId) {
                return (store.todos || []).filter(t => t.group_id === groupId);
            }
            // All (Dashboard)
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

            // Check group membership
            const membership = (store.group_members || []).find(m => m.group_id === todo.group_id && m.user_id === userId);
            return !!membership;
        }
    },
    notes: {
        list: async (userId, groupId) => {
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
            const store = readDb();
            store.notes = (store.notes || []).filter(n => n.id !== noteId);
            writeDb(store);
            return true;
        }
    },
    messages: {
        list: async (groupId) => {
            const store = readDb();
            const msgs = (store.messages || []).filter(m => m.group_id === groupId);
            // Enrich with user names
            const users = store.users || [];
            return msgs.map(m => {
                const user = users.find(u => u.id === m.user_id);
                return { ...m, user_name: user ? (user.name || user.email) : 'Unknown' };
            }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        },
        create: async (userId, groupId, content) => {
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
