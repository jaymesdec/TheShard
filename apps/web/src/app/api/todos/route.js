import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    // Access check logic is handled inside db.groups.findMemberGroups if we were strict,
    // but db.todos.list handles filtering logic based on our plan.
    // However, we should verify group membership if groupId is provided and not personal.
    if (groupId && groupId !== 'personal') {
      const memberGroups = await db.groups.findMemberGroups(userId);
      if (!memberGroups.find(g => g.id === groupId)) {
        return Response.json({ error: "Not a member of this group" }, { status: 403 });
      }
    }

    const todos = await db.todos.list(userId, groupId);
    return Response.json({ todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    return Response.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { groupId, title, dueDate, assignedTo } = body;

    if (!title) {
      return Response.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    // Check group membership
    if (groupId && groupId !== 'personal') {
      const memberGroups = await db.groups.findMemberGroups(userId);
      if (!memberGroups.find(g => g.id === groupId)) {
        return Response.json({ error: "Not a member of this group" }, { status: 403 });
      }
    }

    const assignedToArray = assignedTo && Array.isArray(assignedTo) ? assignedTo : [userId];

    // We only create one todo even if multiple assignees for now (simplified model matches db.js)
    const todo = await db.todos.create(userId, {
      title,
      groupId,
      dueDate,
      assignedTo: assignedToArray
    });

    return Response.json({ todo }, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return Response.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
