import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Trash2, Plus } from "lucide-react";
import DriBadge from "@/components/DriBadge";

export default function TodoListModal({
    mode,
    list,
    members = [],
    isGroupContext = false,
    onCreateList,
    onUpdateListTitle,
    onDeleteList,
    onToggleItem,
    onDeleteItem,
    onAddItem,
    onEditItem,
    onUpdateDri,
    onClose,
}) {
    const isEdit = mode === "edit";
    const layoutId = isEdit ? `todo-list-${list.id}` : "todo-list-add";

    const [newTitle, setNewTitle] = useState("");
    const [titleDraft, setTitleDraft] = useState(isEdit ? list.title : "");
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItemTitle, setEditingItemTitle] = useState("");
    const [newItemTitle, setNewItemTitle] = useState("");

    useEffect(() => {
        if (isEdit) setTitleDraft(list.title);
    }, [isEdit, list?.title]);

    const commitNewTitle = () => {
        if (!isEdit) return;
        const trimmed = titleDraft.trim();
        if (trimmed && trimmed !== list.title) {
            onUpdateListTitle(list.id, trimmed);
        } else if (!trimmed) {
            setTitleDraft(list.title);
        }
    };

    const closeAndCommit = () => {
        if (!isEdit) {
            const trimmed = newTitle.trim();
            if (trimmed) onCreateList(trimmed);
        } else {
            commitNewTitle();
        }
        onClose();
    };

    const closeRef = useRef(closeAndCommit);
    closeRef.current = closeAndCommit;

    useEffect(() => {
        const handler = (event) => {
            if (event.key !== "Escape") return;
            event.stopPropagation();
            closeRef.current();
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

    const handleAddItem = () => {
        const trimmed = newItemTitle.trim();
        if (!trimmed || !isEdit) return;
        onAddItem(list.id, trimmed);
        setNewItemTitle("");
    };

    const handleItemEditSubmit = (itemId, originalTitle) => {
        const trimmed = editingItemTitle.trim();
        if (trimmed && trimmed !== originalTitle) {
            onEditItem(itemId, trimmed);
        }
        setEditingItemId(null);
        setEditingItemTitle("");
    };

    const incompleteItems = isEdit ? list.items.filter((item) => !item.completed) : [];
    const completedItems = isEdit ? list.items.filter((item) => item.completed) : [];

    return createPortal(
        <>
            <motion.div
                className="fixed inset-0 bg-black/40 z-[80]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeAndCommit}
            />

            <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 pointer-events-none">
                <motion.div
                    layoutId={layoutId}
                    className="bg-white rounded-xl border border-[#E5E5E5] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto pointer-events-auto"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="p-8">
                        {!isEdit ? (
                            <input
                                type="text"
                                placeholder="List name..."
                                value={newTitle}
                                onChange={(event) => setNewTitle(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") closeAndCommit();
                                }}
                                autoFocus
                                className="w-full text-[20px] font-semibold text-[#2B2B2B] bg-transparent outline-none mb-2"
                            />
                        ) : (
                            <input
                                type="text"
                                value={titleDraft}
                                onChange={(event) => setTitleDraft(event.target.value)}
                                onBlur={commitNewTitle}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        commitNewTitle();
                                        event.currentTarget.blur();
                                    }
                                }}
                                className="w-full text-[20px] font-semibold text-[#2B2B2B] bg-transparent outline-none mb-2"
                            />
                        )}

                        {isEdit && list.items.length > 0 && (
                            <div className="text-[12px] text-[#9B9B9B] mb-4">
                                {completedItems.length}/{list.items.length} done
                            </div>
                        )}

                        {isEdit && (
                            <div className="mt-4">
                                {incompleteItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 py-2.5 min-w-0 group/item"
                                    >
                                        <button
                                            onClick={() => onToggleItem(item.id, true)}
                                            className="w-5 h-5 rounded border border-[#D1D5DB] hover:border-[#2563FF] transition-colors shrink-0"
                                        />
                                        {editingItemId === item.id ? (
                                            <input
                                                type="text"
                                                value={editingItemTitle}
                                                onChange={(event) => setEditingItemTitle(event.target.value)}
                                                onBlur={() => handleItemEditSubmit(item.id, item.title)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") handleItemEditSubmit(item.id, item.title);
                                                    if (event.key === "Escape") {
                                                        setEditingItemId(null);
                                                        setEditingItemTitle("");
                                                    }
                                                }}
                                                autoFocus
                                                className="flex-1 min-w-0 text-[14px] text-[#2B2B2B] bg-transparent outline-none border-b border-[#2563FF] pb-0.5"
                                            />
                                        ) : (
                                            <span
                                                onClick={() => {
                                                    setEditingItemId(item.id);
                                                    setEditingItemTitle(item.title);
                                                }}
                                                className="flex-1 min-w-0 text-[14px] text-[#2B2B2B] leading-snug cursor-pointer hover:text-[#2563FF] transition-colors"
                                            >
                                                {item.title}
                                            </span>
                                        )}
                                        {isGroupContext && members.length > 0 && (
                                            <div className="shrink-0">
                                                <DriBadge todo={item} members={members} onUpdateDri={onUpdateDri} />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => onDeleteItem(item.id)}
                                            className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded shrink-0"
                                        >
                                            <Trash2 size={14} className="text-red-400" />
                                        </button>
                                    </div>
                                ))}

                                {completedItems.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-[#F1F1F1]">
                                        {completedItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 py-1.5 opacity-50 min-w-0 group/item"
                                            >
                                                <button
                                                    onClick={() => onToggleItem(item.id, false)}
                                                    className="w-5 h-5 rounded bg-[#2563FF] border border-[#2563FF] shrink-0 flex items-center justify-center"
                                                >
                                                    <svg width="12" height="9" viewBox="0 0 10 8" fill="none">
                                                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                                {editingItemId === item.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingItemTitle}
                                                        onChange={(event) => setEditingItemTitle(event.target.value)}
                                                        onBlur={() => handleItemEditSubmit(item.id, item.title)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter") handleItemEditSubmit(item.id, item.title);
                                                            if (event.key === "Escape") {
                                                                setEditingItemId(null);
                                                                setEditingItemTitle("");
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="flex-1 min-w-0 text-[14px] text-[#2B2B2B] bg-transparent outline-none border-b border-[#2563FF] pb-0.5"
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => {
                                                            setEditingItemId(item.id);
                                                            setEditingItemTitle(item.title);
                                                        }}
                                                        className="flex-1 min-w-0 text-[14px] text-[#2B2B2B] leading-snug line-through cursor-pointer hover:text-[#2563FF] transition-colors"
                                                    >
                                                        {item.title}
                                                    </span>
                                                )}
                                                {isGroupContext && members.length > 0 && (
                                                    <div className="shrink-0">
                                                        <DriBadge todo={item} members={members} onUpdateDri={null} />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => onDeleteItem(item.id)}
                                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded shrink-0"
                                                >
                                                    <Trash2 size={14} className="text-red-400" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F1F1F1]">
                                    <Plus size={16} className="text-[#9B9B9B] shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Add item"
                                        value={newItemTitle}
                                        onChange={(event) => setNewItemTitle(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") handleAddItem();
                                        }}
                                        className="flex-1 text-[14px] text-[#2B2B2B] placeholder-[#C3C3C3] bg-transparent outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#F1F1F1] gap-4">
                            <div className="flex items-center gap-1">
                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm("Delete this list and all its items?")) {
                                                onDeleteList(list.id);
                                                onClose();
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Delete list"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={closeAndCommit}
                                className="px-5 py-2 text-[13px] font-medium text-[#2563FF] hover:bg-[#F0F4FF] rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>,
        document.body,
    );
}
