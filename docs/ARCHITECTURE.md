# Архитектура ИCore Messenger

## Общий Обзор

Проект построен по принципу **Модульного Монолита** с возможностью миграции к микросервисам.

## Почему Модульный Монолит?

### Преимущества для Solo-разработчика

1. **Простота разработки**
   - Один репозиторий
   - Единая кодовая база
   - Проще отладка

2. **Быстрый старт**
   - Меньше boilerplate кода
   - Не нужна сложная инфраструктура
   - Единый деплой

3. **Готовность к масштабированию**
   - Модули слабо связаны
   - Можно легко выделить в отдельные сервисы
   - Четкие границы между модулями

### Путь к Микросервисам

```
Монолит               Модульный Монолит          Микросервисы
   |                         |                        |
   |                         |                        |
[Один блок]    ->    [Модуль 1]            ->   [Сервис 1] (Docker)
                     [Модуль 2]            ->   [Сервис 2] (Docker)
                     [Модуль 3]            ->   [Сервис 3] (Docker)
                         |                             |
                   [Одна БД]                    [Своя БД для каждого]
```

## Backend Архитектура

### Слои Приложения

```
┌─────────────────────────────────────┐
│         Controllers                 │  ← HTTP endpoints
├─────────────────────────────────────┤
│         Services                    │  ← Бизнес-логика
├─────────────────────────────────────┤
│         Repositories                │  ← Доступ к данным
├─────────────────────────────────────┤
│         Database (MongoDB)          │  ← Хранилище
└─────────────────────────────────────┘
```

### Модули

#### 1. Auth Module
- Регистрация пользователей
- Вход/выход
- JWT генерация и валидация
- Refresh токены

#### 2. Users Module
- CRUD операции с пользователями
- Профили пользователей
- Поиск пользователей
- Статус онлайн/оффлайн

#### 3. Messages Module
- Создание сообщений
- Получение истории
- Хранение зашифрованных данных
- Метаданные сообщений

#### 4. Chats Module
- Создание чатов (личные, групповые)
- Управление участниками
- Настройки чата
- История чатов

#### 5. WebSocket Module
- Real-time коммуникация
- Обработка событий
- Broadcasting
- Комнаты

#### 6. WebRTC Module
- Сигналинг для звонков
- Обмен SDP/ICE candidates
- Управление звонками
- Peer-to-peer соединение

#### 7. Encryption Module
- Вспомогательные функции
- Валидация ключей
- Утилиты шифрования

### Data Flow

```
Client Request
      ↓
   Controller (HTTP/WS)
      ↓
   Guard (Auth check)
      ↓
   Service (Business logic)
      ↓
   Repository (DB operations)
      ↓
   MongoDB
      ↓
   Response to Client
```

## Frontend Архитектура

### Структура Vue/Nuxt

```
┌─────────────────────────────────────┐
│         Pages                       │  ← Маршруты (auto-routing)
├─────────────────────────────────────┤
│         Components                  │  ← UI компоненты
├─────────────────────────────────────┤
│         Composables                 │  ← Переиспользуемая логика
├─────────────────────────────────────┤
│         Stores (Pinia)              │  ← State management
├─────────────────────────────────────┤
│         Services                    │  ← API вызовы
└─────────────────────────────────────┘
```

### Stores (Pinia)

1. **authStore**
   - Текущий пользователь
   - Токены
   - Login/Logout

2. **chatsStore**
   - Список чатов
   - Активный чат
   - Участники

3. **messagesStore**
   - Сообщения по чатам
   - Отправка/получение
   - Кэш сообщений

4. **encryptionStore**
   - Ключи шифрования
   - Passphrase
   - Encrypt/Decrypt функции

5. **socketStore**
   - WebSocket соединение
   - События
   - Reconnect логика

### Crypto Flow (E2EE)

```
1. Пользователь создает passphrase
   ↓
2. Генерируется ключ через PBKDF2
   ↓
3. Ключ сохраняется в памяти (не на сервере!)
   ↓
4. При отправке сообщения:
   - Сообщение → AES-GCM шифрование → Зашифрованное
   ↓
5. Отправка на сервер
   ↓
6. Получатель:
   - Зашифрованное → AES-GCM расшифровка → Сообщение
```

## База Данных

### MongoDB Схемы

#### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  passwordHash: String,
  publicKey: String,        // Для обмена ключами
  avatar: String,
  status: String,           // online/offline/away
  lastSeen: Date,
  createdAt: Date
}
```

#### Chats Collection
```javascript
{
  _id: ObjectId,
  type: String,             // personal/group
  name: String,
  participants: [ObjectId], // ссылки на Users
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Messages Collection
```javascript
{
  _id: ObjectId,
  chatId: ObjectId,
  senderId: ObjectId,
  encryptedContent: String,  // Зашифрованное сообщение
  iv: String,                // Initialization Vector для AES
  timestamp: Date,
  type: String,              // text/image/file/voice
  metadata: Object           // Дополнительные данные
}
```

## Redis

### Использование

1. **Session хранилище**
   - JWT refresh tokens
   - User sessions

2. **Pub/Sub**
   - Real-time уведомления
   - Broadcasting событий

3. **Кэширование**
   - Онлайн пользователи
   - Активные чаты
   - Frequently accessed data

## WebSocket Communication

### События

```
Client → Server:
- message:send
- typing:start
- typing:stop
- user:status

Server → Client:
- message:new
- user:typing
- user:online
- user:offline
- chat:updated
```

## Безопасность

### Уровни защиты

1. **Транспортный уровень**
   - HTTPS/WSS
   - TLS 1.3

2. **Аутентификация**
   - JWT токены
   - Refresh tokens
   - Bcrypt для паролей

3. **Авторизация**
   - Guards на endpoints
   - Проверка прав доступа
   - Rate limiting

4. **Данные**
   - E2EE шифрование
   - Validation на входе
   - Sanitization данных

## Масштабирование

### Horizontal Scaling

```
Load Balancer (Nginx)
        ↓
   [Backend 1] [Backend 2] [Backend 3]
        ↓           ↓           ↓
      Redis (Shared State)
        ↓
      MongoDB (Replica Set)
```

### Выделение Микросервисов

Когда проект вырастет, можно выделить:

1. **Auth Service**
   - Отдельный микросервис для аутентификации
   - Своя база данных

2. **Chat Service**
   - Обработка чатов и сообщений
   - WebSocket соединения

3. **Media Service**
   - Обработка файлов
   - WebRTC сигналинг

4. **Notification Service**
   - Push уведомления
   - Email уведомления

## Performance

### Оптимизации

1. **Backend**
   - Индексы MongoDB
   - Redis кэширование
   - Pagination для списков
   - Lazy loading

2. **Frontend**
   - Code splitting
   - Lazy load компонентов
   - Virtual scrolling для сообщений
   - Image optimization

3. **WebSocket**
   - Reconnection logic
   - Message batching
   - Compression

## Monitoring

### Метрики

- API response time
- WebSocket connections count
- Database query performance
- Error rates
- User activity

### Инструменты (будущее)

- PM2 для мониторинга Node.js
- MongoDB Atlas для БД
- Redis Cloud
- Sentry для ошибок
- Grafana для метрик
