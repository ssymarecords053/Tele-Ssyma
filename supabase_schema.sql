-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  role TEXT DEFAULT 'USER'
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  "videoUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "taskId" UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "userName" TEXT NOT NULL,
  link TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "taskId" UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "taskId" UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "remindAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable realtime
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.reminders;
