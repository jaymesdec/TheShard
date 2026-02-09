import { Plus } from "lucide-react";
import { format } from "date-fns";

export default function TodoList({
    todos,
    activeGroupId,
    groupName,
    showAddTodo,
    setShowAddTodo,
    newTodoTitle,
    setNewTodoTitle,
    newTodoDueDate,
    setNewTodoDueDate,
    handleAddTodo,
    toggleTodoMutation,
}) {
    const completedTodos = todos.filter((t) => t.completed);
    const incompleteTodos = todos.filter((t) => !t.completed);

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-[#C3C3C3] rounded-full"></div>
                    <h1 className="text-[16px] font-semibold">To-Dos</h1>
                </div>
                <button
                    onClick={() => setShowAddTodo(!showAddTodo)}
                    className="h-8 px-4 border border-[#E5E5E5] rounded-full text-[13px] font-medium text-[#7A7A7A] flex items-center gap-1 hover:border-[#2563FF] hover:text-[#2563FF]"
                >
                    <Plus size={12} />
                    Add To-Do
                </button>
            </div>

            {/* Active Tasks */}
            <div className="bg-white border border-[#F1F1F1] rounded-xl p-8 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-[14px] font-semibold">{groupName || "Tasks"}</h2>
                        <span className="text-[12px] text-[#9B9B9B]">
                            {completedTodos.length}/{todos.length}
                        </span>
                    </div>
                </div>

                {/* Task Rows */}
                <div className="space-y-4">
                    {incompleteTodos.map((todo) => (
                        <div
                            key={todo.id}
                            className="flex items-center justify-between h-8"
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() =>
                                        toggleTodoMutation.mutate({
                                            id: todo.id,
                                            completed: !todo.completed,
                                        })
                                    }
                                    className={`w-3 h-3 rounded-full ${todo.completed ? "bg-[#2563FF]" : "bg-[#D9D9D9]"
                                        }`}
                                ></button>
                                <span>{todo.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {todo.due_date && (
                                    <div
                                        className={`px-2 py-1 text-[11px] rounded-xl ${new Date(todo.due_date) < new Date()
                                            ? "bg-[#FF6A6A] text-white"
                                            : "bg-[#EAEAEA] text-[#4C4C4C]"
                                            }`}
                                    >
                                        {format(new Date(todo.due_date), "d MMM, h:mm a")}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {incompleteTodos.length === 0 && (
                        <div className="text-[#9B9B9B] text-center py-4">
                            No active tasks
                        </div>
                    )}
                </div>

                {/* Add Todo Form */}
                {showAddTodo && (
                    <div className="mt-6 border-2 border-dashed border-[#E2E2E2] rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <input
                                type="text"
                                placeholder="Type task ..."
                                value={newTodoTitle}
                                onChange={(e) => setNewTodoTitle(e.target.value)}
                                className="flex-1 text-[13px] text-[#2B2B2B] bg-transparent outline-none"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="datetime-local"
                                    value={newTodoDueDate}
                                    onChange={(e) => setNewTodoDueDate(e.target.value)}
                                    className="px-3 py-1 border border-[#E5E5E5] rounded text-[12px] text-[#7A7A7A]"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleAddTodo}
                                disabled={!newTodoTitle.trim()}
                                className="px-8 py-3 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#2E69DE] disabled:opacity-50"
                            >
                                Add this to-do
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddTodo(false);
                                    setNewTodoTitle("");
                                    setNewTodoDueDate("");
                                }}
                                className="text-[13px] text-[#A3A3A3]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Completed Tasks */}
            {completedTodos.length > 0 && (
                <div className="bg-white border border-[#F1F1F1] rounded-xl p-8">
                    <h3 className="text-[14px] font-semibold mb-4">Completed</h3>
                    <div className="space-y-4">
                        {completedTodos.map((todo) => (
                            <div
                                key={todo.id}
                                className="flex items-center justify-between h-8 opacity-60"
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() =>
                                            toggleTodoMutation.mutate({
                                                id: todo.id,
                                                completed: !todo.completed,
                                            })
                                        }
                                        className="w-3 h-3 bg-[#2563FF] rounded-full"
                                    ></button>
                                    <span className="line-through">{todo.title}</span>
                                </div>
                                {todo.due_date && (
                                    <div className="px-2 py-1 bg-[#EAEAEA] text-[#4C4C4C] text-[11px] rounded-xl">
                                        {format(new Date(todo.due_date), "d MMM, h:mm a")}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
