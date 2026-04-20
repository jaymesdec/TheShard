import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listId = params.id;
    const userId = session.user.id;

    const hasAccess = await db.todoLists.checkAccess(userId, listId);
    if (!hasAccess) {
      return Response.json({ error: "List not found or access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const list = await db.todoLists.update(listId, { title: title.trim() });
    return Response.json({ list });
  } catch (error) {
    console.error("Error updating todo list:", error);
    return Response.json({ error: "Failed to update todo list" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listId = params.id;
    const userId = session.user.id;

    const hasAccess = await db.todoLists.checkAccess(userId, listId);
    if (!hasAccess) {
      return Response.json({ error: "List not found or access denied" }, { status: 403 });
    }

    await db.todoLists.delete(listId);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo list:", error);
    return Response.json({ error: "Failed to delete todo list" }, { status: 500 });
  }
}
