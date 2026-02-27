import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = params.id;
    const userId = session.user.id;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    const hasAccess = await db.notes.checkAccess(userId, noteId);
    if (!hasAccess) {
      return Response.json({ error: "Note not found or access denied" }, { status: 403 });
    }

    const note = await db.notes.update(noteId, { content: content.trim() });
    return Response.json({ note });
  } catch (error) {
    console.error("Error updating note:", error);
    return Response.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = params.id;
    const userId = session.user.id;

    const hasAccess = await db.notes.checkAccess(userId, noteId);
    if (!hasAccess) {
      return Response.json({ error: "Note not found or access denied" }, { status: 403 });
    }

    await db.notes.delete(noteId);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return Response.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
