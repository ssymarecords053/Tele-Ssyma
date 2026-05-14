import React, { useState } from "react";
import { useAppContext } from "../store/AppContext";
import { isSameDay, startOfMonth, startOfWeek, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { safeFormat as format, safeParseISO as parseISO } from "../lib/utils";
import { Link } from "react-router-dom";
import { Clock, ExternalLink, Instagram, Target, List, Calendar as CalendarIconLucide, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { cn } from "../lib/utils";

export const SidebarIcon = ({ platform, className }: { platform: string; className?: string }) => {
  if (platform === "Instagram") {
    return <Instagram className={cn("w-5 h-5", className)} />;
  }
  if (platform === "TikTok") {
    return (
      <svg className={cn("w-5 h-5", className)} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
      </svg>
    );
  }
  return <Target className={cn("w-5 h-5", className)} />;
};

export const TasksPage = () => {
  const { tasks, submissions, currentUser, activities, deleteTask } = useAppContext();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const canAddTask = currentUser?.role === "ADMIN" || currentUser?.role === "CURATOR";
  const canDeleteTask = currentUser?.role === "ADMIN";

  // Group tasks by date
  const groupedTasks: Record<string, typeof tasks> = {};
  
  // Sort tasks by date then time
  const sortedTasks = [...tasks].filter(t => t && t.date).sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
    const timeB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
    return timeA - timeB;
  });

  sortedTasks.forEach((task) => {
    if (!groupedTasks[task.date]) groupedTasks[task.date] = [];
    groupedTasks[task.date].push(task);
  });

  // Get unique sorted dates
  const dates = Object.keys(groupedTasks).filter(d => {
    try {
      const parsed = parseISO(d);
      return !isNaN(parsed.getTime());
    } catch(e) { return false; }
  }).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const renderTaskCard = (task: typeof tasks[0]) => {
    const hasSubmitted = submissions.find(
      (s) => s.taskId === task.id && s.userId === currentUser?.id
    );
    const hasDownloaded = activities.some(
      a => a.taskId === task.id && a.userId === currentUser?.id && a.type === "DOWNLOAD_VIDEO"
    );

    return (
      <Link
        key={task.id}
        to={`/task/${task.id}`}
        className="block group relative bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="absolute top-4 right-4 flex gap-1.5 z-10">
          {(hasSubmitted && (!task.videoUrl || hasDownloaded)) ? (
             <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full text-green-700 border border-green-200 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
             </div>
          ) : (
            <>
              {task.videoUrl && (
                <div className={cn(
                  "flex items-center justify-center p-1.5 rounded-full transition-colors",
                  hasDownloaded ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                )}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={hasDownloaded ? 3 : 2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              )}
              {hasSubmitted && (
                 <div className="flex items-center justify-center p-1.5 bg-gray-100 rounded-full text-green-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                 </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-xl flex-shrink-0 mt-1",
            task.platform === 'Instagram' ? "bg-fuchsia-50 text-fuchsia-600" :
            task.platform === 'TikTok' ? "bg-zinc-100 text-zinc-900" :
            "bg-blue-50 text-blue-600"
          )}>
            <SidebarIcon platform={task.platform} />
          </div>
          
          <div className="flex-1 pr-6 pb-1">
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
             <Clock className="w-3.5 h-3.5" />
             {task.time} • {task.platform}
            </div>
            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{task.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed pr-6">{task.instructions}</p>
          </div>
        </div>
        {canDeleteTask && (
          <button
            onClick={(e) => {
              e.preventDefault();
              if (window.confirm("Are you sure you want to delete this task?")) {
                deleteTask(task.id);
              }
            }}
            className="absolute bottom-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </Link>
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

    // filter tasks for selected date
    const selectedDateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
    const tasksForSelected = selectedDateString ? groupedTasks[selectedDateString] || [] : [];

    return (
      <div className="space-y-6">
        <div className="bg-white text-gray-900 border border-gray-100 rounded-[32px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-medium tracking-wide">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="text-gray-400 hover:text-gray-900 transition p-2 -m-2">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={nextMonth} className="text-gray-400 hover:text-gray-900 transition p-2 -m-2">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4 text-center">
            {weekDays.map((day, i) => (
              <div key={i} className={cn(
                "text-[10px] font-bold mb-3 uppercase tracking-widest",
                i >= 5 ? "text-red-500/80" : "text-gray-500"
              )}>
                {day}
              </div>
            ))}
            
            {days.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const hasTasks = groupedTasks[dateKey] && groupedTasks[dateKey].length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isWeekend = i % 7 >= 5;

              return (
                <div
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className="relative py-2 flex flex-col items-center justify-center cursor-pointer group"
                >
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-2xl text-sm transition-all duration-200 z-10",
                    isSelected ? "bg-teal-500 text-white font-bold shadow-sm" : "border border-transparent",
                    !isCurrentMonth ? "text-gray-300" : (isWeekend ? (isSelected ? "text-white" : "text-red-500") : (isSelected ? "text-white" : "text-gray-900 font-medium")),
                    !isSelected && "hover:bg-gray-50"
                  )}>
                    {format(day, dateFormat)}
                  </div>
                  {hasTasks && (
                    <div className={cn(
                      "absolute bottom-0.5 w-6 h-[3px] rounded-full",
                      isSelected ? "bg-teal-200" : "bg-teal-400"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 px-1">
              {format(selectedDate, "EEEE, MMMM do")}
            </h3>
            
            {tasksForSelected.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 font-medium">No tasks for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasksForSelected.map(renderTaskCard)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-gray-50/50">
      {isTaskModalOpen && <CreateTaskModal onClose={() => setIsTaskModalOpen(false)} />}
      
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Content Calendar</h1>
          <p className="text-sm text-gray-500">Your upcoming collab tasks.</p>
        </div>
        
        <div className="flex flex-col gap-2 items-end">
          {canAddTask && (
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-700 transition mb-2"
            >
              <Plus className="w-3.5 h-3.5" /> New Task
            </button>
          )}
          <div className="flex items-center bg-gray-200/60 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded-lg transition-colors", viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode("calendar")}
               className={cn("p-1.5 rounded-lg transition-colors", viewMode === "calendar" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}
            >
              <CalendarIconLucide className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "calendar" ? renderCalendar() : (
        <div className="space-y-10">
          {dates.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <CalendarIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No tasks scheduled</p>
            </div>
          )}
          
          {dates.map((dateString) => {
            const date = parseISO(dateString);
            const formattedDate = format(date, "EEEE, MMMM do");
            const isToday = isSameDay(date, new Date());
            
            return (
              <div key={dateString} className="space-y-4">
                <div className="flex items-center gap-2 sticky top-0 bg-gray-50/90 backdrop-blur-md py-2 z-10 -mx-4 px-4">
                  <div className="w-1 h-5 bg-blue-500 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-800">
                    {isToday ? "Today, " : ""}{formattedDate}
                  </h2>
                  {isToday && (
                    <span className="px-2 py-0.5 ms-2 text-[10px] uppercase tracking-wider font-bold bg-blue-100 text-blue-700 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {groupedTasks[dateString].map(renderTaskCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Temp mock for calendar icon missing import
const CalendarIcon = ({className}: {className?: string}) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
