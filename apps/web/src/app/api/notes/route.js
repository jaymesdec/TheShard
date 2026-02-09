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

    let notes;

    if (groupId && groupId !== 'personal') {
      // Check if user is member of this group
      const memberGroups = await db.groups.findMemberGroups(userId);
      if (!memberGroups.find(g => g.id === groupId)) {
        return Response.json(
          { error: "Not a member of this group" },
          { status: 403 },
        );
      }
    }

    notes = await db.notes.list(userId, groupId);

    return Response.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return Response.json({ error: "Failed to fetch notes" }, { status: 500 });
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
    const { groupId, content } = body;

    if (!content) {
      return Response.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    if (groupId && groupId !== 'personal') {
      // Check if user is member of this group
      const memberGroups = await db.groups.findMemberGroups(userId);
      if (!memberGroups.find(g => g.id === groupId)) {
        return Response.json(
          { error: "Not a member of this group" },
          { status: 403 },
        );
      }
    }

    const note = await db.notes.create(userId, { groupId, content });
    return Response.json({ note }, { status: 201 });

  } catch (error) {
    console.error("Error creating note:", error);
    return Response.json({ error: "Failed to create note" }, { status: 500 });
  }
}
