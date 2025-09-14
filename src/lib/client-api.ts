// Client-side API для работы с JSON базой данных

// Интерфейсы (экспортируем из redis-db теперь)
export type { User, Day, Workout, ChatMessage, Goal, Achievement, Exercise } from './redis-db'
import type { Day, Exercise } from './redis-db'

// Утилиты
export const utils = {
  getCurrentDate: () => new Date().toISOString().split('T')[0],
  formatDate: (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'short'
    })
  }
}

// API для пользователей
export const usersApi = {
  async getAll() {
    const response = await fetch('/api/users')
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    return response.json()
  },

  async create(name: string, email: string) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    })
    if (!response.ok) {
      throw new Error('Failed to create user')
    }
    return response.json()
  }
}

// API для дней
export const daysApi = {
  async getAll(userId: string) {
    const response = await fetch(`/api/days?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch days')
    }
    return response.json()
  },

  async getByDate(userId: string, date: string) {
    const days = await this.getAll(userId)
    return days.find((day: Day) => day.date === date) || null
  },

  async create(userId: string, date: string) {
    const response = await fetch('/api/days', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, date }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create day')
    }
    return response.json()
  },

  async getOrCreate(userId: string, date: string) {
    const existingDay = await this.getByDate(userId, date)
    if (existingDay) {
      return existingDay
    }
    return await this.create(userId, date)
  },

  async delete(dayId: string) {
    const response = await fetch(`/api/days?dayId=${dayId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete day')
    }
    return response.json()
  }
}

// API для чата
export const chatApi = {
  async getByDay(dayId: string) {
    const response = await fetch(`/api/chat?dayId=${dayId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch chat messages')
    }
    return response.json()
  },

  async create(userId: string, dayId: string, message: string, isUser: boolean) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, dayId, message, isUser }),
    })
    if (!response.ok) {
      throw new Error('Failed to create chat message')
    }
    return response.json()
  }
}

// API для тренировок
export const workoutsApi = {
  async getByUser(userId: string) {
    const response = await fetch(`/api/workouts?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch workouts')
    }
    return response.json()
  },

  async getByDay(userId: string, dayId: string) {
    const response = await fetch(`/api/workouts?userId=${userId}&dayId=${dayId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch workouts')
    }
    return response.json()
  },

  async create(userId: string, dayId: string, chatMessageId: string, exercises: Exercise[]) {
    const response = await fetch('/api/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, dayId, chatMessageId, exercises }),
    })
    if (!response.ok) {
      throw new Error('Failed to create workout')
    }
    return response.json()
  },

  async delete(workoutId: string) {
    const response = await fetch(`/api/workouts?workoutId=${workoutId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete workout')
    }
    return response.json()
  }
}

// API для целей
export const goalsApi = {
  async getAll(userId: string) {
    const response = await fetch(`/api/goals?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch goals')
    }
    return response.json()
  }
}

// API для достижений
export const achievementsApi = {
  async getAll(userId: string) {
    const response = await fetch(`/api/achievements?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch achievements')
    }
    return response.json()
  }
}