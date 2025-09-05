# 🚀 Настройка SportChat на Vercel (Frontend + Backend)

## 🎯 Преимущества Vercel Functions
- ✅ **Бесплатно** для большинства случаев использования
- ✅ **Один домен** для frontend и API
- ✅ **Автоматический SSL**
- ✅ **Простая настройка**
- ✅ **Нет необходимости в Railway**

## 📋 Шаг 1: Environment Variables в Vercel

Зайти в ваш проект: **https://vercel.com/zaharenoks-projects-6d1abc18**

**Settings** → **Environment Variables** → Add:

### 🔐 Обязательные переменные:

```env
DATABASE_URL
postgresql://postgres:x4-X?W_$x4-X?W_$x4-X?@db.ymxfraufvxprmxfwyvpa.supabase.co:5432/postgres

N8N_WEBHOOK_URL  
https://n8n.aaagency.at/webhook/ca45977e-cf5b-4b7b-a471-3a55da6bf356

SECRET_KEY
your-super-secure-random-key-here-change-this

JWT_SECRET
another-secure-jwt-key-here-change-this

REACT_APP_API_BASE_URL
https://sport-chat-git-main-zaharenokolegwork.vercel.app
```

⚠️ **Важно:** Для каждой переменной выбрать **Production, Preview, Development**

## 🚀 Шаг 2: Redeploy

После добавления environment variables:

1. **Deployments** → найти последний деплой
2. **...** (три точки) → **Redeploy**
3. Ждать ~2-3 минуты

## ✅ Шаг 3: Проверка

### API Health Check:
```
https://sport-chat-git-main-zaharenokolegwork.vercel.app/api/health
```
Ответ: `{"status": "healthy", "platform": "vercel"}`

### Exercises API:
```
https://sport-chat-git-main-zaharenokolegwork.vercel.app/api/exercises/
```
Ответ: массив упражнений из Supabase

### Frontend:
```
https://sport-chat-git-main-zaharenokolegwork.vercel.app
```
Должен загрузиться SportChat с рабочим чатом и дашбордом!

## 🎉 Результат

После настройки у вас будет:

✅ **Frontend:** React app на Vercel  
✅ **Backend API:** Python FastAPI на Vercel Functions  
✅ **Database:** PostgreSQL на Supabase  
✅ **AI Processing:** n8n webhook  

Все в **одном домене** без дополнительных сервисов!

## 🛠️ Troubleshooting

### Function не запускается
- Проверить что `api/index.py` в корне проекта
- Убедиться что `requirements.txt` в корне
- Проверить логи в Vercel Functions

### Database Connection Error
- Проверить DATABASE_URL в Environment Variables
- Убедиться что пароль правильно экранирован
- Проверить что Supabase проект активен

### CORS Error
- Обновить домен в `api/index.py` allowed_origins
- Перезапустить функцию

## 💰 Стоимость
- **Vercel:** Бесплатно (лимиты: 100GB bandwidth, 10M function invocations)
- **Supabase:** Бесплатно (до 2GB database)

**Итого: $0/месяц** для начала! 🎯