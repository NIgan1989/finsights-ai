# ⚡ Быстрый старт для локальной разработки

## 🎯 Цель
Запустить **FinSights AI** локально с полным соответствием background agent окружению.

## 🚀 Команды быстрого запуска

```bash
# 1. Клонировать репозиторий
git clone <your-repo-url>
cd finsights-ai

# 2. Установить Node.js v22.16.0 (если нужно)
nvm install 22.16.0
nvm use 22.16.0

# 3. Автоматическая проверка и настройка
npm run setup-local

# 4. Установить зависимости (если нужно)
npm install --legacy-peer-deps

# 5. Запустить проект
npm start

# 6. Открыть в браузере
# http://localhost:3000
```

## ✅ Проверка установки

```bash
# Проверить версии
npm run check-env
# Ожидаемый вывод:
# Node: v22.16.0
# npm: 10.9.2

# Проверить статус проекта
curl -I http://localhost:3000
# Ожидаемый вывод: HTTP/1.1 200 OK
```

## 🔧 При проблемах

```bash
# Проблемы с зависимостями:
rm -rf node_modules package-lock.json
npm install --force

# Проблемы с портом:
lsof -ti:3000 | xargs kill -9

# Повторная настройка:
npm run setup-local
```

## 📁 Важные файлы

- `.nvmrc` - версия Node.js
- `.env.local` - переменные окружения  
- `setup-local.js` - скрипт настройки
- `LOCAL_SETUP_GUIDE.md` - подробное руководство

## 🎉 Готово!

После выполнения команд выше ваш проект будет работать **точно так же**, как в background agent окружении.

**Happy coding! 🚀**