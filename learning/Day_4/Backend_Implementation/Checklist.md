# ✅ День 4: Backend Checklist - Messages + WebSocket

> Чек-лист для отслеживания прогресса реализации Messages API + WebSocket Gateway

---

## 📋 Теория (Theory.md)

### 1. Messages Schema
- [ ] Понимаю структуру Message schema
- [ ] Понимаю связи sender (ref: 'User') и chat (ref: 'Chat')
- [ ] Знаю зачем нужны индексы ({ chat: 1, createdAt: -1 })
- [ ] Понимаю поля text, type, status
- [ ] Понимаю soft delete через isDeleted

### 2. WebSocket Gateway
- [ ] Понимаю разницу между HTTP и WebSocket
- [ ] Знаю преимущества WebSocket для real-time
- [ ] Понимаю @WebSocketGateway decorator
- [ ] Понимаю @WebSocketServer и Server
- [ ] Знаю lifecycle hooks (OnGatewayConnection, OnGatewayDisconnect)

### 3. Socket.io Rooms
- [ ] Понимаю концепцию комнат (Rooms)
- [ ] Знаю как присоединить клиента к комнате (client.join)
- [ ] Знаю как покинуть комнату (client.leave)
- [ ] Понимаю broadcast в комнату (server.to(roomId).emit)
- [ ] Знаю разницу между server.emit и client.to().emit

### 4. JWT Authorization в WebSocket
- [ ] Понимаю WsJwtGuard
- [ ] Знаю как передать JWT токен в handshake
- [ ] Понимаю client.data для хранения userId
- [ ] Знаю как защитить WebSocket handlers через @UseGuards

### 5. Redis Pub/Sub
- [ ] Понимаю проблему масштабирования WebSocket
- [ ] Знаю как Redis решает синхронизацию между серверами
- [ ] Понимаю RedisIoAdapter
- [ ] Знаю когда Redis обязателен (production vs development)

### 6. Real-time Events
- [ ] Понимаю событие message:send (Client → Server)
- [ ] Понимаю событие message:new (Server → Client)
- [ ] Понимаю событие message:typing
- [ ] Понимаю событие chat:created
- [ ] Знаю когда использовать broadcast vs emit

### 7. CRUD Operations
- [ ] Понимаю создание сообщения (create)
- [ ] Понимаю получение сообщений с пагинацией (getMessages)
- [ ] Понимаю soft delete сообщений
- [ ] Знаю зачем обновлять lastMessage в чате

### 8. Security
- [ ] Понимаю sanitization (sanitize-html)
- [ ] Знаю зачем нужна защита от XSS
- [ ] Понимаю rate limiting (@nestjs/throttler)
- [ ] Знаю как проверять участников чата (isParticipant)

---

## 🛠️ Практика (Practice.md)

### Шаг 1: Установка зависимостей
- [ ] Установил `@nestjs/websockets`
- [ ] Установил `@nestjs/platform-socket.io`
- [ ] Установил `socket.io`
- [ ] Установил `sanitize-html`
- [ ] Установил `@nestjs/throttler`
- [ ] Установил `@types/socket.io` (devDependencies)

### Шаг 2: Message Schema
- [ ] Создал файл `backend/src/modules/messages/schemas/message.schema.ts`
- [ ] Добавил поле `sender` (ObjectId, ref: 'User')
- [ ] Добавил поле `chat` (ObjectId, ref: 'Chat')
- [ ] Добавил поле `text` (string, maxlength: 10000)
- [ ] Добавил поле `type` (enum: text/image/file/voice)
- [ ] Добавил поле `status` (enum: sent/delivered/read)
- [ ] Добавил поле `isDeleted` (boolean, default: false)
- [ ] Добавил `@Schema({ timestamps: true })`
- [ ] Создал индекс `{ chat: 1, createdAt: -1 }`
- [ ] Создал индекс `{ sender: 1 }`

