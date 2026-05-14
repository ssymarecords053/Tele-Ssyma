import React from "react";
import { useAppContext } from "../store/AppContext";
import { User as UserIcon, Shield, Trophy, Download, Link as LinkIcon, ExternalLink } from "lucide-react";
import { cn, safeFormat as format, safeParseISO as parseISO } from "../lib/utils";
import { isSameDay } from "date-fns";
import { Link } from "react-router-dom";

export const ProfilePage = () => {
  const { currentUser, submissions, activities, tasks } = useAppContext();

  if (!currentUser) return null;

  const userSubs = submissions.filter(s => s.userId === currentUser.id);
  const totalPoints = currentUser.points + userSubs.reduce((acc, sub) => acc + (sub.likes * 1) + (sub.comments * 3), 0);

  const userActivities = activities
    .filter(a => a.userId === currentUser.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const groupedActivities: Record<string, typeof userActivities> = {};
  userActivities.forEach(a => {
    const d = a.timestamp.split("T")[0];
    if (!groupedActivities[d]) groupedActivities[d] = [];
    groupedActivities[d].push(a);
  });
  
  const activityDates = Object.keys(groupedActivities).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-gray-50/50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile</h1>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center mb-6 text-center">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <UserIcon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
        <p className="text-sm font-medium text-gray-500 mb-6">{currentUser.username}</p>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-gray-900">{totalPoints}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Total Pts</div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
             <div className="w-5 h-5 flex items-center justify-center text-blue-500 font-bold mx-auto mb-2">#</div>
            <div className="text-2xl font-black text-gray-900">{userSubs.length}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Posts</div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Activities</h3>
        
        {activityDates.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 font-medium">No recent activities</p>
          </div>
        ) : (
          activityDates.map((dateString) => {
            const date = parseISO(dateString);
            const formattedDate = format(date, "EEEE, MMMM do");
            const isToday = isSameDay(date, new Date());

            return (
              <div key={dateString} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gray-300 rounded-full" />
                  <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    {isToday ? "Today" : formattedDate}
                  </h4>
                </div>

                <div className="space-y-3">
                  {groupedActivities[dateString].map((activity) => {
                    const task = tasks.find(t => t.id === activity.taskId);
                    if (!task) return null;

                    const timeFormatted = format(parseISO(activity.timestamp), "h:mm a");

                    return (
                      <div key={activity.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5",
                           activity.type === "DOWNLOAD_VIDEO" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {activity.type === "DOWNLOAD_VIDEO" ? <Download className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 leading-snug">
                            {activity.type === "DOWNLOAD_VIDEO" ? (
                              <>Downloaded video for <span className="font-bold">{task.title}</span></>
                            ) : (
                              <>Submitted link for <span className="font-bold">{task.title}</span> ({task.platform})</>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 font-medium">{timeFormatted}</span>
                            <Link to={`/task/${task.id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                              View task <ExternalLink className="w-3 h-3 ml-0.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
