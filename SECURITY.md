# 🔒 Безопасность проекта SportChat

## ✅ Статус безопасности

- ✅ Все чувствительные данные используют переменные окружения
- ✅ Файл `.env` исключен из git через `.gitignore`
- ✅ Токены и API ключи НЕ хардкодятся в коде
- ✅ Redis сессии с TTL для автоматической очистки
- ✅ Cookie-based аутентификация с httpOnly флагом

## 🚨 Чувствительные данные

Следующие переменные содержат чувствительную информацию и **НИКОГДА** не должны попадать в git:

```bash
KV_REST_API_TOKEN        # Redis токен доступа
KV_REST_API_READ_ONLY_TOKEN  # Redis readonly токен
WEBHOOK_URL             # N8N webhook URL с ID
```

## 📋 Checklist перед деплоем

### На Vercel:
1. **Environment Variables** - Добавьте все переменные из `.env` в Project Settings
2. **НЕ используйте** `.env` файл в продакшене - только через UI Vercel
3. **Проверьте** что Build успешно проходит

### Локальная разработка:
1. Скопируйте `.env.example` в `.env`
2. Заполните реальными значениями
3. **НИКОГДА** не коммитьте `.env` в git

## 🛡️ Рекомендации

### Переменные окружения:
- Используйте только `process.env.ПЕРЕМЕННАЯ`
- Никогда не хардкодьте токены в код
- Регулярно ротируйте API ключи

### Git безопасность:
```bash
# Проверить что .env не отслеживается
git status | grep -v .env

# Если случайно добавили .env
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### Vercel деплой:
1. Environment Variables → Add все переменные
2. Sensitive checkbox ✅ для токенов
3. Production + Preview environments

## 🔍 Аудит безопасности

Последний аудит: $(date)

- [x] Нет хардкод токенов в src/
- [x] .env исключен из git
- [x] .env.example обновлен
- [x] Все API используют process.env
- [x] Redis TTL настроен
- [x] HTTP-only cookies

---

⚠️ **ВАЖНО**: Если вы видите предупреждение о чувствительных данных при деплое - проверьте что переменные добавлены через Vercel UI, а не в коде!