### Шаг 3: CreateMessageDto
- [ ] Создал файл `backend/src/modules/messages/dto/create-message.dto.ts`
- [ ] Добавил валидацию `@IsMongoId()` для chat
- [ ] Добавил валидацию `@IsString()` и `@MaxLength(10000)` для text
- [ ] Добавил опциональное поле `type` с `@IsEnum()`

### Шаг 4: MessagesService
- [ ] Создал файл `backend/src/modules/messages/messages.service.ts`
- [ ] Инжектировал `@InjectModel(Message.name)`
- [ ] Реализовал метод `create(dto, senderId)`
- [ ] Добавил sanitization с `sanitize-html`
- [ ] Добавил `.populate('sender', 'name username avatar')`
- [ ] Реализовал метод `getMessages(chatId, limit, skip)`
- [ ] Добавил сортировку `{ createdAt: -1 }`
- [ ] Возвращаю `{ messages, hasMore }` для пагинации
- [ ] Реализовал метод `findById(messageId)`
- [ ] Реализовал метод `softDelete(messageId)`
- [ ] Реализовал метод `updateStatus(messageId, status)`

### Шаг 5: MessagesController
- [ ] Создал файл `backend/src/modules/messages/messages.controller.ts`
- [ ] Добавил `@Controller('messages')`
- [ ] Добавил `@UseGuards(JwtAuthGuard)`
- [ ] Создал endpoint `POST /messages`
- [ ] Добавил `@Throttle(30, 60)` для rate limiting
- [ ] Добавил проверку `isParticipant` перед созданием
- [ ] Добавил обновление `lastMessage` после создания
- [ ] Создал endpoint `GET /chats/:chatId/messages`
- [ ] Добавил query параметры `limit` и `skip`
- [ ] Создал endpoint `DELETE /messages/:id`
- [ ] Добавил проверку автора перед удалением
- [ ] Использовал `@CurrentUser('userId')` decorator

### Шаг 6: WsJwtGuard
- [ ] Создал папку `backend/src/modules/websocket/guards`
- [ ] Создал файл `ws-jwt.guard.ts`
- [ ] Реализовал `CanActivate` интерфейс
- [ ] Инжектировал `JwtService`
- [ ] Извлекаю токен из `handshake.auth.token` или `headers.authorization`
- [ ] Проверяю токен с `jwtService.verify()`
- [ ] Сохраняю `userId` и `username` в `client.data`
- [ ] Выбрасываю `WsException` если токен невалиден

### Шаг 7: WebsocketGateway
- [ ] Создал файл `backend/src/modules/websocket/websocket.gateway.ts`
- [ ] Добавил `@WebSocketGateway({ cors: { ... } })`
- [ ] Реализовал `OnGatewayConnection` и `OnGatewayDisconnect`
- [ ] Добавил `@WebSocketServer() server: Server`
- [ ] Инжектировал `MessagesService` и `ChatsService`
- [ ] Реализовал `handleConnection` (присоединение к `user-{userId}`)
- [ ] Реализовал `handleDisconnect`
- [ ] Реализовал handler `@SubscribeMessage('chat:join')`
- [ ] Добавил проверку `isParticipant` перед присоединением
- [ ] Реализовал handler `@SubscribeMessage('chat:leave')`
- [ ] Реализовал handler `@SubscribeMessage('message:send')`
- [ ] Добавил валидацию текста (не пустой, макс 10000)
- [ ] Создаю сообщение через `messagesService.create()`
- [ ] Обновляю `lastMessage` через `chatsService.updateLastMessage()`
- [ ] Broadcast `message:new` в комнату чата
- [ ] Реализовал handler `@SubscribeMessage('message:typing')`
- [ ] Транслирую typing всем КРОМЕ отправителя (`client.to().emit`)
- [ ] Реализовал метод `emitChatCreated(chat)`
- [ ] Отправляю `chat:created` в персональные комнаты участников

