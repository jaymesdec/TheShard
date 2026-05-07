import { useState } from "react";
import { Plus } from "lucide-react";
import TodoListCard from "@/components/TodoListCard";

export default function TodoBoard({
  lists,
  onCreateList,
  onUpdateListTitle,
  onDeleteList,
  onToggleItem,
  onDeleteItem,
  onAddItem,
  onEditItem,
  members = [],
  onUpdateDri,
  isGroupContext = false,
}) {
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const handleCreateList = () => {
    const trimmed = newListTitle.trim();
    if (!trimmed) return;
    onCreateList(trimmed);
    setNewListTitle("");
    setShowNewListInput(false);
  };

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-[#C3C3C3] rounded-full"></div>
          <h1 className="text-[16px] font-semibold">To-Dos</h1>
        </div>
        <button
          onClick={() => setShowNewListInput(!showNewListInput)}
          className="h-8 px-4 border border-[#E5E5E5] rounded-full text-[13px] font-medium text-[#7A7A7A] flex items-center gap-1 hover:border-[#2563FF] hover:text-[#2563FF]"
        >
          <Plus size={12} />
          Add List
        </button>
      </div>

      {/* New List Input */}
      {showNewListInput && (
        <div className="mb-4 p-4 border-2 border-dashed border-[#E2E2E2] rounded-xl">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="List name..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateList();
                if (e.key === "Escape") {
                  setShowNewListInput(false);
                  setNewListTitle("");
                }
              }}
              autoFocus
              className="flex-1 text-[14px] text-[#2B2B2B] bg-transparent outline-none"
            />
            <button
              onClick={handleCreateList}
              disabled={!newListTitle.trim()}
              className="px-4 py-2 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#2E69DE] disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewListInput(false);
                setNewListTitle("");
              }}
              className="text-[13px] text-[#A3A3A3]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Masonry Grid */}
      {lists.length === 0 ? (
        <div className="text-[#9B9B9B] text-center py-12 bg-white border border-[#F1F1F1] rounded-xl">
          No to-do lists yet. Create one to get started!
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
          {lists.map((list) => (
            <TodoListCard
              key={list.id}
              list={list}
              onUpdateTitle={onUpdateListTitle}
              onDeleteList={onDeleteList}
              onToggleItem={onToggleItem}
              onDeleteItem={onDeleteItem}
              onAddItem={onAddItem}
              onEditItem={onEditItem}
              members={members}
              onUpdateDri={onUpdateDri}
              isGroupContext={isGroupContext}
            />
          ))}
        </div>
      )}
    </div>
  );
}
