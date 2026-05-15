import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import { Task, Submission, User, Activity, ActivityType, Reminder, UserRole } from "../types";
import { supabase } from "../lib/supabase";

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
  isSupabaseConfigured: boolean;
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

  // Check if supabase variables are available
  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Initialize and load data
  useEffect(() => {
    let tasksChannel: any;
    let usersChannel: any;
    let subsChannel: any;
    let actsChannel: any;
    let remsChannel: any;

    const loadData = async (uid: string) => {
      try {
        if (!isSupabaseConfigured) {
          setIsLoading(false);
          return;
        }

        const [tasksRes, usersRes, subsRes, actsRes, remsRes] = await Promise.all([
          supabase.from("tasks").select("*").order("createdAt", { ascending: false }),
          supabase.from("users").select("*"),
          supabase.from("submissions").select("*").order("submittedAt", { ascending: false }),
          supabase.from("activities").select("*").order("timestamp", { ascending: false }),
          supabase.from("reminders").select("*").eq("userId", uid)
        ]);

        if (tasksRes.data) setTasks(tasksRes.data as Task[]);
        if (usersRes.data) setUsers(usersRes.data as User[]);
        if (subsRes.data) setSubmissions(subsRes.data as Submission[]);
        if (actsRes.data) setActivities(actsRes.data as Activity[]);
        if (remsRes.data) setReminders(remsRes.data as Reminder[]);

        // Real-time subscriptions
        tasksChannel = supabase.channel('tasks_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
            if (payload.eventType === 'INSERT') setTasks(prev => [payload.new as Task, ...prev]);
            if (payload.eventType === 'DELETE') setTasks(prev => prev.filter(t => t.id !== payload.old.id));
            if (payload.eventType === 'UPDATE') setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
        }).subscribe();

        usersChannel = supabase.channel('users_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
            if (payload.eventType === 'INSERT') setUsers(prev => [payload.new as User, ...prev]);
            if (payload.eventType === 'UPDATE') setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new as User : u));
        }).subscribe();

        subsChannel = supabase.channel('subs_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, payload => {
            if (payload.eventType === 'INSERT') setSubmissions(prev => [payload.new as Submission, ...prev]);
            if (payload.eventType === 'UPDATE') setSubmissions(prev => prev.map(s => s.id === payload.new.id ? payload.new as Submission : s));
        }).subscribe();

        actsChannel = supabase.channel('acts_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, payload => {
            if (payload.eventType === 'INSERT') setActivities(prev => [payload.new as Activity, ...prev]);
        }).subscribe();
        
        remsChannel = supabase.channel('rems_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `userId=eq.${uid}` }, payload => {
            if (payload.eventType === 'INSERT') setReminders(prev => [payload.new as Reminder, ...prev]);
        }).subscribe();
        
      } catch (error) {
        console.error("Error loading data from Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const initAuth = async () => {
      // In a Telegram Mini App, we usually use the Telegram user ID as the auth method.
      // If Supabase allows arbitrary user ids, or if we use row-level-security with custom JWTs,
      // it would be more complex. For this application, we manage auth by recognizing the Telegram ID.
      const tgUser = WebApp.initDataUnsafe?.user;
      
      if (tgUser) {
        const uid = tgUser.id.toString();
        // @ts-ignore
        const adminId = import.meta.env.VITE_ADMIN_TELEGRAM_ID;
        const isUserAdmin = adminId && uid === adminId;

        if (isSupabaseConfigured) {
          try {
            // Check if user exists
            const { data: existingUser } = await supabase.from('users').select('*').eq('id', uid).single();
            
            if (existingUser) {
              if (isUserAdmin && existingUser.role !== "ADMIN") {
                const updatedRole = "ADMIN";
                await supabase.from('users').update({ role: updatedRole }).eq('id', uid);
                setCurrentUser({ ...existingUser, role: updatedRole } as User);
              } else {
                setCurrentUser(existingUser as User);
              }
            } else {
              const newUser = {
                id: uid,
                name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ""),
                username: tgUser.username ? `@${tgUser.username}` : `@user_${uid.substring(0,6)}`,
                points: 0,
                role: isUserAdmin ? "ADMIN" : "USER",
              };
              
              const { error: insertError } = await supabase.from('users').insert([newUser]);
              if (!insertError) {
                setCurrentUser(newUser as User);
              } else {
                console.error("Failed to create user", insertError);
                // Fallback for simple display if insert fails
                setCurrentUser(newUser as User);
              }
            }
          } catch (e) {
            console.error("Auth error", e);
          }
        } else {
           // Fallback state if supabase is not connected
           setCurrentUser({
            id: uid,
            name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ""),
            username: tgUser.username ? `@${tgUser.username}` : `@user_${uid.substring(0,6)}`,
            points: 0,
            role: isUserAdmin ? "ADMIN" : "USER"
          });
        }
        
        loadData(uid);
      } else {
        // Not inside telegram
        setCurrentUser(null);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (tasksChannel) supabase.removeChannel(tasksChannel);
      if (usersChannel) supabase.removeChannel(usersChannel);
      if (subsChannel) supabase.removeChannel(subsChannel);
      if (actsChannel) supabase.removeChannel(actsChannel);
      if (remsChannel) supabase.removeChannel(remsChannel);
    };
  }, [isSupabaseConfigured]);

  const logActivity = async (taskId: string, type: ActivityType) => {
    if (!currentUser || !isSupabaseConfigured) return;
    const newActivity = {
      userId: currentUser.id,
      taskId,
      type,
    };
    
    try {
      await supabase.from('activities').insert([newActivity]);
    } catch (error) {
      console.error(error);
    }
  };

  const submitLink = async (taskId: string, link: string) => {
    if (!currentUser || !isSupabaseConfigured) return;
    
    const newSubmission = {
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      link,
      likes: 0,
      comments: 0
    };
    
    try {
      await supabase.from('submissions').insert([newSubmission]);
      await logActivity(taskId, "SUBMIT_LINK");
    } catch (error) {
      console.error(error);
    }
  };

  const updateEngagement = async (submissionId: string, likes: number, comments: number) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('submissions').update({ likes, comments }).eq('id', submissionId);
    } catch (error) {
      console.error(error);
    }
  };

  const addTask = async (task: Omit<Task, "id">) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('tasks').insert([task]);
    } catch (error) {
        console.error(error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('tasks').delete().eq('id', taskId);
    } catch (error) {
      console.error(error);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    if (!isSupabaseConfigured) return;
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
        remindAt
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
      isLoading,
      isSupabaseConfigured
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

