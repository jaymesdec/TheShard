import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function POST(request, { params }) {
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

    const item = await db.todoLists.addItem(userId, listId, { title: title.trim() });
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error adding item to todo list:", error);
    return Response.json({ error: "Failed to add item" }, { status: 500 });
  }
}
