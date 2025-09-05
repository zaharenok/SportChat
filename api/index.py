from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Добавляем путь к backend модулям
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.routers import chat, workouts, exercises, goals
from app.database.database import create_tables
from app.config import settings

app = FastAPI(
    title="SportChat API",
    description="AI-powered fitness chat assistant API",
    version="1.0.0"
)

# CORS middleware - поддержка Vercel доменов
allowed_origins = [
    "http://localhost:3000",
    "https://zaharenok-sport-chat.vercel.app",  # Ваш Vercel домен
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем таблицы при первом запросе
@app.on_event("startup")
async def startup_event():
    try:
        await create_tables()
        # Инициализируем начальные данные
        from app.database.seed_data import init_seed_data
        init_seed_data()
    except Exception as e:
        print(f"Database initialization error: {e}")

# Подключаем роутеры
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(workouts.router, prefix="/api/workouts", tags=["workouts"])
app.include_router(exercises.router, prefix="/api/exercises", tags=["exercises"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])

@app.get("/")
async def root():
    return {"message": "SportChat API is running on Vercel!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "platform": "vercel"}

# Экспорт для Vercel
handler = app