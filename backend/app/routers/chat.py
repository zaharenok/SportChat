from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import httpx
import asyncio
from app.models import schemas, models
from app.database.database import get_db
from app.services.chat_service import ChatService
from app.services.workout_service import WorkoutService
from app.config import settings
from datetime import datetime

router = APIRouter()

@router.post("/message", response_model=schemas.ChatResponse)
async def send_message(
    message: str,
    user_id: int = 1,  # Для MVP используем фиксированный ID пользователя
    db: Session = Depends(get_db)
):
    """Отправить сообщение в чат и получить ответ от AI"""
    
    chat_service = ChatService(db)
    
    # Сохраняем сообщение пользователя
    user_message = models.ChatMessage(
        user_id=user_id,
        message=message,
        is_user=True
    )
    db.add(user_message)
    db.commit()
    
    # Отправляем в n8n webhook
    n8n_response = None
    session_id = f"session_{user_id}_{datetime.now().strftime('%Y%m%d')}"
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Для GET запроса нужно отправить данные как строки
            webhook_payload = {
                "user_id": str(user_id),
                "message": message,
                "timestamp": datetime.now().isoformat(),
                "session_id": session_id,
                "platform": "SportChat"
            }
            
            print(f"🚀 Отправляем в n8n webhook: {webhook_payload}")
            
            webhook_response = await client.get(
                settings.n8n_webhook_url,
                params=webhook_payload
            )
            
            if webhook_response.status_code == 200:
                response_text = webhook_response.text.strip()
                if response_text:
                    n8n_response = webhook_response.json()
                    print(f"✅ n8n response: {n8n_response}")
                    
                    # Обрабатываем массив от n8n
                    if isinstance(n8n_response, list) and len(n8n_response) > 0:
                        n8n_response = n8n_response[0]
                        print(f"🔧 Extracted from array: {n8n_response}")
                else:
                    print("⚠️ n8n webhook returned empty response")
                    n8n_response = None
            else:
                print(f"❌ n8n webhook error: {webhook_response.status_code}")
                n8n_response = None
                
    except Exception as e:
        print(f"❌ n8n webhook failed: {e}")
        n8n_response = None
    
    # Если есть ответ от n8n, используем его, иначе fallback к локальной обработке
    if n8n_response:
        # Обрабатываем разные форматы ответа от n8n
        actual_data = n8n_response
        
        # Если n8n вернул массив, берем первый элемент
        if isinstance(n8n_response, list) and len(n8n_response) > 0:
            actual_data = n8n_response[0]
        
        # Если data вложена в 'output', извлекаем её
        if "output" in actual_data and isinstance(actual_data["output"], dict):
            actual_data = actual_data["output"]
        elif "output" in actual_data:
            # output - строка (старый формат)
            actual_data = {"message": actual_data["output"]}
        
        # Если n8n вернул структурированные упражнения, логируем их
        parsed_exercises = actual_data.get("parsed_exercises", [])
        workout_logged = False
        
        print(f"🏋️ Found {len(parsed_exercises)} parsed exercises: {parsed_exercises}")
        
        if parsed_exercises:
            try:
                # Используем ChatService для логирования упражнений
                workout_logged = await _log_parsed_exercises(user_id, parsed_exercises, db)
                print(f"💪 Workout logged successfully: {workout_logged}")
            except Exception as e:
                print(f"❌ Ошибка при логировании упражнений из n8n: {e}")
            
        # Создаем краткую сводку о залогированных упражнениях
        exercises_summary = None
        if parsed_exercises and workout_logged:
            exercises_list = [f"{ex['name']} {ex['sets']}x{ex['reps']}" for ex in parsed_exercises]
            exercises_summary = f"✅ Записано: {', '.join(exercises_list)}"
        
        # Определяем, есть ли контент для задержанного показа
        has_suggestions = bool(actual_data.get("suggestions"))
        has_recommendation = bool(actual_data.get("next_workout_recommendation"))
        has_delayed = has_suggestions or has_recommendation
        
        response = schemas.ChatResponse(
            message=str(actual_data.get("message", str(actual_data))),
            workout_logged=workout_logged or actual_data.get("workout_logged", False),
            suggestions=actual_data.get("suggestions", []),
            next_workout_recommendation=actual_data.get("next_workout_recommendation"),
            show_delayed_suggestions=has_suggestions,
            show_delayed_recommendation=has_recommendation,
            parsed_exercises_summary=exercises_summary,
            has_delayed_content=has_delayed,
            thinking_message="Анализирую тренировку и готовлю рекомендации..." if has_delayed else None
        )
    else:
        # Fallback к локальной обработке
        response = await chat_service.process_message(user_id, message)
    
    # Сохраняем ответ AI с полным контекстом n8n для анализа
    import json
    serialized_context = None
    if n8n_response:
        # Сохраняем полные данные от n8n для будущих рекомендаций
        ai_context = {
            "n8n_response": n8n_response,
            "parsed_exercises": actual_data.get("parsed_exercises", []) if 'actual_data' in locals() else [],
            "suggestions": actual_data.get("suggestions", []) if 'actual_data' in locals() else [],
            "next_workout_recommendation": actual_data.get("next_workout_recommendation") if 'actual_data' in locals() else None,
            "session_id": session_id if 'session_id' in locals() else None
        }
        
        # Безопасно сериализуем context
        try:
            serialized_context = json.dumps(ai_context, ensure_ascii=False, default=str)
        except Exception as e:
            print(f"❌ Ошибка сериализации context: {e}")
            serialized_context = json.dumps({"error": "serialization_failed", "message": str(e)}, ensure_ascii=False)
    
    ai_message = models.ChatMessage(
        user_id=user_id,
        message=response.message,
        is_user=False,
        context=serialized_context
    )
    db.add(ai_message)
    db.commit()
    
    return response

