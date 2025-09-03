from sqlalchemy.orm import Session
from app.models import models, schemas
from datetime import datetime, date

class WorkoutService:
    def __init__(self, db: Session):
        self.db = db

    async def get_or_create_today_workout(self, user_id: int) -> models.Workout:
        """Получить или создать тренировку на сегодня"""
        
        today = date.today()
        
        # Ищем тренировку на сегодня
        existing_workout = self.db.query(models.Workout).filter(
            models.Workout.user_id == user_id,
            models.Workout.date >= datetime.combine(today, datetime.min.time()),
            models.Workout.date < datetime.combine(today, datetime.max.time())
        ).first()
        
        if existing_workout:
            return existing_workout
        
        # Создаем новую тренировку
        workout = models.Workout(
            user_id=user_id,
            date=datetime.now(),
            name=f"Тренировка {today.strftime('%d.%m.%Y')}"
        )
        
        self.db.add(workout)
        self.db.commit()
        self.db.refresh(workout)
        
        return workout

    def get_recent_workouts(self, user_id: int, limit: int = 10) -> list:
        """Получить последние тренировки пользователя"""
        
        workouts = self.db.query(models.Workout).filter(
            models.Workout.user_id == user_id
        ).order_by(models.Workout.date.desc()).limit(limit).all()
        
        return workouts

    def calculate_workout_volume(self, workout_id: int) -> float:
        """Вычислить общий тоннаж тренировки"""
        
        logs = self.db.query(models.WorkoutLog).filter(
            models.WorkoutLog.workout_id == workout_id
        ).all()
        
        total_volume = 0.0
        for log in logs:
            if log.weight and log.sets and log.reps:
                total_volume += log.weight * log.sets * log.reps
        
        return total_volume