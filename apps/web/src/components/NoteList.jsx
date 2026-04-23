import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function NoteList({
    notes,
    showAddNote,
    setShowAddNote,
    newNoteTitle,
    setNewNoteTitle,
    newNoteBody,
    setNewNoteBody,
    handleAddNote,
    handleDeleteNote,
    handleEditNote,
}) {
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingBody, setEditingBody] = useState("");
    const isAddDisabled = !newNoteTitle.trim() || !newNoteBody.trim();

    const startEditingNote = (note) => {
        setEditingNoteId(note.id);
        setEditingTitle(note.title || "");
        setEditingBody(note.content || "");
    };

    const cancelEditingNote = () => {
        setEditingNoteId(null);
        setEditingTitle("");
        setEditingBody("");
    };

    const submitEditNote = () => {
        const trimmedTitle = editingTitle.trim();
        const trimmedBody = editingBody.trim();
        if (!trimmedTitle || !trimmedBody) return;
        handleEditNote(editingNoteId, trimmedTitle, trimmedBody);
        setEditingNoteId(null);
        setEditingTitle("");
        setEditingBody("");
    };

    return (
        <div className="bg-white border border-[#F1F1F1] rounded-xl p-8 mt-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#7A7A7A]" />
                    <h3 className="text-[14px] font-semibold">Notes & Reminders</h3>
                </div>
                <button
                    onClick={() => setShowAddNote(!showAddNote)}
                    className="h-8 px-4 border border-[#E5E5E5] rounded-full text-[13px] font-medium text-[#7A7A7A] flex items-center gap-1 hover:border-[#2563FF] hover:text-[#2563FF]"
                >
                    <Plus size={12} />
                    Add Note
                </button>
            </div>

            {/* Add Note Form */}
            {showAddNote && (
                <div className="mb-6 border-2 border-dashed border-[#E2E2E2] rounded-lg p-6">
                    <input
                        type="text"
                        placeholder="Title"
                        value={newNoteTitle}
                        onChange={(event) => setNewNoteTitle(event.target.value)}
                        className="w-full text-[15px] font-semibold text-[#2B2B2B] bg-transparent outline-none mb-3"
                    />
                    <textarea
                        placeholder="Write the body of your note..."
                        value={newNoteBody}
                        onChange={(event) => setNewNoteBody(event.target.value)}
                        className="w-full text-[13px] text-[#2B2B2B] bg-transparent outline-none resize-none h-24"
                    />
                    <div className="flex items-center gap-4 mt-4">
                        <button
                            onClick={handleAddNote}
                            disabled={isAddDisabled}
                            className="px-8 py-3 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#2E69DE] disabled:opacity-50"
                        >
                            Add note
                        </button>
                        <button
                            onClick={() => {
                                setShowAddNote(false);
                                setNewNoteTitle("");
                                setNewNoteBody("");
                            }}
                            className="text-[13px] text-[#A3A3A3]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Notes Masonry */}
            {notes.length === 0 ? (
                <div className="text-[#9B9B9B] text-center py-12">
                    No notes yet. Add one to get started!
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className="group break-inside-avoid mb-4 p-4 bg-white rounded-xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow"
                        >
                            {editingNoteId === note.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        autoFocus
                                        className="w-full text-[14px] font-semibold text-[#2B2B2B] bg-transparent outline-none border-b border-[#2563FF] pb-1 mb-3"
                                    />
                                    <textarea
                                        value={editingBody}
                                        onChange={(e) => setEditingBody(e.target.value)}
                                        className="w-full text-[13px] text-[#2B2B2B] bg-transparent outline-none resize-none h-24 whitespace-pre-wrap leading-relaxed"
                                    />
                                    <div className="flex items-center gap-3 mt-3">
                                        <button
                                            onClick={submitEditNote}
                                            disabled={!editingTitle.trim() || !editingBody.trim()}
                                            className="px-4 py-1.5 bg-[#2563FF] text-white text-[12px] font-semibold rounded-lg hover:bg-[#2E69DE] disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={cancelEditingNote}
                                            className="text-[12px] text-[#A3A3A3]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4
                                            onClick={() => handleEditNote && startEditingNote(note)}
                                            className={`text-[14px] font-semibold text-[#2B2B2B] leading-snug flex-1 ${handleEditNote ? "cursor-pointer hover:text-[#2563FF] transition-colors" : ""}`}
                                        >
                                            {note.title || "Untitled"}
                                        </h4>
                                        <button
                                            onClick={() => handleDeleteNote(note.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded shrink-0"
                                            title="Delete note"
                                        >
                                            <Trash2 size={14} className="text-red-500" />
                                        </button>
                                    </div>

                                    <p
                                        onClick={() => handleEditNote && startEditingNote(note)}
                                        className={`text-[13px] text-[#2B2B2B] whitespace-pre-wrap leading-relaxed ${handleEditNote ? "cursor-pointer" : ""}`}
                                    >
                                        {note.content}
                                    </p>

                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F1F1]">
                                        <span className="text-[11px] text-[#9B9B9B] truncate">
                                            {note.created_by_name || note.created_by_email}
                                        </span>
                                        <span className="text-[11px] text-[#C3C3C3]">•</span>
                                        <span className="text-[11px] text-[#9B9B9B]">
                                            {format(new Date(note.created_at), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
