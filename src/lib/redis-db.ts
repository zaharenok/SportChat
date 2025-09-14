import { redis } from './redis'

// Интерфейсы данных (те же что и в json-db.ts)
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

export interface Exercise {
  name: string
  weight: number
  sets: number
  reps: number
}

export interface Workout {
  id: string
  user_id: string
  day_id: string
  chat_message_id: string
  exercises: Exercise[]
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

// Базовые операции с Redis
export const redisDb = {
  async readArray<T>(key: string): Promise<T[]> {
    try {
      const data = await redis.get(key)
      return data ? (Array.isArray(data) ? data : []) : []
    } catch (error) {
      console.error(`Error reading ${key}:`, error)
      return []
    }
  },

  async writeArray<T>(key: string, data: T[]): Promise<void> {
    try {
      await redis.set(key, data)
    } catch (error) {
      console.error(`Error writing ${key}:`, error)
      throw error
    }
  }
}

// API для пользователей
export const usersDb = {
  async getAll(): Promise<User[]> {
    return await redisDb.readArray<User>('users')
  },

  async getById(id: string): Promise<User | null> {
    const users = await this.getAll()
    return users.find(user => user.id === id) || null
  },

  async getByEmail(email: string): Promise<User | null> {
    const users = await this.getAll()
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null
  },

  async create(name: string, email: string): Promise<User> {
    const users = await this.getAll()
    
    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const newUser: User = {
      id: `user-${utils.generateId()}`,
      name,
      email: email.toLowerCase(),
      created_at: utils.getCurrentTimestamp()
    }
    users.push(newUser)
    await redisDb.writeArray('users', users)
    return newUser
  },

  async update(userId: string, name: string, email: string): Promise<User> {
    const users = await this.getAll()
    
    // Проверяем, что email не занят другим пользователем
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== userId)
    if (existingUser) {
      throw new Error('Email already taken')
    }

    // Обновляем пользователя
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, name, email: email.toLowerCase(), updated_at: utils.getCurrentTimestamp() }
        : user
    )

    await redisDb.writeArray('users', updatedUsers)
    
    // Возвращаем обновленного пользователя
    const updatedUser = updatedUsers.find(u => u.id === userId)
    if (!updatedUser) {
      throw new Error('User not found')
    }
    
    return updatedUser
  }
}

// API для дней
export const daysDb = {
  async getAll(): Promise<Day[]> {
    return await redisDb.readArray<Day>('days')
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
    await redisDb.writeArray('days', days)
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
    await redisDb.writeArray('days', filteredDays)

    // Также удаляем связанные данные
    const workouts = await redisDb.readArray<Workout>('workouts')
    const filteredWorkouts = workouts.filter(workout => workout.day_id !== id)
    await redisDb.writeArray('workouts', filteredWorkouts)

    const messages = await redisDb.readArray<ChatMessage>('chat_messages')
    const filteredMessages = messages.filter(message => message.day_id !== id)
    await redisDb.writeArray('chat_messages', filteredMessages)
  }
}

// API для сообщений чата
export const chatDb = {
  async getByDay(dayId: string): Promise<ChatMessage[]> {
    const messages = await redisDb.readArray<ChatMessage>('chat_messages')
    return messages
      .filter(msg => msg.day_id === dayId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  },

  async create(userId: string, dayId: string, message: string, isUser: boolean): Promise<ChatMessage> {
    const messages = await redisDb.readArray<ChatMessage>('chat_messages')
    
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
    await redisDb.writeArray('chat_messages', messages)
    return newMessage
  }
}

// API для тренировок
export const workoutsDb = {
  async getByDay(dayId: string): Promise<Workout[]> {
    const workouts = await redisDb.readArray<Workout>('workouts')
    return workouts
      .filter(workout => workout.day_id === dayId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  },

  async getByUser(userId: string): Promise<Workout[]> {
    const workouts = await redisDb.readArray<Workout>('workouts')
    return workouts
      .filter(workout => workout.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async create(userId: string, dayId: string, chatMessageId: string, exercises: Exercise[]): Promise<Workout> {
    const workouts = await redisDb.readArray<Workout>('workouts')
    
    const newWorkout: Workout = {
      id: `workout-${utils.generateId()}`,
      user_id: userId,
      day_id: dayId,
      chat_message_id: chatMessageId,
      exercises,
      created_at: utils.getCurrentTimestamp(),
      updated_at: utils.getCurrentTimestamp()
    }

    workouts.push(newWorkout)
    await redisDb.writeArray('workouts', workouts)
    return newWorkout
  },

  async delete(id: string): Promise<void> {
    const workouts = await redisDb.readArray<Workout>('workouts')
    const filteredWorkouts = workouts.filter(workout => workout.id !== id)
    await redisDb.writeArray('workouts', filteredWorkouts)
  }
}

// API для целей
export const goalsDb = {
  async getByUser(userId: string): Promise<Goal[]> {
    const goals = await redisDb.readArray<Goal>('goals')
    return goals.filter(goal => goal.user_id === userId)
  }
}

// API для достижений
export const achievementsDb = {
  async getByUser(userId: string): Promise<Achievement[]> {
    const achievements = await redisDb.readArray<Achievement>('achievements')
    return achievements.filter(achievement => achievement.user_id === userId)
  }
}