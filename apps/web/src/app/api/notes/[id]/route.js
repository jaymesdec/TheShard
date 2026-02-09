import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = params.id;
    const userId = session.user.id;

    // Check if user has access to this note (via group membership)
    const noteCheck = await sql`
      SELECT n.id 
      FROM notes n
      INNER JOIN group_members gm ON n.group_id = gm.group_id
      WHERE n.id = ${noteId} AND gm.user_id = ${userId}
    `;

    if (noteCheck.length === 0) {
      return Response.json(
        { error: "Note not found or access denied" },
        { status: 403 },
      );
    }

    await sql`DELETE FROM notes WHERE id = ${noteId}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return Response.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
