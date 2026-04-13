import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

const ALLOWED_COLORS = [
  '#2563FF', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#CA8A04', '#16A34A', '#0D9488',
  '#0891B2', '#4338CA', '#6D28D9', '#9333EA',
];

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = await db.users.getById(session.user.id);
    const profileColor = userRecord?.profile_color || '#2563FF';

    return Response.json({ profile_color: profileColor, palette: ALLOWED_COLORS });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profile_color } = body;

    if (!profile_color || !ALLOWED_COLORS.includes(profile_color)) {
      return Response.json({ error: "Invalid color" }, { status: 400 });
    }

    const updatedUser = await db.users.updateProfileColor(session.user.id, profile_color);
    if (!updatedUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ profile_color: updatedUser.profile_color });
  } catch (error) {
    console.error("Error updating profile color:", error);
    return Response.json({ error: "Failed to update profile color" }, { status: 500 });
  }
}
