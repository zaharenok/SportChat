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

@router.get("/calendar/{user_id}")
async def get_calendar_data(
    user_id: int = 1,
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db)
):
    """Получить данные календаря тренировок"""
    
    if year is None:
        year = datetime.now().year
    if month is None:
        month = datetime.now().month
        
    # Получаем все тренировки за месяц
    from datetime import timedelta
    import calendar
    
    # Первый и последний день месяца
    first_day = datetime(year, month, 1)
    last_day_num = calendar.monthrange(year, month)[1]
    last_day = datetime(year, month, last_day_num, 23, 59, 59)
    
    workouts = db.query(models.Workout).filter(
        models.Workout.user_id == user_id,
        models.Workout.date >= first_day,
        models.Workout.date <= last_day
    ).all()
    
    calendar_data = []
    for workout in workouts:
        # Получаем упражнения для каждой тренировки
        workout_logs = db.query(models.WorkoutLog).filter(
            models.WorkoutLog.workout_id == workout.id
        ).all()
        
        exercises = []
        total_volume = 0.0
        
        for log in workout_logs:
            exercise = db.query(models.Exercise).filter(models.Exercise.id == log.exercise_id).first()
            if exercise:
                volume = (log.weight or 0) * (log.sets or 1) * (log.reps or 1)
                total_volume += volume
                exercises.append(f"{exercise.name} {log.weight}кг {log.sets}х{log.reps}")
        
        calendar_data.append({
            "date": workout.date.isoformat(),
            "exercises": exercises,
            "emoji": "💪",  # По умолчанию
            "intensity": 7,  # По умолчанию
            "duration": workout.duration_minutes or 60,
            "notes": workout.notes or "",
            "total_volume": total_volume
        })
    
    return {
        "year": year,
        "month": month,
        "workouts": calendar_data
    }

