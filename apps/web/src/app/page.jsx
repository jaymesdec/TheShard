import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Bell, ChevronDown } from "lucide-react";
import useUser from "@/utils/useUser";
import Sidebar from "@/components/Sidebar";
import MemberList from "@/components/MemberList";
import NoteList from "@/components/NoteList";
import TodoBoard from "@/components/TodoBoard";
import UserAvatar from "@/components/UserAvatar";

export default function Dashboard() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState('personal');

  // Note State
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteBody, setNewNoteBody] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);

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
    mutationFn: async ({ listId, title }) => {
      const response = await fetch(`/api/todo-lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
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
      setNewNoteTitle("");
      setNewNoteBody("");
      setShowAddNote(false);
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

  const handleAddItem = (listId, title) => {
    addItemMutation.mutate({ listId, title });
  };

  const handleToggleItem = (itemId, completed) => {
    toggleTodoMutation.mutate({ id: itemId, completed });
  };

  const handleDeleteItem = (itemId) => {
    deleteTodoMutation.mutate(itemId);
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteBody.trim() || !activeGroupId) return;
    createNoteMutation.mutate({
      groupId: activeGroupId,
      title: newNoteTitle.trim(),
      body: newNoteBody.trim(),
    });
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
      <div className="flex h-screen">
        <Sidebar
          groups={groups}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
          activeGroupId={activeGroupId}
        />

        {/* Main Workspace */}
        <div className="flex-1 min-w-[640px] flex flex-col">
          {/* Top Bar */}
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-xl font-bold text-[#2B2B2B]">The Shard</h1>
              <div className="relative max-w-[360px] flex-1">
                <div className="flex items-center h-[40px] px-4 border border-[#E5E5E5] rounded-full">
                  <Search size={16} className="text-[#C3C3C3] mr-3" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="flex-1 text-[14px] text-[#A3A3A3] bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <a href="/account/profile">
              <UserAvatar
                name={user.name}
                email={user.email}
                profileColor={userProfileColor}
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
              />

              {activeGroupId !== 'personal' && (
                <NoteList
                  notes={notes}
                  showAddNote={showAddNote}
                  setShowAddNote={setShowAddNote}
                  newNoteTitle={newNoteTitle}
                  setNewNoteTitle={setNewNoteTitle}
                  newNoteBody={newNoteBody}
                  setNewNoteBody={setNewNoteBody}
                  handleAddNote={handleAddNote}
                  handleDeleteNote={handleDeleteNote}
                />
              )}
            </>

          </div>
        </div>

        <MemberList members={members} />
      </div>
    </div>
  );
}
