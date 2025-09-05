# Vercel Environment Variables

## Обязательные переменные для Vercel

### Frontend (Next.js/React)
```bash
# API Base URL
REACT_APP_API_URL=https://your-backend-domain.com

# Environment
NODE_ENV=production
```

### Backend (если деплоите отдельно)
```bash
# N8N Webhook Configuration
N8N_WEBHOOK_URL=https://n8n.aaagency.at/webhook/ca45977e-cf5b-4b7b-a471-3a55da6bf356

# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database
# или
DATABASE_URL=sqlite:///./sportchat.db

# CORS Configuration  
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Application Settings
ENVIRONMENT=production
LOG_LEVEL=INFO

# Security
SECRET_KEY=your-very-secure-secret-key-here
JWT_SECRET=another-secure-jwt-secret-key
```

## Инструкции по настройке в Vercel

### Через Web UI:
1. Зайти в проект на vercel.com
2. Settings → Environment Variables
3. Добавить каждую переменную:
   - Name: `N8N_WEBHOOK_URL`
   - Value: `https://n8n.aaagency.at/webhook/ca45977e-cf5b-4b7b-a471-3a55da6bf356`
   - Environment: Production, Preview, Development (выбрать нужные)

### Через Vercel CLI:
```bash
# Установить CLI
npm i -g vercel

# Логин
vercel login

# Добавить переменную
vercel env add N8N_WEBHOOK_URL production
# Ввести значение: https://n8n.aaagency.at/webhook/ca45977e-cf5b-4b7b-a471-3a55da6bf356

# Список всех переменных
vercel env ls
```

## Рекомендации по безопасности

1. **Никогда не коммитьте .env файлы в Git**
2. **Используйте сложные секретные ключи**
3. **Ограничьте доступ к переменным окружения**
4. **Регулярно ротируйте ключи и токены**

## Переменные по приоритету:

### Критически важные:
- `N8N_WEBHOOK_URL` - для работы AI чата
- `DATABASE_URL` - для подключения к БД

### Важные:
- `FRONTEND_URL` - для CORS
- `SECRET_KEY` - для безопасности

### Опциональные:
- `LOG_LEVEL` - для логирования  
- `ENVIRONMENT` - для определения окружения