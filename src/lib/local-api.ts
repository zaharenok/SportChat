// Local API using localStorage for data persistence

export interface Day {
  id: string
  date: string
  created_at: string
  updated_at: string
}

export interface Workout {
  id: string
  day_id: string
  type: string
  duration: number
  exercises: string[]
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  day_id: string
  message: string
  is_user: boolean
  timestamp: string
  created_at: string
}

export interface Goal {
  id: string
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
  title: string
  description: string
  icon: string
  date: string
  created_at: string
}

// Utility functions
export const utils = {
  generateId: () => Math.random().toString(36).substr(2, 9),
  getCurrentDate: () => new Date().toISOString().split('T')[0],
  formatDate: (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'short'
    })
  },
  getCurrentTimestamp: () => new Date().toISOString()
}

// Local storage helpers
const getFromStorage = <T>(key: string, defaultValue: T[]): T[] => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = <T>(key: string, data: T[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

// Days API
export const daysApi = {
  async getAll(): Promise<Day[]> {
    const days = getFromStorage<Day>('sportchat_days', [])
    return days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  async getByDate(date: string): Promise<Day | null> {
    const days = getFromStorage<Day>('sportchat_days', [])
    return days.find(day => day.date === date) || null
  },

  async create(date: string): Promise<Day> {
    const days = getFromStorage<Day>('sportchat_days', [])
    
    // Check if day already exists
    if (days.find(day => day.date === date)) {
      throw new Error('День уже существует')
    }

    const newDay: Day = {
      id: utils.generateId(),
      date,
      created_at: utils.getCurrentTimestamp(),
      updated_at: utils.getCurrentTimestamp()
    }

    days.push(newDay)
    saveToStorage('sportchat_days', days)
    return newDay
  },

  async getOrCreate(date: string): Promise<Day> {
    const existingDay = await this.getByDate(date)
    if (existingDay) {
      return existingDay
    }
    return await this.create(date)
  },

  async delete(id: string): Promise<void> {
    const days = getFromStorage<Day>('sportchat_days', [])
    const filteredDays = days.filter(day => day.id !== id)
    saveToStorage('sportchat_days', filteredDays)

    // Also delete related data
    const workouts = getFromStorage<Workout>('sportchat_workouts', [])
    const filteredWorkouts = workouts.filter(workout => workout.day_id !== id)
    saveToStorage('sportchat_workouts', filteredWorkouts)

    const messages = getFromStorage<ChatMessage>('sportchat_messages', [])
    const filteredMessages = messages.filter(message => message.day_id !== id)
    saveToStorage('sportchat_messages', filteredMessages)
  }
}

// Chat API
export const chatApi = {
  async getByDay(dayId: string): Promise<ChatMessage[]> {
    const messages = getFromStorage<ChatMessage>('sportchat_messages', [])
    return messages
      .filter(msg => msg.day_id === dayId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  },

  async create(dayId: string, message: string, isUser: boolean): Promise<ChatMessage> {
    const messages = getFromStorage<ChatMessage>('sportchat_messages', [])
    
    const newMessage: ChatMessage = {
      id: utils.generateId(),
      day_id: dayId,
      message,
      is_user: isUser,
      timestamp: utils.getCurrentTimestamp(),
      created_at: utils.getCurrentTimestamp()
    }

    messages.push(newMessage)
    saveToStorage('sportchat_messages', messages)
    return newMessage
  }
}

// Workouts API
export const workoutsApi = {
  async getByDay(dayId: string): Promise<Workout[]> {
    const workouts = getFromStorage<Workout>('sportchat_workouts', [])
    return workouts.filter(workout => workout.day_id === dayId)
  },

  async delete(id: string): Promise<void> {
    const workouts = getFromStorage<Workout>('sportchat_workouts', [])
    const filteredWorkouts = workouts.filter(workout => workout.id !== id)
    saveToStorage('sportchat_workouts', filteredWorkouts)
  }
}

// Goals API with mock data
export const goalsApi = {
  async getAll(): Promise<Goal[]> {
    const goals = getFromStorage<Goal>('sportchat_goals', [])
    
    // If empty, initialize with default goals
    if (goals.length === 0) {
      const defaultGoals: Goal[] = [
        {
          id: utils.generateId(),
          title: 'Тренировки в неделю',
          current: 4,
          target: 5,
          unit: 'раз',
          progress: 80,
          created_at: utils.getCurrentTimestamp(),
          updated_at: utils.getCurrentTimestamp()
        },
        {
          id: utils.generateId(),
          title: 'Продолжительность тренировки',
          current: 52,
          target: 60,
          unit: 'мин',
          progress: 87,
          created_at: utils.getCurrentTimestamp(),
          updated_at: utils.getCurrentTimestamp()
        },
        {
          id: utils.generateId(),
          title: 'Калории за тренировку',
          current: 380,
          target: 450,
          unit: 'ккал',
          progress: 84,
          created_at: utils.getCurrentTimestamp(),
          updated_at: utils.getCurrentTimestamp()
        }
      ]
      saveToStorage('sportchat_goals', defaultGoals)
      return defaultGoals
    }
    
    return goals
  }
}

// Achievements API with mock data
export const achievementsApi = {
  async getAll(): Promise<Achievement[]> {
    const achievements = getFromStorage<Achievement>('sportchat_achievements', [])
    
    // If empty, initialize with default achievements
    if (achievements.length === 0) {
      const defaultAchievements: Achievement[] = [
        {
          id: utils.generateId(),
          title: 'Первая неделя',
          description: 'Выполнил 5 тренировок за неделю',
          icon: '🏆',
          date: '2024-01-10',
          created_at: utils.getCurrentTimestamp()
        },
        {
          id: utils.generateId(),
          title: 'Постоянство',
          description: '10 дней подряд без пропусков',
          icon: '🔥',
          date: '2024-01-08',
          created_at: utils.getCurrentTimestamp()
        },
        {
          id: utils.generateId(),
          title: 'Силач',
          description: 'Увеличил рабочий вес на 20%',
          icon: '💪',
          date: '2024-01-05',
          created_at: utils.getCurrentTimestamp()
        }
      ]
      saveToStorage('sportchat_achievements', defaultAchievements)
      return defaultAchievements
    }
    
    return achievements
  }
}