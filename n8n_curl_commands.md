# 🔗 CURL команды для n8n SportChat

## 📤 Отправка данных в n8n (от Backend к n8n)

```bash
# Команда для отправки сообщения пользователя в n8n
curl -X POST "https://your-n8n.domain.com/webhook/sportchat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_KEY" \
  -d '{
    "user_id": 1,
    "message": "делал жим лежа 80кг 3х8",
    "timestamp": "2025-01-15T10:30:00Z",
    "user_context": {
      "previous_workouts": [
        {
          "date": "2025-01-14",
          "exercises": ["жим лежа 75кг 3х8", "приседания 100кг 3х10"],
          "volume": 4200
        }
      ],
      "current_streak": 5,
      "goals": ["увеличить силу", "набрать массу"],
      "user_profile": {
        "experience_level": "intermediate",
        "weight": 75,
        "age": 28
      },
      "session_id": "session_123"
    }
  }'
```

## 📥 Webhook для получения ответа от n8n (от n8n к Backend)

```bash
# URL для настройки в n8n Webhook Node:
# POST http://localhost:8000/api/webhook/n8n-response

# Пример CURL команды которую будет отправлять n8n:
curl -X POST "http://localhost:8000/api/webhook/n8n-response" \
  -H "Content-Type: application/json" \
  -H "X-N8N-Signature: sha256=your_signature" \
  -d '{
    "message": "Отличная силовая тренировка! 💪 Прогресс в жиме лежа +5кг - продолжай в том же духе!",
    "workout_data": {
      "exercises": [
        {
          "name_original": "жим лежа",
          "name_normalized": "Bench Press",
          "weight": 85,
          "sets": 3,
          "reps": 8,
          "muscle_groups": ["chest", "triceps", "shoulders"],
          "confidence": 0.95
        }
      ],
      "workout_type": "strength",
      "estimated_duration": 60,
      "intensity_level": 8
    },
    "calendar_update": {
      "date": "2025-01-15",
      "emoji": "💪",
      "workout_summary": "Силовая: жим лежа 85кг",
      "completion_percentage": 95,
      "streak_info": {
        "current_streak": 6,
        "milestone_reached": false
      }
    },
    "recommendations": {
      "next_workout_suggestions": [
        "Завтра отдых или легкое кардио",
        "Через 2 дня - тренировка спины"
      ],
      "progression_tips": [
        "В следующий раз попробуй 87.5кг",
        "Следи за техникой с таким весом"
      ]
    },
    "confidence_score": 0.94,
    "processing_time_ms": 1250,
    "llm_model_used": "gpt-4-turbo",
    "language": "ru"
  }'
```

## 🧪 Тестирование локального Backend

```bash
# Тест health check
curl -X GET "http://localhost:8000/health"
# Ожидаемый ответ: {"status":"healthy"}

# Тест отправки сообщения в чат
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "жим лежа 80кг 3х8",
    "user_id": 1
  }'

# Тест получения истории чата
curl -X GET "http://localhost:8000/api/chat/history/1"
```

## ⚙️ Настройка в n8n

### 1. Webhook Trigger Node:
- **HTTP Method:** POST
- **Path:** `/webhook/sportchat`
- **Response Mode:** Respond When Last Node Finishes
- **Response Data:** JSON

### 2. HTTP Request Node для LLM:
```json
{
  "method": "POST",
  "url": "https://api.openai.com/v1/chat/completions",
  "headers": {
    "Authorization": "Bearer YOUR_OPENAI_API_KEY",
    "Content-Type": "application/json"
  },
  "body": {
    "model": "gpt-4-turbo",
    "messages": [
      {
        "role": "system",
        "content": "Ты персональный тренер для пользователя SportChat..."
      },
      {
        "role": "user", 
        "content": "{{ $json.message }}"
      }
    ],
    "max_tokens": 1000,
    "temperature": 0.7
  }
}
```

### 3. HTTP Request Node для ответа в Backend:
- **Method:** POST
- **URL:** `http://localhost:8000/api/webhook/n8n-response`
- **Headers:** `Content-Type: application/json`
- **Body:** Результат обработки LLM

## 🔐 Переменные окружения

Добавьте в `.env` файл:
```env
# n8n Integration
N8N_WEBHOOK_URL=https://your-n8n.domain.com/webhook/sportchat
N8N_API_KEY=your_secure_api_key
N8N_TIMEOUT=30000
N8N_RETRY_ATTEMPTS=3

# OpenAI (для LLM)
OPENAI_API_KEY=your_openai_api_key

# Backend
BACKEND_URL=http://localhost:8000
```

## 🚨 Важные моменты безопасности

1. **Используйте HTTPS** для продакшена
2. **Валидируйте подпись** n8n webhook'а
3. **Ограничьте rate limiting** для предотвращения спама
4. **Не логируйте** API ключи и чувствительные данные

## 📊 Мониторинг

```bash
# Проверка логов n8n webhook'ов
tail -f /var/log/n8n/webhooks.log

# Мониторинг Backend
curl -s http://localhost:8000/health | jq .
```