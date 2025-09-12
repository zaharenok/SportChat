import { supabase } from './supabase'
import type { Day, Workout, ChatMessage, Goal, Achievement } from './supabase'

// Re-export types for easier imports
export type { Day, Workout, ChatMessage, Goal, Achievement }

// Helper function to check if Supabase is configured
const isSupabaseConfigured = () => {
  if (!supabase) {
    console.warn('Supabase not configured - using mock mode');
    return false;
  }
  return true;
}

// Days API with fallbacks
export const daysApi = {
  async getAll(): Promise<Day[]> {
    if (!isSupabaseConfigured()) return [];
    
    try {
      const { data, error } = await supabase!
        .from('days')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching days:', error);
      return [];
    }
  },

  async getByDate(date: string): Promise<Day | null> {
    if (!isSupabaseConfigured()) return null;
    
    try {
      const { data, error } = await supabase!
        .from('days')
        .select('*')
        .eq('date', date)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('Error fetching day by date:', error);
      return null;
    }
  },

  async create(date: string): Promise<Day> {
    if (!isSupabaseConfigured()) {
      // Return mock day for demo
      return {
        id: Date.now().toString(),
        date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    const { data, error } = await supabase!
      .from('days')
      .insert({ date })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getOrCreate(date: string): Promise<Day> {
    let day = await this.getByDate(date)
    if (!day) {
      day = await this.create(date)
    }
    return day
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase!
      .from('days')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Chat API with fallbacks
export const chatApi = {
  async getByDay(dayId: string): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured()) return [];
    
    try {
      const { data, error } = await supabase!
        .from('chat_messages')
        .select('*')
        .eq('day_id', dayId)
        .order('timestamp', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  },

  async create(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    if (!isSupabaseConfigured()) {
      // Return mock message for demo
      return {
        id: Date.now().toString(),
        ...message,
        created_at: new Date().toISOString()
      };
    }
    
    const { data, error } = await supabase!
      .from('chat_messages')
      .insert(message)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async clearByDay(dayId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase!
      .from('chat_messages')
      .delete()
      .eq('day_id', dayId)
    
    if (error) throw error
  }
}

// Utility functions
export const utils = {
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0]
  },

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  },

  isSupabaseConfigured: isSupabaseConfigured
}