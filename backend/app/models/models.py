from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Профиль пользователя
    age = Column(Integer)
    weight = Column(Float)  # в кг
    height = Column(Integer)  # в см
    experience_level = Column(String(20), default="beginner")  # beginner, intermediate, advanced
    goals = Column(Text)  # JSON строка с целями
    
    # Связи
    workouts = relationship("Workout", back_populates="user")

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # strength, cardio, flexibility, etc.
    muscle_groups = Column(Text)  # JSON массив мышечных групп
    equipment = Column(String(100))  # equipment needed
    instructions = Column(Text)
    difficulty_level = Column(String(20), default="beginner")
    
    # Связи
    workout_logs = relationship("WorkoutLog", back_populates="exercise")

class Workout(Base):
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    name = Column(String(100))  # например "Push Day", "Legs", etc.
    notes = Column(Text)
    duration_minutes = Column(Integer)
    
    # Связи
    user = relationship("User", back_populates="workouts")
    workout_logs = relationship("WorkoutLog", back_populates="workout")

class WorkoutLog(Base):
    __tablename__ = "workout_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    
    # Данные выполнения
    sets = Column(Integer, nullable=False)
    reps = Column(Integer)  # может быть null для времени
    weight = Column(Float)  # в кг
    duration_seconds = Column(Integer)  # для кардио/планок
    distance_meters = Column(Float)  # для бега/велосипеда
    rest_seconds = Column(Integer)
    
    # Субъективные оценки
    difficulty_rating = Column(Integer)  # 1-10
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    workout = relationship("Workout", back_populates="workout_logs")
    exercise = relationship("Exercise", back_populates="workout_logs")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_user = Column(Boolean, default=True)  # True - от пользователя, False - от AI
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Метаданные для AI
    parsed_data = Column(Text)  # JSON с распарсенной информацией
    context = Column(Text)  # контекст для AI ответов

class UserGoal(Base):
    __tablename__ = "user_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)  # workouts, exercises, reps, weight_loss, muscle_gain
    target_value = Column(Float, nullable=False)  # целевое значение
    current_value = Column(Float, default=0.0)  # текущее значение
    period = Column(String(20), default="month")  # week, month, year
    created_at = Column(DateTime, default=datetime.utcnow)
    deadline = Column(DateTime)  # дедлайн для достижения цели
    is_active = Column(Boolean, default=True)
    description = Column(String(200))  # описание цели
    
    # Связи
    user = relationship("User", backref="user_goals")