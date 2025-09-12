// Простая система аутентификации
import { usersDb } from './json-db'

export interface AuthSession {
  userId: string
  email: string
  name: string
  expiresAt: number
}

// Простое хранение сессий в памяти (в продакшене использовать Redis/база данных)
const sessions = new Map<string, AuthSession>()

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

    sessions.set(token, {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt
    })

    return token
  },

  getSession: (token: string): AuthSession | null => {
    const session = sessions.get(token)
    if (!session) return null

    // Проверяем, не истекла ли сессия
    if (Date.now() > session.expiresAt) {
      sessions.delete(token)
      return null
    }

    return session
  },

  deleteSession: (token: string): void => {
    sessions.delete(token)
  },

  // Очистка истекших сессий
  cleanupExpiredSessions: () => {
    const now = Date.now()
    for (const [token, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        sessions.delete(token)
      }
    }
  }
}

// Запускаем очистку каждый час
setInterval(authUtils.cleanupExpiredSessions, 60 * 60 * 1000)

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