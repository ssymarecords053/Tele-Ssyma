import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Navigation } from './components/Navigation';
import { TasksPage } from './pages/TasksPage';
import { TaskDetailsPage } from './pages/TaskDetailsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  // Initialize Telegram Web App
  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        if (tg.ready) tg.ready();
        if (tg.expand) tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#F9FAFB');
      }
    } catch (e) {
      console.warn("Telegram WebApp error:", e);
    }
  }, []);

  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
          <Routes>
            <Route path="/" element={<TasksPage />} />
            <Route path="/task/:id" element={<TaskDetailsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
          <Navigation />
        </div>
      </Router>
    </AppProvider>
  );
}

