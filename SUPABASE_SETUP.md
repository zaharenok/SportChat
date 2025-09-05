# Настройка Supabase для SportChat

## 🚀 Шаг 1: Создание проекта Supabase

1. **Регистрация:**
   - Перейти на https://supabase.com
   - Создать аккаунт (можно через GitHub)
   
2. **Создать новый проект:**
   - Название: `SportChat`
   - Пароль базы данных: `сгенерировать сложный пароль`
   - Регион: `Europe West (eu-west-1)` (ближе к России)

3. **Получить настройки подключения:**
   - Settings → Database → Connection string
   - Скопировать URL: `postgresql://postgres:[password]@[host]:5432/postgres`

## 🔧 Шаг 2: Настройка переменных окружения

Обновить в backend/.env:
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_KEY=[anon-key]
```

## 📊 Шаг 3: Создание схемы базы данных

Supabase автоматически создаст таблицы при первом запуске благодаря SQLAlchemy migrations.

Таблицы которые будут созданы:
- `users` - пользователи
- `exercises` - упражнения  
- `workouts` - тренировки
- `workout_logs` - записи упражнений
- `chat_messages` - история чата
- `user_goals` - цели пользователей

## 🚀 Шаг 4: Деплой backend

### Вариант A: Railway (рекомендуется)
1. Зайти на railway.app
2. Connect GitHub repository
3. Выбрать папку `backend`
4. Добавить environment variables:
   - `DATABASE_URL`
   - `N8N_WEBHOOK_URL`
   - `FRONTEND_URL`
   - Остальные из .env.example

### Вариант B: Heroku
1. Установить Heroku CLI
2. Создать Procfile в backend/
3. `heroku create sportchat-api`
4. Настроить environment variables

## 🔗 Шаг 5: Обновить frontend

В frontend/.env.production:
```env
REACT_APP_API_BASE_URL=https://your-backend.railway.app
```

## ✅ Преимущества Supabase

- 🆓 **Бесплатно** до 2GB данных
- 🚄 **Быстрый** PostgreSQL
- 🔒 **Безопасный** с Row Level Security
- 📊 **Dashboard** для мониторинга
- 🔄 **Realtime** возможности
- 🌍 **Глобальная** CDN

## 🛠️ Дополнительные возможности

После настройки можно добавить:
- **Supabase Auth** для регистрации пользователей
- **Realtime subscriptions** для обновлений в реальном времени
- **Storage** для фото упражнений
- **Edge Functions** для serverless логики

## 📞 Поддержка

Если возникнут проблемы:
1. Проверить логи в Supabase Dashboard
2. Убедиться что DATABASE_URL правильный
3. Проверить что backend может подключиться к БД