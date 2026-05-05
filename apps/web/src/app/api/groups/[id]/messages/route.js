import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function GET(_request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groupId = params.id;
    const userId = session.user.id;

    const memberGroups = await db.groups.findMemberGroups(userId);
    if (!memberGroups.find((g) => g.id === groupId)) {
      return Response.json({ error: "Not a member of this group" }, { status: 403 });
    }

    const messages = await db.messages.list(groupId);
    return Response.json({ messages });
  } catch (error) {
    console.error("Error fetching group messages:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
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
    const { content, images } = body;

    const trimmedContent = typeof content === "string" ? content.trim() : "";
    const imageList = Array.isArray(images) ? images : [];

    // Validate: must have content or images
    if (!trimmedContent && imageList.length === 0) {
      return Response.json({ error: "Content or images required" }, { status: 400 });
    }

    // Validate images array
    if (imageList.length > 10) {
      return Response.json({ error: "Maximum 10 images per message" }, { status: 400 });
    }
    for (const img of imageList) {
      if (!img || typeof img.url !== "string") {
        return Response.json({ error: "Invalid image format" }, { status: 400 });
      }
    }

    const memberGroups = await db.groups.findMemberGroups(userId);
    if (!memberGroups.find((g) => g.id === groupId)) {
      return Response.json({ error: "Not a member of this group" }, { status: 403 });
    }

    const message = await db.messages.create(userId, groupId, trimmedContent, imageList);
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error creating group message:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
