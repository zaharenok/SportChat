'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Edit3, Check, X, LogOut, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AuthUser {
  id: string
  name: string
  email: string
  created_at: string
}

interface UserProfileProps {
  user: AuthUser
  onUserUpdate: (user: AuthUser) => void
  onLogout: () => void
}

export function UserProfile({ user, onUserUpdate, onLogout }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
  }, [user])

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Имя и email обязательны')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка обновления профиля')
      }

      const updatedUser = await response.json()
      onUserUpdate(updatedUser)
      setIsEditing(false)
      setSuccess('Профиль успешно обновлен!')
      
      // Убираем сообщение об успехе через 3 секунды
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления профиля'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setName(user.name)
    setEmail(user.email)
    setIsEditing(false)
    setError('')
  }

  const handleLogout = async () => {
    if (!confirm('Вы уверены, что хотите выйти?')) return

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('auth_token')
      onLogout()
    } catch (error) {
      console.error('Logout error:', error)
      // В любом случае выходим локально
      localStorage.removeItem('auth_token')
      onLogout()
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-primary-200">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-full">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Профиль пользователя</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Зарегистрирован {formatDate(user.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Редактировать профиль"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                title="Сохранить"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Отменить"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Имя пользователя
          </label>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              placeholder="Введите имя"
            />
          ) : (
            <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
              {user.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Email адрес
          </label>
          {isEditing ? (
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="Введите email"
              />
            </div>
          ) : (
            <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 flex items-center">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              {user.email}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600 text-xs sm:text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-green-600 text-xs sm:text-sm">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}