### Шаг 8: Обновление ChatsService
- [ ] Добавил метод `isParticipant(chatId, userId)`
- [ ] Возвращаю `boolean` (true если участник)
- [ ] Выбрасываю `NotFoundException` если чат не найден
- [ ] Добавил метод `updateLastMessage(chatId, messageId)`
- [ ] Загружаю message по ID
- [ ] Обновляю `lastMessage` в чате с `{ text, sender, createdAt }`
- [ ] Добавил инъекцию `MessageModel` в ChatsService
- [ ] Обновил `ChatsModule` (импорт MessageSchema)
- [ ] Обновил метод `createChat()` для вызова `emitChatCreated()`
- [ ] Добавил инъекцию `WebsocketGateway` через `forwardRef()`

### Шаг 9: MessagesModule
- [ ] Создал файл `backend/src/modules/messages/messages.module.ts`
- [ ] Импортировал `MongooseModule.forFeature([Message])`
- [ ] Импортировал `ThrottlerModule.forRoot({ ttl: 60, limit: 30 })`
- [ ] Импортировал `ChatsModule`
- [ ] Добавил `MessagesController` в controllers
- [ ] Добавил `MessagesService` в providers
- [ ] Экспортировал `MessagesService`

### Шаг 10: WebsocketModule
- [ ] Создал файл `backend/src/modules/websocket/websocket.module.ts`
- [ ] Импортировал `JwtModule.registerAsync()`
- [ ] Импортировал `forwardRef(() => MessagesModule)`
- [ ] Импортировал `forwardRef(() => ChatsModule)`
- [ ] Добавил `WebsocketGateway` в providers
- [ ] Добавил `WsJwtGuard` в providers
- [ ] Экспортировал `WebsocketGateway`

### Шаг 11: Регистрация в AppModule
- [ ] Импортировал `MessagesModule` в AppModule
- [ ] Импортировал `WebsocketModule` в AppModule
- [ ] Добавил оба модуля в imports массив

---

## 🧪 Тестирование

### HTTP Endpoints

#### POST /messages
- [ ] Создаёт новое сообщение
- [ ] Возвращает message с populated sender
- [ ] Обновляет lastMessage в чате
- [ ] Валидация: пустой текст → 400
- [ ] Валидация: текст > 10000 символов → 400
- [ ] Authorization: не участник → 403
- [ ] Rate limiting: 31-е сообщение в минуту → 429
- [ ] Без JWT токена → 401

#### GET /chats/:chatId/messages
- [ ] Возвращает `{ messages, hasMore }`
- [ ] messages отсортированы по createdAt DESC
- [ ] sender populated (name, username, avatar)
- [ ] Не возвращает удалённые сообщения (isDeleted: true)
- [ ] Пагинация работает (limit, skip)
- [ ] `hasMore: true` если есть ещё сообщения
- [ ] Authorization: не участник → 403
- [ ] Без JWT токена → 401

#### DELETE /messages/:id
- [ ] Помечает сообщение как удалённое (isDeleted: true)
- [ ] Не удаляет физически из БД
- [ ] Authorization: не автор → 403
- [ ] Несуществующее сообщение → 404
- [ ] Без JWT токена → 401
- [ ] После удаления: GET не возвращает это сообщение

### WebSocket Events

#### Подключение (connection)
- [ ] Клиент подключается с JWT токеном
- [ ] Токен валидируется через WsJwtGuard
- [ ] Клиент присоединяется к `user-{userId}` комнате
- [ ] Логируется `Client connected: {id}, user: {userId}`
- [ ] Без токена → disconnect
- [ ] Невалидный токен → disconnect

#### chat:join
- [ ] Клиент присоединяется к комнате чата
- [ ] Проверяется isParticipant перед присоединением
- [ ] Возвращает `{ success: true }`
- [ ] Не участник → WsException 'Access denied'
- [ ] Логируется `User {userId} joined chat {chatId}`

#### chat:leave
- [ ] Клиент покидает комнату чата
- [ ] Возвращает `{ success: true }`
- [ ] Логируется `User {userId} left chat {chatId}`

