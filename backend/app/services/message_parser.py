from sqlalchemy.orm import Session
import re
from typing import Dict, List, Optional
from difflib import get_close_matches

class MessageParser:
    def __init__(self, db: Session):
        self.db = db
        
        # Улучшенные паттерны для распознавания сообщений
        self.workout_patterns = [
            # "делал жим лежа 80кг 3х8"
            r'(?:делал?|сделал|выполнял)?(?:\s+)?(.+?)\s+(\d+(?:[.,]\d+)?)\s*кг\s+(\d+)\s*[хx×]\s*(\d+)',
            # "жим лежа 80 кг 3 подхода по 8 раз"
            r'(.+?)\s+(\d+(?:[.,]\d+)?)\s*кг\s+(\d+)\s*подход.+?(\d+)\s*раз',
            # "приседания 100кг 5 повторений"
            r'(.+?)\s+(\d+(?:[.,]\d+)?)\s*кг\s+(\d+)\s*(?:повтор|раз)',
            # "отжимания 3х20" или "отжимания 3*20"
            r'(.+?)\s+(\d+)\s*[хx×*]\s*(\d+)',
            # "планка 60 секунд"
            r'(.+?)\s+(\d+)\s*(?:секунд|сек)',
            # "бег 30 минут"
            r'(.+?)\s+(\d+)\s*(?:минут|мин)',
            # "жим лежа 80"
            r'(.+?)\s+(\d+(?:[.,]\d+)?)\s*кг?',
            # Простые форматы
            r'(.+?)\s+(\d+)\s*подход',
            r'(.+?)\s+(\d+)\s*раз',
        ]
        
        self.greeting_patterns = [
            r'привет',
            r'здравствуй',
            r'добр.+\s+(день|утро|вечер)',
            r'как дела',
            r'йо',
            r'hi',
            r'hello'
        ]
        
        self.question_patterns = [
            r'как.+прогресс',
            r'какой.+результат',
            r'сколько.+весе',
            r'что.+рекоменду',
            r'как.+делать',
            r'правильно.+выполн'
        ]

    async def parse_message(self, message: str) -> Dict:
        """Парсить сообщение и определить его тип и содержание"""
        
        message_lower = message.lower().strip()
        
        # Проверяем на приветствие
        if self._is_greeting(message_lower):
            return {"type": "greeting"}
        
        # Проверяем на вопрос
        if self._is_question(message_lower):
            return {
                "type": "question",
                "question_type": self._classify_question(message_lower),
                "exercise_name": self._extract_exercise_name_from_question(message_lower)
            }
        
        # Пытаемся распарсить как лог тренировки
        workout_data = self._parse_workout_log(message_lower)
        if workout_data:
            return {
                "type": "workout_log",
                "exercises": workout_data
            }
        
        return {"type": "general"}

    def _is_greeting(self, message: str) -> bool:
        """Определить, является ли сообщение приветствием"""
        return any(re.search(pattern, message, re.IGNORECASE) for pattern in self.greeting_patterns)

    def _is_question(self, message: str) -> bool:
        """Определить, является ли сообщение вопросом"""
        return message.endswith('?') or any(re.search(pattern, message, re.IGNORECASE) for pattern in self.question_patterns)

    def _classify_question(self, message: str) -> str:
        """Классифицировать тип вопроса"""
        if any(word in message for word in ['прогресс', 'результат', 'весе']):
            return "progress"
        elif any(word in message for word in ['рекоменд', 'советуе', 'предлагае']):
            return "recommendation"
        elif any(word in message for word in ['как делать', 'правильно', 'техник']):
            return "exercise_info"
        else:
            return "general"

    def _extract_exercise_name_from_question(self, message: str) -> Optional[str]:
        """Извлечь название упражнения из вопроса"""
        # Простая логика - ищем известные упражнения в сообщении
        known_exercises = ["жим", "присед", "тяга", "отжимания", "подтягивания", "планка"]
        
        for exercise in known_exercises:
            if exercise in message:
                # Расширяем поиск для полного названия
                if exercise == "жим":
                    if "лежа" in message or "лёжа" in message:
                        return "жим лежа"
                    elif "стоя" in message:
                        return "жим стоя"
                    else:
                        return "жим"
                return exercise
        
        return None

    def _parse_workout_log(self, message: str) -> Optional[List[Dict]]:
        """Распарсить сообщение как лог тренировки"""
        
        exercises = []
        
        for pattern in self.workout_patterns:
            matches = re.finditer(pattern, message, re.IGNORECASE)
            
            for match in matches:
                exercise_data = self._extract_exercise_data_from_match(match, pattern)
                if exercise_data:
                    exercises.append(exercise_data)
        
        return exercises if exercises else None

    def _extract_exercise_data_from_match(self, match, pattern: str) -> Optional[Dict]:
        """Извлечь данные упражнения из regex match"""
        
        groups = match.groups()
        
        try:
            # Базовая структура данных
            exercise_data = {
                "name": self._clean_exercise_name(groups[0]),
                "sets": 1,
                "reps": None,
                "weight": None,
                "duration": None,
                "notes": None
            }
            
            # В зависимости от паттерна извлекаем данные
            if len(groups) >= 4:  # Полный формат: название, вес, подходы, повторения
                exercise_data.update({
                    "weight": float(groups[1]),
                    "sets": int(groups[2]),
                    "reps": int(groups[3])
                })
            elif len(groups) == 3:
                if "секунд" in pattern or "минут" in pattern:
                    # Временное упражнение
                    exercise_data.update({
                        "duration": int(groups[1]) * (60 if "минут" in pattern else 1)
                    })
                else:
                    # Подходы и повторения без веса
                    exercise_data.update({
                        "sets": int(groups[1]),
                        "reps": int(groups[2])
                    })
            elif len(groups) == 2:
                if groups[1].isdigit():
                    # Может быть количество повторений
                    exercise_data["reps"] = int(groups[1])
            
            return exercise_data
            
        except (ValueError, IndexError):
            return None

    def _clean_exercise_name(self, name: str) -> str:
        """Очистить и нормализовать название упражнения"""
        
        # Убираем лишние слова
        name = re.sub(r'^(делал|сделал|выполнял)\s+', '', name.strip())
        
        # Нормализуем распространенные названия
        name_mappings = {
            "жим лёжа": "жим лежа",
            "присед": "приседания",
            "тяга штанги": "тяга штанги в наклоне",
            "подтяжки": "подтягивания",
            "отжим": "отжимания"
        }
        
        for old_name, new_name in name_mappings.items():
            if old_name in name.lower():
                name = new_name
                break
        
        return name.title()

    def _extract_numbers(self, text: str) -> List[float]:
        """Извлечь все числа из текста"""
        return [float(match.replace(',', '.')) for match in re.findall(r'\d+(?:[.,]\d+)?', text)]

    def find_similar_exercises(self, exercise_name: str, limit: int = 5) -> List[Dict]:
        """Найти похожие упражнения по названию"""
        from app.models.models import Exercise
        
        # Получаем все упражнения из БД
        all_exercises = self.db.query(Exercise).all()
        exercise_names = [ex.name.lower() for ex in all_exercises]
        
        # Ищем похожие названия
        similar_names = get_close_matches(
            exercise_name.lower(), 
            exercise_names, 
            n=limit, 
            cutoff=0.4
        )
        
        # Возвращаем соответствующие упражнения
        similar_exercises = []
        for name in similar_names:
            exercise = next((ex for ex in all_exercises if ex.name.lower() == name), None)
            if exercise:
                similar_exercises.append({
                    "id": exercise.id,
                    "name": exercise.name,
                    "category": exercise.category,
                    "similarity": self._calculate_similarity(exercise_name.lower(), name)
                })
        
        return sorted(similar_exercises, key=lambda x: x["similarity"], reverse=True)

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Простой расчет схожести строк"""
        from difflib import SequenceMatcher
        return SequenceMatcher(None, str1, str2).ratio()

    def suggest_corrections(self, message: str) -> List[str]:
        """Предложить исправления для неразпознанного сообщения"""
        suggestions = []
        
        # Проверяем основные ошибки в формате
        if re.search(r'\d+', message) and not re.search(r'кг|подход|раз|сек|мин', message):
            suggestions.append("Добавьте единицы измерения: кг, подходы, повторения")
        
        if re.search(r'[а-я]+\s+\d+', message, re.IGNORECASE):
            if not re.search(r'\d+\s*[хx×*]\s*\d+', message):
                suggestions.append("Укажите формат подходов, например: 3х8 или 3*8")
        
        # Ищем возможные упражнения в тексте
        words = re.findall(r'[а-яё]+', message.lower(), re.IGNORECASE)
        for word in words:
            if len(word) > 3:  # Только длинные слова
                similar = self.find_similar_exercises(word, 2)
                if similar:
                    suggestions.append(f"Возможно, вы имели в виду: {similar[0]['name']}")
                    break
        
        return suggestions[:3]  # Максимум 3 предложения