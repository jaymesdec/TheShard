import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Bell, ChevronDown } from "lucide-react";
import useUser from "@/utils/useUser";
import Sidebar from "@/components/Sidebar";
import MemberList from "@/components/MemberList";
import NoteList from "@/components/NoteList";
import TodoBoard from "@/components/TodoBoard";
import UserAvatar from "@/components/UserAvatar";
import ChatPanel from "@/components/ChatPanel";
import SearchDropdown from "@/components/SearchDropdown";

const FLASH_TARGET_STORAGE_KEY = "shard:flashTarget";

export default function Dashboard() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState('personal');
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [flashTarget, setFlashTarget] = useState(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(FLASH_TARGET_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.workspace) {
        setSelectedGroupId(parsed.workspace);
      }
      setFlashTarget({ kind: parsed.kind, id: parsed.id });
    } catch {
      // ignore malformed payload
    }
    sessionStorage.removeItem(FLASH_TARGET_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handlePointerDown = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isSearchOpen]);

  const handleFlashConsumed = useCallback(() => {
    setFlashTarget(null);
  }, []);

  // Fetch current user's profile color from DB (JWT may be stale)
  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await fetch("/api/users/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!user,
  });

  const userProfileColor = profileData?.profile_color || user?.profile_color || '#2563FF';

  // Fetch groups
  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
    enabled: !!user,
  });

  const groups = groupsData?.groups || [];
  const activeGroupId = selectedGroupId;

  // Fetch todo lists
  const { data: todoListsData } = useQuery({
    queryKey: ["todoLists", activeGroupId],
    queryFn: async () => {
      const response = await fetch(`/api/todo-lists?groupId=${activeGroupId}`);
      if (!response.ok) throw new Error("Failed to fetch todo lists");
      return response.json();
    },
    enabled: !!activeGroupId,
  });

  const todoLists = todoListsData?.lists || [];

  // Fetch members
  const { data: membersData } = useQuery({
    queryKey: ["members", activeGroupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${activeGroupId}/members`);
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
    enabled: !!activeGroupId && activeGroupId !== 'personal',
  });

  const members = activeGroupId === 'personal' && user
    ? [{ id: user.id, name: user.name, email: user.email, profile_color: userProfileColor }]
    : membersData?.members || [];

  // Fetch notes
  const { data: notesData } = useQuery({
    queryKey: ["notes", activeGroupId],
    queryFn: async () => {
      const response = await fetch(`/api/notes?groupId=${activeGroupId}`);
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    },
    enabled: !!activeGroupId,
  });

  const notes = notesData?.notes || [];

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: ["globalSearch", debouncedQuery, activeGroupId],
    queryFn: async () => {
      const url = `/api/search?q=${encodeURIComponent(debouncedQuery)}&active=${encodeURIComponent(activeGroupId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to search");
      return response.json();
    },
    enabled: !!user && debouncedQuery.length > 0,
    staleTime: 10_000,
  });

  const searchResults = searchData?.results || [];

  const handleResultSelect = (result) => {
    const targetWorkspace = result.group_id || "personal";
    const isPersonalNote = result.kind === "note" && targetWorkspace === "personal";

    setSearchQuery("");
    setIsSearchOpen(false);

    if (isPersonalNote) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          FLASH_TARGET_STORAGE_KEY,
          JSON.stringify({
            kind: result.kind,
            id: result.id,
            workspace: targetWorkspace,
          }),
        );
        window.location.href = "/notes";
      }
      return;
    }

    if (targetWorkspace !== activeGroupId) {
      setSelectedGroupId(targetWorkspace);
    }
    setFlashTarget({ kind: result.kind, id: result.id });
  };

  // Mutations
  const createListMutation = useMutation({
    mutationFn: async (title) => {
      const response = await fetch("/api/todo-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, groupId: activeGroupId }),
      });
      if (!response.ok) throw new Error("Failed to create list");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todoLists"] });
    },
  });

  const updateListTitleMutation = useMutation({
    mutationFn: async ({ listId, title }) => {
      const response = await fetch(`/api/todo-lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to update list");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todoLists"] });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId) => {
      const response = await fetch(`/api/todo-lists/${listId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete list");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todoLists"] });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ listId, title, dri }) => {
      const payload = { title };
      if (dri) payload.dri = dri;
      const response = await fetch(`/api/todo-lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to add item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todoLists"] });
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, completed }) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("Failed to update todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todoLists"] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (todoId) => {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todoLists"] });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });
      if (!response.ok) throw new Error("Failed to create note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const editTodoMutation = useMutation({
    mutationFn: async ({ todoId, title }) => {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to update todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todoLists"] });
    },
  });

  const updateDriMutation = useMutation({
    mutationFn: async ({ todoId, memberId }) => {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dri: memberId }),
      });
      if (!response.ok) throw new Error("Failed to update DRI");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todoLists"] });
    },
  });

  const editNoteMutation = useMutation({
    mutationFn: async ({ noteId, title, body, images }) => {
      const payload = { title, body };
      if (images !== undefined) payload.images = images;
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // Handlers
  const handleCreateList = (title) => {
    createListMutation.mutate(title);
  };

  const handleUpdateListTitle = (listId, title) => {
    updateListTitleMutation.mutate({ listId, title });
  };

  const handleDeleteList = (listId) => {
    if (confirm("Delete this list and all its items?")) {
      deleteListMutation.mutate(listId);
    }
  };

  const isGroupContext = activeGroupId !== 'personal';

  const handleAddItem = (listId, title) => {
    addItemMutation.mutate({ listId, title, dri: isGroupContext ? user.id : undefined });
  };

  const handleUpdateDri = (todoId, memberId) => {
    updateDriMutation.mutate({ todoId, memberId });
  };

  const handleToggleItem = (itemId, completed) => {
    toggleTodoMutation.mutate({ id: itemId, completed });
  };

  const handleDeleteItem = (itemId) => {
    deleteTodoMutation.mutate(itemId);
  };

  const handleEditItem = (todoId, title) => {
    editTodoMutation.mutate({ todoId, title });
  };

  const handleEditNote = (noteId, title, body, images) => {
    editNoteMutation.mutate({ noteId, title, body, images });
  };

  const handleAddNote = ({ title, body, images } = {}) => {
    if (!activeGroupId) return;
    const cleanTitle = (title || "").trim();
    const cleanBody = (body || "").trim();
    const imageList = images || [];
    if (!cleanTitle && !cleanBody && imageList.length === 0) return;
    createNoteMutation.mutate({
      groupId: activeGroupId,
      title: cleanTitle,
      body: cleanBody,
      images: imageList,
    });
  };

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
      setSelectedGroupId('personal');
    },
  });

  const handleLeaveGroup = (groupId) => {
    leaveGroupMutation.mutate(groupId);
  };

  const handleDeleteNote = (noteId) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
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
    <div className="min-h-screen bg-white font-inter text-[#2B2B2B] text-[13px] font-normal">
      <div className="app-shell flex h-screen">
        <Sidebar
          groups={groups}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
          activeGroupId={activeGroupId}
          onLeaveGroup={handleLeaveGroup}
        />

        {/* Main Workspace */}
        <div className="flex-1 min-w-[640px] flex flex-col">
          {/* Top Bar */}
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-xl font-bold text-[#2B2B2B]">The Shard</h1>
              <div
                ref={searchContainerRef}
                className="relative max-w-[360px] flex-1"
              >
                <div className="flex items-center h-[40px] px-4 border border-[#E5E5E5] rounded-full focus-within:border-[#2563FF]">
                  <Search size={16} className="text-[#C3C3C3] mr-3" />
                  <input
                    type="text"
                    placeholder="Search notes and to-dos..."
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim()) setIsSearchOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }
                    }}
                    className="flex-1 text-[14px] text-[#2B2B2B] placeholder:text-[#A3A3A3] bg-transparent outline-none"
                  />
                </div>
                {isSearchOpen && debouncedQuery.length > 0 && (
                  <SearchDropdown
                    query={debouncedQuery}
                    results={searchResults}
                    isLoading={isSearching}
                    onSelect={handleResultSelect}
                  />
                )}
              </div>
            </div>

            <a href="/account/profile">
              <UserAvatar
                name={user.name}
                email={user.email}
                profileColor={userProfileColor}
                image={profileData?.image}
                size="sm"
              />
            </a>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[#4C4C4C]">
                  {user.email}
                </span>
                <ChevronDown size={12} className="text-[#C3C3C3]" />
              </div>
              <a href="/account/logout">
                <Bell size={12} className="text-[#C3C3C3]" />
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <>
              <TodoBoard
                lists={todoLists}
                onCreateList={handleCreateList}
                onUpdateListTitle={handleUpdateListTitle}
                onDeleteList={handleDeleteList}
                onToggleItem={handleToggleItem}
                onDeleteItem={handleDeleteItem}
                onAddItem={handleAddItem}
                onEditItem={handleEditItem}
                members={isGroupContext ? members : []}
                onUpdateDri={isGroupContext ? handleUpdateDri : null}
                isGroupContext={isGroupContext}
                flashTarget={flashTarget}
                onFlashConsumed={handleFlashConsumed}
              />

              {activeGroupId !== 'personal' && (
                <NoteList
                  notes={notes}
                  onAddNote={handleAddNote}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  flashTarget={flashTarget}
                  onFlashConsumed={handleFlashConsumed}
                />
              )}
            </>

          </div>
        </div>

        <div className="w-[300px] h-full border-l border-[#EDEDED] flex flex-col bg-white">
          <MemberList
            members={members}
            driCounts={isGroupContext
              ? todoLists.flatMap(l => l.items || []).filter(i => !i.completed && i.dri).reduce((acc, item) => {
                  acc[item.dri] = (acc[item.dri] || 0) + 1;
                  return acc;
                }, {})
              : {}
            }
            compact={isGroupContext}
          />
          {isGroupContext && (
            <ChatPanel groupId={activeGroupId} currentUser={user} />
          )}
        </div>
      </div>
    </div>
  );
}
