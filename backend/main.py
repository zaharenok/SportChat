from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, workouts, exercises, goals
from app.database.database import create_tables
from app.config import settings

app = FastAPI(
    title="SportChat API",
    description="AI-powered fitness chat assistant API",
    version="1.0.0"
)

# CORS middleware - поддержка как localhost так и продакшен домена
allowed_origins = [
    "http://localhost:3000",  # React dev server
    settings.frontend_url,    # Продакшен URL из .env
]

# Добавляем Vercel домены если есть
if settings.environment == "production":
    allowed_origins.extend([
        "https://*.vercel.app",
        "https://sportchat.vercel.app",  # Замените на ваш домен
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем таблицы при запуске
@app.on_event("startup")
async def startup_event():
    await create_tables()
    # Инициализируем начальные данные
    from app.database.seed_data import init_seed_data
    init_seed_data()

# Подключаем роутеры
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(workouts.router, prefix="/api/workouts", tags=["workouts"])
app.include_router(exercises.router, prefix="/api/exercises", tags=["exercises"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])

@app.get("/")
async def root():
    return {"message": "SportChat API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}