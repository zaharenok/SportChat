"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Chat } from "@/components/Chat";
import { Dashboard } from "@/components/Dashboard";
import { DayManager } from "@/components/DayManager";
import { LoginForm } from "@/components/LoginForm";
import { UserProfile } from "@/components/UserProfile";
import { Day } from "@/lib/client-api";

interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard">("chat");
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Проверка аутентификации при загрузке
  useEffect(() => {
    checkAuth()
    loadAvailableUsers()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      } else {
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const users = await response.json()
        setAvailableUsers(users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    setSelectedDay(null)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setSelectedDay(null)
  }

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser)
  }

  // Показываем форму логина, если пользователь не аутентифицирован
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        availableUsers={availableUsers}
      />
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto p-4 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-140px)]">
          {/* Профиль пользователя */}
          <div className="xl:col-span-1">
            <div className="space-y-4">
              <UserProfile 
                user={currentUser}
                onUserUpdate={handleUserUpdate}
                onLogout={handleLogout}
              />
              
              <DayManager 
                selectedDay={selectedDay}
                selectedUser={currentUser}
                onDaySelect={setSelectedDay}
              />
            </div>
          </div>
          
          {/* Основной контент */}
          <div className="xl:col-span-4">
            {activeTab === "chat" ? (
              <Chat 
                selectedDay={selectedDay} 
                selectedUser={currentUser}
              />
            ) : (
              <Dashboard 
                selectedDay={selectedDay}
                selectedUser={currentUser}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
