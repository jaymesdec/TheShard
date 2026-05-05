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
    const requestPayload = await request.json();
    const nextTitle = typeof requestPayload.title === "string" ? requestPayload.title.trim() : undefined;
    const nextBody =
      typeof requestPayload.body === "string"
        ? requestPayload.body.trim()
        : typeof requestPayload.content === "string"
        ? requestPayload.content.trim()
        : undefined;
    const nextImages = Array.isArray(requestPayload.images) ? requestPayload.images : undefined;

    if (nextTitle === undefined && nextBody === undefined && nextImages === undefined) {
      return Response.json({ error: "Provide a title, body, or images to update" }, { status: 400 });
    }

    // Validate images if provided
    if (nextImages !== undefined) {
      if (nextImages.length > 10) {
        return Response.json({ error: "Maximum 10 images per note" }, { status: 400 });
      }
      for (const img of nextImages) {
        if (!img || typeof img.url !== "string") {
          return Response.json({ error: "Invalid image format" }, { status: 400 });
        }
      }
    }

    const hasAccess = await db.notes.checkAccess(userId, noteId);
    if (!hasAccess) {
      return Response.json({ error: "Note not found or access denied" }, { status: 403 });
    }

    const note = await db.notes.update(noteId, {
      ...(nextTitle !== undefined ? { title: nextTitle } : {}),
      ...(nextBody !== undefined ? { body: nextBody } : {}),
      ...(nextImages !== undefined ? { images: nextImages } : {}),
    });
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
