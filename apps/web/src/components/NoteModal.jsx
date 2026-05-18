import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Trash2, ImagePlus, X } from "lucide-react";
import { format } from "date-fns";
import ImageUploader from "@/components/ImageUploader";
import Lightbox from "@/components/Lightbox";
import { toast } from "sonner";

export default function NoteModal({ mode, note, onSave, onDelete, onClose }) {
    const isEdit = mode === "edit";
    const [title, setTitle] = useState(isEdit ? note?.title || "" : "");
    const [body, setBody] = useState(isEdit ? note?.content || "" : "");
    const [images, setImages] = useState(isEdit ? note?.images || [] : []);
    const [lightboxImage, setLightboxImage] = useState(null);

    const initialRef = useRef({
        title: isEdit ? note?.title || "" : "",
        body: isEdit ? note?.content || "" : "",
        images: isEdit ? note?.images || [] : [],
    });

    const layoutId = isEdit ? `note-${note.id}` : "note-add";

    const commit = () => {
        const trimmedTitle = title.trim();
        const trimmedBody = body.trim();
        const hasContent = trimmedTitle || trimmedBody || images.length > 0;

        if (!isEdit) {
            if (hasContent) onSave({ title: trimmedTitle, body: trimmedBody, images });
            return;
        }

        const initial = initialRef.current;
        const changed =
            trimmedTitle !== initial.title.trim() ||
            trimmedBody !== initial.body.trim() ||
            JSON.stringify(images) !== JSON.stringify(initial.images);
        if (changed && hasContent) {
            onSave(note.id, trimmedTitle, trimmedBody, images);
        }
    };

    const saveAndClose = () => {
        commit();
        onClose();
    };

    const saveAndCloseRef = useRef(saveAndClose);
    saveAndCloseRef.current = saveAndClose;

    const lightboxOpenRef = useRef(!!lightboxImage);
    lightboxOpenRef.current = !!lightboxImage;

    useEffect(() => {
        const handler = (event) => {
            if (event.key !== "Escape") return;
            if (lightboxOpenRef.current) return;
            event.stopPropagation();
            saveAndCloseRef.current();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        document.body.setAttribute("data-note-modal-open", "true");
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.removeAttribute("data-note-modal-open");
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    const handleImageUploaded = ({ url }) => {
        if (images.length >= 10) {
            toast.error("Maximum 10 images per note");
            return;
        }
        setImages((prev) => [...prev, { url }]);
    };

    const handleDelete = () => {
        if (!isEdit) return;
        if (!confirm("Are you sure you want to delete this note?")) return;
        onDelete(note.id);
        onClose();
    };

    return createPortal(
        <>
            <motion.div
                className="fixed inset-0 bg-black/40 z-[80]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={saveAndClose}
            />

            <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 pointer-events-none">
                <motion.div
                    layoutId={layoutId}
                    className="bg-white rounded-xl border border-[#E5E5E5] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto pointer-events-auto"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="p-8">
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            autoFocus={!isEdit}
                            className="w-full text-[20px] font-semibold text-[#2B2B2B] bg-transparent outline-none mb-4"
                        />
                        <textarea
                            placeholder="Write the body of your note..."
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            className="w-full text-[14px] text-[#2B2B2B] bg-transparent outline-none resize-none min-h-[200px] leading-relaxed whitespace-pre-wrap"
                        />

                        {images.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-4">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative group">
                                        <img
                                            src={img.url}
                                            alt=""
                                            className="w-[90px] h-[90px] object-cover rounded-lg border border-gray-200 cursor-pointer"
                                            onClick={() => setLightboxImage(img.url)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove image"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#F1F1F1] gap-4">
                            <div className="flex items-center gap-1">
                                <ImageUploader onImageUploaded={handleImageUploaded}>
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
                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Delete note"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            {isEdit && note?.created_at && (
                                <span className="text-[11px] text-[#9B9B9B] truncate">
                                    {note.created_by_name || note.created_by_email}
                                    {" · "}
                                    {format(new Date(note.created_at), "MMM d, yyyy")}
                                </span>
                            )}

                            <button
                                onClick={saveAndClose}
                                className="px-5 py-2 text-[13px] font-medium text-[#2563FF] hover:bg-[#F0F4FF] rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <Lightbox
                imageUrl={lightboxImage}
                isOpen={!!lightboxImage}
                onClose={() => setLightboxImage(null)}
            />
        </>,
        document.body,
    );
}
