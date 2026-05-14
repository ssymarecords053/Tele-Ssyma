import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import { Task, Submission, User, Activity, ActivityType, Reminder, UserRole } from "../types";
import { db, auth } from "../lib/firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, getDoc, where } from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // In production, you might report this to a dashboard instead of crashing
}

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
    let unsubTasks: () => void;
    let unsubUsers: () => void;
    let unsubSubs: () => void;
    let unsubActs: () => void;
    let unsubRems: () => void;

    const setupListeners = (uid: string) => {
      try {
        const qTasks = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
        unsubTasks = onSnapshot(qTasks, (snapshot) => {
          setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
        }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

        unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

        const qSubs = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
        unsubSubs = onSnapshot(qSubs, (snapshot) => {
          setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
        }, (error) => handleFirestoreError(error, OperationType.GET, 'submissions'));

        const qActs = query(collection(db, 'activities'), orderBy('timestamp', 'desc'));
        unsubActs = onSnapshot(qActs, (snapshot) => {
          setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
        }, (error) => handleFirestoreError(error, OperationType.GET, 'activities'));

        unsubRems = onSnapshot(query(collection(db, 'reminders'), where('userId', '==', uid)), (snapshot) => {
          setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder)));
        }, (error) => handleFirestoreError(error, OperationType.GET, 'reminders'));
      } catch (error) {
        console.error("Error setting up listeners:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        setupListeners(uid);
        
        // Sync Telegram user to Firebase
        const tgUser = WebApp.initDataUnsafe?.user;
        
        try {
          // @ts-ignore
          const adminId = import.meta.env.VITE_ADMIN_TELEGRAM_ID;
          const isUserAdmin = adminId && tgUser && tgUser.id.toString() === adminId;
          
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const existingUser = { id: userSnap.id, ...userSnap.data() } as User;
            if (isUserAdmin && existingUser.role !== "ADMIN") {
              const updatedRole = "ADMIN";
              await updateDoc(userRef, { role: updatedRole });
              setCurrentUser({ ...existingUser, role: updatedRole });
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
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newUser);
            setCurrentUser(newUser as User);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${uid}`);
        }
      } else {
        signInAnonymously(auth).catch(err => {
          console.error("Failed to sign in anonymously:", err);
          setIsLoading(false);
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubTasks) unsubTasks();
      if (unsubUsers) unsubUsers();
      if (unsubSubs) unsubSubs();
      if (unsubActs) unsubActs();
      if (unsubRems) unsubRems();
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
      const docRef = doc(collection(db, 'activities'));
      await setDoc(docRef, { id: docRef.id, ...newActivity });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'activities');
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
      const docRef = doc(collection(db, 'submissions'));
      await setDoc(docRef, { id: docRef.id, ...newSubmission });
      logActivity(taskId, "SUBMIT_LINK");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'submissions');
    }
  };

  const updateEngagement = async (submissionId: string, likes: number, comments: number) => {
    try {
      await updateDoc(doc(db, 'submissions', submissionId), { likes, comments });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${submissionId}`);
    }
  };

  const addTask = async (task: Omit<Task, "id">) => {
    try {
      const docRef = doc(collection(db, 'tasks'));
      await setDoc(docRef, {
        id: docRef.id,
        ...task,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const addReminder = async (taskId: string, remindAt: string) => {
    if (!currentUser) return;
    
    try {
      const docRef = doc(collection(db, 'reminders'));
      await setDoc(docRef, {
        id: docRef.id,
        taskId,
        userId: currentUser.id,
        remindAt,
        createdAt: new Date().toISOString()
      });
      
      const timeToNotify = new Date(remindAt).getTime() - Date.now();
      if (timeToNotify > 0 && timeToNotify < 86400000) {
        setTimeout(() => {
          if (WebApp?.showAlert) WebApp.showAlert(`Reminder: Your task is due soon!`);
          else alert(`Reminder: Your task is due soon!`);
        }, timeToNotify);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reminders');
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

