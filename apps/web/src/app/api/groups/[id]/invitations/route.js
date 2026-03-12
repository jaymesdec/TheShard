import { db } from "@/app/api/utils/db";
import { auth } from "@/auth";

const isValidGmail = (email = "") => {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@gmail\.com$/.test(normalized);
};

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groupId = params.id;
    const userId = session.user.id;
    const body = await request.json();
    const invitedEmail = (body?.email || "").trim().toLowerCase();

    if (!invitedEmail) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidGmail(invitedEmail)) {
      return Response.json(
        { error: "Please enter a valid Gmail address" },
        { status: 400 },
      );
    }

    const usersGroups = await db.groups.findMemberGroups(userId);
    if (!usersGroups.find((g) => g.id === groupId)) {
      return Response.json({ error: "Not a member of this group" }, { status: 403 });
    }

    const invitation = await db.invitations.create({
      groupId,
      invitedEmail,
      invitedBy: userId,
    });

    return Response.json(
      { success: true, invitation, alreadyInvited: !!invitation?.alreadyExists },
      { status: invitation?.alreadyExists ? 200 : 201 },
    );
  } catch (error) {
    console.error("Error creating invitation:", error);
    return Response.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
