"use client";

import { MessageCircle, BarChart3, User, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: "chat" | "dashboard" | "profile" | "history";
  onTabChange: (tab: "chat" | "dashboard" | "profile" | "history") => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="bg-white border-b border-primary-200 px-4 py-3 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-bold text-primary-800">SportChat</h1>
        </div>
        
        <div className="flex bg-primary-100 rounded-lg p-1">
          <button
            onClick={() => onTabChange("chat")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === "chat"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-primary-600 hover:text-primary-800"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Чат</span>
          </button>
          <button
            onClick={() => onTabChange("dashboard")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === "dashboard"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-primary-600 hover:text-primary-800"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Дашборд</span>
          </button>
          <button
            onClick={() => onTabChange("profile")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === "profile"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-primary-600 hover:text-primary-800"
            )}
          >
            <User className="w-4 h-4" />
            <span>Профиль</span>
          </button>
          <button
            onClick={() => onTabChange("history")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === "history"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-primary-600 hover:text-primary-800"
            )}
          >
            <History className="w-4 h-4" />
            <span>История</span>
          </button>
        </div>
      </div>
    </div>
  );
}