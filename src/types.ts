export type Platform = "Instagram" | "TikTok";

export type ActivityType = "DOWNLOAD_VIDEO" | "SUBMIT_LINK";

export interface Activity {
  id: string;
  userId: string;
  taskId: string;
  type: ActivityType;
  timestamp: string; // ISO string 
}

export interface Task {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  time: string; // HH:MM
  platform: Platform;
  title: string;
  instructions: string;
  videoUrl?: string;
}

export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  link: string;
  likes: number;
  comments: number;
  submittedAt: string; // ISO string format
}

export interface Reminder {
  id: string;
  taskId: string;
  userId: string;
  remindAt: string; // ISO string
}

export type UserRole = "ADMIN" | "CURATOR" | "USER";

export interface User {
  id: string;
  name: string;
  username: string; // Telegram username
  points: number; // Derived from likes/comments
  role?: UserRole;
}
