import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id || !session.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inviteId = params.inviteId;
    const result = await db.invitations.accept({
      invitationId: inviteId,
      userId: session.user.id,
      userEmail: session.user.email,
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return Response.json({ error: error.message || "Failed to accept invitation" }, { status: 400 });
  }
}
