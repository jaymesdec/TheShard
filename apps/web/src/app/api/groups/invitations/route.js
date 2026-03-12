import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id || !session.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await db.invitations.listForEmail(session.user.email);
    return Response.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return Response.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}
