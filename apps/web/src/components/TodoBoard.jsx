import { useState } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TodoListCard from "@/components/TodoListCard";
import TodoListModal from "@/components/TodoListModal";

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
    const [modalState, setModalState] = useState(null);

    const openNewList = () => setModalState({ mode: "new" });
    const openExistingList = (listId) => setModalState({ mode: "edit", listId });
    const closeModal = () => setModalState(null);

    const activeList =
        modalState?.mode === "edit"
            ? lists.find((l) => l.id === modalState.listId)
            : null;

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-[#C3C3C3] rounded-full"></div>
                    <h1 className="text-[16px] font-semibold">To-Dos</h1>
                </div>
                <motion.button
                    layoutId="todo-list-add"
                    onClick={openNewList}
                    className="h-8 px-4 border border-[#E5E5E5] rounded-full text-[13px] font-medium text-[#7A7A7A] flex items-center gap-1 hover:border-[#2563FF] hover:text-[#2563FF]"
                >
                    <Plus size={12} />
                    Add List
                </motion.button>
            </div>

            {lists.length === 0 ? (
                <div className="text-[#9B9B9B] text-center py-12 bg-white border border-[#F1F1F1] rounded-xl">
                    No to-do lists yet. Create one to get started!
                </div>
            ) : (
                <div className={`columns-1 sm:columns-2 ${isGroupContext ? 'lg:columns-3' : 'lg:columns-3 xl:columns-4'} gap-5 [column-fill:_balance]`}>
                    {lists.map((list) => (
                        <TodoListCard
                            key={list.id}
                            list={list}
                            onOpen={openExistingList}
                            onDeleteList={onDeleteList}
                            onToggleItem={onToggleItem}
                            onDeleteItem={onDeleteItem}
                            onAddItem={onAddItem}
                            members={members}
                            onUpdateDri={onUpdateDri}
                            isGroupContext={isGroupContext}
                        />
                    ))}
                </div>
            )}

            <AnimatePresence>
                {modalState && (modalState.mode === "new" || activeList) && (
                    <TodoListModal
                        key={modalState.mode === "edit" ? `edit-${modalState.listId}` : "new"}
                        mode={modalState.mode}
                        list={activeList}
                        members={members}
                        isGroupContext={isGroupContext}
                        onCreateList={onCreateList}
                        onUpdateListTitle={onUpdateListTitle}
                        onDeleteList={onDeleteList}
                        onToggleItem={onToggleItem}
                        onDeleteItem={onDeleteItem}
                        onAddItem={onAddItem}
                        onEditItem={onEditItem}
                        onUpdateDri={onUpdateDri}
                        onClose={closeModal}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
