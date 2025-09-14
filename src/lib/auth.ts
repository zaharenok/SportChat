// Простая система аутентификации
import { usersDb } from './redis-db'
import { redis } from './redis'

export interface AuthSession {
  userId: string
  email: string
  name: string
  expiresAt: number
}

// Хранение сессий в Redis для serverless окружения
const SESSIONS_PREFIX = 'session:'

// Утилиты для работы с сессиями
export const authUtils = {
  generateSessionToken: () => Math.random().toString(36).substr(2, 32),
  
  createSession: async (userId: string): Promise<string> => {
    const user = await usersDb.getById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const token = authUtils.generateSessionToken()
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 дней

    const session: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt
    }

    // Сохраняем сессию в Redis с TTL 7 дней
    await redis.setex(`${SESSIONS_PREFIX}${token}`, 7 * 24 * 60 * 60, JSON.stringify(session))

    return token
  },

  getSession: async (token: string): Promise<AuthSession | null> => {
    try {
      const sessionData = await redis.get(`${SESSIONS_PREFIX}${token}`)
      if (!sessionData) return null

      const session: AuthSession = JSON.parse(sessionData as string)
      
      // Проверяем, не истекла ли сессия
      if (Date.now() > session.expiresAt) {
        await redis.del(`${SESSIONS_PREFIX}${token}`)
        return null
      }

      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  },

  deleteSession: async (token: string): Promise<void> => {
    try {
      await redis.del(`${SESSIONS_PREFIX}${token}`)
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  },

  // Очистка истекших сессий (Redis автоматически удаляет с TTL)
  cleanupExpiredSessions: async () => {
    // Redis автоматически удалит ключи с истекшим TTL
    // Эта функция оставлена для совместимости
  }
}

// В serverless окружении не используем setInterval
// Redis автоматически удаляет ключи с истекшим TTL

// Client-side утилиты
export const clientAuth = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
  },

  removeToken: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
  },

  isAuthenticated: (): boolean => {
    return clientAuth.getToken() !== null
  }
}