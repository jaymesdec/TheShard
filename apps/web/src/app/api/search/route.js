import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

const MAX_QUERY_LENGTH = 100;
const RESULT_LIMIT = 21;

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") || "";
    const activeGroupId = searchParams.get("active") || null;

    const query = rawQuery.slice(0, MAX_QUERY_LENGTH).trim();
    if (!query) {
      return Response.json({ results: [] });
    }

    const results = await db.search.global(userId, query, {
      limit: RESULT_LIMIT,
      activeGroupId,
    });

    return Response.json({ results });
  } catch (error) {
    console.error("Error running search:", error);
    return Response.json({ error: "Failed to run search" }, { status: 500 });
  }
}
