from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.models import schemas, models
from app.database.database import get_db

router = APIRouter()

@router.get("/user/{user_id}", response_model=List[schemas.GoalProgress])
async def get_user_goals(
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Получить все цели пользователя с прогрессом"""
    
    goals = db.query(models.UserGoal).filter(
        models.UserGoal.user_id == user_id,
        models.UserGoal.is_active == True
    ).all()
    
    goal_progress = []
    for goal in goals:
        progress = await calculate_goal_progress(user_id, goal, db)
        goal_progress.append(progress)
    
    return goal_progress

@router.post("/user/{user_id}", response_model=schemas.UserGoal)
async def create_user_goal(
    goal: schemas.UserGoalCreate,
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Создать новую цель для пользователя"""
    
    # Проверяем, что пользователь существует
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Создаем цель
    db_goal = models.UserGoal(
        user_id=user_id,
        type=goal.type,
        target_value=goal.target_value,
        period=goal.period,
        deadline=goal.deadline,
        description=goal.description
    )
    
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    return db_goal

@router.put("/{goal_id}", response_model=schemas.UserGoal)
async def update_user_goal(
    goal_id: int,
    goal_update: schemas.UserGoalUpdate,
    db: Session = Depends(get_db)
):
    """Обновить существующую цель"""
    
    db_goal = db.query(models.UserGoal).filter(models.UserGoal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    
    # Обновляем только переданные поля
    update_data = goal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_goal, field, value)
    
    db.commit()
    db.refresh(db_goal)
    
    return db_goal

@router.delete("/{goal_id}")
async def delete_user_goal(
    goal_id: int,
    db: Session = Depends(get_db)
):
    """Удалить цель (деактивировать)"""
    
    db_goal = db.query(models.UserGoal).filter(models.UserGoal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    
    db_goal.is_active = False
    db.commit()
    
    return {"message": "Цель успешно удалена"}

@router.post("/update-progress/{user_id}")
async def update_goals_progress(
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Обновить прогресс по всем целям пользователя на основе актуальных данных"""
    
    goals = db.query(models.UserGoal).filter(
        models.UserGoal.user_id == user_id,
        models.UserGoal.is_active == True
    ).all()
    
    updated_goals = []
    
    for goal in goals:
        current_value = await calculate_current_value(user_id, goal, db)
        goal.current_value = current_value
        updated_goals.append({
            "goal_id": goal.id,
            "type": goal.type,
            "current_value": current_value,
            "target_value": goal.target_value,
            "progress": (current_value / goal.target_value) * 100 if goal.target_value > 0 else 0
        })
    
    db.commit()
    
    return {"updated_goals": updated_goals}

async def calculate_goal_progress(user_id: int, goal: models.UserGoal, db: Session) -> schemas.GoalProgress:
    """Рассчитать прогресс по цели"""
    
    # Обновляем текущее значение
    current_value = await calculate_current_value(user_id, goal, db)
    goal.current_value = current_value
    
    # Рассчитываем процент прогресса
    progress_percentage = (current_value / goal.target_value) * 100 if goal.target_value > 0 else 0
    progress_percentage = min(progress_percentage, 100)  # Максимум 100%
    
    # Определяем статус
    status = "not_started"
    if current_value > 0:
        if progress_percentage >= 100:
            status = "completed"
        elif goal.deadline and datetime.now() > goal.deadline:
            status = "overdue"
        else:
            status = "in_progress"
    
    return schemas.GoalProgress(
        goal=goal,
        progress_percentage=progress_percentage,
        status=status
    )

async def calculate_current_value(user_id: int, goal: models.UserGoal, db: Session) -> float:
    """Рассчитать текущее значение цели на основе данных из БД"""
    
    # Определяем период для расчета
    if goal.period == "week":
        start_date = datetime.now() - timedelta(weeks=1)
    elif goal.period == "month":
        start_date = datetime.now() - timedelta(days=30)
    elif goal.period == "year":
        start_date = datetime.now() - timedelta(days=365)
    else:
        start_date = goal.created_at
    
    if goal.type == "workouts":
        # Считаем количество тренировок за период
        count = db.query(models.Workout).filter(
            models.Workout.user_id == user_id,
            models.Workout.date >= start_date
        ).count()
        return float(count)
    
    elif goal.type == "exercises":
        # Считаем количество уникальных упражнений за период
        count = db.query(models.WorkoutLog.exercise_id).join(models.Workout).filter(
            models.Workout.user_id == user_id,
            models.Workout.date >= start_date
        ).distinct().count()
        return float(count)
    
    elif goal.type == "reps":
        # Считаем общее количество повторений за период
        logs = db.query(models.WorkoutLog).join(models.Workout).filter(
            models.Workout.user_id == user_id,
            models.Workout.date >= start_date,
            models.WorkoutLog.reps.isnot(None)
        ).all()
        total_reps = sum((log.sets or 1) * (log.reps or 0) for log in logs)
        return float(total_reps)
    
    elif goal.type == "weight_loss":
        # Для похудения нужны записи веса пользователя (пока возвращаем 0)
        return 0.0
    
    elif goal.type == "muscle_gain":
        # Для набора мышечной массы нужны записи веса пользователя (пока возвращаем 0)
        return 0.0
    
    return 0.0

@router.get("/templates")
async def get_goal_templates():
    """Получить шаблоны целей для выбора пользователем"""
    
    templates = [
        {
            "type": "workouts",
            "name": "Количество тренировок",
            "description": "Тренироваться определенное количество раз",
            "unit": "тренировок",
            "suggested_values": [8, 12, 16, 20],
            "periods": ["week", "month"]
        },
        {
            "type": "exercises",
            "name": "Разнообразие упражнений",
            "description": "Выполнить разные упражнения",
            "unit": "упражнений",
            "suggested_values": [20, 50, 75, 100],
            "periods": ["month", "year"]
        },
        {
            "type": "reps",
            "name": "Общее количество повторений",
            "description": "Выполнить определенное количество повторений",
            "unit": "повторений",
            "suggested_values": [500, 1000, 2000, 5000],
            "periods": ["week", "month"]
        }
    ]
    
    return templates