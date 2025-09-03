# 🚀 SportChat n8n Webhook Architecture

## 📋 Обзор

SportChat интегрируется с n8n для обеспечения интеллектуальной обработки тренировочных сообщений через LLM и создания персонализированных планов тренировок.

## 🔄 Архитектура потока данных

```
[Пользователь] → [Frontend] → [Backend] → [n8n Webhook] → [LLM] → [Обработка] → [Backend] → [Frontend]
```

## 🎯 Основные компоненты

### 1. Frontend → Backend
**Endpoint:** `POST /api/chat/message`

```typescript
interface ChatRequest {
  message: string;
  user_id: number;
  context?: {
    previous_workouts: WorkoutSummary[];
    current_streak: number;
    goals: string[];
    preferences: UserPreferences;
  }
}
```

### 2. Backend → n8n Webhook
**Webhook URL:** `https://your-n8n.domain.com/webhook/sportchat`

```json
{
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
}
```

## 🤖 n8n Workflow Обработка

### Шаг 1: Получение webhook
- Валидация входящих данных
- Извлечение контекста пользователя
- Логирование запроса

### Шаг 2: LLM Обработка
**Промпт шаблон:**
```
Ты персональный тренер для пользователя SportChat.

Контекст пользователя:
- Опыт: {user_profile.experience_level}
- Текущий streak: {current_streak} дней
- Цели: {goals}
- Предыдущие тренировки: {previous_workouts}

Сообщение пользователя: "{message}"

Проанализируй сообщение и верни JSON с:
1. Короткий мотивирующий ответ (message)
2. Структурированные данные тренировки (workout_data)
3. Рекомендации для следующей тренировки (recommendations)
4. Обновления календаря (calendar_update)

Формат ответа должен быть строго JSON без дополнительного текста.
```

### Шаг 3: Генерация структурированного ответа

```typescript
interface N8nResponse {
  // Основной ответ пользователю
  message: string;
  
  // Извлеченные данные о тренировке
  workout_data?: {
    exercises: Array<{
      name_original: string;
      name_normalized: string;
      weight?: number;
      sets?: number;
      reps?: number;
      duration_seconds?: number;
      equipment?: string;
      muscle_groups: string[];
      confidence: number; // 0-1
    }>;
    workout_type?: "strength" | "cardio" | "flexibility" | "mixed";
    estimated_duration?: number; // минуты
    intensity_level?: number; // 1-10
    notes?: string;
  };

  // Обновление календаря
  calendar_update?: {
    date: string; // ISO date
    emoji: string; // 💪🏃🧘🏋️
    workout_summary: string;
    completion_percentage: number; // 0-100
    streak_info?: {
      current_streak: number;
      milestone_reached?: boolean;
      achievement?: string;
    }
  };

  // Рекомендации и мотивация
  recommendations?: {
    next_workout_suggestions?: string[];
    progression_tips?: string[];
    recovery_advice?: string;
    form_feedback?: string;
  };

  // Мета информация
  confidence_score: number; // 0-1
  processing_time_ms: number;
  llm_model_used: string;
  language: string;
}
```

## 🔧 Backend Integration

### Новый Webhook Endpoint
```python
@router.post("/webhook/n8n-response", response_model=schemas.ChatResponse)
async def receive_n8n_response(
    response_data: schemas.N8nWebhookResponse,
    db: Session = Depends(get_db)
):
    # Валидация и обработка ответа от n8n
    # Обновление базы данных
    # Отправка ответа на frontend
```

### Новые модели данных
```python
class WorkoutCalendarEntry(Base):
    __tablename__ = "workout_calendar"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, nullable=False)
    emoji = Column(String(10))
    workout_summary = Column(String(200))
    completion_percentage = Column(Float, default=0.0)
    streak_day = Column(Integer, default=0)
    exercises_data = Column(JSON)  # Structured exercise data
    
class N8nProcessingLog(Base):
    __tablename__ = "n8n_logs"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(100), unique=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    original_message = Column(Text)
    n8n_response = Column(JSON)
    confidence_score = Column(Float)
    processing_time_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
```

## 🎨 Frontend Updates

### Calendar Integration
```typescript
// Обновление календаря в реальном времени
const updateCalendarFromChat = (calendarUpdate: CalendarUpdate) => {
  setCalendarData(prev => ({
    ...prev,
    [calendarUpdate.date]: {
      emoji: calendarUpdate.emoji,
      summary: calendarUpdate.workout_summary,
      completion: calendarUpdate.completion_percentage,
      streak: calendarUpdate.streak_info?.current_streak || 0
    }
  }));
};
```

### Enhanced Chat Response
```typescript
interface EnhancedChatResponse {
  message: string;
  workout_logged: boolean;
  calendar_updated: boolean;
  suggestions?: string[];
  recommendations?: WorkoutRecommendations;
  achievements?: Achievement[];
}
```

## 📊 Примеры использования