@router.put("/calendar/{user_id}/date/{date_str}")
async def update_calendar_day(
    user_id: int,
    date_str: str,  # Format: YYYY-MM-DD
    workout_data: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    """Обновить или удалить тренировку на определенную дату"""
    
    try:
        workout_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        # Создаем диапазон для всего дня
        start_datetime = datetime.combine(workout_date, datetime.min.time())
        end_datetime = datetime.combine(workout_date, datetime.max.time().replace(microsecond=999999))
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")
    
    # Найти ВСЕ существующие тренировки на эту дату (весь день)
    existing_workouts = db.query(models.Workout).filter(
        models.Workout.user_id == user_id,
        models.Workout.date >= start_datetime,
        models.Workout.date <= end_datetime
    ).all()
    
    if workout_data is None:
        # Удаляем ВСЕ тренировки на эту дату
        if existing_workouts:
            for workout in existing_workouts:
                # Удаляем связанные логи упражнений
                db.query(models.WorkoutLog).filter(
                    models.WorkoutLog.workout_id == workout.id
                ).delete()
                
                # Удаляем саму тренировку
                db.delete(workout)
            
            db.commit()
            return {"message": f"Удалено {len(existing_workouts)} тренировок"}
        else:
            return {"message": "Тренировка не найдена"}
    
    # Создаем или обновляем тренировку
    if existing_workouts:
        # Удаляем ВСЕ старые записи и их логи
        for old_workout in existing_workouts:
            db.query(models.WorkoutLog).filter(
                models.WorkoutLog.workout_id == old_workout.id
            ).delete()
            db.delete(old_workout)
        
        db.commit()
    
    # Создаем новую тренировку (всегда создаем новую, чтобы избежать дублей)
    workout = models.Workout(
        user_id=user_id,
        date=start_datetime,  # Используем начало дня для единообразия
        duration_minutes=workout_data.get("duration", 60),
        notes=workout_data.get("notes", "")
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)
    
    # Добавляем упражнения
    exercises = workout_data.get("exercises", [])
    for exercise_name in exercises:
        # Попробуем найти или создать упражнение
        exercise = db.query(models.Exercise).filter(
            models.Exercise.name.ilike(f"%{exercise_name}%")
        ).first()
        
        if not exercise:
            exercise = models.Exercise(
                name=exercise_name,
                category="general",
                muscle_groups="general",
                instructions=f"Упражнение: {exercise_name}"
            )
            db.add(exercise)
            db.commit()
            db.refresh(exercise)
        
        # Создаем лог упражнения
        workout_log = models.WorkoutLog(
            workout_id=workout.id,
            exercise_id=exercise.id,
            sets=1,
            reps=1,
            weight=0,
            notes=f"Добавлено через календарь: {exercise_name}"
        )
        db.add(workout_log)
    
    db.commit()
    
    return {
        "message": "Тренировка обновлена",
        "workout_id": workout.id,
        "date": date_str
    }

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

@router.get("/trainer-dashboard/{trainer_id}")
async def get_trainer_dashboard(
    trainer_id: int = 1,  # В MVP показываем данные для текущего пользователя
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Получить полный дашборд для тренера (персональная статистика)"""
    
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=days)
    
    # В персональном MVP показываем статистику только для текущего пользователя
    user = db.query(models.User).filter(models.User.id == trainer_id).first()
    if not user:
        return {"error": "Пользователь не найден"}
    
    dashboard_data = {
        "overview": {
            "total_clients": 1,  # Персональное приложение - один пользователь
            "active_clients": 0,
            "inactive_clients": 0,
            "total_workouts": 0,
            "total_exercises": 0,  # Заменяем тоннаж на количество упражнений
            "total_reps": 0        # Общее количество повторений
        },
        "client_progress": [],
        "activity_heatmap": {},
        "alerts": [],
        "top_exercises_global": []
    }
    
    # Статистика по пользователю
    user_workouts = db.query(models.Workout).filter(
        models.Workout.user_id == user.id,
        models.Workout.date >= start_date
    ).count()
    
    # Последняя тренировка
    last_workout = db.query(models.Workout).filter(
        models.Workout.user_id == user.id
    ).order_by(models.Workout.date.desc()).first()
    
    days_since_last = None
    is_active = False
    if last_workout:
        days_since_last = (datetime.now() - last_workout.date).days
        is_active = days_since_last <= 7
    
    # Подсчет всех упражнений (включая bodyweight)
    user_logs = db.query(models.WorkoutLog).join(models.Workout).filter(
        models.Workout.user_id == user.id,
        models.Workout.date >= start_date
    ).all()
    
    # Новая логика подсчета метрик
    total_exercises = len(user_logs)  # Общее количество выполненных упражнений
    total_reps = sum((log.sets or 1) * (log.reps or 1) for log in user_logs)  # Общее количество повторений
    total_volume = sum((log.weight or 0) * (log.sets or 1) * (log.reps or 1) for log in user_logs if log.weight)  # Тоннаж только для упражнений с весом
    
    # Заполняем данные по клиенту
    dashboard_data["client_progress"].append({
        "user_id": user.id,
        "username": user.username,
        "workouts_count": user_workouts,
        "last_workout": last_workout.date.isoformat() if last_workout else None,
        "days_since_last": days_since_last,
        "is_active": is_active,
        "total_exercises": total_exercises,  # Количество упражнений вместо тоннажа
        "total_reps": total_reps,           # Общее количество повторений
        "total_volume": round(total_volume, 2) if total_volume > 0 else 0,  # Тоннаж только если есть
        "progress_trend": "up" if user_workouts > 0 else "down"  # Упрощенно
    })
    
    # Обновляем общие счетчики
    dashboard_data["overview"]["total_workouts"] = user_workouts
    dashboard_data["overview"]["total_exercises"] = total_exercises
    dashboard_data["overview"]["total_reps"] = total_reps
    
    if is_active:
        dashboard_data["overview"]["active_clients"] = 1
    else:
        dashboard_data["overview"]["inactive_clients"] = 1
        
    # Добавляем алерты для неактивного пользователя
    if days_since_last and days_since_last > 3:
        dashboard_data["alerts"].append({
            "type": "inactive_user",
            "user_id": user.id,
            "username": user.username,
            "message": f"Вы не тренировались {days_since_last} дней",
            "severity": "high" if days_since_last > 7 else "medium",
            "days_inactive": days_since_last
        })
    
    # Создаем тепловую карту активности только для текущего пользователя
    user_workouts_for_heatmap = db.query(models.Workout).filter(
        models.Workout.user_id == user.id,
        models.Workout.date >= start_date
    ).all()
    
    activity_by_day = {}
    for workout in user_workouts_for_heatmap:
        day_key = workout.date.strftime("%Y-%m-%d")
        activity_by_day[day_key] = activity_by_day.get(day_key, 0) + 1
    
    dashboard_data["activity_heatmap"] = activity_by_day
    
    return dashboard_data

@router.get("/exercise-analytics/{exercise_name}")
async def get_exercise_analytics(
    exercise_name: str,
    user_id: int = None,
    days: int = 90,
    db: Session = Depends(get_db)
):
    """Получить детальную аналитику по конкретному упражнению"""
    
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=days)
    
    # Находим упражнение
    exercise = db.query(models.Exercise).filter(
        models.Exercise.name.ilike(f"%{exercise_name}%")
    ).first()
    
    if not exercise:
        return {"error": "Упражнение не найдено"}
    
    # Базовый запрос логов
    query = db.query(models.WorkoutLog).join(models.Workout).filter(
        models.WorkoutLog.exercise_id == exercise.id,
        models.Workout.date >= start_date
    )
    
    # Фильтр по пользователю если указан
    if user_id:
        query = query.filter(models.Workout.user_id == user_id)
    
    logs = query.order_by(models.Workout.date.asc()).all()
    
    if not logs:
        return {"error": "Нет данных по этому упражнению"}
    
    # Анализируем прогресс
    progress_data = []
    max_weights = []
    total_volume_per_session = []
    
    for log in logs:
        workout = db.query(models.Workout).filter(models.Workout.id == log.workout_id).first()
        session_volume = (log.weight or 0) * (log.sets or 1) * (log.reps or 1)
        
        progress_data.append({
            "date": workout.date.isoformat(),
            "weight": log.weight,
            "sets": log.sets,
            "reps": log.reps,
            "volume": session_volume,
            "user_id": workout.user_id
        })
        
        if log.weight:
            max_weights.append(log.weight)
        total_volume_per_session.append(session_volume)
    
    # Вычисляем метрики
    current_max = max(max_weights) if max_weights else 0
    avg_volume = sum(total_volume_per_session) / len(total_volume_per_session) if total_volume_per_session else 0
    
    # Определяем тренд (упрощенно - сравниваем первую и вторую половину периода)
    mid_point = len(progress_data) // 2
    if mid_point > 0:
        first_half_avg = sum(session["volume"] for session in progress_data[:mid_point]) / mid_point
        second_half_avg = sum(session["volume"] for session in progress_data[mid_point:]) / (len(progress_data) - mid_point)
        trend = "up" if second_half_avg > first_half_avg else "down"
    else:
        trend = "stable"
    
    return {
        "exercise_name": exercise.name,
        "total_sessions": len(logs),
        "current_max_weight": current_max,
        "average_volume_per_session": round(avg_volume, 2),
        "trend": trend,
        "progress_data": progress_data,
        "recommendations": [
            f"Текущий максимум: {current_max}кг",
            f"Средний объем за сессию: {avg_volume:.1f}кг",
            "Рекомендуем увеличить вес на 2.5кг" if trend == "stable" else f"Прогресс {trend}!"
        ]
    }

@router.get("/client-alerts")
async def get_client_alerts(
    severity: str = "all",  # all, high, medium, low
    db: Session = Depends(get_db)
):
    """Получить алерты и предупреждения по клиентам"""
    
    from datetime import datetime, timedelta
    
    alerts = []
    users = db.query(models.User).all()
    
    for user in users:
        # Проверяем активность
        last_workout = db.query(models.Workout).filter(
            models.Workout.user_id == user.id
        ).order_by(models.Workout.date.desc()).first()
        
        if last_workout:
            days_inactive = (datetime.now() - last_workout.date).days
            
            if days_inactive > 7:
                alerts.append({
                    "type": "long_inactive",
                    "user_id": user.id,
                    "username": user.username,
                    "message": f"Клиент не тренировался {days_inactive} дней",
                    "severity": "high",
                    "days_inactive": days_inactive,
                    "action": "Связаться с клиентом"
                })
            elif days_inactive > 3:
                alerts.append({
                    "type": "inactive",
                    "user_id": user.id,
                    "username": user.username,
                    "message": f"Клиент не тренировался {days_inactive} дня",
                    "severity": "medium",
                    "days_inactive": days_inactive,
                    "action": "Отправить мотивационное сообщение"
                })
        
        # Проверяем на потенциальную перетренированность
        week_ago = datetime.now() - timedelta(days=7)
        recent_workouts = db.query(models.Workout).filter(
            models.Workout.user_id == user.id,
            models.Workout.date >= week_ago
        ).count()
        
        if recent_workouts > 6:  # Более 6 тренировок в неделю
            alerts.append({
                "type": "overtraining",
                "user_id": user.id,
                "username": user.username,
                "message": f"Возможная перетренированность: {recent_workouts} тренировок за неделю",
                "severity": "medium",
                "workouts_per_week": recent_workouts,
                "action": "Рекомендовать день отдыха"
            })
    
    # Фильтруем по серьезности
    if severity != "all":
        alerts = [alert for alert in alerts if alert["severity"] == severity]
    
    return {
        "total_alerts": len(alerts),
        "alerts": sorted(alerts, key=lambda x: {"high": 3, "medium": 2, "low": 1}[x["severity"]], reverse=True)
    }