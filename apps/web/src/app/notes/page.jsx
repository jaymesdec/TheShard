import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import useUser from "@/utils/useUser";
import NoteList from "@/components/NoteList";

export default function NotesPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

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

  const handleAddNote = ({ title, body, images } = {}) => {
    const cleanTitle = (title || "").trim();
    const cleanBody = (body || "").trim();
    const imageList = images || [];
    if (!cleanTitle && !cleanBody && imageList.length === 0) return;
    createNoteMutation.mutate({
      groupId: "personal",
      title: cleanTitle,
      body: cleanBody,
      images: imageList,
    });
  };

  const handleEditNote = (noteId, title, body, images) => {
    editNoteMutation.mutate({ noteId, title, body, images });
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
      <div className="app-shell max-w-5xl mx-auto p-6">
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
          onAddNote={handleAddNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>
    </div>
  );
}
