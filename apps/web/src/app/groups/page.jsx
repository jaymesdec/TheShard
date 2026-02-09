import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, UserPlus, Search } from "lucide-react";
import useUser from "@/utils/useUser";

export default function GroupsPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState("");
  const chatEndRef = useState(null)[1]; // Ref for scrolling to bottom

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

  // Fetch messages for selected group
  const { data: messagesData } = useQuery({
    queryKey: ["messages", selectedGroupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${selectedGroupId}/messages`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!selectedGroupId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const messages = messagesData?.messages || [];

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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }) => {
      const response = await fetch(`/api/groups/${selectedGroupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, userId: user.id }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setMessage("");
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate({ content: message });
  };

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

  // Format info
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                    !newGroupName.trim() || createGroupMutation.isLoading
                  }
                  className="px-6 py-3 bg-[#2563FF] text-white rounded-lg font-medium hover:bg-[#2E69DE] disabled:opacity-50"
                >
                  {createGroupMutation.isLoading ? "Creating..." : "Create"}
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
                    {selectedGroupId === group.id && (
                      <div className="w-2 h-2 bg-[#2563FF] rounded-full"></div>
                    )}
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
                    <div className="w-10 h-10 rounded-full bg-[#2563FF] flex items-center justify-center text-white font-semibold">
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {member.name || member.email}
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
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                          {(foundUser.name || foundUser.email)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
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
                          addMemberMutation.isLoading ||
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

        {/* Chat Section */}
        {selectedGroupId && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mt-6 h-[500px] flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Group Chat</h2>

            <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2 bg-gray-50 rounded-xl">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">No messages yet. Say hello!</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.user_id === user.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.user_id === user.id
                      ? 'bg-[#2563FF] text-white rounded-tr-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                      } shadow-sm`}>
                      {msg.user_id !== user.id && (
                        <div className="text-xs font-bold mb-1 opacity-70">{msg.user_name}</div>
                      )}
                      <div className="text-sm">{msg.content}</div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.created_at)}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2563FF] focus:ring-1 focus:ring-[#2563FF]"
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-[#2563FF] text-white px-6 rounded-xl font-medium hover:bg-[#2E69DE] disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