#### message:send
- [ ] Создаёт новое сообщение
- [ ] Проверяет isParticipant перед созданием
- [ ] Валидация: пустой текст → WsException
- [ ] Валидация: текст > 10000 → WsException
- [ ] Обновляет lastMessage в чате
- [ ] Broadcast `message:new` всем в комнате чата
- [ ] Возвращает `{ success: true, message }`
- [ ] Sanitization работает (HTML теги удаляются)
- [ ] message содержит populated sender

#### message:new (получение)
- [ ] Все клиенты в комнате чата получают событие
- [ ] message содержит все поля (text, sender, chat, createdAt)
- [ ] sender populated (name, username, avatar)
- [ ] Клиенты НЕ в комнате НЕ получают событие

#### message:typing
- [ ] Событие транслируется всем в комнате КРОМЕ отправителя
- [ ] Payload: `{ chatId, userId, isTyping }`
- [ ] Возвращает `{ success: true }`

#### chat:created
- [ ] Событие отправляется всем участникам нового чата
- [ ] Отправляется в персональные комнаты `user-{userId}`
- [ ] Payload: полный объект Chat с populated participants
- [ ] Клиенты получают событие в real-time

---

## 📦 Структура файлов

### Созданные файлы
- [ ] `backend/src/modules/messages/schemas/message.schema.ts`
- [ ] `backend/src/modules/messages/dto/create-message.dto.ts`
- [ ] `backend/src/modules/messages/messages.service.ts`
- [ ] `backend/src/modules/messages/messages.controller.ts`
- [ ] `backend/src/modules/messages/messages.module.ts`
- [ ] `backend/src/modules/websocket/guards/ws-jwt.guard.ts`
- [ ] `backend/src/modules/websocket/websocket.gateway.ts`
- [ ] `backend/src/modules/websocket/websocket.module.ts`

### Изменённые файлы
- [ ] `backend/src/modules/chats/chats.service.ts` (добавлены isParticipant, updateLastMessage)
- [ ] `backend/src/modules/chats/chats.module.ts` (импорт MessageSchema)
- [ ] `backend/src/app.module.ts` (добавлены MessagesModule, WebsocketModule)
- [ ] `backend/package.json` (добавлены зависимости)

---

## 🔍 Код Review

### Message Schema
- [ ] Все поля типизированы
- [ ] sender и chat - ObjectId с правильными ref
- [ ] enum для type и status полей
- [ ] maxlength: 10000 для text
- [ ] timestamps: true для createdAt/updatedAt
- [ ] Индексы созданы

### MessagesService
- [ ] Все методы async
- [ ] Используется @InjectModel(Message.name)
- [ ] Sanitization в create()
- [ ] populate() где нужен sender
- [ ] .lean() для оптимизации
- [ ] Пагинация с hasMore флагом

### MessagesController
- [ ] @UseGuards(JwtAuthGuard) на уровне контроллера
- [ ] @Throttle(30, 60) на POST /messages
- [ ] @CurrentUser('userId') для получения userId
- [ ] Authorization checks (isParticipant)
- [ ] Используются DTO для валидации

### WsJwtGuard
- [ ] Реализует CanActivate
- [ ] Проверяет токен в handshake.auth и headers
- [ ] Сохраняет userId в client.data
- [ ] Выбрасывает WsException если невалиден

### WebsocketGateway
- [ ] @WebSocketGateway с CORS настройками
- [ ] @WebSocketServer для доступа к server
- [ ] @UseGuards(WsJwtGuard) на handlers
- [ ] Authorization checks (isParticipant)
- [ ] Валидация входных данных
- [ ] Правильное использование .to() и .emit()
- [ ] emitChatCreated() для уведомлений

### ChatsService (обновления)
- [ ] isParticipant() возвращает boolean
- [ ] updateLastMessage() обновляет subdocument
- [ ] MessageModel инжектирован
- [ ] WebsocketGateway инжектирован через forwardRef

### Модули
- [ ] MessagesModule экспортирует MessagesService
- [ ] WebsocketModule экспортирует WebsocketGateway
- [ ] forwardRef используется для circular dependencies
- [ ] ThrottlerModule настроен
- [ ] Все зависимости импортированы

