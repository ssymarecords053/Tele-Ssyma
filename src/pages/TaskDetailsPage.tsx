import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import { useAppContext } from "../store/AppContext";
import { isValid } from "date-fns";
import { safeFormat as format, safeParseISO as parseISO, cn } from "../lib/utils";
import { ChevronLeft, Info, Link as LinkIcon, Send, Bell } from "lucide-react";
import { SidebarIcon } from "./TasksPage";

export const TaskDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, submissions, submitLink, currentUser, activities, logActivity, reminders, addReminder } = useAppContext();
  
  const [linkInput, setLinkInput] = useState("");
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  
  const task = tasks.find(t => t.id === id);
  const existingSubmission = submissions.find(
    s => s.taskId === id && s.userId === currentUser?.id
  );
  
  const hasDownloaded = activities.some(
    a => a.taskId === id && a.userId === currentUser?.id && a.type === "DOWNLOAD_VIDEO"
  );
  
  const [isDownloadingLocal, setIsDownloadingLocal] = useState(false);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const downloadTriggeredRef = useRef(false);

  const existingReminder = reminders.find(
    r => r.taskId === id && r.userId === currentUser?.id
  );

  if (!task) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold">Task not found</h2>
        <button onClick={() => navigate("/")} className="mt-4 text-blue-600 font-medium">Go back</button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkInput.trim() && currentUser) {
      submitLink(task.id, linkInput.trim());
    }
  };

  const handleSetReminder = (minutesBefore: number) => {
    let taskDateStr = `${task.date}T${task.time}:00`;
    let taskTime = new Date(taskDateStr).getTime();
    
    // Fallback if date is invalid 
    if (isNaN(taskTime)) {
        taskTime = Date.now() + 86400000; // Tomorrow
    }

    const remindTime = new Date(taskTime - minutesBefore * 60000);
    
    addReminder(task.id, remindTime.toISOString());
    setShowReminderOptions(false);
    
    if (WebApp?.showAlert) {
      WebApp.showAlert(`Reminder set for ${format(remindTime, "h:mm a")}`);
    } else {
      alert(`Reminder set for ${format(remindTime, "h:mm a")}`);
    }
  };

  const formattedDate = format(parseISO(task.date), "EEEE, MMMM do, yyyy");

  const isFullyCompleted = !!existingSubmission && (!task.videoUrl || hasDownloaded);

  const allSubmissionsForTask = submissions.filter(s => s.taskId === task.id);
  const totalLikes = allSubmissionsForTask.reduce((acc, sub) => acc + sub.likes, 0);
  const totalComments = allSubmissionsForTask.reduce((acc, sub) => acc + sub.comments, 0);

  return (
    <div className="pb-24 min-h-screen bg-gray-50/30">
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="font-semibold text-gray-900 tracking-tight">Task Details</div>
        </div>
        {isFullyCompleted && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full text-green-700 border border-green-200 shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 justify-between mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-700">
              <SidebarIcon platform={task.platform} className="w-4 h-4 text-gray-500" />
              {task.platform}
            </div>
            <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
              {task.time}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
            {task.title}
          </h1>
          
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 font-medium">
              {formattedDate}
            </p>
            {!existingReminder ? (
              <div className="relative">
                <button 
                  onClick={() => setShowReminderOptions(!showReminderOptions)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Remind Me
                </button>
                {showReminderOptions && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-200/50 p-2 z-30">
                    <button onClick={() => handleSetReminder(15)} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">15 minutes before</button>
                    <button onClick={() => handleSetReminder(60)} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">1 hour before</button>
                    <button onClick={() => handleSetReminder(1440)} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">1 day before</button>
                  </div>
                )}
              </div>
            ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold tracking-wider">
                  <Bell className="w-3.5 h-3.5" />
                  Reminder Set
                </div>
            )}
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-blue-900 mb-1">Instructions</h3>
                <p className="text-[15px] text-blue-800/80 leading-relaxed">
                  {task.instructions}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-center">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Total Likes</div>
              <div className="text-2xl font-bold text-gray-900">{totalLikes}</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-center">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Total Comments</div>
              <div className="text-2xl font-bold text-gray-900">{totalComments}</div>
            </div>
          </div>

          {task.videoUrl && (
            <div className="mt-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Attached Media</h3>
              <div className="aspect-video bg-black rounded-xl overflow-hidden relative mb-3">
                <video src={task.videoUrl} controls className="w-full h-full object-cover" />
              </div>
              <a
                href={task.videoUrl + (task.videoUrl.includes('?') ? '&' : '?') + 'download'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!hasDownloaded && !isDownloadingLocal && !downloadTriggeredRef.current) {
                    downloadTriggeredRef.current = true;
                    setIsDownloadingLocal(true);
                    logActivity(task.id, "DOWNLOAD_VIDEO").catch(console.error);
                  }
                  
                  if (WebApp?.initData) {
                    e.preventDefault();
                    try {
                      WebApp.showPopup({
                        title: 'Download Video',
                        message: 'For the best experience, please use the three dots (⋮) on the bottom right of the video player above and select "Download". If that doesn\'t work, we can open it in your browser.',
                        buttons: [
                          { id: 'browser', type: 'default', text: 'Open in Browser' },
                          { type: 'cancel', text: 'Got it' }
                        ]
                      }, (buttonId) => {
                        if (buttonId === 'browser') {
                          WebApp.openLink(task.videoUrl, { try_instant_view: false });
                        }
                      });
                    } catch (err) {
                      // Fallback if showPopup fails
                      WebApp.openLink(task.videoUrl, { try_instant_view: false });
                    }
                  }
                }}
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  hasDownloaded || isDownloadingLocal
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    : "bg-gray-900 text-white hover:bg-gray-800",
                  isSavingVideo && "opacity-75 cursor-wait"
                )}
              >
                {isSavingVideo ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : hasDownloaded || isDownloadingLocal ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Again
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Video for Telegram
                  </>
                )}
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-gray-400" />
            Submit Your Post
          </h2>
          
          {existingSubmission ? (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-green-900 mb-1">Post Submitted!</h3>
              <p className="text-sm text-green-700/80 mb-4 break-all px-2">
                {existingSubmission.link}
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-green-200/50">
                <div className="bg-white/60 rounded-xl py-2">
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-0.5">Likes</div>
                  <div className="text-xl font-bold text-green-900">{existingSubmission.likes || "-"}</div>
                </div>
                <div className="bg-white/60 rounded-xl py-2">
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-0.5">Comments</div>
                  <div className="text-xl font-bold text-green-900">{existingSubmission.comments || "-"}</div>
                </div>
              </div>
              {existingSubmission.likes === 0 && existingSubmission.comments === 0 && (
                <p className="text-xs text-green-700/60 mt-3 font-medium">Pending admin verification</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Post URL</label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder={`Paste your ${task.platform} link here...`}
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!linkInput.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-2 font-medium">
                  Submit the link so the admin can verify your engagement.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
