import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, UserPlus, Search, LogOut } from "lucide-react";
import useUser from "@/utils/useUser";
import UserAvatar from "@/components/UserAvatar";

export default function GroupsPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");

  const [isSearching, setIsSearching] = useState(false);

  // Fetch groups
  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await fetch("/api/groups");
      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const groups = groupsData?.groups || [];

  // Fetch members for selected group
  const { data: membersData } = useQuery({
    queryKey: ["members", selectedGroupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${selectedGroupId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      return response.json();
    },
    enabled: !!selectedGroupId,
  });

  const members = membersData?.members || [];

  const { data: invitationsData } = useQuery({
    queryKey: ["groupInvitations"],
    queryFn: async () => {
      const response = await fetch("/api/groups/invitations");
      if (!response.ok) throw new Error("Failed to fetch invitations");
      return response.json();
    },
    enabled: !!user,
  });

  const invitations = invitationsData?.invitations || [];

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (name) => {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error("Failed to create group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setNewGroupName("");
      setShowCreateGroup(false);
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }) => {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIdToAdd: userId }),
      });
      if (!response.ok) {
        throw new Error("Failed to add member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setSearchEmail("");
      setSearchResults([]);
    },

  });

  const parseJsonSafely = async (response) => {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  };

  const inviteByEmailMutation = useMutation({
    mutationFn: async ({ groupId, email }) => {
      const response = await fetch(`/api/groups/${groupId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await parseJsonSafely(response);
      if (!response.ok) {
        throw new Error(data?.error || data?.raw || "Failed to invite member");
      }
      return data || {};
    },
    onSuccess: () => {
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["groupInvitations"] });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId) => {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to leave group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setSelectedGroupId(null);
    },
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: async (inviteId) => {
      const response = await fetch(`/api/groups/invitations/${inviteId}/accept`, {
        method: "POST",
      });
      const data = await parseJsonSafely(response);
      if (!response.ok) {
        throw new Error(data?.error || data?.raw || "Failed to accept invitation");
      }
      return data || {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groupInvitations"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    createGroupMutation.mutate(newGroupName.trim());
  };

  const handleSearchUsers = async () => {
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/users/search?email=${encodeURIComponent(searchEmail)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = (userId) => {
    if (!selectedGroupId) return;
    addMemberMutation.mutate({ groupId: selectedGroupId, userId });
  };

  const handleInviteByEmail = () => {
    if (!selectedGroupId || !inviteEmail.trim()) return;
    inviteByEmailMutation.mutate({
      groupId: selectedGroupId,
      email: inviteEmail.trim().toLowerCase(),
    });
  };

  const handleLeaveGroup = (groupId) => {
    if (confirm("Leave this group? It will be removed from your view but remain active for other members.")) {
      leaveGroupMutation.mutate(groupId);
    }
  };

  const handleAcceptInvite = (inviteId) => {
    acceptInvitationMutation.mutate(inviteId);
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/account/signin";
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-inter">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[#2563FF] font-medium mb-4 hover:text-[#2E69DE]"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-gray-800">Manage Groups</h1>
          <p className="text-gray-600 mt-2">
            Create groups and add members to collaborate
          </p>
        </div>

        {/* Create Group Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
          {!showCreateGroup ? (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#2563FF] text-white rounded-lg font-medium hover:bg-[#2E69DE]"
            >
              <Plus size={20} />
              Create Group
            </button>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#2563FF] focus:ring-1 focus:ring-[#2563FF]"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateGroup}
                  disabled={
                    !newGroupName.trim() || createGroupMutation.isPending
                  }
                  className="px-6 py-3 bg-[#2563FF] text-white rounded-lg font-medium hover:bg-[#2E69DE] disabled:opacity-50"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName("");
                  }}
                  className="px-6 py-3 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Group Invitations</h2>
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div key={invite.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{invite.group_name}</p>
                    <p className="text-sm text-gray-500">Invited to join with {user.email}</p>
                  </div>
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    disabled={acceptInvitationMutation.isPending}
                    className="px-4 py-2 bg-[#2563FF] text-white rounded-lg font-medium hover:bg-[#2E69DE] disabled:opacity-50"
                  >
                    {acceptInvitationMutation.isPending ? "Accepting..." : "Accept"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Groups */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
          {groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No groups yet. Create one to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedGroupId === group.id
                    ? "border-[#2563FF] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created{" "}
                        {new Date(group.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedGroupId === group.id && (
                        <div className="w-2 h-2 bg-[#2563FF] rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveGroup(group.id);
                        }}
                        disabled={leaveGroupMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Leave group"
                      >
                        <LogOut size={14} />
                        Leave
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Members Section */}
        {selectedGroupId && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mt-6">
            <h2 className="text-xl font-semibold mb-4">
              Members of {groups.find((g) => g.id === selectedGroupId)?.name}
            </h2>

            {/* Current Members */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Current Members
              </h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <UserAvatar
                      name={member.name}
                      email={member.email}
                      profileColor={member.profile_color}
                      image={member.image}
                      size="md"
                    />
                    <div>
                      <div className="font-medium text-gray-800">
                        {member.name || member.email || 'Unknown'}
                      </div>
                      {member.name && (
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite by Gmail */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Invite by Gmail
              </h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInviteByEmail()}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#2563FF] focus:ring-1 focus:ring-[#2563FF]"
                />
                <button
                  onClick={handleInviteByEmail}
                  disabled={!inviteEmail.trim() || inviteByEmailMutation.isPending}
                  className="px-6 py-3 bg-[#2563FF] text-white rounded-lg font-medium hover:bg-[#2E69DE] disabled:opacity-50"
                >
                  {inviteByEmailMutation.isPending ? "Inviting..." : "Send Invite"}
                </button>
              </div>
              <p className="text-xs text-gray-500">The invited person can accept from their own account on another device.</p>
              {inviteByEmailMutation.isError && (
                <p className="text-xs text-red-600 mt-2">{inviteByEmailMutation.error?.message || "Failed to send invite"}</p>
              )}
              {inviteByEmailMutation.isSuccess && (
                <p className="text-xs text-green-600 mt-2">Invitation sent.</p>
              )}
            </div>

            {/* Add New Member */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Add New Member
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchUsers()}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#2563FF] focus:ring-1 focus:ring-[#2563FF]"
                />
                <button
                  onClick={handleSearchUsers}
                  disabled={isSearching}
                  className="px-6 py-3 bg-[#2563FF] text-white rounded-lg font-medium hover:bg-[#2E69DE] flex items-center gap-2"
                >
                  <Search size={20} />
                  Search
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((foundUser) => (
                    <div
                      key={foundUser.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={foundUser.name}
                          email={foundUser.email}
                          profileColor={foundUser.profile_color}
                          image={foundUser.image}
                          size="md"
                        />
                        <div>
                          <div className="font-medium text-gray-800">
                            {foundUser.name || foundUser.email}
                          </div>
                          {foundUser.name && (
                            <div className="text-sm text-gray-500">
                              {foundUser.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(foundUser.id)}
                        disabled={
                          addMemberMutation.isPending ||
                          members.some((m) => m.id === foundUser.id)
                        }
                        className="px-4 py-2 bg-[#2563FF] text-white rounded-lg font-medium hover:bg-[#2E69DE] disabled:opacity-50 flex items-center gap-2"
                      >
                        <UserPlus size={16} />
                        {members.some((m) => m.id === foundUser.id)
                          ? "Added"
                          : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchEmail && !isSearching && (
                <div className="text-center py-4 text-gray-500">
                  No users found with that email
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
