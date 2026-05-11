import { useState, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import DriBadge from "@/components/DriBadge";

export default function TodoListCard({
  list,
  onUpdateTitle,
  onDeleteList,
  onToggleItem,
  onDeleteItem,
  onAddItem,
  onEditItem,
  members = [],
  onUpdateDri,
  isGroupContext = false,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");
  const titleInputRef = useRef(null);

  const incompleteItems = list.items.filter((item) => !item.completed);
  const completedItems = list.items.filter((item) => item.completed);
  const totalItems = list.items.length;
  const completedCount = completedItems.length;

  const handleTitleSubmit = () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== list.title) {
      onUpdateTitle(list.id, trimmed);
    } else {
      setEditedTitle(list.title);
    }
    setIsEditingTitle(false);
  };

  const handleAddItem = () => {
    const trimmed = newItemTitle.trim();
    if (!trimmed) return;
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

  return (
    <div className="group/card break-inside-avoid mb-5 bg-white rounded-xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-3">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSubmit();
              if (e.key === "Escape") {
                setEditedTitle(list.title);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
            className="flex-1 text-[14px] font-semibold text-[#2B2B2B] bg-transparent outline-none border-b border-[#2563FF] pb-0.5"
          />
        ) : (
          <h4
            onClick={() => setIsEditingTitle(true)}
            className="flex-1 text-[14px] font-semibold text-[#2B2B2B] cursor-pointer hover:text-[#2563FF] transition-colors"
          >
            {list.title}
          </h4>
        )}

        <button
          onClick={() => onDeleteList(list.id)}
          className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded shrink-0 ml-2"
          title="Delete list"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>

      {/* Progress */}
      {totalItems > 0 && (
        <div className="px-5 pb-3">
          <span className="text-[11px] text-[#9B9B9B]">
            {completedCount}/{totalItems} done
          </span>
        </div>
      )}

      {/* Items */}
      <div className="px-5 pb-3">
        {incompleteItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 py-2.5 group/item"
          >
            <button
              onClick={() => onToggleItem(item.id, true)}
              className="w-4 h-4 rounded border border-[#D1D5DB] hover:border-[#2563FF] transition-colors shrink-0"
            />
            {editingItemId === item.id ? (
              <input
                type="text"
                value={editingItemTitle}
                onChange={(e) => setEditingItemTitle(e.target.value)}
                onBlur={() => handleItemEditSubmit(item.id, item.title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleItemEditSubmit(item.id, item.title);
                  if (e.key === "Escape") {
                    setEditingItemId(null);
                    setEditingItemTitle("");
                  }
                }}
                autoFocus
                className="flex-1 text-[13px] text-[#2B2B2B] leading-snug bg-transparent outline-none border-b border-[#2563FF] pb-0.5"
              />
            ) : (
              <span
                onClick={() => {
                  setEditingItemId(item.id);
                  setEditingItemTitle(item.title);
                }}
                className="flex-1 text-[13px] text-[#2B2B2B] leading-snug cursor-pointer hover:text-[#2563FF] transition-colors"
              >
                {item.title}
              </span>
            )}
            {isGroupContext && members.length > 0 && (
              <DriBadge todo={item} members={members} onUpdateDri={onUpdateDri} />
            )}
            <button
              onClick={() => onDeleteItem(item.id)}
              className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded"
            >
              <Trash2 size={12} className="text-red-400" />
            </button>
          </div>
        ))}

        {/* Completed items */}
        {completedItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#F1F1F1]">
            {completedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 py-1.5 opacity-50 group/item"
              >
                <button
                  onClick={() => onToggleItem(item.id, false)}
                  className="w-4 h-4 rounded bg-[#2563FF] border border-[#2563FF] shrink-0 flex items-center justify-center"
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={editingItemTitle}
                    onChange={(e) => setEditingItemTitle(e.target.value)}
                    onBlur={() => handleItemEditSubmit(item.id, item.title)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleItemEditSubmit(item.id, item.title);
                      if (e.key === "Escape") {
                        setEditingItemId(null);
                        setEditingItemTitle("");
                      }
                    }}
                    autoFocus
                    className="flex-1 text-[13px] text-[#2B2B2B] leading-snug bg-transparent outline-none border-b border-[#2563FF] pb-0.5"
                  />
                ) : (
                  <span
                    onClick={() => {
                      setEditingItemId(item.id);
                      setEditingItemTitle(item.title);
                    }}
                    className="flex-1 text-[13px] text-[#2B2B2B] leading-snug line-through cursor-pointer hover:text-[#2563FF] transition-colors"
                  >
                    {item.title}
                  </span>
                )}
                {isGroupContext && members.length > 0 && (
                  <DriBadge todo={item} members={members} onUpdateDri={null} />
                )}
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded"
                >
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item */}
      <div className="px-5 pb-4 pt-2">
        <div className="flex items-center gap-2">
          <Plus size={14} className="text-[#9B9B9B] shrink-0" />
          <input
            type="text"
            placeholder="Add item"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddItem();
            }}
            className="flex-1 text-[13px] text-[#2B2B2B] placeholder-[#C3C3C3] bg-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
}
