import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todoId = params.id;
    const userId = session.user.id;
    const body = await request.json();
    const { completed, title, dueDate, assignedTo } = body;

    // Check access
    const hasAccess = await db.todos.checkAccess(userId, todoId);
    if (!hasAccess) {
      return Response.json(
        { error: "Todo not found or access denied" },
        { status: 403 },
      );
    }

    // Prepare update data
    const updateData = {};
    if (typeof completed === "boolean") updateData.completed = completed;
    if (title) updateData.title = title;
    if (dueDate !== undefined) updateData.due_date = dueDate;
    if (assignedTo && Array.isArray(assignedTo)) updateData.assigned_to = assignedTo;

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const todo = await db.todos.update(todoId, updateData);

    return Response.json({ todo });
  } catch (error) {
    console.error("Error updating todo:", error);
    return Response.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todoId = params.id;
    const userId = session.user.id;

    // Check access
    const hasAccess = await db.todos.checkAccess(userId, todoId);
    if (!hasAccess) {
      return Response.json(
        { error: "Todo not found or access denied" },
        { status: 403 },
      );
    }

    await db.todos.delete(todoId);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return Response.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
