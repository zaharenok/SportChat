from sqlalchemy.orm import Session
from app.models import models, schemas
from app.services.message_parser import MessageParser
from app.services.workout_service import WorkoutService
from typing import Optional
import re

class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.message_parser = MessageParser(db)
        self.workout_service = WorkoutService(db)

    async def process_message(self, user_id: int, message: str) -> schemas.ChatResponse:
        """Обработать сообщение пользователя и вернуть ответ"""
        
        # Получаем пользователя
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            return schemas.ChatResponse(
                message="Пользователь не найден. Создайте профиль для продолжения."
            )
        
        # Парсим сообщение
        parsed_data = await self.message_parser.parse_message(message)
        
        # Обрабатываем в зависимости от типа сообщения
        if parsed_data.get("type") == "workout_log":
            return await self._handle_workout_log(user_id, message, parsed_data)
        elif parsed_data.get("type") == "question":
            return await self._handle_question(user_id, message, parsed_data)
        elif parsed_data.get("type") == "greeting":
            return await self._handle_greeting(user_id, message)
        elif parsed_data.get("type") == "negative":
            return await self._handle_negative_message(user_id, message)
        else:
            return await self._handle_general_message(user_id, message)

    async def _handle_workout_log(self, user_id: int, message: str, parsed_data: dict) -> schemas.ChatResponse:
        """Обработать сообщение с логированием тренировки"""
        
        exercises = parsed_data.get("exercises", [])
        if not exercises:
            # Получаем предложения по исправлению
            corrections = self.message_parser.suggest_corrections(message)
            suggestions_text = "; ".join(corrections) if corrections else ""
            
            base_message = "Я не смог понять, какое упражнение вы выполняли."
            if suggestions_text:
                full_message = f"{base_message} {suggestions_text}. Попробуйте исправить или используйте подсказки."
            else:
                full_message = f"{base_message} Попробуйте формат: 'Делал жим лежа 80кг 3х8' или используйте подсказки."
            
            return schemas.ChatResponse(
                message=full_message,
                suggestions=corrections if corrections else ["Используйте кнопки подсказок", "Формат: 'упражнение вес подходыхповторения'"]
            )
        
        # Создаем или получаем сегодняшнюю тренировку
        workout = await self.workout_service.get_or_create_today_workout(user_id)
        
        logged_exercises = []
        suggestions = []
        
        for exercise_data in exercises:
            # Ищем упражнение в базе
            exercise = self._find_exercise(exercise_data["name"])
            if not exercise:
                # Предлагаем похожие упражнения с улучшенной логикой
                similar = self.message_parser.find_similar_exercises(exercise_data["name"], 3)
                if similar:
                    similar_names = [ex["name"] for ex in similar]
                    return schemas.ChatResponse(
                        message=f"Не нашел упражнение '{exercise_data['name']}'. Возможно, вы имели в виду: {', '.join(similar_names)}?",
                        suggestions=similar_names
                    )
                else:
                    # Предлагаем исправления формата сообщения
                    corrections = self.message_parser.suggest_corrections(message)
                    if corrections:
                        return schemas.ChatResponse(
                            message=f"Упражнение '{exercise_data['name']}' не найдено. Попробуйте исправить: {'; '.join(corrections)}",
                            suggestions=corrections
                        )
                    else:
                        return schemas.ChatResponse(
                            message=f"Упражнение '{exercise_data['name']}' не найдено в базе. Попробуйте использовать подсказки или другое название."
                        )
            
            # Создаем лог упражнения
            workout_log = models.WorkoutLog(
                workout_id=workout.id,
                exercise_id=exercise.id,
                sets=exercise_data.get("sets", 1),
                reps=exercise_data.get("reps"),
                weight=exercise_data.get("weight"),
                duration_seconds=exercise_data.get("duration"),
                notes=exercise_data.get("notes")
            )
            
            self.db.add(workout_log)
            logged_exercises.append(exercise.name)
            
            # Генерируем рекомендации по прогрессии
            next_suggestion = await self._generate_progression_suggestion(user_id, exercise.id, exercise_data)
            if next_suggestion:
                suggestions.append(next_suggestion)
        
        self.db.commit()
        
        # Формируем ответ
        if len(logged_exercises) == 1:
            response_msg = f"Отлично! Записал {logged_exercises[0]}."
        else:
            response_msg = f"Записал упражнения: {', '.join(logged_exercises)}."
        
        if suggestions:
            response_msg += f" На следующей тренировке попробуйте: {'; '.join(suggestions)}"
        
        return schemas.ChatResponse(
            message=response_msg,
            workout_logged=True,
            suggestions=suggestions
        )

    async def _handle_question(self, user_id: int, message: str, parsed_data: dict) -> schemas.ChatResponse:
        """Обработать вопрос пользователя"""
        
        question_type = parsed_data.get("question_type", "general")
        
        if question_type == "progress":
            return await self._handle_progress_question(user_id, parsed_data)
        elif question_type == "exercise_info":
            return await self._handle_exercise_info_question(parsed_data)
        elif question_type == "recommendation":
            return await self._handle_recommendation_question(user_id)
        else:
            return schemas.ChatResponse(
                message="Хороший вопрос! Пока я учусь отвечать на такие вопросы. Попробуйте спросить о прогрессе в упражнениях или попросить рекомендации."
            )

    async def _handle_greeting(self, user_id: int, message: str) -> schemas.ChatResponse:
        """Обработать приветствие"""
        
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        username = user.username if user else "друг"
        
        recent_workout = self.db.query(models.Workout).filter(
            models.Workout.user_id == user_id
        ).order_by(models.Workout.date.desc()).first()
        
        if recent_workout:
            import datetime
            days_ago = (datetime.datetime.now() - recent_workout.date).days
            if days_ago == 0:
                greeting = f"Привет, {username}! Вижу, уже тренировались сегодня. Как дела?"
            elif days_ago == 1:
                greeting = f"Привет, {username}! Вчера была хорошая тренировка. Готовы к новой?"
            else:
                greeting = f"Привет, {username}! Последняя тренировка была {days_ago} дней назад. Время возвращаться! 💪"
        else:
            greeting = f"Привет, {username}! Готовы начать отслеживать тренировки? Расскажите, что делали сегодня!"
        
        return schemas.ChatResponse(message=greeting)

    async def _handle_negative_message(self, user_id: int, message: str) -> schemas.ChatResponse:
        """Обработать негативное сообщение (не идти в зал)"""
        
        # Получаем мотивирующие сообщения в зависимости от причины
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['болею', 'болен']):
            response = "Понимаю, здоровье важнее. Отдыхайте и выздоравливайте! Можете попробовать легкую растяжку дома, если позволяет самочувствие."
        elif any(word in message_lower for word in ['устал', 'усталость']):
            response = "Отдых тоже часть тренировочного процесса. Может быть, легкая прогулка или растяжка? Иногда легкая активность помогает восстановиться."
        elif any(word in message_lower for word in ['нет времени', 'занят']):
            response = "Бывает! Попробуйте короткую 10-15 минутную тренировку дома - отжимания, приседания, планка. Это лучше, чем ничего."
        elif any(word in message_lower for word in ['лень']):
            response = "Понимаю чувство! Помните: даже 5 минут активности - это победа. Может быть, просто прогуляетесь?"
        else:
            response = "Понимаю, бывают такие дни. Главное - не бросать совсем! Завтра новый день для тренировок."
        
        # НЕ логируем это в историю тренировок
        return schemas.ChatResponse(
            message=response,
            workout_logged=False,  # Явно указываем, что тренировка не записана
            suggestions=["Попробуйте завтра", "Легкая активность дома", "10-минутная тренировка"]
        )

    async def _handle_general_message(self, user_id: int, message: str) -> schemas.ChatResponse:
        """Обработать общее сообщение"""
        
        return schemas.ChatResponse(
            message="Расскажите о своей тренировке! Например: 'Делал приседания 100кг 3х5' или спросите что-нибудь о прогрессе."
        )

    def _find_exercise(self, exercise_name: str) -> Optional[models.Exercise]:
        """Найти упражнение по названию"""
        
        # Точное совпадение
        exercise = self.db.query(models.Exercise).filter(
            models.Exercise.name.ilike(f"%{exercise_name}%")
        ).first()
        
        return exercise

    def _find_similar_exercises(self, exercise_name: str) -> list:
        """Найти похожие упражнения"""
        
        exercises = self.db.query(models.Exercise).filter(
            models.Exercise.name.contains(exercise_name)
        ).limit(5).all()
        
        return exercises

    async def _generate_progression_suggestion(self, user_id: int, exercise_id: int, current_data: dict) -> Optional[str]:
        """Генерировать рекомендации по прогрессии"""
        
        # Получаем последние выполнения этого упражнения
        recent_logs = self.db.query(models.WorkoutLog).join(models.Workout).filter(
            models.Workout.user_id == user_id,
            models.WorkoutLog.exercise_id == exercise_id
        ).order_by(models.Workout.date.desc()).limit(3).all()
        
        if len(recent_logs) < 2:
            return None
        
        current_weight = current_data.get("weight")
        current_reps = current_data.get("reps") 
        
        if not current_weight or not current_reps:
            return None
        
        # Простая логика прогрессии
        prev_log = recent_logs[1]  # Предыдущая тренировка
        
        if prev_log.weight and prev_log.reps:
            if current_weight > prev_log.weight:
                return f"Отличный прогресс по весу!"
            elif current_weight == prev_log.weight and current_reps >= prev_log.reps:
                # Рекомендуем увеличить вес на 2.5-5кг
                suggested_weight = current_weight + 2.5 if current_weight < 50 else current_weight + 5
                return f"попробуйте {suggested_weight}кг в следующий раз"
        
        return None

    async def _handle_progress_question(self, user_id: int, parsed_data: dict) -> schemas.ChatResponse:
        """Ответить на вопрос о прогрессе"""
        
        exercise_name = parsed_data.get("exercise_name")
        if exercise_name:
            exercise = self._find_exercise(exercise_name)
            if exercise:
                # Получаем прогресс по упражнению
                logs = self.db.query(models.WorkoutLog).join(models.Workout).filter(
                    models.Workout.user_id == user_id,
                    models.WorkoutLog.exercise_id == exercise.id,
                    models.WorkoutLog.weight.isnot(None)
                ).order_by(models.Workout.date.desc()).limit(5).all()
                
                if logs:
                    current_max = max(log.weight for log in logs)
                    response = f"По упражнению {exercise.name}: текущий максимум {current_max}кг"
                    
                    if len(logs) > 1:
                        prev_weights = [log.weight for log in logs[1:]]
                        prev_max = max(prev_weights)
                        if current_max > prev_max:
                            response += f" (+{current_max - prev_max}кг прогресс!)"
                    
                    return schemas.ChatResponse(message=response)
        
        # Общий прогресс
        return await self._get_general_progress(user_id)

    async def _get_general_progress(self, user_id: int) -> schemas.ChatResponse:
        """Получить общую статистику прогресса"""
        
        from datetime import datetime, timedelta
        
        # Тренировки за последние 30 дней
        month_ago = datetime.now() - timedelta(days=30)
        workouts_count = self.db.query(models.Workout).filter(
            models.Workout.user_id == user_id,
            models.Workout.date >= month_ago
        ).count()
        
        # Общий тоннаж за месяц
        logs = self.db.query(models.WorkoutLog).join(models.Workout).filter(
            models.Workout.user_id == user_id,
            models.Workout.date >= month_ago,
            models.WorkoutLog.weight.isnot(None),
            models.WorkoutLog.reps.isnot(None)
        ).all()
        
        total_volume = sum((log.weight or 0) * (log.sets or 1) * (log.reps or 1) for log in logs)
        
        message = f"За последний месяц: {workouts_count} тренировок, общий тоннаж {total_volume:.0f}кг"
        
        return schemas.ChatResponse(message=message)

    async def _handle_exercise_info_question(self, parsed_data: dict) -> schemas.ChatResponse:
        """Ответить на вопрос об упражнении"""
        
        exercise_name = parsed_data.get("exercise_name")
        if exercise_name:
            exercise = self._find_exercise(exercise_name)
            if exercise:
                muscle_groups = exercise.muscle_groups.strip('[]"').replace('"', '').split(',') if exercise.muscle_groups else []
                response = f"{exercise.name} - упражнение категории '{exercise.category}'"
                if muscle_groups:
                    response += f", работает мышцы: {', '.join(muscle_groups)}"
                if exercise.equipment:
                    response += f". Нужно оборудование: {exercise.equipment}"
                
                return schemas.ChatResponse(message=response)
        
        return schemas.ChatResponse(message="Не нашел информацию об этом упражнении.")

    async def _handle_recommendation_question(self, user_id: int) -> schemas.ChatResponse:
        """Дать рекомендации по тренировкам"""
        
        # Анализируем последние тренировки пользователя
        recent_workouts = self.db.query(models.Workout).filter(
            models.Workout.user_id == user_id
        ).order_by(models.Workout.date.desc()).limit(5).all()
        
        if not recent_workouts:
            return schemas.ChatResponse(
                message="Для рекомендаций мне нужно больше данных о ваших тренировках. Начните логировать упражнения!"
            )
        
        # Анализируем, какие группы мышц тренировались недавно
        recent_exercises = []
        for workout in recent_workouts:
            logs = self.db.query(models.WorkoutLog).filter(
                models.WorkoutLog.workout_id == workout.id
            ).all()
            for log in logs:
                exercise = self.db.query(models.Exercise).filter(
                    models.Exercise.id == log.exercise_id
                ).first()
                if exercise:
                    recent_exercises.append(exercise)
        
        # Простая логика рекомендаций
        if recent_exercises:
            categories = [ex.category for ex in recent_exercises]
            if "strength" in categories:
                recommendation = "Рекомендую добавить кардио для восстановления"
            else:
                recommendation = "Попробуйте силовые упражнения для баланса"
        else:
            recommendation = "Начните с базовых упражнений: приседания, отжимания, подтягивания"
        
        return schemas.ChatResponse(
            message=recommendation,
            suggestions=[recommendation]
        )