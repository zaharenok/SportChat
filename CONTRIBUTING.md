# Contributing to SportChat

Добро пожаловать в проект SportChat! Мы рады вашему вкладу в развитие приложения для отслеживания тренировок.

## 🚀 Быстрый старт

### Требования
- Node.js 18+ 
- Python 3.9+
- Git

### Локальная разработка

1. **Клонирование репозитория**
```bash
git clone https://github.com/zaharenok/SportChat.git
cd SportChat
```

2. **Backend (FastAPI)**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate на Windows
pip install -r requirements.txt
cp .env.example .env  # и настройте переменные
uvicorn main:app --reload --port 8000
```

3. **Frontend (React + Vite)**
```bash
cd frontend
npm install
cp .env.example .env.local  # и настройте переменные
npm run dev
```

4. **Откройте браузер**: http://localhost:3000

## 📋 Процесс разработки

### Ветвление
- `main` - продакшн версия
- `develop` - разработка новых фичей
- `feature/название` - новые возможности
- `fix/название` - исправления багов

### Workflow
1. Создайте ветку от `develop`
2. Внесите изменения
3. Убедитесь что тесты проходят
4. Создайте Pull Request в `develop`

### Стиль кода

**Python (Backend)**
- Используйте `black` для форматирования
- Соблюдайте PEP 8
- Добавляйте docstrings для функций

**TypeScript/React (Frontend)**  
- Используйте Prettier
- Функциональные компоненты с хуками
- TypeScript строгий режим

## 🧪 Тестирование

```bash
# Backend тесты
cd backend
pytest

# Frontend тесты  
cd frontend
npm test
```

## 📦 Структура проекта

```
SportChat/
├── backend/           # FastAPI приложение
│   ├── app/
│   │   ├── routers/   # API endpoints
│   │   ├── models/    # SQLAlchemy модели
│   │   ├── services/  # Бизнес логика
│   └── requirements.txt
├── frontend/          # React + Vite приложение
│   ├── src/
│   │   ├── components/
│   │   ├── api/
│   │   └── lib/
│   └── package.json
└── docs/             # Документация
```

## 🌟 Типы вкладов

### 🐛 Багрепорты
- Используйте GitHub Issues
- Опишите шаги воспроизведения
- Приложите скриншоты если нужно

### ✨ Новые возможности
- Обсудите идею в Issues
- Создайте детальный план
- Учитывайте UX/UI принципы

### 📚 Документация
- README обновления
- API документация
- Примеры использования

## 🔧 Переменные окружения

### Backend (.env)
```env
DATABASE_URL=sqlite:///./sportchat.db
N8N_WEBHOOK_URL=https://n8n.aaagency.at/webhook/your-id
FRONTEND_URL=http://localhost:3000
SECRET_KEY=dev-key
```

### Frontend (.env.local)
```env
REACT_APP_API_BASE_URL=http://localhost:8000
```

## 🚀 Деплой

### Vercel (Frontend)
- Автоматический деплой из `main`
- Настройте env переменные в Dashboard

### Backend деплой
- Можно использовать Railway, Render, или AWS
- Настройте PostgreSQL для продакшена

## 📞 Связь

- **Issues**: Для багов и предложений
- **Discussions**: Для вопросов и идей
- **Email**: Для приватной связи

## 📄 Лицензия

Этот проект использует MIT License. См. [LICENSE](LICENSE) для деталей.

---

Спасибо за ваш вклад в SportChat! 💪🏋️‍♂️