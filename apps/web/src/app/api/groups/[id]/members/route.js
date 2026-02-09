import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groupId = params.id;
    const userId = session.user.id;

    // Check if user is member of this group (reusing findMemberGroups as check)
    const usersGroups = await db.groups.findMemberGroups(userId);
    if (!usersGroups.find(g => g.id === groupId)) {
      return Response.json(
        { error: "Not a member of this group" },
        { status: 403 },
      );
    }

    // Get all members
    const members = await db.members.list(groupId);

    return Response.json({ members });
  } catch (error) {
    console.error("Error fetching group members:", error);
    return Response.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groupId = params.id;
    const userId = session.user.id;
    const body = await request.json();
    const { userIdToAdd } = body;

    if (!userIdToAdd) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if current user is member of this group
    const usersGroups = await db.groups.findMemberGroups(userId);
    if (!usersGroups.find(g => g.id === groupId)) {
      return Response.json(
        { error: "Not a member of this group" },
        { status: 403 },
      );
    }

    // Add new member
    await db.members.add(groupId, userIdToAdd);

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding group member:", error);
    return Response.json({ error: "Failed to add member" }, { status: 500 });
  }
}
