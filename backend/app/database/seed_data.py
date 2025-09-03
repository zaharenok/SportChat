from sqlalchemy.orm import Session
from app.models.models import Exercise, User
from app.database.database import SessionLocal
import json

# Базовые упражнения для заполнения БД
EXERCISES_DATA = [
    # Грудь
    {"name": "Жим штанги лёжа", "category": "strength", "muscle_groups": '["chest", "shoulders", "triceps"]', "equipment": "barbell", "difficulty_level": "intermediate"},
    {"name": "Жим гантелей лёжа", "category": "strength", "muscle_groups": '["chest", "shoulders", "triceps"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Отжимания", "category": "strength", "muscle_groups": '["chest", "shoulders", "triceps"]', "equipment": "bodyweight", "difficulty_level": "beginner"},
    {"name": "Жим на наклонной скамье", "category": "strength", "muscle_groups": '["chest", "shoulders", "triceps"]', "equipment": "barbell", "difficulty_level": "intermediate"},
    {"name": "Разводка гантелей", "category": "strength", "muscle_groups": '["chest"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Отжимания на брусьях", "category": "strength", "muscle_groups": '["chest", "triceps", "shoulders"]', "equipment": "parallel_bars", "difficulty_level": "intermediate"},
    {"name": "Пуловер с гантелью", "category": "strength", "muscle_groups": '["chest", "lats"]', "equipment": "dumbbell", "difficulty_level": "beginner"},
    
    # Спина
    {"name": "Становая тяга", "category": "strength", "muscle_groups": '["back", "glutes", "hamstrings", "traps"]', "equipment": "barbell", "difficulty_level": "advanced"},
    {"name": "Подтягивания", "category": "strength", "muscle_groups": '["back", "biceps"]', "equipment": "pull_up_bar", "difficulty_level": "intermediate"},
    {"name": "Тяга штанги в наклоне", "category": "strength", "muscle_groups": '["back", "biceps"]', "equipment": "barbell", "difficulty_level": "intermediate"},
    {"name": "Тяга гантели в наклоне", "category": "strength", "muscle_groups": '["back", "biceps"]', "equipment": "dumbbell", "difficulty_level": "beginner"},
    {"name": "Тяга верхнего блока", "category": "strength", "muscle_groups": '["back", "biceps"]', "equipment": "cable_machine", "difficulty_level": "beginner"},
    {"name": "Тяга горизонтального блока", "category": "strength", "muscle_groups": '["back", "biceps"]', "equipment": "cable_machine", "difficulty_level": "beginner"},
    {"name": "Гиперэкстензия", "category": "strength", "muscle_groups": '["lower_back", "glutes", "hamstrings"]', "equipment": "hyperextension_bench", "difficulty_level": "beginner"},
    
    # Ноги
    {"name": "Приседания со штангой", "category": "strength", "muscle_groups": '["quadriceps", "glutes", "hamstrings"]', "equipment": "barbell", "difficulty_level": "intermediate"},
    {"name": "Приседания с гантелями", "category": "strength", "muscle_groups": '["quadriceps", "glutes", "hamstrings"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Выпады", "category": "strength", "muscle_groups": '["quadriceps", "glutes", "hamstrings"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Румынская тяга", "category": "strength", "muscle_groups": '["hamstrings", "glutes", "lower_back"]', "equipment": "barbell", "difficulty_level": "intermediate"},
    {"name": "Жим ногами", "category": "strength", "muscle_groups": '["quadriceps", "glutes"]', "equipment": "leg_press_machine", "difficulty_level": "beginner"},
    {"name": "Подъемы на носки", "category": "strength", "muscle_groups": '["calves"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Сгибания ног лёжа", "category": "strength", "muscle_groups": '["hamstrings"]', "equipment": "leg_curl_machine", "difficulty_level": "beginner"},
    {"name": "Разгибания ног", "category": "strength", "muscle_groups": '["quadriceps"]', "equipment": "leg_extension_machine", "difficulty_level": "beginner"},
    
    # Плечи
    {"name": "Жим штанги стоя", "category": "strength", "muscle_groups": '["shoulders", "triceps"]', "equipment": "barbell", "difficulty_level": "intermediate"},
    {"name": "Жим гантелей сидя", "category": "strength", "muscle_groups": '["shoulders", "triceps"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Разводка гантелей в стороны", "category": "strength", "muscle_groups": '["shoulders"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Разводка в наклоне", "category": "strength", "muscle_groups": '["rear_delts", "traps"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Подъемы перед собой", "category": "strength", "muscle_groups": '["front_delts"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Шраги", "category": "strength", "muscle_groups": '["traps"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    
    # Руки
    {"name": "Подъем штанги на бицепс", "category": "strength", "muscle_groups": '["biceps"]', "equipment": "barbell", "difficulty_level": "beginner"},
    {"name": "Подъем гантелей на бицепс", "category": "strength", "muscle_groups": '["biceps"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Молотки", "category": "strength", "muscle_groups": '["biceps", "forearms"]', "equipment": "dumbbells", "difficulty_level": "beginner"},
    {"name": "Французский жим", "category": "strength", "muscle_groups": '["triceps"]', "equipment": "barbell", "difficulty_level": "intermediate"},
    {"name": "Жим узким хватом", "category": "strength", "muscle_groups": '["triceps", "chest"]', "equipment": "barbell", "difficulty_level": "intermediate"},
    {"name": "Разгибания из-за головы", "category": "strength", "muscle_groups": '["triceps"]', "equipment": "dumbbell", "difficulty_level": "beginner"},
    
    # Пресс
    {"name": "Скручивания", "category": "strength", "muscle_groups": '["abs"]', "equipment": "bodyweight", "difficulty_level": "beginner"},
    {"name": "Планка", "category": "strength", "muscle_groups": '["abs", "core"]', "equipment": "bodyweight", "difficulty_level": "beginner"},
    {"name": "Подъемы ног в висе", "category": "strength", "muscle_groups": '["abs", "hip_flexors"]', "equipment": "pull_up_bar", "difficulty_level": "intermediate"},
    {"name": "Велосипед", "category": "strength", "muscle_groups": '["abs", "obliques"]', "equipment": "bodyweight", "difficulty_level": "beginner"},
    {"name": "Русские скручивания", "category": "strength", "muscle_groups": '["abs", "obliques"]', "equipment": "bodyweight", "difficulty_level": "beginner"},
    
    # Кардио
    {"name": "Бег", "category": "cardio", "muscle_groups": '["legs", "cardio"]', "equipment": "none", "difficulty_level": "beginner"},
    {"name": "Велосипед", "category": "cardio", "muscle_groups": '["legs", "cardio"]', "equipment": "bicycle", "difficulty_level": "beginner"},
    {"name": "Эллипс", "category": "cardio", "muscle_groups": '["full_body", "cardio"]', "equipment": "elliptical", "difficulty_level": "beginner"},
    {"name": "Гребля", "category": "cardio", "muscle_groups": '["full_body", "cardio"]', "equipment": "rowing_machine", "difficulty_level": "intermediate"},
    {"name": "Прыжки на скакалке", "category": "cardio", "muscle_groups": '["legs", "cardio"]', "equipment": "jump_rope", "difficulty_level": "beginner"},
    
    # Функциональные
    {"name": "Берпи", "category": "functional", "muscle_groups": '["full_body"]', "equipment": "bodyweight", "difficulty_level": "intermediate"},
    {"name": "Приседания с прыжком", "category": "functional", "muscle_groups": '["legs", "glutes"]', "equipment": "bodyweight", "difficulty_level": "intermediate"},
    {"name": "Отжимания с хлопком", "category": "functional", "muscle_groups": '["chest", "triceps", "shoulders"]', "equipment": "bodyweight", "difficulty_level": "advanced"},
    {"name": "Горка", "category": "functional", "muscle_groups": '["full_body"]', "equipment": "bodyweight", "difficulty_level": "intermediate"},
    {"name": "Махи гирей", "category": "functional", "muscle_groups": '["glutes", "hamstrings", "core"]', "equipment": "kettlebell", "difficulty_level": "intermediate"},
]

def seed_exercises(db: Session):
    """Заполняет базу данных базовыми упражнениями"""
    
    # Проверяем, есть ли уже упражнения в БД
    existing_count = db.query(Exercise).count()
    if existing_count > 0:
        print(f"База данных уже содержит {existing_count} упражнений. Пропускаем заполнение.")
        return
    
    # Добавляем упражнения
    for exercise_data in EXERCISES_DATA:
        exercise = Exercise(**exercise_data)
        db.add(exercise)
    
    db.commit()
    print(f"Добавлено {len(EXERCISES_DATA)} упражнений в базу данных.")

def create_default_user(db: Session):
    """Создает пользователя по умолчанию для тестирования"""
    
    existing_user = db.query(User).filter(User.username == "test_user").first()
    if existing_user:
        print("Тестовый пользователь уже существует.")
        return existing_user
    
    user = User(
        username="test_user",
        email="test@sportchat.com", 
        age=25,
        weight=75.0,
        height=180,
        experience_level="intermediate",
        goals='{"primary": "muscle_gain", "secondary": "strength"}'
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    print("Создан тестовый пользователь.")
    return user

def init_seed_data():
    """Инициализирует начальные данные в БД"""
    db = SessionLocal()
    try:
        seed_exercises(db)
        create_default_user(db)
    finally:
        db.close()

if __name__ == "__main__":
    init_seed_data()