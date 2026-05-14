import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Trophy, Settings, User } from "lucide-react";
import { useAppContext } from "../store/AppContext";
import { cn } from "../lib/utils";

export const Navigation = () => {
  const location = useLocation();
  const { currentUser } = useAppContext();
  const isAdmin = currentUser?.role === "ADMIN";

  const navItems = [
    { name: "Tasks", path: "/", icon: Calendar },
    { name: "Leader", path: "/leaderboard", icon: Trophy },
    ...(isAdmin ? [{ name: "Admin", path: "/admin", icon: Settings }] : []),
    { name: "Profile", path: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-40">
      <div className="flex justify-between items-center max-w-sm mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                           (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-colors duration-200",
                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300", 
                isActive && "bg-blue-50"
              )}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
