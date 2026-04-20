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

    if (groupId && groupId !== "personal") {
      const memberGroups = await db.groups.findMemberGroups(userId);
      if (!memberGroups.find((g) => g.id === groupId)) {
        return Response.json({ error: "Not a member of this group" }, { status: 403 });
      }
    }

    const lists = await db.todoLists.list(userId, groupId);
    return Response.json({ lists });
  } catch (error) {
    console.error("Error fetching todo lists:", error);
    return Response.json({ error: "Failed to fetch todo lists" }, { status: 500 });
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
    const { title, groupId } = body;

    if (!title || !title.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    if (groupId && groupId !== "personal") {
      const memberGroups = await db.groups.findMemberGroups(userId);
      if (!memberGroups.find((g) => g.id === groupId)) {
        return Response.json({ error: "Not a member of this group" }, { status: 403 });
      }
    }

    const list = await db.todoLists.create(userId, { title: title.trim(), groupId });
    return Response.json({ list }, { status: 201 });
  } catch (error) {
    console.error("Error creating todo list:", error);
    return Response.json({ error: "Failed to create todo list" }, { status: 500 });
  }
}
