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
  description?: string
  current_value: number
  target_value: number
  unit?: string
  category?: string
  due_date?: string
  is_completed?: boolean
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
      console.log(`🔍 Redis: Reading array from key '${key}'...`)
      const data = await redis.get(key)
      console.log(`🔍 Redis: Raw data for '${key}':`, data ? 'Data exists' : 'No data', typeof data)
      const result = data ? (Array.isArray(data) ? data : []) : []
      console.log(`🔍 Redis: Returning ${result.length} items for '${key}'`)
      return result
    } catch (error) {
      console.error(`❌ Redis: Error reading ${key}:`, error)
      console.error(`❌ Redis: Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      return []
    }
  },

  async writeArray<T>(key: string, data: T[]): Promise<void> {
    try {
      console.log(`✍️ Redis: Writing array to key '${key}' with ${data.length} items...`)
      await redis.set(key, data)
      console.log(`✅ Redis: Successfully wrote to '${key}'`)
    } catch (error) {
      console.error(`❌ Redis: Error writing ${key}:`, error)
      console.error(`❌ Redis: Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error', 
        stack: error instanceof Error ? error.stack : undefined
      })
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
    console.log('💾 DB: Getting workouts by user:', userId)
    const workouts = await redisDb.readArray<Workout>('workouts')
    console.log('💾 DB: Total workouts in database:', workouts.length)
    const userWorkouts = workouts.filter(workout => workout.user_id === userId)
    console.log('💾 DB: User workouts found:', userWorkouts.length)
    console.log('💾 DB: User workouts:', userWorkouts)
    return userWorkouts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async create(userId: string, dayId: string, chatMessageId: string, exercises: Exercise[]): Promise<Workout> {
    console.log('💾 DB: Creating workout in database:', { userId, dayId, chatMessageId, exercisesCount: exercises?.length })
    
    const workouts = await redisDb.readArray<Workout>('workouts')
    console.log('💾 DB: Current workouts count:', workouts.length)
    
    const newWorkout: Workout = {
      id: `workout-${utils.generateId()}`,
      user_id: userId,
      day_id: dayId,
      chat_message_id: chatMessageId,
      exercises,
      created_at: utils.getCurrentTimestamp(),
      updated_at: utils.getCurrentTimestamp()
    }

    console.log('💾 DB: New workout created:', newWorkout)
    
    workouts.push(newWorkout)
    await redisDb.writeArray('workouts', workouts)
    
    console.log('💾 DB: Total workouts after save:', workouts.length)
    return newWorkout
  },

  async update(id: string, updates: { exercises: Exercise[] }): Promise<Workout> {
    console.log('💾 DB: Updating workout:', id, 'with:', updates)
    
    const workouts = await redisDb.readArray<Workout>('workouts')
    const workoutIndex = workouts.findIndex(workout => workout.id === id)
    
    if (workoutIndex === -1) {
      throw new Error(`Workout with id ${id} not found`)
    }
    
    const updatedWorkout: Workout = {
      ...workouts[workoutIndex],
      ...updates,
      updated_at: utils.getCurrentTimestamp()
    }
    
    workouts[workoutIndex] = updatedWorkout
    await redisDb.writeArray('workouts', workouts)
    
    console.log('💾 DB: Workout updated successfully:', updatedWorkout)
    return updatedWorkout
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
  },

  async create(userId: string, goalData: {
    title: string
    description?: string
    targetValue: number
    currentValue?: number
    unit?: string
    category?: string
    dueDate?: string
  }): Promise<Goal> {
    const goal: Goal = {
      id: `goal-${utils.generateId()}`,
      user_id: userId,
      title: goalData.title,
      description: goalData.description || '',
      target_value: goalData.targetValue,
      current_value: goalData.currentValue || 0,
      unit: goalData.unit || '',
      category: goalData.category || 'fitness',
      created_at: utils.getCurrentTimestamp(),
      updated_at: utils.getCurrentTimestamp(),
      due_date: goalData.dueDate,
      is_completed: false
    }
    
    const goals = await redisDb.readArray<Goal>('goals')
    goals.push(goal)
    await redisDb.writeArray('goals', goals)
    return goal
  },

  async update(goalId: string, updates: Partial<{
    title: string
    description: string
    targetValue: number
    currentValue: number
    unit: string
    category: string
    dueDate: string
    isCompleted: boolean
  }>): Promise<Goal> {
    console.log('🎯 DB: Updating goal', goalId, 'with updates:', updates)
    
    const goals = await redisDb.readArray<Goal>('goals')
    console.log('🎯 DB: Found', goals.length, 'goals total')
    
    const goalIndex = goals.findIndex(g => g.id === goalId)
    console.log('🎯 DB: Goal index:', goalIndex)
    
    if (goalIndex === -1) {
      console.log('❌ DB: Goal not found with ID:', goalId)
      throw new Error('Goal not found')
    }
    
    const goal = goals[goalIndex]
    console.log('🎯 DB: Current goal:', { title: goal.title, current_value: goal.current_value, target_value: goal.target_value })
    
    if (updates.title !== undefined) goal.title = updates.title
    if (updates.description !== undefined) goal.description = updates.description
    if (updates.targetValue !== undefined) goal.target_value = updates.targetValue
    if (updates.currentValue !== undefined) {
      console.log('🎯 DB: Updating current_value from', goal.current_value, 'to', updates.currentValue)
      goal.current_value = updates.currentValue
    }
    if (updates.unit !== undefined) goal.unit = updates.unit
    if (updates.category !== undefined) goal.category = updates.category
    if (updates.dueDate !== undefined) goal.due_date = updates.dueDate
    if (updates.isCompleted !== undefined) goal.is_completed = updates.isCompleted
    
    goal.updated_at = utils.getCurrentTimestamp()
    
    goals[goalIndex] = goal
    console.log('🎯 DB: Updated goal:', { title: goal.title, current_value: goal.current_value, target_value: goal.target_value })
    
    await redisDb.writeArray('goals', goals)
    console.log('✅ DB: Goal saved to database successfully')
    
    return goal
  },

  async delete(goalId: string): Promise<void> {
    const goals = await redisDb.readArray<Goal>('goals')
    const filteredGoals = goals.filter(g => g.id !== goalId)
    
    if (filteredGoals.length === goals.length) {
      throw new Error('Goal not found')
    }
    
    await redisDb.writeArray('goals', filteredGoals)
  }
}

// API для достижений
export const achievementsDb = {
  async getByUser(userId: string): Promise<Achievement[]> {
    const achievements = await redisDb.readArray<Achievement>('achievements')
    return achievements.filter(achievement => achievement.user_id === userId)
  },

  async create(userId: string, title: string, description: string, icon: string = '🏆'): Promise<Achievement> {
    const achievement: Achievement = {
      id: utils.generateId(),
      user_id: userId,
      title,
      description,
      icon,
      date: utils.getCurrentDate(),
      created_at: utils.getCurrentTimestamp()
    }

    const achievements = await redisDb.readArray<Achievement>('achievements')
    achievements.push(achievement)
    await redisDb.writeArray('achievements', achievements)

    console.log('🏆 Achievement created:', achievement.title)
    return achievement
  }
}