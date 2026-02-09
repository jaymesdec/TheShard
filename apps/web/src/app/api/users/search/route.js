import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return Response.json(
        { error: "Email query is required" },
        { status: 400 },
      );
    }

    const users = await db.users.search(email);

    return Response.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return Response.json({ error: "Failed to search users" }, { status: 500 });
  }
}
