import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import { Task, Submission, User, Activity, ActivityType, Reminder, UserRole } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface AppContextType {
  tasks: Task[];
  submissions: Submission[];
  users: User[];
  activities: Activity[];
  reminders: Reminder[];
  currentUser: User | null;
  submitLink: (taskId: string, link: string) => Promise<void>;
  updateEngagement: (submissionId: string, likes: number, comments: number) => Promise<void>;
  addTask: (task: Omit<Task, "id">) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  logActivity: (taskId: string, type: ActivityType) => Promise<void>;
  addReminder: (taskId: string, remindAt: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authenticate & Fetch initial data
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let globalChannel: any;

    const setupListeners = () => {
      const fetchData = async () => {
        try {
          const [tasksRes, usersRes, subsRes, actsRes, remsRes] = await Promise.all([
            supabase.from('tasks').select('*').order('date', { ascending: false }),
            supabase.from('users').select('*'),
            supabase.from('submissions').select('*').order('submittedAt', { ascending: false }),
            supabase.from('activities').select('*').order('timestamp', { ascending: false }),
            supabase.from('reminders').select('*')
          ]);
          if (tasksRes.data) setTasks(tasksRes.data);
          if (usersRes.data) setUsers(usersRes.data);
          if (subsRes.data) setSubmissions(subsRes.data);
          if (actsRes.data) setActivities(actsRes.data);
          if (remsRes.data) setReminders(remsRes.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();

      globalChannel = supabase.channel(`public-db-${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, () => fetchData())
        .subscribe();
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.signInAnonymously();
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const uid = user.id;
          setupListeners();
          
          // Sync Telegram user
          const tgUser = WebApp.initDataUnsafe?.user;
          const adminId = import.meta.env.VITE_ADMIN_TELEGRAM_ID;
          const isUserAdmin = adminId && tgUser && tgUser.id.toString() === adminId;
          
          const { data: userSnap } = await supabase.from('users').select('*').eq('id', uid).single();
          
          if (userSnap) {
            const existingUser = userSnap as User;
            if (isUserAdmin && existingUser.role !== "ADMIN") {
              await supabase.from('users').update({ role: "ADMIN" }).eq('id', uid);
              setCurrentUser({ ...existingUser, role: "ADMIN" });
            } else {
              setCurrentUser(existingUser);
            }
          } else {
            const newUser = {
              id: uid,
              name: tgUser ? tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : "") : `User_${uid.substring(0,6)}`,
              username: tgUser?.username ? `@${tgUser.username}` : `@user_${tgUser?.id || uid.substring(0,6)}`,
              points: 0,
              role: isUserAdmin ? "ADMIN" : "USER",
            };
            await supabase.from('users').insert([newUser]);
            setCurrentUser(newUser as User);
          }
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Auth init failed", err);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (globalChannel) {
        supabase.removeChannel(globalChannel);
      }
    };
  }, []);

  const logActivity = async (taskId: string, type: ActivityType) => {
    if (!currentUser) return;
    const newActivity = {
      userId: currentUser.id,
      taskId,
      type,
      timestamp: new Date().toISOString()
    };
    try {
      await supabase.from('activities').insert([newActivity]);
    } catch (error) {
      console.error(error);
    }
  };

  const submitLink = async (taskId: string, link: string) => {
    if (!currentUser) return;
    
    const newSubmission = {
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      link,
      likes: 0,
      comments: 0,
      submittedAt: new Date().toISOString()
    };
    
    try {
      await supabase.from('submissions').insert([newSubmission]);
      logActivity(taskId, "SUBMIT_LINK");
    } catch (error) {
      console.error(error);
    }
  };

  const updateEngagement = async (submissionId: string, likes: number, comments: number) => {
    try {
      await supabase.from('submissions').update({ likes, comments }).eq('id', submissionId);
    } catch (error) {
      console.error(error);
    }
  };

  const addTask = async (task: Omit<Task, "id">) => {
    try {
      await supabase.from('tasks').insert([{
        ...task,
        createdAt: new Date().toISOString()
      }]);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await supabase.from('tasks').delete().eq('id', taskId);
    } catch (error) {
      console.error(error);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      await supabase.from('users').update({ role }).eq('id', userId);
    } catch (error) {
      console.error(error);
    }
  };

  const addReminder = async (taskId: string, remindAt: string) => {
    if (!currentUser || !isSupabaseConfigured) return;
    
    try {
      await supabase.from('reminders').insert([{
        taskId,
        userId: currentUser.id,
        remindAt,
        createdAt: new Date().toISOString()
      }]);
      
      const timeToNotify = new Date(remindAt).getTime() - Date.now();
      if (timeToNotify > 0 && timeToNotify < 86400000) {
        setTimeout(() => {
          if (WebApp?.showAlert) WebApp.showAlert(`Reminder: Your task is due soon!`);
          else alert(`Reminder: Your task is due soon!`);
        }, timeToNotify);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">Supabase Setup Required</h2>
          <p className="text-gray-700 mb-4">
            Please add the following variables to your project's environment variables:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2 mb-6">
            <li><code className="bg-gray-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code></li>
            <li><code className="bg-gray-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code></li>
          </ul>
          <p className="text-sm text-gray-500">
            You can find these in your Supabase project settings under API. Include them in the Settings menu and reload the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      tasks,
      submissions,
      users,
      activities,
      reminders,
      currentUser,
      submitLink,
      updateEngagement,
      addTask,
      deleteTask,
      logActivity,
      addReminder,
      updateUserRole,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

