'use client'

import { useState, useEffect } from 'react'
import { User, Users, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usersApi } from '@/lib/client-api'
import type { User as UserType } from '@/lib/client-api'

interface UserSelectorProps {
  selectedUser: UserType | null
  onUserSelect: (user: UserType) => void
}

export function UserSelector({ selectedUser, onUserSelect }: UserSelectorProps) {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')

  useEffect(() => {
    loadUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    try {
      const usersData = await usersApi.getAll()
      setUsers(usersData)
      
      // Автоматически выбираем первого пользователя если никого не выбрано
      if (!selectedUser && usersData.length > 0) {
        onUserSelect(usersData[0])
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return

    try {
      const newUser = await usersApi.create(newUserName, newUserEmail)
      setUsers([...users, newUser])
      setNewUserName('')
      setNewUserEmail('')
      setIsAddingUser(false)
      onUserSelect(newUser)
    } catch (error) {
      console.error('Ошибка создания пользователя:', error)
    }
  }

  const cancelAddUser = () => {
    setIsAddingUser(false)
    setNewUserName('')
    setNewUserEmail('')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-primary-200">
        <div className="flex items-center justify-center py-4">
          <div className="text-primary-600">Загрузка пользователей...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-primary-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Пользователи</h3>
        </div>
        
        {!isAddingUser ? (
          <button
            onClick={() => setIsAddingUser(true)}
            className="flex items-center space-x-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Добавить</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddUser}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={cancelAddUser}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddingUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-2"
          >
            <input
              type="text"
              placeholder="Имя пользователя"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {users.map((user) => (
          <motion.div
            key={user.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUserSelect(user)}
            className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
              selectedUser?.id === user.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              selectedUser?.id === user.id ? 'bg-primary-600' : 'bg-gray-300'
            }`}>
              <User className={`w-4 h-4 ${
                selectedUser?.id === user.id ? 'text-white' : 'text-gray-600'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>

            {selectedUser?.id === user.id && (
              <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
            )}
          </motion.div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Нет пользователей</p>
          <p className="text-sm">Добавьте первого пользователя</p>
        </div>
      )}
    </div>
  )
}