---

## 🐛 Troubleshooting

### Backend не запускается
- [ ] Проверил `docker-compose logs backend`
- [ ] Проверил что MongoDB запущен
- [ ] Проверил что зависимости установлены (`yarn install`)
- [ ] Проверил импорты (нет ошибок circular dependencies)
- [ ] Проверил что все модули зарегистрированы в AppModule

### WebSocket не подключается
- [ ] Проверил CORS настройки в @WebSocketGateway
- [ ] Проверил что токен передаётся в handshake.auth
- [ ] Проверил логи сервера (`connection error`)
- [ ] Проверил что JWT_SECRET в .env
- [ ] Проверил что Frontend использует правильный URL

### message:new не получается
- [ ] Проверил что клиенты присоединились к комнате (chat:join)
- [ ] Проверил broadcast: `server.to(chatId).emit()`
- [ ] Проверил логи сервера
- [ ] Проверил что Frontend слушает событие

### JWT токен не валидируется
- [ ] Проверил что токен правильный (скопирован из /auth/login)
- [ ] Проверил JWT_SECRET совпадает с auth модулем
- [ ] Проверил что токен не истёк
- [ ] Проверил формат: `Bearer TOKEN` или `handshake.auth.token`

### Rate limiting не работает
- [ ] Проверил что ThrottlerModule импортирован
- [ ] Проверил @Throttle(30, 60) на методе
- [ ] Попробовал отправить 31 сообщение за минуту
- [ ] Проверил ответ: должен быть 429

### lastMessage не обновляется
- [ ] Проверил что updateLastMessage() вызывается после create()
- [ ] Проверил что MessageModel инжектирован в ChatsService
- [ ] Проверил логи ошибок
- [ ] Проверил MongoDB: lastMessage должен быть subdocument

---

## ✅ Критерии завершения

День 4 Backend считается завершённым когда:

### Основное
- [ ] Message Schema создана и индексирована
- [ ] DTOs созданы с валидацией
- [ ] MessagesService реализован полностью
- [ ] MessagesController реализован полностью
- [ ] WsJwtGuard реализован
- [ ] WebsocketGateway реализован полностью
- [ ] ChatsService обновлён (isParticipant, updateLastMessage)
- [ ] Модули зарегистрированы
- [ ] Backend запускается без ошибок

### HTTP Endpoints
- [ ] POST /messages создаёт сообщение
- [ ] GET /chats/:chatId/messages возвращает сообщения с пагинацией
- [ ] DELETE /messages/:id удаляет сообщение (soft delete)
- [ ] Rate limiting работает (30 msg/min)
- [ ] Authorization проверяет участников
- [ ] Sanitization защищает от XSS

### WebSocket
- [ ] Подключение с JWT токеном работает
- [ ] chat:join присоединяет к комнате
- [ ] message:send создаёт и транслирует сообщение
- [ ] message:new получается всеми в комнате
- [ ] message:typing транслируется (кроме отправителя)
- [ ] chat:created отправляется участникам
- [ ] Personalnye комнаты `user-{userId}` работают

### Качество
- [ ] Код следует PATTERNS_CHECKLIST.md
- [ ] Нет XSS уязвимостей (sanitization)
- [ ] Authorization на всех endpoints и handlers
- [ ] Валидация входных данных (DTO, WsException)
- [ ] Индексы созданы для производительности
- [ ] Errors обрабатываются (try-catch)

### Документация
- [ ] Все чек-листы заполнены
- [ ] Понимаю каждую строку кода
- [ ] Могу объяснить как работает WebSocket
- [ ] Могу объяснить как работают Rooms

---

## 🎉 Поздравляем!

Если все пункты отмечены, ты завершил Backend часть Дня 4!

**Следующий шаг:** [Frontend_Implementation](../Frontend_Implementation/) - создание UI сообщений + WebSocket интеграция + виртуализация

---

**Время выполнения:** ~3-4 часа
