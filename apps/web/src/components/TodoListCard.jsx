import { motion } from "motion/react";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import DriBadge from "@/components/DriBadge";

export default function TodoListCard({
    list,
    onOpen,
    onDeleteList,
    onToggleItem,
    onDeleteItem,
    onAddItem,
    members = [],
    onUpdateDri,
    isGroupContext = false,
}) {
    const [newItemTitle, setNewItemTitle] = useState("");

    const incompleteItems = list.items.filter((item) => !item.completed);
    const completedItems = list.items.filter((item) => item.completed);
    const totalItems = list.items.length;
    const completedCount = completedItems.length;

    const handleAddItem = () => {
        const trimmed = newItemTitle.trim();
        if (!trimmed) return;
        onAddItem(list.id, trimmed);
        setNewItemTitle("");
    };

    const stop = (event) => event.stopPropagation();

    return (
        <motion.div
            layoutId={`todo-list-${list.id}`}
            onClick={() => onOpen(list.id)}
            className="group/card break-inside-avoid mb-5 bg-white rounded-xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
        >
            <div className="flex items-start justify-between p-5 pb-3">
                <h4 className="flex-1 min-w-0 text-[14px] font-semibold text-[#2B2B2B]">
                    {list.title}
                </h4>
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        if (confirm("Delete this list and all its items?")) {
                            onDeleteList(list.id);
                        }
                    }}
                    className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded shrink-0 ml-2"
                    title="Delete list"
                >
                    <Trash2 size={14} className="text-red-400" />
                </button>
            </div>

            {totalItems > 0 && (
                <div className="px-5 pb-3">
                    <span className="text-[11px] text-[#9B9B9B]">
                        {completedCount}/{totalItems} done
                    </span>
                </div>
            )}

            <div className="px-5 pb-3">
                {incompleteItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-2 py-2.5 min-w-0 group/item"
                    >
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onToggleItem(item.id, true);
                            }}
                            className="w-4 h-4 rounded border border-[#D1D5DB] hover:border-[#2563FF] transition-colors shrink-0"
                        />
                        <span className="flex-1 min-w-0 text-[13px] text-[#2B2B2B] leading-snug">
                            {item.title}
                        </span>
                        {isGroupContext && members.length > 0 && (
                            <div className="shrink-0" onClick={stop}>
                                <DriBadge todo={item} members={members} onUpdateDri={onUpdateDri} />
                            </div>
                        )}
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onDeleteItem(item.id);
                            }}
                            className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded"
                        >
                            <Trash2 size={12} className="text-red-400" />
                        </button>
                    </div>
                ))}

                {completedItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#F1F1F1]">
                        {completedItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-2 py-1.5 opacity-50 min-w-0 group/item"
                            >
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onToggleItem(item.id, false);
                                    }}
                                    className="w-4 h-4 rounded bg-[#2563FF] border border-[#2563FF] shrink-0 flex items-center justify-center"
                                >
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <span className="flex-1 min-w-0 text-[13px] text-[#2B2B2B] leading-snug line-through">
                                    {item.title}
                                </span>
                                {isGroupContext && members.length > 0 && (
                                    <div className="shrink-0" onClick={stop}>
                                        <DriBadge todo={item} members={members} onUpdateDri={null} />
                                    </div>
                                )}
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onDeleteItem(item.id);
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={12} className="text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-5 pb-4 pt-2" onClick={stop}>
                <div className="flex items-center gap-2">
                    <Plus size={14} className="text-[#9B9B9B] shrink-0" />
                    <input
                        type="text"
                        placeholder="Add item"
                        value={newItemTitle}
                        onChange={(event) => setNewItemTitle(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") handleAddItem();
                        }}
                        className="flex-1 text-[13px] text-[#2B2B2B] placeholder-[#C3C3C3] bg-transparent outline-none"
                    />
                </div>
            </div>
        </motion.div>
    );
}
