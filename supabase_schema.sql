-- Run this SQL in your Supabase SQL Editor to set up the tables required for this app

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- USERS
CREATE TABLE "users" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "username" text,
  "points" integer DEFAULT 0,
  "role" text DEFAULT 'USER',
  "createdAt" text
);

-- TASKS
CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "date" text NOT NULL,
  "time" text NOT NULL,
  "platform" text NOT NULL,
  "title" text NOT NULL,
  "instructions" text NOT NULL,
  "videoUrl" text,
  "createdAt" text
);

-- SUBMISSIONS
CREATE TABLE "submissions" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "taskId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "userName" text NOT NULL,
  "link" text NOT NULL,
  "likes" integer DEFAULT 0,
  "comments" integer DEFAULT 0,
  "submittedAt" text
);

-- ACTIVITIES
CREATE TABLE "activities" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "taskId" text NOT NULL,
  "type" text NOT NULL,
  "timestamp" text
);

-- REMINDERS
CREATE TABLE "reminders" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "taskId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "remindAt" text NOT NULL,
  "createdAt" text
);

-- Configure RLS Default Policies
-- Depending on your app needs, you may want more restrictive policies, but below is a starting point for an open setup during dev

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "users" FOR SELECT USING (true);
CREATE POLICY "Enable all access for anonymous" ON "users" FOR ALL USING (true);

ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "tasks" FOR SELECT USING (true);
CREATE POLICY "Enable all access for anonymous" ON "tasks" FOR ALL USING (true);

ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "submissions" FOR SELECT USING (true);
CREATE POLICY "Enable all access for anonymous" ON "submissions" FOR ALL USING (true);

ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "activities" FOR SELECT USING (true);
CREATE POLICY "Enable all access for anonymous" ON "activities" FOR ALL USING (true);

ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "reminders" FOR SELECT USING (true);
CREATE POLICY "Enable all access for anonymous" ON "reminders" FOR ALL USING (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE "users";
ALTER PUBLICATION supabase_realtime ADD TABLE "tasks";
ALTER PUBLICATION supabase_realtime ADD TABLE "submissions";
ALTER PUBLICATION supabase_realtime ADD TABLE "activities";
ALTER PUBLICATION supabase_realtime ADD TABLE "reminders";
