from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import schemas, models
from app.database.database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Exercise])
async def get_exercises(
    category: Optional[str] = None,
    muscle_group: Optional[str] = None,
    equipment: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Получить список упражнений с фильтрами"""
    
    query = db.query(models.Exercise)
    
    # Применяем фильтры
    if category:
        query = query.filter(models.Exercise.category == category)
    
    if equipment:
        query = query.filter(models.Exercise.equipment == equipment)
        
    if difficulty:
        query = query.filter(models.Exercise.difficulty_level == difficulty)
    
    if muscle_group:
        query = query.filter(models.Exercise.muscle_groups.contains(muscle_group))
    
    if search:
        query = query.filter(models.Exercise.name.contains(search))
    
    exercises = query.offset(offset).limit(limit).all()
    return exercises

@router.get("/{exercise_id}", response_model=schemas.Exercise)
async def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db)
):
    """Получить конкретное упражнение"""
    
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    
    return exercise

@router.get("/search/{query}")
async def search_exercises(
    query: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Поиск упражнений по названию"""
    
    exercises = db.query(models.Exercise).filter(
        models.Exercise.name.contains(query)
    ).limit(limit).all()
    
    return [{"id": ex.id, "name": ex.name, "category": ex.category} for ex in exercises]

@router.get("/categories/")
async def get_categories(db: Session = Depends(get_db)):
    """Получить все категории упражнений"""
    
    categories = db.query(models.Exercise.category).distinct().all()
    return [cat[0] for cat in categories]

@router.get("/equipment/")
async def get_equipment_types(db: Session = Depends(get_db)):
    """Получить все типы оборудования"""
    
    equipment = db.query(models.Exercise.equipment).distinct().all()
    return [eq[0] for eq in equipment if eq[0]]

@router.post("/", response_model=schemas.Exercise)
async def create_exercise(
    exercise_data: schemas.ExerciseCreate,
    db: Session = Depends(get_db)
):
    """Создать новое упражнение (для админов)"""
    
    exercise = models.Exercise(**exercise_data.dict())
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    
    return exercise

@router.get("/{exercise_id}/history/{user_id}")
async def get_exercise_history(
    exercise_id: int,
    user_id: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Получить историю выполнения конкретного упражнения пользователем"""
    
    logs = db.query(models.WorkoutLog).join(models.Workout).filter(
        models.WorkoutLog.exercise_id == exercise_id,
        models.Workout.user_id == user_id
    ).order_by(models.Workout.date.desc()).limit(limit).all()
    
    history = []
    for log in logs:
        workout = db.query(models.Workout).filter(models.Workout.id == log.workout_id).first()
        history.append({
            "date": workout.date,
            "sets": log.sets,
            "reps": log.reps,
            "weight": log.weight,
            "notes": log.notes,
            "volume": (log.weight or 0) * (log.sets or 1) * (log.reps or 1)
        })
    
    return history

@router.get("/{exercise_id}/progress/{user_id}")
async def get_exercise_progress(
    exercise_id: int,
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Получить прогресс по упражнению (максимальные веса, объемы)"""
    
    logs = db.query(models.WorkoutLog).join(models.Workout).filter(
        models.WorkoutLog.exercise_id == exercise_id,
        models.Workout.user_id == user_id,
        models.WorkoutLog.weight.isnot(None)
    ).order_by(models.Workout.date.asc()).all()
    
    if not logs:
        return {"message": "Нет данных для анализа прогресса"}
    
    # Максимальный вес
    max_weight = max((log.weight or 0) for log in logs)
    
    # Максимальный объем за тренировку
    max_volume = max((log.weight or 0) * (log.sets or 1) * (log.reps or 1) for log in logs)
    
    # Прогресс по времени
    progress_data = []
    for log in logs:
        workout = db.query(models.Workout).filter(models.Workout.id == log.workout_id).first()
        progress_data.append({
            "date": workout.date,
            "weight": log.weight,
            "volume": (log.weight or 0) * (log.sets or 1) * (log.reps or 1)
        })
    
    return {
        "max_weight": max_weight,
        "max_volume": max_volume,
        "total_sessions": len(logs),
        "progress_data": progress_data
    }