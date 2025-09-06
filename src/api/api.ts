import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  is_user: boolean;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  workout_logged: boolean;
  suggestions?: string[];
  next_workout_recommendation?: string;
  show_delayed_suggestions?: boolean;
  show_delayed_recommendation?: boolean;
  parsed_exercises_summary?: string;
  has_delayed_content?: boolean;
  thinking_message?: string;
}

export interface EditMessageResponse {
  success: boolean;
  message: string;
  ai_response?: string;
  workout_updated?: boolean;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_groups?: string;
  equipment?: string;
  instructions?: string;
  difficulty_level?: string;
}

export interface Workout {
  id: number;
  user_id: number;
  date: string;
  name?: string;
  notes?: string;
  duration_minutes?: number;
}

export interface WorkoutSummary {
  workout: Workout;
  exercises: Array<{
    exercise_name: string;
    sets: number;
    reps?: number;
    weight?: number;
    notes?: string;
    volume: number;
  }>;
  total_volume: number;
}

// API functions
export const chatApi = {
  sendMessage: (message: string, userId: number = 1): Promise<ChatResponse> =>
    api.post('/chat/message', null, { 
      params: { message, user_id: userId } 
    }).then(res => res.data),

  getChatHistory: (userId: number = 1, limit: number = 50): Promise<ChatMessage[]> =>
    api.get(`/chat/history/${userId}`, { params: { limit } }).then(res => res.data),

  clearChatHistory: (userId: number = 1): Promise<{ message: string }> =>
    api.delete(`/chat/history/${userId}`).then(res => res.data),

  editMessage: (messageId: number, newText: string): Promise<EditMessageResponse> =>
    api.put(`/chat/message/${messageId}`, { message: newText }).then(res => res.data),
};

export interface CalendarWorkout {
  date: string;
  exercises: string[];
  emoji: string;
  intensity: number;
  duration: number;
  notes: string;
  total_volume: number;
}

export interface CalendarData {
  year: number;
  month: number;
  workouts: CalendarWorkout[];
}

export interface WorkoutDayUpdate {
  exercises?: string[];
  emoji?: string;
  intensity?: number;
  duration?: number;
  notes?: string;
}

export const workoutApi = {
  getWorkouts: (userId: number = 1, limit: number = 20, offset: number = 0): Promise<Workout[]> =>
    api.get('/workouts/', { params: { user_id: userId, limit, offset } }).then(res => res.data),

  getWorkout: (workoutId: number): Promise<WorkoutSummary> =>
    api.get(`/workouts/${workoutId}`).then(res => res.data),

  getWorkoutStats: (userId: number = 1, days: number = 30) =>
    api.get(`/workouts/stats/${userId}`, { params: { days } }).then(res => res.data),

  getCalendarData: (userId: number = 1, year?: number, month?: number): Promise<CalendarData> =>
    api.get(`/workouts/calendar/${userId}`, { params: { year, month } }).then(res => res.data),

  updateCalendarDay: (userId: number = 1, dateStr: string, workoutData?: WorkoutDayUpdate): Promise<{message: string, workout_id?: number, date: string}> =>
    api.put(`/workouts/calendar/${userId}/date/${dateStr}`, workoutData).then(res => res.data),

  deleteCalendarDay: (userId: number = 1, dateStr: string): Promise<{message: string}> =>
    api.put(`/workouts/calendar/${userId}/date/${dateStr}`, null).then(res => res.data),
};

export const exerciseApi = {
  getExercises: (params?: {
    category?: string;
    muscle_group?: string;
    equipment?: string;
    difficulty?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Exercise[]> =>
    api.get('/exercises/', { params }).then(res => res.data),

  searchExercises: (query: string, limit: number = 20) =>
    api.get(`/exercises/search/${query}`, { params: { limit } }).then(res => res.data),

  getCategories: (): Promise<string[]> =>
    api.get('/exercises/categories/').then(res => res.data),

  getEquipmentTypes: (): Promise<string[]> =>
    api.get('/exercises/equipment/').then(res => res.data),
};

export default api;