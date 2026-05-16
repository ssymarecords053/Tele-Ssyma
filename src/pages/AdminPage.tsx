import React, { useState } from "react";
import { useAppContext } from "../store/AppContext";
import { ExternalLink, Users, Save, CheckCircle2, ChevronDown, ShieldAlert, Key } from "lucide-react";
import { cn, safeFormat as format, safeParseISO as parseISO } from "../lib/utils";

export const AdminPage = () => {
  const { submissions, tasks, updateEngagement, users, updateUserRole, currentUser } = useAppContext();
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [likesInput, setLikesInput] = useState(0);
  const [commentsInput, setCommentsInput] = useState(0);
  const [activeTab, setActiveTab] = useState<"submissions" | "users" | "user-rankings">("submissions");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Filtering state
  const [taskSearch, setTaskSearch] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Group submissions by task
  const submissionsByTask = submissions.reduce((acc, sub) => {
    if (!acc[sub.taskId]) acc[sub.taskId] = [];
    acc[sub.taskId].push(sub);
    return acc;
  }, {} as Record<string, typeof submissions>);

  // Group submissions by user for rankings tab
  const submissionsByUser = submissions.reduce((acc, sub) => {
    if (!acc[sub.userId]) acc[sub.userId] = [];
    acc[sub.userId].push(sub);
    return acc;
  }, {} as Record<string, typeof submissions>);

  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  const filteredTasks = tasks.filter(task => {
    if (taskSearch && !task.title.toLowerCase().includes(taskSearch.toLowerCase())) return false;
    if (startDate && task.date < startDate) return false;
    if (endDate && task.date > endDate) return false;
    return true;
  });

  const hasRenderedTasks = filteredTasks.some(t => (submissionsByTask[t.id] || []).length > 0);

  const handleEditClick = (sub: any) => {
    setEditingSub(sub.id);
    setLikesInput(sub.likes);
    setCommentsInput(sub.comments);
  };

  const handleSave = (subId: string) => {
    updateEngagement(subId, likesInput, commentsInput);
    setEditingSub(null);
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-gray-50/50">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Area</h1>
          <p className="text-sm text-gray-500 font-medium">Verify submissions & input metrics</p>
        </div>
      </div>

      <div className="flex bg-gray-200/60 p-1 rounded-xl mb-6 overflow-x-auto">
        <button
          className={cn("flex-1 whitespace-nowrap px-3 py-1.5 text-sm font-bold rounded-lg transition-colors", activeTab === "submissions" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}
          onClick={() => setActiveTab("submissions")}
        >
          By Task
        </button>
        <button
          className={cn("flex-1 whitespace-nowrap px-3 py-1.5 text-sm font-bold rounded-lg transition-colors", activeTab === "user-rankings" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}
          onClick={() => { setActiveTab("user-rankings"); setSelectedUserId(null); }}
        >
          User Rankings
        </button>
        <button
          className={cn("flex-1 whitespace-nowrap px-3 py-1.5 text-sm font-bold rounded-lg transition-colors", activeTab === "users" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}
          onClick={() => setActiveTab("users")}
        >
          Roles
        </button>
      </div>

      {activeTab === "submissions" ? (
        <>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Filter Submissions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Task</label>
            <input
              type="text"
              placeholder="Search tasks..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredTasks.map(task => {
          const taskSubs = submissionsByTask[task.id] || [];
          if (taskSubs.length === 0) return null;

          return (
            <div key={task.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 leading-tight pr-4">{task.title}</h3>
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {task.platform}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {taskSubs.length} subs
                  </span>
                  <span>{format(parseISO(task.date), "MMM d, yyyy")}</span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {taskSubs.map(sub => {
                  const isEditing = editingSub === sub.id;

                  return (
                    <div key={sub.id} className="p-4 transition-colors hover:bg-gray-50/50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-bold text-sm text-gray-900">{sub.userName}</div>
                        <a 
                          href={sub.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          View Link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {isEditing ? (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 flex items-end gap-3 flex-wrap">
                          <div className="flex-1 w-full min-w-[100px]">
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Likes</label>
                            <input
                              type="number"
                              min="0"
                              value={likesInput}
                              onChange={e => setLikesInput(parseInt(e.target.value) || 0)}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1 w-full min-w-[100px]">
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Comments</label>
                            <input
                              type="number"
                              min="0"
                              value={commentsInput}
                              onChange={e => setCommentsInput(parseInt(e.target.value) || 0)}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex gap-2 w-full justify-end mt-2">
                            <button
                              onClick={() => handleSave(sub.id)}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 flex justify-center items-center flex-shrink-0 shadow-sm text-xs font-bold flex-1 max-w-[80px]"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between bg-gray-50 rounded-2xl p-3 border border-gray-100 cursor-pointer hover:border-gray-300 transition-colors group"
                          onClick={() => handleEditClick(sub)}
                        >
                          <div className="flex gap-4">
                            <div>
                              <div className="text-[10px] font-bold text-gray-400 leading-none mb-1 uppercase tracking-wider">LIKES</div>
                              <div className="text-sm font-bold text-gray-900 leading-none">{sub.likes}</div>
                            </div>
                            <div className="w-px h-6 bg-gray-200" />
                            <div>
                              <div className="text-[10px] font-bold text-gray-400 leading-none mb-1 uppercase tracking-wider">COMMENTS</div>
                              <div className="text-sm font-bold text-gray-900 leading-none">{sub.comments}</div>
                            </div>
                          </div>
                          <div className="text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Edit <ChevronDown className="w-3 h-3 -rotate-90" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!hasRenderedTasks && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">No submissions found.</p>
          </div>
        )}
        </div>
        </>
      ) : activeTab === "user-rankings" ? (
        <div className="space-y-4">
          {!selectedUserId ? (
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">User Rankings (A-Z)</h2>
              <div className="space-y-3">
                {sortedUsers.map(user => {
                  const userSubs = submissionsByUser[user.id] || [];
                  const totalLikes = userSubs.reduce((acc, sub) => acc + sub.likes, 0);
                  return (
                    <div 
                      key={user.id} 
                      onClick={() => setSelectedUserId(user.id)}
                      className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">@{user.username || "anonymous"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">{userSubs.length} links</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{totalLikes} total likes</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <button 
                  onClick={() => setSelectedUserId(null)}
                  className="text-sm font-bold text-gray-500 flex items-center gap-1 hover:text-gray-900"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" /> Back to Users
                </button>
              </div>
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">
                    {users.find(u => u.id === selectedUserId)?.name}'s Submissions
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {(submissionsByUser[selectedUserId] || [])
                    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                    .map(sub => {
                      const task = tasks.find(t => t.id === sub.taskId);
                      const isEditing = editingSub === sub.id;

                      return (
                        <div key={sub.id} className="p-4 transition-colors hover:bg-gray-50/50">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-bold text-sm text-gray-900">{task?.title || "Unknown Task"}</div>
                              <div className="text-xs text-gray-500 font-medium mt-0.5">
                                {format(parseISO(sub.submittedAt), "MMM d, yyyy h:mm a")}
                              </div>
                            </div>
                            <a 
                              href={sub.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              View Link <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {isEditing ? (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 flex items-end gap-3 flex-wrap">
                              <div className="flex-1 w-full min-w-[100px]">
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Likes</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={likesInput}
                                  onChange={e => setLikesInput(parseInt(e.target.value) || 0)}
                                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex-1 w-full min-w-[100px]">
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Comments</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={commentsInput}
                                  onChange={e => setCommentsInput(parseInt(e.target.value) || 0)}
                                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex gap-2 w-full justify-end mt-2">
                                <button
                                  onClick={() => handleSave(sub.id)}
                                  className="bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 flex justify-center items-center flex-shrink-0 shadow-sm text-xs font-bold flex-1 max-w-[80px]"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center justify-between bg-gray-50 rounded-2xl p-3 border border-gray-100 cursor-pointer hover:border-gray-300 transition-colors group"
                              onClick={() => handleEditClick(sub)}
                            >
                              <div className="flex gap-4">
                                <div>
                                  <div className="text-[10px] font-bold text-gray-400 leading-none mb-1 uppercase tracking-wider">LIKES</div>
                                  <div className="text-sm font-bold text-gray-900 leading-none">{sub.likes}</div>
                                </div>
                                <div className="w-px h-6 bg-gray-200" />
                                <div>
                                  <div className="text-[10px] font-bold text-gray-400 leading-none mb-1 uppercase tracking-wider">COMMENTS</div>
                                  <div className="text-sm font-bold text-gray-900 leading-none">{sub.comments}</div>
                                </div>
                              </div>
                              <div className="text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                Edit <ChevronDown className="w-3 h-3 -rotate-90" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  {(submissionsByUser[selectedUserId] || []).length === 0 && (
                    <div className="p-6 text-center text-gray-500 text-sm font-medium">
                      This user hasn't submitted any links yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Manage Roles</h2>
                <p className="text-xs text-gray-500 font-medium tracking-wide">GRANT CURATOR ACCESS</p>
              </div>
            </div>

            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/50">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{user.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role || "USER"}
                      onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                      disabled={user.id === currentUser?.id}
                      className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="USER">User</option>
                      <option value="CURATOR">Curator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
