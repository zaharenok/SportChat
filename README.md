# 🏋️ SportChat - Твой спортивный помощник

Умное приложение для отслеживания тренировок и получения персональных советов с интеграцией ИИ.

*Smart fitness tracking application with AI integration for personalized workout advice.*

## 🚀 Возможности

- **📅 Управление тренировочными днями** - создание и отслеживание дней тренировок
- **💬 ИИ чат-помощник** - персональные советы и мотивация 
- **📊 Дашборд с аналитикой** - визуализация прогресса и статистики
- **🎯 Цели и достижения** - постановка целей и отслеживание результатов
- **👤 Профиль пользователя** - управление личными данными
- **🔐 Безопасная аутентификация** - система входа на основе cookies

## 🛠️ Технологии

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Redis (Upstash)
- **Authentication**: Custom cookie-based system
- **Deployment**: Vercel
- **AI Integration**: N8N webhooks
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Требования

- Node.js 18+ 
- npm или yarn
- Redis database (Upstash рекомендуется)
- N8N для ИИ интеграции (опционально)

## ⚡ Быстрый старт

### 1. Клонирование и установка

```bash
git clone <your-repo-url>
cd sportchat
npm install
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
```

Заполните `.env` файл:

```env
# Обязательные переменные
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-redis-token
WEBHOOK_URL=https://your-n8n.com/webhook/your-id

# Опциональные
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

### 3. Запуск разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 🗄️ База данных

Приложение использует **Redis** через Upstash для:

- Пользователи и аутентификация
- Тренировочные дни и данные
- Сообщения чата
- Цели и достижения
- Сессии пользователей (TTL 7 дней)

### Настройка Redis (Upstash)

1. Создайте базу на [upstash.com](https://upstash.com)
2. Скопируйте **REST API URL** и **Token**
3. Добавьте в переменные окружения

## 🔧 Скрипты

```bash
npm run dev          # Запуск dev сервера
npm run build        # Сборка для продакшена  
npm start            # Запуск production сервера
npm run lint         # Проверка кода ESLint
npm run type-check   # Проверка TypeScript типов
```

## 📁 Структура проекта

```
sportchat/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── register/       # Страница регистрации
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Главная страница
│   ├── components/         # React компоненты
│   │   ├── Chat.tsx       # ИИ чат
│   │   ├── Dashboard.tsx  # Аналитика
│   │   ├── DayManager.tsx # Управление днями
│   │   └── ...
│   └── lib/               # Утилиты и API
│       ├── redis-db.ts   # Redis адаптер
│       ├── auth.ts       # Аутентификация
│       └── client-api.ts # Client-side API
├── public/                # Статические файлы
├── .env.example          # Шаблон переменных
├── SECURITY.md          # Инструкции по безопасности
└── README.md           # Этот файл
```

## 🚀 Деплой на Vercel

### 1. Подготовка

```bash
npm run build  # Проверка сборки
```

### 2. Настройка Vercel

1. Подключите репозиторий к Vercel
2. В **Project Settings → Environment Variables** добавьте все переменные из `.env`
3. Отметьте чувствительные переменные как **Sensitive**

### 3. Переменные окружения в Vercel

```env
KV_REST_API_URL          (Sensitive) ✅
KV_REST_API_TOKEN        (Sensitive) ✅  
WEBHOOK_URL              (Sensitive) ✅
NEXT_PUBLIC_WEBHOOK_URL  (Public)
```

### 4. Deploy

Vercel автоматически деплоит при push в main ветку.

## 🔐 Безопасность

- ✅ Все чувствительные данные в переменных окружения
- ✅ `.env` исключен из git
- ✅ Cookie-based аутентификация с httpOnly
- ✅ Redis сессии с автоматическим TTL
- ✅ Валидация всех пользовательских данных

См. [SECURITY.md](./SECURITY.md) для деталей.

## 🤖 ИИ Интеграция

### N8N Webhook

1. Настройте N8N workflow с HTTP webhook
2. Добавьте обработку запросов от SportChat
3. Интегрируйте с вашим ИИ сервисом (OpenAI, Claude, etc.)
4. URL webhook добавьте в `WEBHOOK_URL`

### Пример N8N workflow

```json
{
  "trigger": "webhook",
  "method": "POST", 
  "data": {
    "message": "user message",
    "context": "training context"
  }
}
```

## 🤝 Разработка

### Добавление новых функций

1. Создайте feature branch
2. Добавьте компоненты в `src/components/`
3. API routes в `src/app/api/`
4. Обновите типы в `src/lib/`
5. Создайте PR с описанием

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Компоненты с TypeScript interfaces
- Async/await для асинхронных операций

## 📞 Поддержка

Если возникли вопросы:

1. Проверьте [SECURITY.md](./SECURITY.md) для проблем с деплоем
2. Посмотрите логи в Vercel Functions
3. Проверьте переменные окружения
4. Откройте Issue в репозитории

## 📄 Лицензия

MIT License - можете использовать для любых целей.

---

**Создано с ❤️ для спортивного сообщества**

🚀 **GitHub**: https://github.com/zaharenok  
💪 **Начните тренироваться с ИИ уже сегодня!**