@router.get("/history/{user_id}", response_model=List[schemas.ChatMessage])
async def get_chat_history(
    user_id: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Получить историю чата пользователя"""
    
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == user_id
    ).order_by(models.ChatMessage.timestamp.desc()).limit(limit).all()
    
    return messages[::-1]  # Возвращаем в хронологическом порядке

@router.delete("/history/{user_id}")
async def clear_chat_history(
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Очистить историю чата пользователя"""
    
    deleted_count = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == user_id
    ).delete()
    
    db.commit()
    
    return {"message": f"Удалено {deleted_count} сообщений"}

@router.put("/message/{message_id}", response_model=schemas.EditMessageResponse)
async def edit_message(
    message_id: int,
    request: schemas.EditMessageRequest,
    db: Session = Depends(get_db)
):
    """Редактировать сообщение пользователя и пересчитать тренировочные данные"""
    
    # Находим сообщение
    message = db.query(models.ChatMessage).filter(
        models.ChatMessage.id == message_id,
        models.ChatMessage.is_user == True
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Сообщение не найдено")
    
    # Сохраняем старое сообщение для логов
    old_message = message.message
    
    # Обновляем сообщение
    message.message = request.message
    message.timestamp = datetime.utcnow()  # Обновляем время редактирования
    
    db.commit()
    db.refresh(message)
    
    # Обрабатываем новое сообщение через ChatService
    chat_service = ChatService(db)
    
    try:
        # Получаем новый ответ от AI на отредактированное сообщение
        response = await chat_service.process_message(message.user_id, request.message)
        
        # Если нужно, создаем новое сообщение от AI
        ai_response_text = None
        if response.workout_logged:
            ai_response_text = f"✏️ Запись обновлена: {response.message}"
            
            # Сохраняем новый ответ AI
            ai_message = models.ChatMessage(
                user_id=message.user_id,
                message=ai_response_text,
                is_user=False,
                context=f"edited_response_for_message_{message_id}"
            )
            db.add(ai_message)
            db.commit()
        
        return schemas.EditMessageResponse(
            success=True,
            message="Сообщение успешно отредактировано",
            ai_response=ai_response_text,
            workout_updated=response.workout_logged
        )
        
    except Exception as e:
        # Если что-то пошло не так, возвращаем старое сообщение
        message.message = old_message
        db.commit()
        
        return schemas.EditMessageResponse(
            success=False,
            message=f"Ошибка при обработке: {str(e)}"
        )

@router.get("/insights/{user_id}")
async def get_workout_insights(
    user_id: int = 1,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Получить аналитику и рекомендации из n8n за период"""
    
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=days)
    
    # Получаем сообщения с контекстом n8n
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == user_id,
        models.ChatMessage.is_user == False,
        models.ChatMessage.context.isnot(None),
        models.ChatMessage.timestamp >= start_date
    ).order_by(models.ChatMessage.timestamp.desc()).all()
    
    insights = {
        "total_workouts": 0,
        "total_exercises": 0,
        "recent_suggestions": [],
        "recommendations": [],
        "parsed_exercises": []
    }
    
    for message in messages:
        if message.context:
            try:
                context = json.loads(message.context)
                if "parsed_exercises" in context:
                    for exercise in context["parsed_exercises"]:
                        insights["parsed_exercises"].append({
                            "date": message.timestamp.isoformat(),
                            "exercise": exercise
                        })
                        insights["total_exercises"] += 1
                    if context["parsed_exercises"]:
                        insights["total_workouts"] += 1
                
                if context.get("suggestions"):
                    insights["recent_suggestions"].extend(context["suggestions"])
                
                if context.get("next_workout_recommendation"):
                    insights["recommendations"].append({
                        "date": message.timestamp.isoformat(),
                        "recommendation": context["next_workout_recommendation"]
                    })
            except:
                continue
    
    # Убираем дубликаты из предложений
    insights["recent_suggestions"] = list(set(insights["recent_suggestions"]))[-10:]
    
    return insights

async def _log_parsed_exercises(user_id: int, parsed_exercises: list, db: Session) -> bool:
    """Логирование структурированных упражнений из n8n"""
    
    try:
        workout_service = WorkoutService(db)
        
        # Получаем или создаем сегодняшнюю тренировку
        workout = await workout_service.get_or_create_today_workout(user_id)
        
        logged_count = 0
        
        for exercise_data in parsed_exercises:
            # Ищем упражнение в базе по названию
            exercise_name = exercise_data.get("name", "").strip()
            if not exercise_name:
                continue
                
            exercise = db.query(models.Exercise).filter(
                models.Exercise.name.ilike(f"%{exercise_name}%")
            ).first()
            
            # Если упражнение не найдено, создаем его
            if not exercise:
                exercise = models.Exercise(
                    name=exercise_name,
                    category="strength",
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
                sets=exercise_data.get("sets", 1),
                reps=exercise_data.get("reps", 1),
                weight=exercise_data.get("weight", 0),
                duration_seconds=exercise_data.get("duration"),
                notes=f"Обработано через n8n: {exercise_name}"
            )
            
            db.add(workout_log)
            logged_count += 1
        
        db.commit()
        
        print(f"✅ Успешно залогировано {logged_count} упражнений из n8n")
        return logged_count > 0
        
    except Exception as e:
        print(f"❌ Ошибка в _log_parsed_exercises: {e}")
        db.rollback()
        return False