### Сценарий 1: Логирование силовой тренировки
**Пользователь:** "делал жим лежа 85кг 3х8, приседания 110кг 3х10"

**n8n Response:**
```json
{
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
      },
      {
        "name_original": "приседания",
        "name_normalized": "Squats",
        "weight": 110,
        "sets": 3,
        "reps": 10,
        "muscle_groups": ["quads", "glutes", "hamstrings"],
        "confidence": 0.98
      }
    ],
    "workout_type": "strength",
    "estimated_duration": 60,
    "intensity_level": 8
  },
  "calendar_update": {
    "date": "2025-01-15",
    "emoji": "💪",
    "workout_summary": "Силовая: жим лежа, приседания",
    "completion_percentage": 95,
    "streak_info": {
      "current_streak": 6,
      "milestone_reached": false
    }
  },
  "recommendations": {
    "next_workout_suggestions": [
      "Завтра отдых или легкое кардио",
      "Через 2 дня - тренировка спины и бицепса"
    ],
    "progression_tips": [
      "В следующий раз попробуй 87.5кг в жиме лежа",
      "Следи за техникой в приседаниях с таким весом"
    ]
  },
  "confidence_score": 0.94
}
```

### Сценарий 2: Исправление записи
**Пользователь редактирует:** "жим лежа 80" → "жим лежа 90кг 3х6"

**n8n Response:**
```json
{
  "message": "✏️ Запись обновлена: жим лежа 90кг 3х6. Хороший рабочий вес!",
  "workout_data": {
    "exercises": [
      {
        "name_original": "жим лежа",
        "name_normalized": "Bench Press",
        "weight": 90,
        "sets": 3,
        "reps": 6,
        "muscle_groups": ["chest", "triceps", "shoulders"],
        "confidence": 0.99
      }
    ]
  },
  "calendar_update": {
    "date": "2025-01-15",
    "emoji": "💪",
    "workout_summary": "Силовая: жим лежа 90кг",
    "completion_percentage": 100
  },
  "recommendations": {
    "progression_tips": [
      "90кг на 6 повторений - отличный результат!",
      "В следующий раз можно попробовать 8 повторений"
    ]
  }
}
```

## 🚦 Fallback Strategy

### Offline Mode
Если n8n недоступен, backend использует локальную обработку:

```python
class FallbackService:
    async def process_message_locally(self, message: str, user_context: dict):
        # Простая regex-обработка
        # Базовые ответы
        # Минимальное логирование
        pass
```

### Error Handling
```python
async def process_with_n8n(message: str):
    try:
        response = await webhook_service.call_n8n(message)
        return response
    except N8nTimeoutError:
        return await fallback_service.process_locally(message)
    except N8nValidationError as e:
        logger.error(f"n8n validation error: {e}")
        return create_error_response("Не удалось обработать сообщение")
```

## 🔒 Security & Configuration

### Environment Variables
```env
# n8n Integration
N8N_WEBHOOK_URL=https://n8n.sportchat.app/webhook/sportchat
N8N_API_KEY=your_secure_api_key
N8N_TIMEOUT=30000
N8N_RETRY_ATTEMPTS=3

# Fallback Settings
ENABLE_FALLBACK=true
FALLBACK_RESPONSES_PATH=./data/fallback_responses.json

# LLM Configuration
LLM_PROVIDER=openai
LLM_MODEL=gpt-4-turbo
LLM_MAX_TOKENS=1000
```

### Rate Limiting
```python
@limiter.limit("10/minute")
async def send_message_endpoint():
    # Rate limiting для предотвращения спама
    pass
```

## 📈 Monitoring & Analytics

### Logging
```python
logger.info({
    "event": "n8n_request",
    "user_id": user_id,
    "message_length": len(message),
    "processing_time_ms": processing_time,
    "confidence_score": response.confidence_score,
    "workout_detected": bool(response.workout_data)
})
```

### Metrics
- Среднее время обработки
- Процент успешных обработок
- Точность распознавания упражнений
- Активность пользователей (streak metrics)

## 🚀 Deployment Strategy

### Phase 1: Basic Integration (Week 1)
- [x] Backend webhook endpoints
- [x] Basic n8n workflow
- [x] Simple exercise recognition

### Phase 2: Enhanced Features (Week 2)
- [ ] Calendar integration
- [ ] Streak tracking
- [ ] Advanced recommendations

### Phase 3: AI-Powered Coaching (Week 3-4)
- [ ] Personalized workout plans
- [ ] Progress analysis
- [ ] Achievement system
- [ ] Social features

## 🎯 Success Metrics

- **User Engagement:** Увеличение daily active users на 40%
- **Accuracy:** 95%+ правильного распознавания упражнений
- **Performance:** < 2 секунды время обработки
- **Retention:** Увеличение 7-day retention на 25%

---

*Этот документ описывает полную архитектуру интеграции SportChat с n8n для создания интеллектуального фитнес-помощника нового поколения.*