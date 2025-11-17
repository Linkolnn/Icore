# ⚙️ День 4: Backend Implementation

> Messages API + WebSocket Gateway для real-time коммуникации

---

## 🎯 Цель

Реализовать Backend API для сообщений + WebSocket Gateway для real-time обмена сообщениями, типинга и уведомлений

---

## 📚 Материалы

- 📖 **[Theory.md](./Theory.md)** - Теория (2-3 ч)
  - Messages Schema
  - WebSocket Gateway
  - Socket.io Rooms
  - JWT Authorization в WebSocket
  - Redis Pub/Sub
  - Real-time Events
  - Security (Sanitization, Rate Limiting)

- 🛠️ **[Practice.md](./Practice.md)** - Практика (3-4 ч)
  - Установка зависимостей
  - Message Schema
  - MessagesService
  - MessagesController
  - WsJwtGuard
  - WebsocketGateway
  - Обновление ChatsService
  - Тестирование HTTP + WebSocket

- ✅ **[Checklist.md](./Checklist.md)** - Чек-лист прогресса

---

## 📦 Что реализуем

### Message Schema

```typescript
Message {
  _id: ObjectId                    // MongoDB ID
  sender: ObjectId                 // ref: 'User'
  chat: ObjectId                   // ref: 'Chat'
  text: string                     // max 10,000 символов
  type: 'text' | 'image' | 'file' | 'voice'
  status: 'sent' | 'delivered' | 'read'
  isDeleted: boolean               // Soft delete
  createdAt: Date
  updatedAt: Date
}
```

### HTTP API Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| POST | `/messages` | Создать сообщение (fallback) | JWT | 30/min |
| GET | `/chats/:chatId/messages` | Получить сообщения с пагинацией | JWT | - |
| DELETE | `/messages/:id` | Удалить сообщение (soft delete) | JWT | - |

### WebSocket Events

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `chat:join` | Client → Server | Присоединиться к комнате чата | `{ chatId }` |
| `chat:leave` | Client → Server | Покинуть комнату чата | `{ chatId }` |
| `message:send` | Client → Server | Отправить сообщение | `{ chatId, text }` |
| `message:new` | Server → Client | Новое сообщение | `Message` object |
| `message:typing` | Client ↔ Server | Индикатор набора | `{ chatId, userId, isTyping }` |
| `chat:created` | Server → Client | Новый чат создан | `Chat` object |

### MessagesService Methods

```typescript
class MessagesService {
  async create(dto: CreateMessageDto, senderId: string): Promise<Message>
  async getMessages(chatId: string, limit: number, skip: number): Promise<{ messages, hasMore }>
  async findById(messageId: string): Promise<Message>
  async softDelete(messageId: string): Promise<void>
  async updateStatus(messageId: string, status: string): Promise<void>
}
```

### WebsocketGateway Handlers

```typescript
@WebSocketGateway()
class WebsocketGateway {
  async handleConnection(client: Socket): Promise<void>
  async handleDisconnect(client: Socket): Promise<void>
  async handleJoinChat(client: Socket, data: { chatId }): Promise<{ success }>
  async handleLeaveChat(client: Socket, data: { chatId }): Promise<{ success }>
  async handleSendMessage(client: Socket, data: { chatId, text }): Promise<{ success, message }>
  async handleTyping(client: Socket, data: { chatId, isTyping }): Promise<{ success }>
  emitChatCreated(chat: Chat): void
}
```

---

## 📁 Файлы для создания

```
backend/src/modules/messages/
├── schemas/
│   └── message.schema.ts           ✅ создаём
├── dto/
│   └── create-message.dto.ts       ✅ создаём
├── messages.module.ts              ✅ создаём
├── messages.service.ts             ✅ создаём
└── messages.controller.ts          ✅ создаём

backend/src/modules/websocket/
├── guards/
│   └── ws-jwt.guard.ts             ✅ создаём
├── websocket.module.ts             ✅ создаём
└── websocket.gateway.ts            ✅ создаём
```

### Обновление существующих файлов

```typescript
// backend/src/modules/chats/chats.service.ts
+ async isParticipant(chatId, userId): Promise<boolean>
+ async updateLastMessage(chatId, messageId): Promise<void>
+ @InjectModel(Message.name) private messageModel
+ @Inject(forwardRef(() => WebsocketGateway))

// backend/src/modules/chats/chats.module.ts
+ MongooseModule.forFeature([Message])

// backend/src/app.module.ts
+ import { MessagesModule } from './modules/messages/messages.module'
+ import { WebsocketModule } from './modules/websocket/websocket.module'
```

---

## 🔑 Ключевые Концепции

### 1. WebSocket vs HTTP

```typescript
// HTTP - однонаправленный (клиент → сервер)
POST /messages { text: "Hello" }

// WebSocket - двунаправленный (клиент ↔ сервер)
socket.emit('message:send', { text: "Hello" })
socket.on('message:new', (message) => { ... })
```

