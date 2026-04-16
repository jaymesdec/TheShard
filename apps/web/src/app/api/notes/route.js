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
    const requestPayload = await request.json();
    const { groupId, title, body } = requestPayload;

    // Both title and body required; trim whitespace; cap lengths to protect DB.
    const MAX_TITLE_LENGTH = 200;
    const MAX_BODY_LENGTH = 10_000;
    const cleanTitle = typeof title === "string" ? title.trim() : "";
    const cleanBody = typeof body === "string" ? body.trim() : "";

    if (!cleanTitle) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }
    if (!cleanBody) {
      return Response.json({ error: "Body is required" }, { status: 400 });
    }
    if (cleanTitle.length > MAX_TITLE_LENGTH) {
      return Response.json({ error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` }, { status: 400 });
    }
    if (cleanBody.length > MAX_BODY_LENGTH) {
      return Response.json({ error: `Body must be ${MAX_BODY_LENGTH} characters or fewer` }, { status: 400 });
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

    const note = await db.notes.create(userId, {
      groupId,
      title: cleanTitle,
      body: cleanBody,
    });
    return Response.json({ note }, { status: 201 });

  } catch (error) {
    console.error("Error creating note:", error);
    return Response.json({ error: "Failed to create note" }, { status: 500 });
  }
}
