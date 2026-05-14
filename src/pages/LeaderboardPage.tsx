import React from "react";
import { useAppContext } from "../store/AppContext";
import { Trophy, Medal, Star } from "lucide-react";
import { cn } from "../lib/utils";
import { isSameMonth } from "date-fns";

export const LeaderboardPage = () => {
  const { users, submissions, activities, tasks } = useAppContext();

  const now = new Date();

  // Only consider tasks assigned in the current month
  const currentMonthTasks = tasks.filter(t => isSameMonth(new Date(t.date), now));
  const totalTasksThisMonth = currentMonthTasks.length;

  const userScores = users.map(user => {
    // Only current month submissions
    const userSubsThisMonth = submissions.filter(s => {
      const task = tasks.find(t => t.id === s.taskId);
      return s.userId === user.id && task && isSameMonth(new Date(task.date), now);
    });
    
    // Only current month downloads
    const userDownloadsThisMonth = activities.filter(a => {
      const task = tasks.find(t => t.id === a.taskId);
      return a.userId === user.id && a.type === "DOWNLOAD_VIDEO" && task && isSameMonth(new Date(task.date), now);
    });
    
    // Total completed for this month
    const completedTasksCount = userSubsThisMonth.filter(sub => {
      const task = tasks.find(t => t.id === sub.taskId);
      if (!task) return false;
      if (task.videoUrl) {
        return userDownloadsThisMonth.some(download => download.taskId === sub.taskId);
      }
      return true;
    }).length;

    const totalLikes = userSubsThisMonth.reduce((acc, sub) => acc + sub.likes, 0);
    const totalComments = userSubsThisMonth.reduce((acc, sub) => acc + sub.comments, 0);
    
    // Composite score based on tasks done, total likes, and total comments
    const score = (completedTasksCount * 100) + totalLikes + (totalComments * 3);

    return {
      ...user,
      completedTasks: completedTasksCount,
      likes: totalLikes,
      comments: totalComments,
      score,
    };
  }).sort((a, b) => b.score - a.score);

  const getRankStyle = (index: number) => {
    switch(index) {
      case 0: return { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200", icon: <Trophy className="w-5 h-5 text-yellow-500" /> };
      case 1: return { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: <Medal className="w-5 h-5 text-gray-400" /> };
      case 2: return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <Medal className="w-5 h-5 text-amber-600" /> };
      default: return { bg: "bg-white", text: "text-gray-500", border: "border-gray-100", icon: <span className="font-bold">{index + 1}</span> };
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-gray-50/50">
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-full mb-2">
          <Star className="w-8 h-8 fill-blue-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Top Collaborators</h1>
        <p className="text-sm text-gray-500 font-medium">Monthly performance rating</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[3rem_1fr_4rem] px-5 py-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest">
          <div className="text-center">Rank</div>
          <div>User</div>
          <div className="text-right">Score</div>
        </div>
        
        <div className="divide-y divide-gray-50">
          {userScores.map((user, index) => {
            const style = getRankStyle(index);
            
            return (
              <div 
                key={user.id} 
                className={cn(
                  "grid grid-cols-[3rem_1fr_4rem] items-center px-4 py-4 transition-colors hover:bg-gray-50",
                  index < 3 && "bg-white"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 mx-auto rounded-full border",
                  style.bg, style.text, style.border
                )}>
                  {style.icon}
                </div>
                
                <div className="pl-3 overflow-hidden">
                  <h3 className={cn(
                    "font-bold truncate",
                    index < 3 ? "text-gray-900 text-base" : "text-gray-700 text-sm"
                  )}>
                    {user.name}
                  </h3>
                  <p className="text-[11px] leading-tight text-gray-400 font-medium truncate mt-0.5">
                    {user.completedTasks}/{totalTasksThisMonth} Tasks • {user.likes} Likes • {user.comments} Comments
                  </p>
                </div>
                
                <div className={cn(
                  "text-right font-black font-mono",
                  index < 3 ? "text-blue-600 text-lg" : "text-gray-600 text-base"
                )}>
                  {user.score}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
