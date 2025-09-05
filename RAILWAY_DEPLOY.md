# 🚂 Деплой Backend на Railway

## Шаг 1: Подготовка Railway

1. Зайти на **https://railway.app**
2. **Login** через GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Выбрать репозиторий `SportChat`

## Шаг 2: Настройка Service

1. Railway покажет структуру проекта
2. **Add Service** → **GitHub Repo** → **backend** (выбрать папку)
3. Railway автоматически определит Python проект

## Шаг 3: Environment Variables

В Railway Dashboard → ваш сервис → **Variables**, добавить:

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
N8N_WEBHOOK_URL=https://n8n.aaagency.at/webhook/ca45977e-cf5b-4b7b-a471-3a55da6bf356
FRONTEND_URL=https://sport-chat-git-main-zaharenokolegwork.vercel.app
ENVIRONMENT=production
LOG_LEVEL=INFO
SECRET_KEY=your-super-secure-random-key-here
JWT_SECRET=another-secure-jwt-key-here
```

⚠️ **Важно:** Замените `[password]` и `[ref]` на реальные значения из Supabase!

## Шаг 4: Deploy

1. Railway автоматически начнет деплой
2. После деплоя получите URL: `https://your-app-name.up.railway.app`
3. Проверить health check: `https://your-backend.railway.app/health`

## Шаг 5: Обновить Vercel

После получения Railway URL, обновить в Vercel Environment Variables:
- `REACT_APP_API_BASE_URL` = `https://your-backend.railway.app`

## Альтернатива: Render

Если Railway не работает:

1. Зайти на **render.com**
2. **New** → **Web Service**
3. Connect GitHub → выбрать репозиторий
4. **Root Directory:** `backend`
5. **Build Command:** `pip install -r requirements.txt`
6. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`