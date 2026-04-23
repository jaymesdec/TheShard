import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isToday,
    addDays,
    getHours,
    getMinutes,
} from "date-fns";
import { Trash2, X } from "lucide-react";

export default function WeekView({ currentDate, todos }) {
    const queryClient = useQueryClient();
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Edit Modal State
    const [selectedTask, setSelectedTask] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDueDate, setEditDueDate] = useState("");

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, title, dueDate }) => {
            const response = await fetch(`/api/todos/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, dueDate }),
            });
            if (!response.ok) throw new Error("Failed to update todo");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["todos"]);
            closeModals();
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`/api/todos/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete todo");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["todos"]);
            closeModals();
        },
    });

    const closeModals = () => {
        setSelectedTask(null);
        setEditTitle("");
        setEditDueDate("");
    };

    const handleTaskClick = (e, todo) => {
        e.stopPropagation();
        setSelectedTask(todo);
        setEditTitle(todo.title);
        setEditDueDate(format(new Date(todo.due_date), "yyyy-MM-dd'T'HH:mm"));
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (!selectedTask || !editTitle) return;
        updateMutation.mutate({
            id: selectedTask.id,
            title: editTitle,
            dueDate: new Date(editDueDate).toISOString(),
        });
    };

    const handleDelete = () => {
        if (!selectedTask) return;
        if (confirm("Are you sure you want to delete this task?")) {
            deleteMutation.mutate(selectedTask.id);
        }
    };

    // Filter tasks for this week
    const weekTodos = useMemo(() => {
        return todos.filter((todo) => {
            if (!todo.due_date) return false;
            const date = new Date(todo.due_date);
            return date >= weekStart && date <= weekEnd;
        });
    }, [todos, weekStart, weekEnd]);

    const getTaskStyle = (date) => {
        const startHour = getHours(date);
        const startMin = getMinutes(date);

        // Position: top is proportional to time (hour * 60 + min)
        // Height: fixed for now (e.g., 60px for 1 hour block) or based on duration if we had it.
        // Assuming 1 hour slot height = 60px.
        const top = (startHour * 60 + startMin) * (60 / 60); // 1px per minute
        const height = 50; // default height for a task dot/block

        return {
            top: `${top}px`,
            height: `${height}px`,
            position: 'absolute',
            width: '90%',
            left: '5%',
        };
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[800px] relative">
            {/* Header (Days) */}
            <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 flex-none">
                <div className="p-4 border-r border-gray-200 w-16"></div> {/* Time axis header */}
                {weekDays.map((day) => (
                    <div
                        key={day.toString()}
                        className={`p-4 text-center font-semibold text-sm border-r border-gray-100 last:border-r-0 ${isToday(day) ? "text-[#2563FF] bg-blue-50" : "text-gray-600"
                            }`}
                    >
                        <div>{format(day, "EEE")}</div>
                        <div className={`text-xl ${isToday(day) && "bg-[#2563FF] text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1"}`}>
                            {format(day, "d")}
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid (Scrollable) */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="grid grid-cols-8 relative min-h-[1440px]"> {/* 24h * 60px/h = 1440px */}

                    {/* Time Axis */}
                    <div className="bg-white border-r border-gray-100 w-16 relative">
                        {hours.map((hour) => (
                            <div key={hour} className="absolute w-full text-right pr-2 text-xs text-gray-400 -mt-2.5" style={{ top: `${hour * 60}px` }}> {/* 60px per hour */}
                                {format(new Date().setHours(hour, 0), "h a")}
                            </div>
                        ))}
                        {/* Horizontal lines are easier to do as standard divs in the day/grid cols */}
                    </div>

                    {/* Days Columns */}
                    {weekDays.map((day) => (
                        <div key={day.toString()} className="relative border-r border-gray-100 last:border-r-0 bg-white">
                            {/* Hour Lines */}
                            {hours.map((hour) => (
                                <div key={hour} className="h-[60px] border-b border-gray-50 box-border w-full"></div>
                            ))}

                            {/* Tasks */}
                            {weekTodos.filter(t => isSameDay(new Date(t.due_date), day)).map(todo => (
                                <div
                                    key={todo.id}
                                    onClick={(e) => handleTaskClick(e, todo)}
                                    className={`rounded p-2 text-xs font-medium shadow-sm z-10 hover:z-20 cursor-pointer overflow-hidden ${todo.completed ? "bg-green-100 text-green-800 border border-green-200" : "bg-blue-100 text-blue-800 border border-blue-200"
                                        }`}
                                    style={getTaskStyle(new Date(todo.due_date))}
                                    title={`${todo.title} - ${format(new Date(todo.due_date), "h:mm a")}`}
                                >
                                    <div className="font-bold">{format(new Date(todo.due_date), "h:mm a")}</div>
                                    <div className="truncate">{todo.title}</div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* EDIT MODAL */}
            {selectedTask && (
                <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Edit Event</h3>
                            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={editDueDate}
                                    onChange={(e) => setEditDueDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            {selectedTask.group_name && (
                                <div className="text-xs text-blue-600 font-medium mb-4">{selectedTask.group_name}</div>
                            )}
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                                >
                                    <Trash2 size={16} />
                                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {updateMutation.isPending ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
