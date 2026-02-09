import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const groups = await db.groups.findMemberGroups(userId);

    return Response.json({ groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return Response.json({ error: "Failed to fetch groups" }, { status: 500 });
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
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json(
        { error: "Group name is required" },
        { status: 400 },
      );
    }

    const group = await db.groups.create(name.trim(), userId);

    return Response.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return Response.json({ error: "Failed to create group" }, { status: 500 });
  }
}
