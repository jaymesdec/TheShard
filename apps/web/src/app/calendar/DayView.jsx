import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    format,
    startOfDay,
    endOfDay,
    eachHourOfInterval,
    isSameDay,
    getHours,
    getMinutes,
    addHours,
} from "date-fns";
import { Trash2, X } from "lucide-react";

export default function DayView({ currentDate, todos, groups }) {
    const queryClient = useQueryClient();
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // States for Modals
    const [selectedSlot, setSelectedSlot] = useState(null); // { date } for creating
    const [selectedTask, setSelectedTask] = useState(null); // todo object for editing

    // Form States
    const [title, setTitle] = useState("");
    const [groupId, setGroupId] = useState("personal");

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (newTodo) => {
            const response = await fetch("/api/todos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTodo),
            });
            if (!response.ok) throw new Error("Failed to create todo");
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
        }
    });

    const closeModals = () => {
        setSelectedSlot(null);
        setSelectedTask(null);
        setTitle("");
        setGroupId("personal");
    };

    const handleSlotClick = (hour) => {
        const date = new Date(currentDate);
        date.setHours(hour, 0, 0, 0);
        setSelectedSlot(date);
        setGroupId("personal");
    };

    const handleTaskClick = (e, todo) => {
        e.stopPropagation();
        setSelectedTask(todo);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!title) return;
        createMutation.mutate({
            title,
            groupId,
            dueDate: selectedSlot.toISOString(),
        });
    };

    const handleDelete = () => {
        if (!selectedTask) return;
        if (confirm("Are you sure you want to delete this task?")) {
            deleteMutation.mutate(selectedTask.id);
        }
    };

    // Filter tasks for this day
    const dayTodos = useMemo(() => {
        return todos.filter((todo) => {
            if (!todo.due_date) return false;
            const date = new Date(todo.due_date);
            return isSameDay(date, currentDate);
        });
    }, [todos, currentDate]);

    const getTaskStyle = (date) => {
        const startHour = getHours(date);
        const startMin = getMinutes(date);
        const top = (startHour * 60 + startMin) * (60 / 60);
        const height = 50;

        return {
            top: `${top}px`,
            height: `${height}px`,
            position: 'absolute',
            width: '95%',
            left: '2.5%',
        };
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[800px] relative">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-sm font-semibold text-gray-500 uppercase">{format(currentDate, "EEEE")}</div>
                    <div className="text-2xl font-bold text-gray-800">{format(currentDate, "d")}</div>
                </div>
            </div>

            {/* Grid (Scrollable) */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="flex relative min-h-[1440px]"> {/* 24h * 60px/h = 1440px */}

                    {/* Time Axis */}
                    <div className="bg-white border-r border-gray-100 w-20 relative flex-shrink-0">
                        {hours.map((hour) => (
                            <div key={hour} className="absolute w-full text-right pr-3 text-xs text-gray-400 -mt-2.5" style={{ top: `${hour * 60}px` }}>
                                {format(new Date().setHours(hour, 0), "h a")}
                            </div>
                        ))}
                    </div>

                    {/* Day Column */}
                    <div className="flex-1 relative bg-white">
                        {/* Hour Lines (Clickable Slots) */}
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                onClick={() => handleSlotClick(hour)}
                                className="h-[60px] border-b border-gray-50 box-border w-full hover:bg-gray-50 cursor-pointer transition-colors"
                                title={`Create task at ${format(new Date().setHours(hour, 0), "h a")}`}
                            ></div>
                        ))}

                        {/* Tasks */}
                        {dayTodos.map(todo => (
                            <div
                                key={todo.id}
                                onClick={(e) => handleTaskClick(e, todo)}
                                className={`rounded p-3 text-sm font-medium shadow-sm z-10 hover:z-20 cursor-pointer overflow-hidden border-l-4 ${todo.completed
                                        ? "bg-green-50 text-green-800 border-green-500"
                                        : "bg-blue-50 text-blue-800 border-blue-500"
                                    }`}
                                style={getTaskStyle(new Date(todo.due_date))}
                                title={`${todo.title} - ${format(new Date(todo.due_date), "h:mm a")}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{format(new Date(todo.due_date), "h:mm a")}</span>
                                    <span className="truncate">{todo.title}</span>
                                </div>
                                {todo.group_name && (
                                    <div className="text-xs opacity-75 mt-0.5 truncate">{todo.group_name}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CREATE MODAL */}
            {selectedSlot && (
                <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">New Event</h3>
                            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <div className="text-gray-900 font-medium">{format(selectedSlot, "PP p")}</div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What are you getting done?"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace</label>
                                <select
                                    value={groupId || 'personal'}
                                    onChange={(e) => setGroupId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="personal">Personal Workspace</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {createMutation.isPending ? "Creating..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW/EDIT MODAL */}
            {selectedTask && (
                <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-start items-start justify-between mb-4">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">{format(new Date(selectedTask.due_date), "PP p")}</div>
                                <h3 className="font-semibold text-lg text-gray-900 leading-tight">{selectedTask.title}</h3>
                                {selectedTask.group_name && <div className="text-xs text-blue-600 font-medium mt-1">{selectedTask.group_name}</div>}
                            </div>
                            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-gray-100">
                            <button
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
