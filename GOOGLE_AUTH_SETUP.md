# 🔐 Настройка авторизации через Google

## 📋 Пререквизиты

Перед настройкой Google OAuth убедитесь, что у вас установлены необходимые зависимости:

```bash
npm install next-auth@^4.24.7
```

## 🚀 Шаги настройки

### 1. Настройка Google Console

1. Перейдите в [Google Cloud Console](https://console.developers.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **Google+ API** (или Google Identity API)
4. Перейдите в **APIs & Services** → **Credentials**
5. Нажмите **Create Credentials** → **OAuth client ID**
6. Выберите **Web application**
7. Добавьте **Authorized redirect URIs**:
   - Для разработки: `http://localhost:3000/api/auth/callback/google`
   - Для продакшена: `https://yourdomain.com/api/auth/callback/google`
8. Скопируйте **Client ID** и **Client Secret**

### 2. Настройка переменных окружения

Добавьте в ваш `.env` файл:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration  
NEXTAUTH_SECRET=your_nextauth_secret_here_generate_random_string
NEXTAUTH_URL=http://localhost:3000
```

Для генерации `NEXTAUTH_SECRET` выполните:
```bash
openssl rand -base64 32
```

### 3. Проверка установки

После установки зависимостей и настройки переменных окружения:

```bash
npm run dev
```

## ✨ Функциональность

После настройки пользователи смогут:

- **Войти через Google** одним кликом
- **Автоматическое создание аккаунта** при первом входе через Google
- **Синхронизация данных** между Google аккаунтом и локальной базой данных
- **Безопасный выход** с очисткой всех сессий

## 🔧 Интеграция с существующей системой

Google OAuth полностью интегрирован с существующей системой авторизации:

- Пользователи могут входить как через email, так и через Google
- Данные пользователей синхронизируются в едином формате
- Все существующие функции (цели, тренировки, чат) работают одинаково
- Выход происходит из обеих систем одновременно

## 🛡️ Безопасность

- Используется стандарт OAuth 2.0
- Сессии управляются через NextAuth
- Токены автоматически обновляются
- Данные пользователей хранятся локально

## 📱 Как использовать

1. Откройте приложение
2. На странице входа увидите кнопку "Войти через Google"
3. Нажмите на неё и выберите Google аккаунт
4. Приложение автоматически создаст профиль и перенаправит в главное меню

Готово! Теперь у ваших пользователей есть удобный способ авторизации через Google! 🎉