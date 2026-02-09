import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Bell, ChevronDown } from "lucide-react";
import useUser from "@/utils/useUser";
import Sidebar from "@/components/Sidebar";
import MemberList from "@/components/MemberList";
import NoteList from "@/components/NoteList";
import TodoList from "@/components/TodoList";

export default function Dashboard() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState('personal');

  // Todo State
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDueDate, setNewTodoDueDate] = useState("");
  const [showAddTodo, setShowAddTodo] = useState(false);

  // Note State
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);

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

  // Fetch todos
  const { data: todosData } = useQuery({
    queryKey: ["todos", activeGroupId],
    queryFn: async () => {
      const response = await fetch(`/api/todos?groupId=${activeGroupId}`);
      if (!response.ok) throw new Error("Failed to fetch todos");
      return response.json();
    },
    enabled: !!activeGroupId,
  });

  const todos = todosData?.todos || [];

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
    ? [{ id: user.id, name: user.name, email: user.email }]
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
  const createTodoMutation = useMutation({
    mutationFn: async (todoData) => {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todoData),
      });
      if (!response.ok) throw new Error("Failed to create todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setNewTodoTitle("");
      setNewTodoDueDate("");
      setShowAddTodo(false);
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
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["todos", activeGroupId] });
      const previousTodos = queryClient.getQueryData(["todos", activeGroupId]);

      queryClient.setQueryData(["todos", activeGroupId], (old) => ({
        ...old,
        todos: old?.todos?.map((todo) =>
          todo.id === id ? { ...todo, completed } : todo,
        ),
      }));

      return { previousTodos };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["todos", activeGroupId], context.previousTodos);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
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
      setNewNoteContent("");
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
  const handleAddTodo = () => {
    if (!newTodoTitle.trim() || !activeGroupId) return;
    createTodoMutation.mutate({
      groupId: activeGroupId,
      title: newTodoTitle.trim(),
      dueDate: newTodoDueDate || null,
      assignedTo: [user.id],
    });
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim() || !activeGroupId) return;
    createNoteMutation.mutate({
      groupId: activeGroupId,
      content: newNoteContent.trim(),
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

            <div className="w-6 h-6 border-4 border-[#2563FF] rounded-full"></div>

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
              <TodoList
                todos={todos}
                activeGroupId={activeGroupId}
                groupName={activeGroupId === 'personal' ? "Personal Tasks" : groups.find((g) => g.id === activeGroupId)?.name}
                showAddTodo={showAddTodo}
                setShowAddTodo={setShowAddTodo}
                newTodoTitle={newTodoTitle}
                setNewTodoTitle={setNewTodoTitle}
                newTodoDueDate={newTodoDueDate}
                setNewTodoDueDate={setNewTodoDueDate}
                handleAddTodo={handleAddTodo}
                toggleTodoMutation={toggleTodoMutation}
              />

              <NoteList
                notes={notes}
                showAddNote={showAddNote}
                setShowAddNote={setShowAddNote}
                newNoteContent={newNoteContent}
                setNewNoteContent={setNewNoteContent}
                handleAddNote={handleAddNote}
                handleDeleteNote={handleDeleteNote}
              />
            </>

          </div>
        </div>

        <MemberList members={members} />
      </div>
    </div>
  );
}
