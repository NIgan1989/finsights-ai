# FinSights AI

ИИ-платформа для финансовой аналитики бизнеса

## Быстрый старт

### 1. Установка зависимостей
```bash
npm install
cd backend && npm install
```

### 2. Настройка (опционально)

Создайте файл `backend/.env` для дополнительных настроек:
```env
OPENAI_API_KEY=your_openai_api_key_here
SESSION_SECRET=случайная_строка_минимум_32_символа
JWT_SECRET=случайная_строка_минимум_32_символа
PORT=3001
```

⚠️ **Примечание:** Google OAuth удален! Теперь используется простая авторизация логин/пароль.

### 3. Готовые аккаунты для тестирования

**Демо пользователь:**
- Email: `demo@finsights.ai`
- Пароль: `demo123`

**Администратор:**
- Email: `admin@finsights.ai`
- Пароль: `admin123`

**Или создайте новый аккаунт** прямо в приложении!

### 4. Запуск
```bash
npm run dev:all
```

Приложение будет доступно на:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Функции

- 🤖 ИИ-анализ финансовых данных
- 📊 Интерактивные дашборды и отчёты  
- 💼 Управление бизнес-профилями
- 📈 Прогнозирование и рекомендации
- 📄 Экспорт в PDF/Excel
- 🔒 Безопасное хранение данных
- 👤 Простая регистрация и авторизация

## Тарифы

- **Бесплатно:** 1 профиль, до 200 транзакций
- **PRO (2200₸/мес):** Безлимит профилей и транзакций

## Техподдержка

- Админ-панель: http://localhost:5173/admin
- Отладка авторизации: http://localhost:5173/auth-debug

## Авторизация

### Простая система входа:
1. **Регистрация:** Укажите email, пароль и имя
2. **Вход:** Введите email и пароль
3. **Быстрый вход:** Используйте кнопки "Демо" или "Админ"

### Безопасность:
- Пароли хешируются с помощью bcrypt
- Сессии защищены httpOnly cookies
- JWT токены для API запросов

### Для разработчиков:
```bash
# Быстрый вход в демо
curl http://localhost:3001/api/auth/demo

# API регистрации
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","displayName":"Test User"}'

# API входа
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

## Разработка

### Структура проекта:
```
finsights-ai/
├── backend/          # Express.js сервер
│   ├── index.cjs     # Основной сервер
│   └── components/   # React компоненты
├── services/         # Бизнес-логика
├── types.ts          # TypeScript типы
└── README.md
```

### Команды:
- `npm run dev` - только frontend
- `npm run start:backend` - только backend  
- `npm run dev:all` - frontend + backend

### API эндпоинты:
- `POST /api/register` - регистрация
- `POST /api/login` - вход
- `GET /api/me` - текущий пользователь
- `POST /api/logout` - выход
- `GET /api/auth/demo` - быстрый демо-вход
- `GET /api/auth/admin` - быстрый админ-вход

---

© 2025 FinSights AI - Умная финансовая аналитика для бизнеса
