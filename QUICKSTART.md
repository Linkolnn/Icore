# 🚀 Быстрый Старт ИCore Messenger

## Текущее Состояние

✅ **Проект полностью создан и готов к разработке!**

### Что Уже Готово

#### Backend (NestJS)
- ✅ Структура проекта создана через `nest new`
- ✅ 7 модулей сгенерированы: auth, users, messages, chats, websocket, webrtc, encryption
- ✅ Все зависимости установлены (Yarn)
- ✅ MongoDB, Redis, JWT, Socket.io, Passport настроены
- ✅ Dockerfile готов

#### Frontend (Nuxt 4)
- ✅ Структура проекта создана через `nuxi init`
- ✅ Nuxt 4 с Vue 3 настроен
- ✅ Pinia добавлена для state management
- ✅ SASS настроен с переменными
- ✅ Socket.io Client и VueUse установлены
- ✅ Структура папок создана
- ✅ Dockerfile готов

#### Docker
- ✅ docker-compose.yml с MongoDB + Redis + Backend + Frontend
- ✅ Network конфигурация
- ✅ Volumes для данных

#### Документация
- ✅ README.md - общая информация
- ✅ ARCHITECTURE.md - детальная архитектура
- ✅ DEVELOPMENT.md - руководство разработчика
- ✅ PROJECT_STRUCTURE.md - структура проекта

---

## 🎯 Варианты Запуска

### Вариант 1: Запуск с Docker (Рекомендуется)

```bash
# 1. Перейдите в папку проекта
cd /home/linkoln/Vue-project/icore-messenger

# 2. Скопируйте env файлы
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Запустите все сервисы
docker-compose up -d

# 4. Проверьте статус
docker-compose ps

# 5. Смотрите логи
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Доступ:**
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:3001
- 📊 MongoDB: localhost:27017
- 🔴 Redis: localhost:6379

### Вариант 2: Локальная Разработка (Без Docker)

#### Terminal 1 - Инфраструктура (MongoDB + Redis)

```bash
cd /home/linkoln/Vue-project/icore-messenger

# Запустить только MongoDB и Redis
docker-compose up -d mongodb redis

# Проверить
docker-compose ps
```

#### Terminal 2 - Backend

```bash
cd /home/linkoln/Vue-project/icore-messenger/backend

# Скопировать env
cp .env.example .env

# Убедиться что зависимости установлены
yarn install

# Запустить в dev режиме
yarn start:dev
```

Backend запустится на http://localhost:3001

#### Terminal 3 - Frontend

```bash
cd /home/linkoln/Vue-project/icore-messenger/frontend

# Скопировать env
cp .env.example .env

# Убедиться что зависимости установлены
yarn install

# Запустить в dev режиме
yarn dev
```

Frontend запустится на http://localhost:3000

---

## 🔍 Проверка Работы

### Backend

```bash
# Проверить здоровье API
curl http://localhost:3001

# Должен вернуть "Hello World!" (из app.controller.ts)
```

### Frontend

Откройте браузер: http://localhost:3000
- Должна отобразиться страница "ИCore Messenger"

### MongoDB

```bash
# Подключиться к MongoDB
docker exec -it icore-mongodb mongosh -u admin -p password123

# Внутри mongosh:
show dbs
use icore
```

### Redis

```bash
# Подключиться к Redis
docker exec -it icore-redis redis-cli

# Внутри redis-cli:
ping
# Должен ответить: PONG
```

---

## 📝 Следующие Шаги Разработки

### 1. Backend - Auth Module (JWT)

```bash
cd backend/src/modules/auth

# Создать файлы:
# - dto/register.dto.ts
# - dto/login.dto.ts
# - jwt.strategy.ts
# - auth.guard.ts
```

**Задача:** Реализовать регистрацию и вход с JWT токенами

### 2. Backend - User Schema (MongoDB)

```bash
cd backend/src/modules/users

# Создать:
# - schemas/user.schema.ts
# - dto/create-user.dto.ts
```

**Задача:** Создать Mongoose схему для пользователей

### 3. Frontend - Auth Pages

```bash
cd frontend/app/pages

# Создать:
# - login.vue
# - register.vue
```

**Задача:** Страницы авторизации

### 4. Frontend - Auth Store (Pinia)

```bash
cd frontend/app/stores

# Создать:
# - auth.ts
```

**Задача:** State management для аутентификации

### 5. Encryption Utils

```bash
cd frontend/app/utils

# Создать:
# - crypto.ts
```

**Задача:** Web Crypto API для E2E шифрования

---

## 📚 Полезные Команды

### Docker

```bash
# Остановить все
docker-compose down

# Пересобрать и запустить
docker-compose up -d --build

# Очистить volumes (ОСТОРОЖНО: удалит данные)
docker-compose down -v

# Логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
docker-compose logs -f redis
```

### Backend

```bash
cd backend

# Dev режим с hot-reload
yarn start:dev

# Debug режим
yarn start:debug

# Production build
yarn build
yarn start:prod

# Тесты
yarn test

# Генерация модуля
nest g module modules/[name]
nest g service modules/[name]
nest g controller modules/[name]
```

### Frontend

```bash
cd frontend

# Dev режим
yarn dev

# Build для production
yarn build

# Preview production build
yarn preview

# Type checking
yarn typecheck
```

### Git

```bash
# Первый коммит
git add .
git commit -m "feat: initial project setup with modular architecture"

# Создать feature branch
git checkout -b feature/auth-implementation

# Посмотреть статус
git status
```

---

## 🐛 Troubleshooting

### Backend не запускается

**Проблема:** `Cannot find module '@nestjs/...'`

```bash
cd backend
rm -rf node_modules yarn.lock
yarn install
```

**Проблема:** `Cannot connect to MongoDB`

```bash
# Проверить что MongoDB запущен
docker-compose ps mongodb

# Рестарт MongoDB
docker-compose restart mongodb

# Проверить логи
docker-compose logs mongodb
```

### Frontend не запускается

**Проблема:** `Module not found`

```bash
cd frontend
rm -rf node_modules .nuxt yarn.lock
yarn install
yarn dev
```

**Проблема:** SASS ошибки

```bash
# Убедиться что sass установлен
cd frontend
yarn add -D sass
```

### Docker проблемы

**Проблема:** Порты заняты

```bash
# Проверить какие порты используются
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis

# Остановить конфликтующие процессы или изменить порты в docker-compose.yml
```

---

## 📖 Документация

- 📘 **README.md** - Главная документация проекта
- 🏗️ **docs/ARCHITECTURE.md** - Детальная архитектура (модульный монолит)
- 👨‍💻 **docs/DEVELOPMENT.md** - Полное руководство разработчика с примерами кода
- 📁 **PROJECT_STRUCTURE.md** - Структура проекта

---

## 🎉 Готово к Работе!

Проект полностью настроен и готов к разработке функционала!

### Рекомендуемый Порядок Разработки:

1. ✅ **Auth System** - JWT аутентификация
2. ✅ **User Management** - CRUD операции с пользователями
3. ✅ **Chat System** - Создание чатов
4. ✅ **Messages** - Отправка/получение сообщений
5. ✅ **E2E Encryption** - Web Crypto API на клиенте
6. ✅ **WebSocket** - Real-time коммуникация
7. ✅ **WebRTC** - Видео/аудио звонки

**Удачи в разработке! 🚀**
