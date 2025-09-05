import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymxfraufvxprmxfwyvpa.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}