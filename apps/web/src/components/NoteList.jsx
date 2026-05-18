import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import NoteModal from "@/components/NoteModal";

export default function NoteList({
    notes,
    onAddNote,
    onEditNote,
    onDeleteNote,
}) {
    const [modalState, setModalState] = useState(null);

    const openNewNote = () => setModalState({ mode: "new" });
    const openEditNote = (note) => setModalState({ mode: "edit", note });
    const closeModal = () => setModalState(null);

    const handleSave = (...args) => {
        if (modalState?.mode === "new") {
            const [data] = args;
            onAddNote(data);
        } else {
            const [noteId, title, body, images] = args;
            onEditNote(noteId, title, body, images);
        }
    };

    return (
        <div className="bg-white border border-[#F1F1F1] rounded-xl p-8 mt-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#7A7A7A]" />
                    <h3 className="text-[14px] font-semibold">Notes & Reminders</h3>
                </div>
                <motion.button
                    layoutId="note-add"
                    onClick={openNewNote}
                    className="h-8 px-4 border border-[#E5E5E5] rounded-full text-[13px] font-medium text-[#7A7A7A] flex items-center gap-1 hover:border-[#2563FF] hover:text-[#2563FF]"
                >
                    <Plus size={12} />
                    Add Note
                </motion.button>
            </div>

            {notes.length === 0 ? (
                <div className="text-[#9B9B9B] text-center py-12">
                    No notes yet. Add one to get started!
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
                    {notes.map((note) => (
                        <motion.div
                            key={note.id}
                            layoutId={`note-${note.id}`}
                            onClick={() => openEditNote(note)}
                            className="group break-inside-avoid mb-5 p-5 bg-white rounded-xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <h4 className="text-[14px] font-semibold text-[#2B2B2B] leading-snug flex-1">
                                    {note.title || "Untitled"}
                                </h4>
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        if (confirm("Are you sure you want to delete this note?")) {
                                            onDeleteNote(note.id);
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded shrink-0"
                                    title="Delete note"
                                >
                                    <Trash2 size={14} className="text-red-500" />
                                </button>
                            </div>

                            {note.content && (
                                <p className="text-[13px] text-[#2B2B2B] whitespace-pre-wrap leading-relaxed">
                                    {note.content}
                                </p>
                            )}

                            {note.images?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {note.images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img.url}
                                            alt=""
                                            className="w-[80px] h-[60px] object-cover rounded-lg"
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#F1F1F1]">
                                <span className="text-[11px] text-[#9B9B9B] truncate">
                                    {note.created_by_name || note.created_by_email}
                                </span>
                                <span className="text-[11px] text-[#C3C3C3]">•</span>
                                <span className="text-[11px] text-[#9B9B9B]">
                                    {format(new Date(note.created_at), "MMM d, yyyy")}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {modalState && (
                    <NoteModal
                        key={modalState.mode === "edit" ? `edit-${modalState.note.id}` : "new"}
                        mode={modalState.mode}
                        note={modalState.note}
                        onSave={handleSave}
                        onDelete={onDeleteNote}
                        onClose={closeModal}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
