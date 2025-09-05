from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Базовые схемы
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[int] = None
    experience_level: Optional[str] = "beginner"
    goals: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExerciseBase(BaseModel):
    name: str
    category: str
    muscle_groups: Optional[str] = None
    equipment: Optional[str] = None
    instructions: Optional[str] = None
    difficulty_level: Optional[str] = "beginner"

class ExerciseCreate(ExerciseBase):
    pass

class Exercise(ExerciseBase):
    id: int
    
    class Config:
        from_attributes = True

class WorkoutBase(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    duration_minutes: Optional[int] = None

class WorkoutCreate(WorkoutBase):
    user_id: int

class Workout(WorkoutBase):
    id: int
    user_id: int
    date: datetime
    
    class Config:
        from_attributes = True

class WorkoutLogBase(BaseModel):
    sets: int
    reps: Optional[int] = None
    weight: Optional[float] = None
    duration_seconds: Optional[int] = None
    distance_meters: Optional[float] = None
    rest_seconds: Optional[int] = None
    difficulty_rating: Optional[int] = None
    notes: Optional[str] = None

class WorkoutLogCreate(WorkoutLogBase):
    workout_id: int
    exercise_id: int

class WorkoutLog(WorkoutLogBase):
    id: int
    workout_id: int
    exercise_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    message: str
    is_user: bool = True

class ChatMessageCreate(ChatMessageBase):
    user_id: int
    parsed_data: Optional[str] = None
    context: Optional[str] = None

class ChatMessage(ChatMessageBase):
    id: int
    user_id: int
    timestamp: datetime
    parsed_data: Optional[str] = None
    context: Optional[str] = None
    
    class Config:
        from_attributes = True

# Схемы для ответов API
class ChatResponse(BaseModel):
    message: str
    workout_logged: bool = False
    suggestions: Optional[List[str]] = None
    next_workout_recommendation: Optional[str] = None
    
    # Новые поля для богатого отображения
    show_delayed_suggestions: bool = False
    show_delayed_recommendation: bool = False
    parsed_exercises_summary: Optional[str] = None
    
    # Поля для двухэтапной системы ответов
    has_delayed_content: bool = False
    thinking_message: Optional[str] = None

class EditMessageRequest(BaseModel):
    message: str

class EditMessageResponse(BaseModel):
    success: bool
    message: str
    ai_response: Optional[str] = None
    workout_updated: bool = False

class WorkoutSummary(BaseModel):
    workout: Workout
    exercises: List[dict]  # exercise name + stats
    total_volume: float  # общий тоннаж

# Схемы для целей
class UserGoalBase(BaseModel):
    type: str  # workouts, exercises, reps, weight_loss, muscle_gain
    target_value: float
    period: str = "month"  # week, month, year
    deadline: Optional[datetime] = None
    description: Optional[str] = None

class UserGoalCreate(UserGoalBase):
    pass

class UserGoalUpdate(BaseModel):
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class UserGoal(UserGoalBase):
    id: int
    user_id: int
    current_value: float
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class GoalProgress(BaseModel):
    goal: UserGoal
    progress_percentage: float
    status: str  # "not_started", "in_progress", "completed", "overdue"