import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: groupId } = await params;

    if (!groupId) {
      return Response.json({ error: "Group ID is required" }, { status: 400 });
    }

    await db.members.remove(groupId, userId);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error leaving group:", error);
    return Response.json({ error: "Failed to leave group" }, { status: 500 });
  }
}