### 2. Socket.io Rooms

```typescript
// Клиент присоединяется к комнате чата
client.join('chat-123')

// Отправка всем в комнате
this.server.to('chat-123').emit('message:new', message)

// Отправка всем КРОМЕ отправителя
client.to('chat-123').emit('message:typing', data)
```

### 3. JWT Authorization в WebSocket

```typescript
// Клиент подключается с токеном
const socket = io('http://localhost:3001', {
  auth: { token: 'YOUR_JWT_TOKEN' }
})

// Сервер проверяет токен в WsJwtGuard
const payload = this.jwtService.verify(token)
client.data.userId = payload.sub // Сохраняем userId
```

### 4. Real-time Events Flow

```
Client A                 Server                  Client B
   |                        |                        |
   |-- message:send ------>|                        |
   |                        |                        |
   |                   [create in DB]               |
   |                        |                        |
   |<-- message:new --------|------ message:new -->|
   |                        |                        |
```

### 5. Sanitization (XSS Protection)

```typescript
import sanitizeHtml from 'sanitize-html'

const sanitized = sanitizeHtml(text, {
  allowedTags: [],      // Никаких HTML тегов
  allowedAttributes: {}
})
```

### 6. Rate Limiting

```typescript
@Throttle(30, 60) // 30 сообщений в 60 секунд
@Post()
async create(...) { ... }
```

---

## ⏱️ Время выполнения

| Раздел | Время |
|--------|-------|
| Theory.md | 2-3 ч |
| Practice.md | 3-4 ч |
| Тестирование | 30-60 мин |
| **Итого** | **~6-8 ч** |

---

## ✅ Критерии завершения

### HTTP API
- ✅ Message Schema создана
- ✅ CreateMessageDto создан
- ✅ MessagesService реализован
- ✅ MessagesController реализован
- ✅ POST /messages создаёт сообщение
- ✅ GET /chats/:chatId/messages возвращает сообщения с пагинацией
- ✅ DELETE /messages/:id удаляет сообщение (soft delete)
- ✅ Rate limiting работает (30 msg/min)
- ✅ Sanitization защищает от XSS

### WebSocket
- ✅ WsJwtGuard реализован
- ✅ WebsocketGateway реализован
- ✅ WebSocket соединение устанавливается с JWT токеном
- ✅ `chat:join` присоединяет к комнате
- ✅ `message:send` создаёт и транслирует сообщение
- ✅ `message:new` получается всеми в комнате
- ✅ `message:typing` транслируется (кроме отправителя)
- ✅ `chat:created` отправляется участникам

### Integration
- ✅ ChatsService обновлён (isParticipant, updateLastMessage)
- ✅ lastMessage обновляется при создании сообщения
- ✅ Authorization проверяет участников
- ✅ Personalnye комнаты `user-{userId}` работают

---

## 🚀 С чего начать?

1. **[Theory.md](./Theory.md)** - изучи концепции WebSocket, Rooms, Real-time Events
2. **[Practice.md](./Practice.md)** - реализуй код пошагово (Messages + WebSocket)
3. **[Checklist.md](./Checklist.md)** - отслеживай прогресс

---

## 🧪 Быстрое тестирование

### Тест HTTP

```bash
# Создать сообщение
curl -X POST http://localhost:3001/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "chat": "CHAT_ID", "text": "Hello!" }'

# Получить сообщения
curl -X GET "http://localhost:3001/api/messages/chats/CHAT_ID?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Тест WebSocket (Browser Console)

```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'YOUR_JWT_TOKEN' }
})

socket.on('connect', () => {
  // Присоединиться к чату
  socket.emit('chat:join', { chatId: 'CHAT_ID' })

  // Отправить сообщение
  socket.emit('message:send', {
    chatId: 'CHAT_ID',
    text: 'Test message'
  })
})

// Слушать новые сообщения
socket.on('message:new', (msg) => console.log('New:', msg))
```

---

## 📞 Нужна помощь?

### Не понимаю концепцию
→ читай [Theory.md](./Theory.md) раздел за разделом

### Не получается реализовать
→ следуй [Practice.md](./Practice.md) пошагово (10 шагов)

### Код не работает
→ проверь [Checklist.md](./Checklist.md) и раздел Troubleshooting

### WebSocket не подключается
→ проверь CORS, JWT токен, логи сервера

### Сообщения не транслируются
→ проверь что клиенты присоединились к комнате (`chat:join`)

---

## 🎯 Что дальше?

После завершения Backend переходи к **[Frontend_Implementation](../Frontend_Implementation/)** для создания:
- MessageBubble component
- MessageList component с виртуализацией
- WebSocket интеграция на клиенте
- Real-time обновления ChatList.vue

---

**Удачи! 🚀**
