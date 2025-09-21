"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Chat } from "@/components/Chat";
import { Dashboard } from "@/components/Dashboard";
import { LoginForm } from "@/components/LoginForm";
import { UserProfile } from "@/components/UserProfile";
import { WorkoutsList } from "@/components/WorkoutsList";
import { Achievements } from "@/components/Achievements";
import { ChatProvider } from "@/lib/chat-context";
import { Day, daysApi, utils } from "@/lib/client-api";

interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard" | "profile" | "workouts" | "achievements">("chat");
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Состояние для принудительного обновления данных в Dashboard
  const [dashboardUpdateTrigger, setDashboardUpdateTrigger] = useState(0);

  // Проверка аутентификации при загрузке
  useEffect(() => {
    checkAuth()
  }, [])

  // Автоматическое создание и переключение на сегодняшний день
  useEffect(() => {
    if (currentUser) {
      checkAndCreateTodayDay()
    }
  }, [currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    try {
      // Проверяем аутентификацию на сервере через cookies
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // Важно для отправки cookies
      })
      
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
        // Отмечаем в localStorage, что пользователь авторизован
        localStorage.setItem('auth_token', 'authenticated')
      } else {
        // Очищаем localStorage при ошибке аутентификации
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const checkAndCreateTodayDay = async () => {
    if (!currentUser) return
    
    try {
      const today = utils.getCurrentDate()
      console.log('Checking for today\'s day:', today)
      
      // Проверяем, существует ли день для сегодняшней даты
      const existingDay = await daysApi.getByDate(currentUser.id, today)
      
      if (existingDay) {
        // Если день существует, но не выбран, переключаемся на него
        if (!selectedDay || selectedDay.date !== today) {
          console.log('Switching to today\'s day:', existingDay)
          setSelectedDay(existingDay)
        }
      } else {
        // Если дня не существует, создаем новый
        console.log('Creating new day for today:', today)
        const newDay = await daysApi.create(currentUser.id, today)
        setSelectedDay(newDay)
      }
    } catch (error) {
      console.error('Error checking/creating today day:', error)
    }
  }

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    setSelectedDay(null)
  }

  const handleLogout = async () => {
    try {
      // Удаляем сессию на сервере
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Очищаем локальное состояние
      localStorage.removeItem('auth_token')
      setCurrentUser(null)
      setSelectedDay(null)
    }
  }

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser)
  }

  // Функция для обновления данных в дашборде после сохранения тренировки
  const handleWorkoutSaved = () => {
    console.log('🔄 Workout saved, triggering dashboard refresh')
    setDashboardUpdateTrigger(prev => prev + 1)
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
      />
    )
  }

  return (
    <ChatProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 px-4 py-4 overflow-hidden">
        {activeTab === "profile" ? (
          /* Полноэкранный профиль */
          <div className="max-w-2xl mx-auto h-full overflow-y-auto">
            <UserProfile 
              user={currentUser}
              onUserUpdate={handleUserUpdate}
              onLogout={handleLogout}
            />
          </div>
        ) : activeTab === "workouts" ? (
          /* Полноэкранный список тренировок */
          <WorkoutsList 
            selectedUser={currentUser}
            updateTrigger={dashboardUpdateTrigger}
          />
        ) : activeTab === "achievements" ? (
          /* Полноэкранные достижения */
          <div className="h-full overflow-y-auto">
            <Achievements selectedUser={currentUser} />
          </div>
        ) : (
          <>
            <div className="w-full h-full">
              {activeTab === "chat" ? (
                <Chat 
                  selectedDay={selectedDay} 
                  selectedUser={currentUser}
                  onWorkoutSaved={handleWorkoutSaved}
                />
              ) : (
                <div className="h-full max-w-7xl mx-auto overflow-y-auto">
                  <Dashboard 
                    selectedDay={selectedDay}
                    selectedUser={currentUser}
                    updateTrigger={dashboardUpdateTrigger}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
    </ChatProvider>
  );
}