# ИCore Messenger

Защищенный мессенджер с end-to-end шифрованием на основе современного технологического стека.

## 🚀 Технологический Стек

### Frontend
- **Nuxt 4** - Framework на основе Vue 3
- **Vue 3** - Progressive JavaScript Framework
- **Pinia** - State Management
- **SASS** - CSS Preprocessor
- **Socket.io Client** - Real-time коммуникация
- **VueUse** - Коллекция композиций для Vue

### Backend
- **NestJS** - Progressive Node.js Framework
- **Node.js** - JavaScript Runtime
- **MongoDB** - NoSQL Database
- **Mongoose** - MongoDB ODM
- **JWT** - Аутентификация
- **Redis** - Кэширование и Pub/Sub
- **WebSocket** - Real-time коммуникация
- **WebRTC** - Видео/аудио звонки
- **Socket.io** - WebSocket Library

### DevOps
- **Docker** - Контейнеризация
- **Docker Compose** - Оркестрация контейнеров
- **Yarn** - Package Manager

## 🔐 Архитектура Шифрования

### End-to-End Encryption (E2EE)

- **Алгоритм**: AES-GCM (256-bit)
- **Ключ**: Генерируется из passphrase пользователя через PBKDF2
- **Обмен ключами**: Diffie-Hellman для групповых чатов
- **Хранение**: Сервер хранит только зашифрованные сообщения
- **Безопасность**: Ключи никогда не покидают клиента

## 🏗️ Архитектура Приложения

### Модульный Монолит

Проект реализован как **Modular Monolith** - промежуточное решение между монолитом и микросервисами.

**Модули Backend:**
- `auth` - JWT аутентификация и авторизация
- `users` - CRUD операции с пользователями
- `messages` - Обработка и хранение сообщений
- `chats` - Управление чатами/комнатами
- `websocket` - Real-time события через WebSocket
- `webrtc` - Сигналинг для видео/аудио звонков
- `encryption` - Вспомогательные функции шифрования

## 🚀 Быстрый Старт

### Предварительные Требования

- Node.js >= 20
- Yarn >= 1.22
- Docker и Docker Compose (опционально)

### Установка

#### 1. Клонирование репозитория

```bash
cd icore-messenger
```

#### 2. Настройка Backend

```bash
cd backend
cp .env.example .env
# Отредактируйте .env при необходимости
yarn install
```

#### 3. Настройка Frontend

```bash
cd ../frontend
cp .env.example .env
# Отредактируйте .env при необходимости
yarn install
```

### Запуск с Docker

```bash
# Вернитесь в корень проекта
cd ..

# Запустите все сервисы
docker-compose up -d

# Проверьте статус
docker-compose ps
```

**Доступ:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MongoDB: localhost:27017
- Redis: localhost:6379

### Запуск без Docker

#### Terminal 1 - MongoDB и Redis

```bash
# Запустите только инфраструктуру
docker-compose up -d mongodb redis
```

#### Terminal 2 - Backend

```bash
cd backend
yarn start:dev
```

#### Terminal 3 - Frontend

```bash
cd frontend
yarn dev
```

## 📚 Документация

### Backend API Endpoints

```
POST   /api/auth/register     - Регистрация
POST   /api/auth/login        - Вход
GET    /api/users/me          - Текущий пользователь
GET    /api/chats             - Список чатов
POST   /api/chats             - Создать чат
GET    /api/messages/:chatId  - Получить сообщения
POST   /api/messages          - Отправить сообщение
```

### WebSocket Events

```
connect              - Подключение
disconnect           - Отключение
message:send         - Отправка сообщения
message:receive      - Получение сообщения
typing:start         - Начало печати
typing:stop          - Конец печати
user:online          - Пользователь онлайн
user:offline         - Пользователь оффлайн
```

## 🛠️ Разработка

### Структура Модуля (NestJS)

```
modules/[module-name]/
├── [module-name].module.ts      # Модуль
├── [module-name].service.ts     # Бизнес-логика
├── [module-name].controller.ts  # HTTP endpoints
├── [module-name].gateway.ts     # WebSocket (если нужно)
├── dto/                         # Data Transfer Objects
├── entities/                    # Mongoose Schemas
└── interfaces/                  # TypeScript Interfaces
```

### Добавление нового модуля

```bash
cd backend
nest g module modules/[name]
nest g service modules/[name]
nest g controller modules/[name]
```

## 🔒 Безопасность

- JWT токены для аутентификации
- Bcrypt для хэширования паролей
- CORS настроен для frontend
- Rate limiting на API endpoints
- Input validation через class-validator
- Helmet.js для HTTP заголовков безопасности

## 📦 Сборка для Production

### Backend

```bash
cd backend
yarn build
yarn start:prod
```

### Frontend

```bash
cd frontend
yarn build
yarn preview
```

### Docker Production Build

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
3. Push в branch (`git push origin feature/AmazingFeature`)
4. Откройте Pull Request

## 📝 License

MIT License

## 👨‍💻 Автор

Ваше Имя - [@yourhandle](https://github.com/yourhandle)

---

**Статус:** 🚧 В разработке
