import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import useUser from "@/utils/useUser";
import NoteList from "@/components/NoteList";

export default function NotesPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteBody, setNewNoteBody] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);

  const { data: notesData } = useQuery({
    queryKey: ["notes", "personal"],
    queryFn: async () => {
      const response = await fetch("/api/notes?groupId=personal");
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    },
    enabled: !!user,
  });

  const notes = notesData?.notes || [];

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

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteBody.trim()) return;
    createNoteMutation.mutate({
      groupId: "personal",
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
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[#2563FF] font-medium mb-4 hover:text-[#2E69DE] text-[14px]"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </a>
        </div>

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
      </div>
    </div>
  );
}
