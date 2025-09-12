import { createClient } from '@supabase/supabase-js'

// Check if Supabase is properly configured
const isConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Only create client if proper env vars are set
export const supabase = isConfigured 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : null

// Types for our database tables
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