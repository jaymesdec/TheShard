import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid, Clock } from "lucide-react";
import useUser from "@/utils/useUser";
import WeekView from "./WeekView";
import DayView from "./DayView";

export default function CalendarPage() {
  const { data: user, loading: userLoading } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState("month"); // 'month' | 'week'

  // Fetch all todos
  const { data: todosData } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await fetch("/api/todos");
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const todos = todosData?.todos || [];

  // Fetch groups for the content creation modal
  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
    enabled: !!user,
  });

  const groups = groupsData?.groups || [];

  // Calculate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group todos by date
  const todosByDate = useMemo(() => {
    const grouped = {};
    todos.forEach((todo) => {
      if (todo.due_date) {
        const dateKey = format(new Date(todo.due_date), "yyyy-MM-dd");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(todo);
      }
    });
    return grouped;
  }, [todos]);

  // Add padding days for calendar grid
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array(firstDayOfWeek).fill(null);
  const calendarDays = [...paddingDays, ...daysInMonth];

  const handlePrev = () => {
    if (view === 'month') setCurrentMonth(subMonths(currentMonth, 1));
    else if (view === 'week') setCurrentMonth(subWeeks(currentMonth, 1));
    else setCurrentMonth(subDays(currentMonth, 1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentMonth(addMonths(currentMonth, 1));
    else if (view === 'week') setCurrentMonth(addWeeks(currentMonth, 1));
    else setCurrentMonth(addDays(currentMonth, 1));
  };

  const handleDayClick = (day) => {
    setCurrentMonth(day);
    setView('day');
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/account/signin";
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-inter">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[#2563FF] font-medium mb-4 hover:text-[#2E69DE]"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </a>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
              <p className="text-gray-600 mt-2">
                View all your tasks and deadlines
              </p>
            </div>

            {/* View Switcher and Navigation */}
            <div className="flex items-center gap-6">
              {/* View Toggle */}
              <div className="bg-white rounded-lg p-1 border border-gray-200 flex items-center">
                <button
                  onClick={() => setView("month")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${view === "month" ? "bg-blue-50 text-[#2563FF]" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <Grid size={16} />
                  Month
                </button>
                <button
                  onClick={() => setView("week")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${view === "week" ? "bg-blue-50 text-[#2563FF]" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <CalendarIcon size={16} />
                  Week
                </button>
                <button
                  onClick={() => setView("day")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${view === "day" ? "bg-blue-50 text-[#2563FF]" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <Clock size={16} />
                  Day
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-xl font-semibold text-gray-800 min-w-[200px] text-center">
                  {view === 'month' && format(currentMonth, "MMMM yyyy")}
                  {view === 'week' && `Week of ${format(currentMonth, "MMM d")}`}
                  {view === 'day' && format(currentMonth, "MMMM d, yyyy")}
                </div>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {view === 'month' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-4 text-center font-semibold text-gray-600 text-sm"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`padding-${index}`}
                      className="min-h-[120px] border-b border-r border-gray-100 bg-gray-50"
                    ></div>
                  );
                }

                const dateKey = format(day, "yyyy-MM-dd");
                const dayTodos = todosByDate[dateKey] || [];
                const isPastDay = day < new Date() && !isToday(day);

                return (
                  <div
                    key={day.toString()}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[120px] border-b border-r border-gray-100 p-3 cursor-pointer transition-colors hover:bg-blue-50 ${!isSameMonth(day, currentMonth) ? "bg-gray-50" : ""
                      } ${isToday(day) ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-semibold ${isToday(day)
                          ? "w-6 h-6 flex items-center justify-center rounded-full bg-[#2563FF] text-white"
                          : isSameMonth(day, currentMonth)
                            ? "text-gray-800"
                            : "text-gray-400"
                          }`}
                      >
                        {format(day, "d")}
                      </span>
                      {dayTodos.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {dayTodos.length} task{dayTodos.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayTodos.slice(0, 3).map((todo) => (
                        <div
                          key={todo.id}
                          className={`text-xs p-1.5 rounded ${todo.completed
                            ? "bg-green-100 text-green-800 line-through"
                            : isPastDay
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                            } truncate`}
                          title={todo.title}
                        >
                          {todo.title}
                        </div>
                      ))}
                      {dayTodos.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1.5">
                          +{dayTodos.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'week' && <WeekView currentDate={currentMonth} todos={todos} />}
        {view === 'day' && <DayView currentDate={currentMonth} todos={todos} groups={groups} />}

        {/* Legend */}
        {view === 'month' && (
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
              <span className="text-gray-600">Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
              <span className="text-gray-600">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
              <span className="text-gray-600">Completed</span>
            </div>
          </div>
        )}

        {/* Upcoming Tasks List */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {todos
              .filter(
                (todo) =>
                  !todo.completed &&
                  todo.due_date &&
                  new Date(todo.due_date) >= new Date(),
              )
              .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
              .slice(0, 10)
              .map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {todo.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {todo.group_name}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${new Date(todo.due_date).toDateString() ===
                      new Date().toDateString()
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {format(new Date(todo.due_date), "MMM d, yyyy")}
                  </div>
                </div>
              ))}
            {todos.filter(
              (todo) =>
                !todo.completed &&
                todo.due_date &&
                new Date(todo.due_date) >= new Date(),
            ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No upcoming deadlines
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
