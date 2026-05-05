import { useState } from "react";
import { FileText, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { format } from "date-fns";
import ImageUploader from "@/components/ImageUploader";
import Lightbox from "@/components/Lightbox";
import { toast } from "sonner";

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
    const [editingImages, setEditingImages] = useState([]);
    const [newNoteImages, setNewNoteImages] = useState([]);
    const [lightboxImage, setLightboxImage] = useState(null);

    const isAddDisabled = !newNoteTitle.trim() && !newNoteBody.trim() && newNoteImages.length === 0;

    const startEditingNote = (note) => {
        setEditingNoteId(note.id);
        setEditingTitle(note.title || "");
        setEditingBody(note.content || "");
        setEditingImages(note.images || []);
    };

    const cancelEditingNote = () => {
        setEditingNoteId(null);
        setEditingTitle("");
        setEditingBody("");
        setEditingImages([]);
    };

    const submitEditNote = () => {
        const trimmedTitle = editingTitle.trim();
        const trimmedBody = editingBody.trim();
        if (!trimmedTitle && !trimmedBody && editingImages.length === 0) return;
        handleEditNote(editingNoteId, trimmedTitle, trimmedBody, editingImages);
        setEditingNoteId(null);
        setEditingTitle("");
        setEditingBody("");
        setEditingImages([]);
    };

    const handleNewNoteImageUploaded = ({ url }) => {
        if (newNoteImages.length >= 10) {
            toast.error("Maximum 10 images per note");
            return;
        }
        setNewNoteImages((prev) => [...prev, { url }]);
    };

    const handleEditImageUploaded = ({ url }) => {
        if (editingImages.length >= 10) {
            toast.error("Maximum 10 images per note");
            return;
        }
        setEditingImages((prev) => [...prev, { url }]);
    };

    const handleAddNoteWithImages = () => {
        handleAddNote(newNoteImages);
        setNewNoteImages([]);
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

                    {/* New note image previews */}
                    {newNoteImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {newNoteImages.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <img
                                        src={img.url}
                                        alt=""
                                        className="w-[60px] h-[60px] object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNewNoteImages((prev) => prev.filter((_, i) => i !== idx))}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4 mt-4">
                        <button
                            onClick={handleAddNoteWithImages}
                            disabled={isAddDisabled}
                            className="px-8 py-3 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#2E69DE] disabled:opacity-50"
                        >
                            Add note
                        </button>
                        <ImageUploader onImageUploaded={handleNewNoteImageUploaded}>
                            {({ triggerFileInput, uploading }) => (
                                <button
                                    type="button"
                                    onClick={triggerFileInput}
                                    disabled={uploading}
                                    className="p-2 text-gray-400 hover:text-[#2563FF] disabled:opacity-50 transition-colors"
                                    title="Attach image"
                                >
                                    <ImagePlus size={18} />
                                </button>
                            )}
                        </ImageUploader>
                        <button
                            onClick={() => {
                                setShowAddNote(false);
                                setNewNoteTitle("");
                                setNewNoteBody("");
                                setNewNoteImages([]);
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

                                    {/* Editing image previews */}
                                    {editingImages.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {editingImages.map((img, idx) => (
                                                <div key={idx} className="relative group/img">
                                                    <img
                                                        src={img.url}
                                                        alt=""
                                                        className="w-[50px] h-[50px] object-cover rounded-lg border border-gray-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingImages((prev) => prev.filter((_, i) => i !== idx))}
                                                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mt-3">
                                        <button
                                            onClick={submitEditNote}
                                            disabled={!editingTitle.trim() && !editingBody.trim() && editingImages.length === 0}
                                            className="px-4 py-1.5 bg-[#2563FF] text-white text-[12px] font-semibold rounded-lg hover:bg-[#2E69DE] disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                        <ImageUploader onImageUploaded={handleEditImageUploaded}>
                                            {({ triggerFileInput, uploading }) => (
                                                <button
                                                    type="button"
                                                    onClick={triggerFileInput}
                                                    disabled={uploading}
                                                    className="p-1.5 text-gray-400 hover:text-[#2563FF] disabled:opacity-50 transition-colors"
                                                    title="Attach image"
                                                >
                                                    <ImagePlus size={14} />
                                                </button>
                                            )}
                                        </ImageUploader>
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

                                    {note.content && (
                                        <p
                                            onClick={() => handleEditNote && startEditingNote(note)}
                                            className={`text-[13px] text-[#2B2B2B] whitespace-pre-wrap leading-relaxed ${handleEditNote ? "cursor-pointer" : ""}`}
                                        >
                                            {note.content}
                                        </p>
                                    )}

                                    {/* Note images */}
                                    {note.images?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {note.images.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img.url}
                                                    alt=""
                                                    className="w-[80px] h-[60px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setLightboxImage(img.url)}
                                                />
                                            ))}
                                        </div>
                                    )}

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

            <Lightbox
                imageUrl={lightboxImage}
                isOpen={!!lightboxImage}
                onClose={() => setLightboxImage(null)}
            />
        </div>
    );
}
