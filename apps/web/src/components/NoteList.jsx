import { FileText, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function NoteList({
    notes,
    showAddNote,
    setShowAddNote,
    newNoteContent,
    setNewNoteContent,
    handleAddNote,
    handleDeleteNote,
}) {
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
                    <textarea
                        placeholder="Type your note..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="w-full text-[13px] text-[#2B2B2B] bg-transparent outline-none resize-none h-24"
                    />
                    <div className="flex items-center gap-4 mt-4">
                        <button
                            onClick={handleAddNote}
                            disabled={!newNoteContent.trim()}
                            className="px-8 py-3 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#2E69DE] disabled:opacity-50"
                        >
                            Add note
                        </button>
                        <button
                            onClick={() => {
                                setShowAddNote(false);
                                setNewNoteContent("");
                            }}
                            className="text-[13px] text-[#A3A3A3]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Notes List */}
            <div className="space-y-3">
                {notes.map((note) => (
                    <div
                        key={note.id}
                        className="p-4 bg-[#FAFAFA] rounded-lg border border-[#F1F1F1] group hover:border-[#E5E5E5]"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <p className="text-[13px] text-[#2B2B2B] whitespace-pre-wrap">
                                    {note.content}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[11px] text-[#9B9B9B]">
                                        {note.created_by_name || note.created_by_email}
                                    </span>
                                    <span className="text-[11px] text-[#C3C3C3]">•</span>
                                    <span className="text-[11px] text-[#9B9B9B]">
                                        {format(new Date(note.created_at), "MMM d, yyyy")}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded"
                                title="Delete note"
                            >
                                <Trash2 size={14} className="text-red-500" />
                            </button>
                        </div>
                    </div>
                ))}

                {notes.length === 0 && (
                    <div className="text-[#9B9B9B] text-center py-8">
                        No notes yet. Add one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
