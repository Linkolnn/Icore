# 🛠️ Backend Practice - День 4: WebSocket Gateway

> Пошаговая реализация WebSocket функционала

---

## 📋 Содержание

1. [Создание WebSocket модуля](#step-1-создание-websocket-модуля)
2. [WebSocket Gateway](#step-2-websocket-gateway)
3. [JWT аутентификация](#step-3-jwt-аутентификация)
4. [Обработчики событий](#step-4-обработчики-событий)
5. [Интеграция с ChatsService](#step-5-интеграция-с-chatsservice)
6. [Тестирование](#step-6-тестирование)

---

## Step 1: Создание WebSocket модуля

### 1.1 Генерация модуля

```bash
cd backend
nest g module modules/websocket
```

### 1.2 Создание файлов

```bash
touch src/modules/websocket/websocket.gateway.ts
touch src/modules/websocket/guards/ws-jwt.guard.ts
```

### 1.3 Структура модуля

```typescript
// websocket.module.ts
import { Module, forwardRef } from '@nestjs/common'
import { WebsocketGateway } from './websocket.gateway'
import { MessagesModule } from '../messages/messages.module'
import { ChatsModule } from '../chats/chats.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    forwardRef(() => MessagesModule),
    forwardRef(() => ChatsModule),
    forwardRef(() => AuthModule),
  ],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
```

---

## Step 2: WebSocket Gateway

### 2.1 Базовая структура Gateway

```typescript
// websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Inject, forwardRef } from '@nestjs/common'
import { MessagesService } from '../messages/messages.service'
import { ChatsService } from '../chats/chats.service'

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server

  constructor(
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
    @Inject(forwardRef(() => ChatsService))
    private chatsService: ChatsService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized')
    // Передаем server в ChatsService для отправки событий
    this.chatsService.setSocketServer(server)
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
  }
}
```

---

## Step 3: JWT аутентификация

### 3.1 Добавление JWT валидации

```typescript
// В websocket.gateway.ts добавляем:

async handleConnection(client: Socket) {
  try {
    const token = client.handshake.auth.token
    
    if (!token) {
      client.disconnect()
      return
    }
    
    // Валидация токена
    const payload = await this.verifyToken(token)
    
    // Сохраняем userId в контексте сокета
    client.data.userId = payload.sub
    
    // Автоматически присоединяем к персональной комнате
    client.join(`user-${payload.sub}`)
    
    console.log(`User ${payload.sub} connected`)
    
  } catch (error) {
    console.error('Auth error:', error)
    client.disconnect()
  }
}

private async verifyToken(token: string): Promise<any> {
  // Используем JwtService из AuthModule
  const jwt = require('jsonwebtoken')
  const secret = process.env.JWT_SECRET || 'your-secret'
  
  try {
    return jwt.verify(token, secret)
  } catch (error) {
    throw new Error('Invalid token')
  }
}
```

---

## Step 4: Обработчики событий

### 4.1 Событие присоединения к чату

```typescript
@SubscribeMessage('chat:join')
async handleJoinChat(
  @MessageBody() dto: { chatId: string },
  @ConnectedSocket() client: Socket,
) {
  const userId = client.data.userId
  
  // Проверяем права доступа
  const isParticipant = await this.chatsService.isParticipant(
    dto.chatId,
    userId,
  )
  
  if (!isParticipant) {
    return { success: false, error: 'Access denied' }
  }
  
  // Присоединяем к комнате чата
  client.join(`chat-${dto.chatId}`)
  
  return { success: true, message: `Joined chat ${dto.chatId}` }
}
```

### 4.2 Событие отправки сообщения

```typescript
@SubscribeMessage('message:send')
async handleMessage(
  @MessageBody() dto: { chatId: string; text: string },
  @ConnectedSocket() client: Socket,
) {
  const userId = client.data.userId
  
  try {
    // 1. Проверка прав
    const isParticipant = await this.chatsService.isParticipant(
      dto.chatId,
      userId,
    )
    
    if (!isParticipant) {
      return { success: false, error: 'Access denied' }
    }
    
    // 2. Создание сообщения
    const message = await this.messagesService.create({
      sender: userId,
      chat: dto.chatId,
      text: dto.text,
      type: 'text',
    })
    
    // 3. Populate отправителя
    const populatedMessage = await this.messagesService.findOne(message._id)
    
    // 4. Отправка в комнату чата
    this.server.to(`chat-${dto.chatId}`).emit('message:new', populatedMessage)
    
    // 5. Отправка в персональные комнаты для обновления списка
    const chat = await this.chatsService.getChatById(dto.chatId, userId)
    if (chat && chat.participants) {
      for (const participant of chat.participants) {
        const participantId = participant._id || participant
        // Отправляем всем участникам для обновления lastMessage
        this.server.to(`user-${participantId}`).emit('message:new', populatedMessage)
      }
    }
    
    // 6. Обновление unreadCount для получателей
    await this.chatsService.incrementUnreadCount(dto.chatId, userId)
    
    // 7. Acknowledgment отправителю
    return { success: true, message: populatedMessage }
    
  } catch (error) {
    console.error('Message send error:', error)
    return { success: false, error: error.message }
  }
}
```

### 4.3 Событие выхода из чата

```typescript
@SubscribeMessage('chat:leave')
async handleLeaveChat(
  @MessageBody() dto: { chatId: string },
  @ConnectedSocket() client: Socket,
) {
  client.leave(`chat-${dto.chatId}`)
  return { success: true, message: `Left chat ${dto.chatId}` }
}
```

---

## Step 5: Интеграция с ChatsService

### 5.1 Добавление Socket.io в ChatsService

```typescript
// chats.service.ts
import { Server } from 'socket.io'

@Injectable()
export class ChatsService {
  private io: Server

  setSocketServer(server: Server) {
    this.io = server
  }

  async createChat(dto: CreateChatDto, userId: string) {
    // ... создание чата ...
    
    const createdChat = await this.chatModel
      .findById(chat._id)
      .populate('participants', '-password -refreshToken')
      .lean()
    
    // Отправляем событие всем участникам
    if (this.io) {
      const chatWithUnread = {
        ...createdChat,
        unreadCount: 0,
      }
      
      createdChat.participants.forEach((participant: any) => {
        const participantId = participant._id || participant
        this.io.to(`user-${participantId}`).emit('chat:created', chatWithUnread)
      })
    }
    
    return createdChat
  }
}
```

### 5.2 Метод проверки участника

```typescript
// chats.service.ts
async isParticipant(chatId: string, userId: string): Promise<boolean> {
  const chat = await this.chatModel.findById(chatId)
  
  if (!chat || chat.isDeleted) {
    return false
  }
  
  const userIdStr = toStringId(userId)
  return chat.participants.some((p) => compareIds(p, userIdStr))
}
```

---

## Step 6: Тестирование

### 6.1 Создание тестового скрипта

```javascript
// test-websocket.js
const io = require('socket.io-client')

async function testWebSocket() {
  // 1. Получаем токен
  const loginResponse = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test1@example.com',
      password: 'password123',
    }),
  })
  const { accessToken } = await loginResponse.json()
  
  // 2. Подключаемся к WebSocket
  const socket = io('http://localhost:3001', {
    auth: { token: accessToken },
  })
  
  // 3. Слушаем события
  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket')
    
    // Присоединяемся к чату
    socket.emit('chat:join', { chatId: '...' }, (response) => {
      console.log('Join response:', response)
      
      // Отправляем сообщение
      socket.emit(
        'message:send',
        { chatId: '...', text: 'Test message' },
        (response) => {
          console.log('Message response:', response)
        },
      )
    })
  })
  
  socket.on('message:new', (message) => {
    console.log('📨 New message:', message)
  })
  
  socket.on('chat:created', (chat) => {
    console.log('💬 New chat:', chat)
  })
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected')
  })
}

testWebSocket()
```

### 6.2 Проверка логов

```bash
# Backend логи
docker-compose logs -f backend

# Должны видеть:
# WebSocket Gateway initialized
# User 123... connected
# Joined chat 456...
# Message sent successfully
```

---

## 🎯 Чек-лист

- [ ] WebSocket модуль создан
- [ ] Gateway настроен с CORS
- [ ] JWT аутентификация работает
- [ ] Персональные комнаты создаются
- [ ] События chat:join/leave работают
- [ ] message:send отправляет в несколько комнат
- [ ] ChatsService интегрирован с Socket.io
- [ ] chat:created событие отправляется
- [ ] Тесты проходят успешно

---

## 🐛 Частые ошибки

### 1. Client disconnects immediately
```
Причина: Неверный токен или отсутствует
Решение: Проверить передачу токена в auth.token
```

### 2. forwardRef dependency errors
```
Причина: Циклические зависимости
Решение: Использовать forwardRef(() => Module)
```

### 3. Events not received
```
Причина: Не присоединились к комнате
Решение: Проверить client.join() вызовы
```

### 4. Multiple messages received
```
Причина: Отправка в несколько комнат
Решение: Проверить логику отправки, исключить дубли
```

---

## 📚 Полезные команды

```bash
# Перезапуск backend
docker-compose restart backend

# Просмотр логов
docker-compose logs -f backend

# Тестирование
node test-websocket.js

# Отладка в Chrome
chrome://inspect -> Remote Target -> backend
```
