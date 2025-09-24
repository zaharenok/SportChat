import { redisDb, utils } from './redis-db'

export interface ChatSettings {
  id: string
  user_id: string
  show_suggestions: boolean
  show_next_workout_recommendation: boolean
  created_at: string
  updated_at: string
}

// Класс для работы с настройками чата
export const chatSettingsDb = {
  async getByUser(userId: string): Promise<ChatSettings | null> {
    console.log('🔍 Getting chat settings for user:', userId)
    const settings = await redisDb.readArray<ChatSettings>('chat_settings')
    const userSettings = settings.find(s => s.user_id === userId)
    console.log('⚙️ Retrieved chat settings:', userSettings)
    return userSettings || null
  },

  async getOrCreate(userId: string): Promise<ChatSettings> {
    console.log('🔍 Getting or creating chat settings for user:', userId)
    
    let userSettings = await this.getByUser(userId)
    
    if (!userSettings) {
      // Создаем настройки по умолчанию
      userSettings = {
        id: utils.generateId(),
        user_id: userId,
        show_suggestions: true,
        show_next_workout_recommendation: true,
        created_at: utils.getCurrentTimestamp(),
        updated_at: utils.getCurrentTimestamp()
      }
      
      const settings = await redisDb.readArray<ChatSettings>('chat_settings')
      settings.push(userSettings)
      await redisDb.writeArray('chat_settings', settings)
      
      console.log('✅ Default chat settings created:', userSettings)
    }
    
    return userSettings
  },

  async update(userId: string, updates: Partial<Omit<ChatSettings, 'id' | 'user_id' | 'created_at'>>): Promise<ChatSettings> {
    console.log('🔄 Updating chat settings for user:', userId, updates)
    
    const settings = await redisDb.readArray<ChatSettings>('chat_settings')
    const settingIndex = settings.findIndex(s => s.user_id === userId)
    
    if (settingIndex === -1) {
      throw new Error('Chat settings not found')
    }
    
    const updatedSettings = {
      ...settings[settingIndex],
      ...updates,
      updated_at: utils.getCurrentTimestamp()
    }
    
    settings[settingIndex] = updatedSettings
    await redisDb.writeArray('chat_settings', settings)
    
    console.log('✅ Chat settings updated:', updatedSettings)
    return updatedSettings
  }
}