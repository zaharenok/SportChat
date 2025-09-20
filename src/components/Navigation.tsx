"use client";

import { useState } from "react";
import { MessageCircle, BarChart3, User, Menu, X, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: "chat" | "dashboard" | "profile" | "workouts";
  onTabChange: (tab: "chat" | "dashboard" | "profile" | "workouts") => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: "chat", label: "Чат", icon: MessageCircle },
    { id: "dashboard", label: "Дашборд", icon: BarChart3 },
    { id: "workouts", label: "Последние тренировки", icon: Dumbbell },
    { id: "profile", label: "Профиль", icon: User }
  ] as const;

  const handleTabChange = (tab: typeof activeTab) => {
    onTabChange(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
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
          
          {/* Hamburger Button (всегда показываем) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />
            
            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--gradient-primary)' }}
                    >
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <h2 className="text-lg font-bold text-primary-800">SportChat</h2>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 p-4">
                  <nav className="space-y-2">
                    {menuItems.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => handleTabChange(id)}
                        className={cn(
                          "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left font-medium transition-all",
                          activeTab === id
                            ? "bg-primary-100 text-primary-700 border border-primary-200"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    SportChat - Ваш персональный тренер
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}