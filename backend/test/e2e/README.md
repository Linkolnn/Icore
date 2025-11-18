# 🧪 E2E WebSocket Tests

Набор E2E тестов для проверки WebSocket функционала.

## 📋 Доступные тесты

### 1. websocket.test.js
Полный E2E тест WebSocket коммуникаций.

**Что тестирует:**
- Подключение к WebSocket
- JWT аутентификация
- Присоединение к чатам
- Отправка и получение сообщений
- События `chat:created`

**Запуск:**
```bash
node backend/test/e2e/websocket.test.js
```

---

### 2. realtime-updates.test.js
Мониторинг real-time событий в режиме реального времени.

**Что делает:**
- Подключается к WebSocket
- Слушает все события
- Выводит их в консоль
- Полезно для отладки

**Запуск:**
```bash
node backend/test/e2e/realtime-updates.test.js
```

**События которые слушает:**
- `message:new` - новые сообщения
- `chat:created` - создание чатов
- `user:status` - статусы пользователей
- `typing:start/stop` - индикаторы набора

---

### 3. send-message.test.js
Быстрая отправка тестового сообщения.

**Параметры:**
- `--email` - email пользователя (default: test1@example.com)
- `--password` - пароль (default: password123)
- `--chat-id` - ID чата (опционально)
- `--message` - текст сообщения

**Примеры запуска:**
```bash
# Простая отправка (в первый доступный чат)
node backend/test/e2e/send-message.test.js

# С параметрами
node backend/test/e2e/send-message.test.js --message="Hello World"

# В конкретный чат
node backend/test/e2e/send-message.test.js --chat-id=674abc123def --message="Test"

# От другого пользователя
node backend/test/e2e/send-message.test.js --email=test2@example.com
```

---

## 🚀 Перед запуском

### 1. Убедитесь что сервисы запущены:
```bash
docker-compose up -d
```

### 2. Проверьте логи:
```bash
docker-compose logs -f backend
```

### 3. Убедитесь что тестовые пользователи созданы:
```bash
# Создание через API
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","password":"password123","username":"test1","name":"Test User 1"}'

curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"password123","username":"test2","name":"Test User 2"}'
```

---

## 🐛 Отладка

### Если WebSocket не подключается:
1. Проверьте что backend запущен: `docker-compose ps`
2. Проверьте CORS настройки в `websocket.gateway.ts`
3. Проверьте токен: он должен быть валидным

### Если сообщения не приходят:
1. Убедитесь что оба пользователя в одном чате
2. Проверьте что оба присоединились к комнате (`chat:join`)
3. Смотрите логи backend: `docker-compose logs -f backend`

### Полезные команды:
```bash
# Перезапуск backend
docker-compose restart backend

# Очистка БД
docker-compose down -v
docker-compose up -d

# Мониторинг в реальном времени
node backend/test/e2e/realtime-updates.test.js
```

---

## 📊 Ожидаемые результаты

### Успешный тест websocket.test.js:
```
✅ Socket connected: eKj3f8s...
✅ Both users logged in
✅ Chat ready: 674abc...
✅ Both users connected
✅ Both users joined chat
📤 User 1 send response: ✅
📨 User 2 received: Test message 1234567890
✅ Message delivered correctly!
🎉 All tests completed successfully!
```

### Работающий realtime-updates.test.js:
```
📡 Listening for real-time events...

📨 NEW MESSAGE EVENT:
   Chat ID: 674abc...
   Text: Hello World
   Sender: test2
   Time: 10:30:45

💬 NEW CHAT EVENT:
   Chat ID: 674def...
   Type: personal
   Participants: 2
```
