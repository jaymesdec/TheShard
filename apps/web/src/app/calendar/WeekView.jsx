import { useMemo } from "react";
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

export default function WeekView({ currentDate, todos }) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 24 }, (_, i) => i);

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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[800px]">
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
        </div>
    );
}
