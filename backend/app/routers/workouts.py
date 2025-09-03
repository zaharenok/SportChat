from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.models import schemas, models
from app.database.database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Workout])
async def get_workouts(
    user_id: int = 1,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Получить список тренировок пользователя"""
    
    workouts = db.query(models.Workout).filter(
        models.Workout.user_id == user_id
    ).order_by(models.Workout.date.desc()).offset(offset).limit(limit).all()
    
    return workouts

@router.get("/{workout_id}", response_model=schemas.WorkoutSummary)
async def get_workout(
    workout_id: int,
    db: Session = Depends(get_db)
):
    """Получить детали конкретной тренировки"""
    
    workout = db.query(models.Workout).filter(models.Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Тренировка не найдена")
    
    # Получаем упражнения из этой тренировки
    workout_logs = db.query(models.WorkoutLog).filter(
        models.WorkoutLog.workout_id == workout_id
    ).all()
    
    exercises = []
    total_volume = 0.0
    
    for log in workout_logs:
        exercise = db.query(models.Exercise).filter(models.Exercise.id == log.exercise_id).first()
        if exercise:
            volume = (log.weight or 0) * (log.sets or 1) * (log.reps or 1)
            total_volume += volume
            
            exercises.append({
                "exercise_name": exercise.name,
                "sets": log.sets,
                "reps": log.reps,
                "weight": log.weight,
                "notes": log.notes,
                "volume": volume
            })
    
    return schemas.WorkoutSummary(
        workout=workout,
        exercises=exercises,
        total_volume=total_volume
    )

@router.post("/", response_model=schemas.Workout)
async def create_workout(
    workout_data: schemas.WorkoutCreate,
    db: Session = Depends(get_db)
):
    """Создать новую тренировку"""
    
    workout = models.Workout(**workout_data.dict())
    db.add(workout)
    db.commit()
    db.refresh(workout)
    
    return workout

@router.post("/{workout_id}/exercises")
async def add_exercise_to_workout(
    workout_id: int,
    exercise_log: schemas.WorkoutLogCreate,
    db: Session = Depends(get_db)
):
    """Добавить упражнение к тренировке"""
    
    # Проверяем, что тренировка существует
    workout = db.query(models.Workout).filter(models.Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Тренировка не найдена")
    
    # Проверяем, что упражнение существует
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_log.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    
    # Создаем лог упражнения
    log_data = exercise_log.dict()
    log_data["workout_id"] = workout_id
    
    workout_log = models.WorkoutLog(**log_data)
    db.add(workout_log)
    db.commit()
    db.refresh(workout_log)
    
    return {"message": "Упражнение добавлено к тренировке", "workout_log": workout_log}

@router.get("/stats/{user_id}")
async def get_workout_stats(
    user_id: int = 1,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Получить статистику тренировок за период"""
    
    from datetime import timedelta
    start_date = datetime.now() - timedelta(days=days)
    
    # Общая статистика
    total_workouts = db.query(models.Workout).filter(
        models.Workout.user_id == user_id,
        models.Workout.date >= start_date
    ).count()
    
    # Общий объем (тоннаж)
    logs = db.query(models.WorkoutLog).join(models.Workout).filter(
        models.Workout.user_id == user_id,
        models.Workout.date >= start_date,
        models.WorkoutLog.weight.isnot(None),
        models.WorkoutLog.reps.isnot(None)
    ).all()
    
    total_volume = sum((log.weight or 0) * (log.sets or 1) * (log.reps or 1) for log in logs)
    
    # Наиболее частые упражнения
    exercise_counts = {}
    for log in logs:
        exercise = db.query(models.Exercise).filter(models.Exercise.id == log.exercise_id).first()
        if exercise:
            exercise_counts[exercise.name] = exercise_counts.get(exercise.name, 0) + 1
    
    top_exercises = sorted(exercise_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "period_days": days,
        "total_workouts": total_workouts,
        "total_volume_kg": round(total_volume, 2),
        "avg_workouts_per_week": round(total_workouts * 7 / days, 1),
        "top_exercises": [{"name": name, "count": count} for name, count in top_exercises]
    }