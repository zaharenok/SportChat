from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models import schemas, models
from app.database.database import get_db
from app.services.chat_service import ChatService
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
    
    # Обрабатываем сообщение и получаем ответ
    response = await chat_service.process_message(user_id, message)
    
    # Сохраняем ответ AI
    ai_message = models.ChatMessage(
        user_id=user_id,
        message=response.message,
        is_user=False,
        context=response.context if hasattr(response, 'context') else None
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