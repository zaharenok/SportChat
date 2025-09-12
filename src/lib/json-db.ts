import fs from 'fs/promises'
import path from 'path'

// Интерфейсы данных
export interface User {
  id: string
  name: string
  email: string
  created_at: string
  updated_at?: string
}

export interface Day {
  id: string
  user_id: string
  date: string
  created_at: string
  updated_at: string
}

export interface Workout {
  id: string
  user_id: string
  day_id: string
  type: string
  duration: number
  exercises: string[]
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  day_id: string
  message: string
  is_user: boolean
  timestamp: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  current: number
  target: number
  unit: string
  progress: number
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  user_id: string
  title: string
  description: string
  icon: string
  date: string
  created_at: string
}

// Утилиты
export const utils = {
  generateId: () => Math.random().toString(36).substr(2, 9),
  getCurrentDate: () => new Date().toISOString().split('T')[0],
  getCurrentTimestamp: () => new Date().toISOString(),
  formatDate: (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'short'
    })
  }
}

// Базовые операции с файлами
const DB_PATH = path.join(process.cwd(), 'data', 'db')

export const fileDb = {
  async readFile<T>(filename: string): Promise<T[]> {
    try {
      const filePath = path.join(DB_PATH, filename)
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error(`Error reading ${filename}:`, error)
      return []
    }
  },

  async writeFile<T>(filename: string, data: T[]): Promise<void> {
    try {
      const filePath = path.join(DB_PATH, filename)
      await fs.mkdir(DB_PATH, { recursive: true })
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.error(`Error writing ${filename}:`, error)
      throw error
    }
  }
}

// API для пользователей
export const usersDb = {
  async getAll(): Promise<User[]> {
    return await fileDb.readFile<User>('users.json')
  },

  async getById(id: string): Promise<User | null> {
    const users = await this.getAll()
    return users.find(user => user.id === id) || null
  },

  async create(name: string, email: string): Promise<User> {
    const users = await this.getAll()
    const newUser: User = {
      id: `user-${utils.generateId()}`,
      name,
      email,
      created_at: utils.getCurrentTimestamp()
    }
    users.push(newUser)
    await fileDb.writeFile('users.json', users)
    return newUser
  }
}

// API для дней
export const daysDb = {
  async getAll(): Promise<Day[]> {
    return await fileDb.readFile<Day>('days.json')
  },

  async getByUser(userId: string): Promise<Day[]> {
    const days = await this.getAll()
    return days
      .filter(day => day.user_id === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  async getByDate(userId: string, date: string): Promise<Day | null> {
    const days = await this.getAll()
    return days.find(day => day.user_id === userId && day.date === date) || null
  },

  async create(userId: string, date: string): Promise<Day> {
    const days = await this.getAll()
    
    // Проверяем, существует ли уже день с такой датой для этого пользователя
    const existingDay = days.find(day => day.user_id === userId && day.date === date)
    if (existingDay) {
      throw new Error('День уже существует')
    }

    const newDay: Day = {
      id: `day-${utils.generateId()}`,
      user_id: userId,
      date,
      created_at: utils.getCurrentTimestamp(),
      updated_at: utils.getCurrentTimestamp()
    }

    days.push(newDay)
    await fileDb.writeFile('days.json', days)
    return newDay
  },

  async getOrCreate(userId: string, date: string): Promise<Day> {
    const existingDay = await this.getByDate(userId, date)
    if (existingDay) {
      return existingDay
    }
    return await this.create(userId, date)
  },

  async delete(id: string): Promise<void> {
    const days = await this.getAll()
    const filteredDays = days.filter(day => day.id !== id)
    await fileDb.writeFile('days.json', filteredDays)

    // Также удаляем связанные данные
    const workouts = await fileDb.readFile<Workout>('workouts.json')
    const filteredWorkouts = workouts.filter(workout => workout.day_id !== id)
    await fileDb.writeFile('workouts.json', filteredWorkouts)

    const messages = await fileDb.readFile<ChatMessage>('chat_messages.json')
    const filteredMessages = messages.filter(message => message.day_id !== id)
    await fileDb.writeFile('chat_messages.json', filteredMessages)
  }
}

// API для сообщений чата
export const chatDb = {
  async getByDay(dayId: string): Promise<ChatMessage[]> {
    const messages = await fileDb.readFile<ChatMessage>('chat_messages.json')
    return messages
      .filter(msg => msg.day_id === dayId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  },

  async create(userId: string, dayId: string, message: string, isUser: boolean): Promise<ChatMessage> {
    const messages = await fileDb.readFile<ChatMessage>('chat_messages.json')
    
    const newMessage: ChatMessage = {
      id: `msg-${utils.generateId()}`,
      user_id: userId,
      day_id: dayId,
      message,
      is_user: isUser,
      timestamp: utils.getCurrentTimestamp(),
      created_at: utils.getCurrentTimestamp()
    }

    messages.push(newMessage)
    await fileDb.writeFile('chat_messages.json', messages)
    return newMessage
  }
}

// API для тренировок
export const workoutsDb = {
  async getByDay(dayId: string): Promise<Workout[]> {
    const workouts = await fileDb.readFile<Workout>('workouts.json')
    return workouts.filter(workout => workout.day_id === dayId)
  },

  async delete(id: string): Promise<void> {
    const workouts = await fileDb.readFile<Workout>('workouts.json')
    const filteredWorkouts = workouts.filter(workout => workout.id !== id)
    await fileDb.writeFile('workouts.json', filteredWorkouts)
  }
}

// API для целей
export const goalsDb = {
  async getByUser(userId: string): Promise<Goal[]> {
    const goals = await fileDb.readFile<Goal>('goals.json')
    return goals.filter(goal => goal.user_id === userId)
  }
}

// API для достижений
export const achievementsDb = {
  async getByUser(userId: string): Promise<Achievement[]> {
    const achievements = await fileDb.readFile<Achievement>('achievements.json')
    return achievements.filter(achievement => achievement.user_id === userId)
  }
}