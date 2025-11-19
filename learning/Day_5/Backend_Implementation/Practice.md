# 💻 Практика: Backend Implementation

## 📋 План реализации

1. [Обновление схем MongoDB](#step-1-mongodb-schemas)
2. [Создание DTOs](#step-2-dtos)
3. [Typing Manager](#step-3-typing-manager)
4. [Messages Service](#step-4-messages-service)
5. [Messages Controller](#step-5-messages-controller)
6. [WebSocket Gateway](#step-6-websocket-gateway)
7. [Тестирование](#step-7-testing)

---

## Step 1: MongoDB Schemas

### 📝 Обновляем схему сообщения

**Файл:** `backend/src/modules/messages/schemas/message.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chat: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ default: 'text' })
  type: string;

  // Новые поля для Day 5
  @Prop({ 
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read'],
    default: 'sent'
  })
  status: string;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ type: Date })
  editedAt?: Date;

  @Prop({ 
    type: [{
      text: String,
      editedAt: Date
    }],
    default: []
  })
  editHistory: Array<{
    text: string;
    editedAt: Date;
  }>;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  readBy: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  deliveredTo: Types.ObjectId[];

  // Для пересылки сообщений
  @Prop({ 
    type: {
      from: { type: Types.ObjectId, ref: 'User' },
      fromName: String,
      originalChatId: { type: Types.ObjectId, ref: 'Chat' },
      originalMessageId: { type: Types.ObjectId, ref: 'Message' },
      originalCreatedAt: Date
    }
  })
  forwarded?: {
    from: Types.ObjectId;
    fromName: string;
    originalChatId: Types.ObjectId;
    originalMessageId: Types.ObjectId;
    originalCreatedAt: Date;
  };

  // Для ответов
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo?: Types.ObjectId;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Создаем индексы
MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ text: 'text' }); // Для полнотекстового поиска
MessageSchema.index({ sender: 1 });
MessageSchema.index({ isDeleted: 1 });
```

---

## Step 2: DTOs

### 📝 DTO для обновления сообщения

**Файл:** `backend/src/modules/messages/dto/update-message.dto.ts`

```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text: string;
}
```

### 📝 DTO для поиска

**Файл:** `backend/src/modules/messages/dto/search-messages.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchMessagesDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  chatId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  cursor?: string;
}
```

### 📝 DTO для обновления статуса

**Файл:** `backend/src/modules/messages/dto/update-status.dto.ts`

```typescript
import { IsString, IsEnum, IsArray, IsMongoId } from 'class-validator';

export class UpdateStatusDto {
  @IsArray()
  @IsMongoId({ each: true })
  messageIds: string[];

  @IsEnum(['delivered', 'read'])
  status: 'delivered' | 'read';
}
```

---

## Step 3: Typing Manager

### 📝 Создаем менеджер набора текста

**Файл:** `backend/src/modules/websocket/managers/typing.manager.ts`

```typescript
import { Injectable } from '@nestjs/common';

interface TypingUser {
  userId: string;
  username: string;
  startedAt: Date;
}

@Injectable()
export class TypingManager {
  private typing = new Map<string, Map<string, TypingUser>>();
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly TYPING_TIMEOUT = 3000; // 3 секунды

  startTyping(chatId: string, userId: string, username: string): void {
    // Получаем или создаем Map для чата
    if (!this.typing.has(chatId)) {
      this.typing.set(chatId, new Map());
    }
    
    const chatTyping = this.typing.get(chatId)!;
    
    // Добавляем пользователя
    chatTyping.set(userId, {
      userId,
      username,
      startedAt: new Date()
    });
    
    // Сбрасываем таймер
    this.resetTimer(chatId, userId);
  }

  private resetTimer(chatId: string, userId: string): void {
    const key = `${chatId}:${userId}`;
    
    // Очищаем старый таймер
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    // Устанавливаем новый
    const timer = setTimeout(() => {
      this.stopTyping(chatId, userId);
    }, this.TYPING_TIMEOUT);
    
    this.timers.set(key, timer);
  }

  stopTyping(chatId: string, userId: string): void {
    const chatTyping = this.typing.get(chatId);
    if (chatTyping) {
      chatTyping.delete(userId);
      
      // Удаляем пустой Map
      if (chatTyping.size === 0) {
        this.typing.delete(chatId);
      }
    }
    
    // Очищаем таймер
    const key = `${chatId}:${userId}`;
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  getTypingUsers(chatId: string): TypingUser[] {
    const chatTyping = this.typing.get(chatId);
    return chatTyping ? Array.from(chatTyping.values()) : [];
  }

  clearUserTyping(userId: string): void {
    // Очищаем typing для пользователя во всех чатах
    for (const [chatId, chatTyping] of this.typing.entries()) {
      if (chatTyping.has(userId)) {
        this.stopTyping(chatId, userId);
      }
    }
  }

  clearAll(): void {
    // Очищаем все таймеры
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.typing.clear();
    this.timers.clear();
  }
}
```

---

## Step 4: Messages Service

### 📝 Обновляем сервис сообщений

**Файл:** `backend/src/modules/messages/messages.service.ts` (дополнения)

```typescript
// Добавляем новые методы

/**
 * Пагинация с курсором
 */
async getMessagesPaginated(
  chatId: string,
  cursor?: string,
  limit: number = 50
): Promise<{
  messages: MessageDocument[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  const query: any = { 
    chat: chatId, 
    isDeleted: false 
  };
  
  // Декодируем курсор если есть
  if (cursor) {
    const decodedDate = Buffer.from(cursor, 'base64').toString('utf-8');
    query.createdAt = { $lt: new Date(decodedDate) };
  }
  
  // Запрашиваем на 1 больше для hasMore
  const messages = await this.messageModel
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('sender', 'username name avatar')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'username name'
      }
    })
    .exec();
  
  const hasMore = messages.length > limit;
  if (hasMore) {
    messages.pop();
  }
  
  // Создаем следующий курсор
  const nextCursor = messages.length > 0
    ? Buffer.from(
        messages[messages.length - 1].createdAt.toISOString()
      ).toString('base64')
    : undefined;
  
  return {
    messages: messages.reverse(), // Возвращаем в хронологическом порядке
    hasMore,
    nextCursor
  };
}

/**
 * Полнотекстовый поиск
 */
async searchMessages(
  chatId: string,
  query: string,
  limit: number = 50
): Promise<{
  messages: any[];
  total: number;
  highlights: Map<string, string[]>;
}> {
  const searchQuery = {
    chat: chatId,
    $text: { $search: query },
    isDeleted: false
  };
  
  const messages = await this.messageModel
    .find(searchQuery, {
      score: { $meta: 'textScore' }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('sender', 'username name avatar')
    .exec();
  
  // Подсветка найденного текста
  const highlights = new Map<string, string[]>();
  const queryWords = query.toLowerCase().split(/\s+/);
  
  messages.forEach(msg => {
    const matches: string[] = [];
    const text = msg.text.toLowerCase();
    
    queryWords.forEach(word => {
      const index = text.indexOf(word);
      if (index !== -1) {
        matches.push(msg.text.substring(index, index + word.length));
      }
    });
    
    if (matches.length > 0) {
      highlights.set(msg._id.toString(), matches);
    }
  });
  
  const total = await this.messageModel.countDocuments(searchQuery);
  
  return {
    messages: messages.map(m => m.toObject()),
    total,
    highlights
  };
}

/**
 * Обновление статуса сообщений
 */
async updateMessagesStatus(
  messageIds: string[],
  status: 'delivered' | 'read',
  userId: string
): Promise<void> {
  const bulkOps = messageIds.map(messageId => {
    const update: any = { status };
    
    if (status === 'delivered') {
      update.$addToSet = { deliveredTo: userId };
    } else if (status === 'read') {
      update.$addToSet = { readBy: userId };
    }
    
    return {
      updateOne: {
        filter: { _id: messageId },
        update
      }
    };
  });
  
  await this.messageModel.bulkWrite(bulkOps);
  
  // Эмитируем события для каждого сообщения
  for (const messageId of messageIds) {
    const message = await this.messageModel
      .findById(messageId)
      .populate('sender');
    
    if (message) {
      // Уведомляем отправителя об изменении статуса
      this.wsGateway.emitStatusUpdate(
        message.sender._id.toString(),
        messageId,
        status
      );
    }
  }
}

/**
 * Редактирование сообщения
 */
async editMessage(
  messageId: string,
  userId: string,
  newText: string
): Promise<MessageDocument> {
  const message = await this.messageModel.findById(messageId);
  
  if (!message) {
    throw new NotFoundException('Message not found');
  }
  
  if (message.sender.toString() !== userId) {
    throw new ForbiddenException('You can only edit your own messages');
  }
  
  if (message.forwarded) {
    throw new ForbiddenException('Cannot edit forwarded messages');
  }
  
  // Сохраняем историю
  if (!message.editHistory) {
    message.editHistory = [];
  }
  
  message.editHistory.push({
    text: message.text,
    editedAt: message.editedAt || message.createdAt
  });
  
  // Обновляем текст
  const sanitizedText = DOMPurify.sanitize(newText);
  message.text = sanitizedText;
  message.editedAt = new Date();
  message.isEdited = true;
  
  await message.save();
  
  // Populate и возвращаем
  await message.populate('sender', 'username name avatar');
  
  // Эмитируем событие
  await this.wsGateway.emitMessageEdited(message);
  
  return message;
}
```

---

## Step 5: Messages Controller

### 📝 Добавляем новые эндпоинты

**Файл:** `backend/src/modules/messages/messages.controller.ts` (дополнения)

```typescript
/**
 * GET /messages/chats/:chatId/paginated - Получить сообщения с пагинацией
 */
@Get('chats/:chatId/paginated')
async getMessagesPaginated(
  @Param('chatId') chatId: string,
  @Query('cursor') cursor?: string,
  @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  @User() user: UserPayload
) {
  // Проверяем доступ к чату
  await this.chatsService.getChatById(chatId, user.sub);
  
  return this.messagesService.getMessagesPaginated(chatId, cursor, limit);
}

/**
 * POST /messages/search - Поиск сообщений
 */
@Post('search')
@UseGuards(ThrottlerGuard)
@Throttle(10, 60) // 10 запросов в минуту
async searchMessages(
  @Body() searchDto: SearchMessagesDto,
  @User() user: UserPayload
) {
  // Проверяем доступ к чату если указан
  if (searchDto.chatId) {
    await this.chatsService.getChatById(searchDto.chatId, user.sub);
  }
  
  return this.messagesService.searchMessages(
    searchDto.chatId,
    searchDto.query,
    searchDto.limit
  );
}

/**
 * PATCH /messages/status - Обновить статус сообщений
 */
@Patch('status')
async updateStatus(
  @Body() updateStatusDto: UpdateStatusDto,
  @User() user: UserPayload
) {
  await this.messagesService.updateMessagesStatus(
    updateStatusDto.messageIds,
    updateStatusDto.status,
    user.sub
  );
  
  return { success: true };
}

/**
 * PATCH /messages/:id - Редактировать сообщение
 */
@Patch(':id')
async editMessage(
  @Param('id') messageId: string,
  @Body() updateDto: UpdateMessageDto,
  @User() user: UserPayload
) {
  const message = await this.messagesService.editMessage(
    messageId,
    user.sub,
    updateDto.text
  );
  
  return { success: true, message };
}

/**
 * DELETE /messages/:id - Удалить сообщение (soft delete)
 */
@Delete(':id')
async deleteMessage(
  @Param('id') messageId: string,
  @User() user: UserPayload
) {
  await this.messagesService.softDelete(messageId, user.sub);
  
  return { success: true };
}
```

---

## Step 6: WebSocket Gateway

### 📝 Добавляем обработчики typing и статусов

**Файл:** `backend/src/modules/websocket/websocket.gateway.ts` (дополнения)

```typescript
import { TypingManager } from './managers/typing.manager';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebsocketGateway 
  implements OnGatewayConnection, OnGatewayDisconnect {
  
  constructor(
    private readonly typingManager: TypingManager,
    // ... другие зависимости
  ) {}

  /**
   * Typing indicators
   */
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string }
  ) {
    const userId = client.data.userId;
    const username = client.data.username;
    
    this.typingManager.startTyping(data.chatId, userId, username);
    
    // Отправляем всем кроме отправителя
    client.to(`chat-${data.chatId}`).emit('typing:update', {
      chatId: data.chatId,
      typing: this.typingManager.getTypingUsers(data.chatId)
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string }
  ) {
    const userId = client.data.userId;
    
    this.typingManager.stopTyping(data.chatId, userId);
    
    client.to(`chat-${data.chatId}`).emit('typing:update', {
      chatId: data.chatId,
      typing: this.typingManager.getTypingUsers(data.chatId)
    });
  }

  /**
   * Message status updates
   */
  @SubscribeMessage('messages:delivered')
  async handleMessagesDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageIds: string[] }
  ) {
    const userId = client.data.userId;
    
    await this.messagesService.updateMessagesStatus(
      data.messageIds,
      'delivered',
      userId
    );
  }

  @SubscribeMessage('messages:read')
  async handleMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageIds: string[]; chatId: string }
  ) {
    const userId = client.data.userId;
    
    await this.messagesService.updateMessagesStatus(
      data.messageIds,
      'read',
      userId
    );
    
    // Уведомляем всех в чате о прочтении
    client.to(`chat-${data.chatId}`).emit('messages:read:update', {
      messageIds: data.messageIds,
      readBy: userId
    });
  }

  /**
   * При отключении очищаем typing
   */
  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.typingManager.clearUserTyping(userId);
    }
    
    // ... остальная логика disconnect
  }

  /**
   * Вспомогательные методы для эмиссии
   */
  emitStatusUpdate(userId: string, messageId: string, status: string) {
    this.server.to(`user-${userId}`).emit('message:status:updated', {
      messageId,
      status
    });
  }

  emitMessageEdited(message: any) {
    const chatId = message.chat._id || message.chat;
    
    // В комнату чата
    this.server.to(`chat-${chatId}`).emit('message:edited', message);
    
    // В персональные комнаты участников
    this.emitToParticipants(chatId, 'message:edited', message);
  }

  private async emitToParticipants(chatId: string, event: string, data: any) {
    const participants = await this.chatsService.getChatParticipants(chatId);
    
    participants.forEach(participantId => {
      this.server.to(`user-${participantId}`).emit(event, data);
    });
  }
}
```

---

## Step 7: Testing

### 📝 E2E тест для статусов

**Файл:** `backend/test/e2e/message-status.test.js`

```javascript
const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:3001';
const WS_URL = 'http://localhost:3001';

async function testMessageStatus() {
  console.log('🧪 Testing Message Status System...\n');
  
  // 1. Логинимся как два пользователя
  const user1Token = await login('user1@test.com', 'password');
  const user2Token = await login('user2@test.com', 'password');
  
  // 2. Подключаем WebSocket для обоих
  const socket1 = io(WS_URL, {
    auth: { token: user1Token }
  });
  
  const socket2 = io(WS_URL, {
    auth: { token: user2Token }
  });
  
  // 3. Создаем чат
  const chat = await createChat([user1Id, user2Id], user1Token);
  
  // 4. User2 присоединяется к комнате чата
  socket2.emit('chat:join', { chatId: chat._id });
  
  // 5. User1 отправляет сообщение
  const messagePromise = new Promise(resolve => {
    socket2.on('message:new', (message) => {
      console.log('✅ User2 received message:', message._id);
      console.log('   Status:', message.status); // Should be 'sent'
      
      // 6. User2 отмечает как доставлено
      socket2.emit('messages:delivered', {
        messageIds: [message._id]
      });
      
      resolve(message);
    });
  });
  
  socket1.emit('message:send', {
    chatId: chat._id,
    text: 'Test message for status'
  });
  
  const message = await messagePromise;
  
  // 7. User1 должен получить обновление статуса
  const statusPromise = new Promise(resolve => {
    socket1.on('message:status:updated', (data) => {
      console.log('✅ User1 received status update:', data);
      resolve(data);
    });
  });
  
  const statusUpdate = await statusPromise;
  console.log('   New status:', statusUpdate.status); // Should be 'delivered'
  
  // 8. User2 прочитывает сообщение
  socket2.emit('messages:read', {
    messageIds: [message._id],
    chatId: chat._id
  });
  
  // Cleanup
  socket1.disconnect();
  socket2.disconnect();
  
  console.log('\n✅ Message status test completed!');
}

async function login(email, password) {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  });
  return response.data.accessToken;
}

// Run test
testMessageStatus().catch(console.error);
```

---

## ✅ Контрольные точки

### После выполнения у вас должно быть:

1. **Схема сообщений** с полями статуса и редактирования
2. **Typing Manager** для управления индикаторами
3. **Пагинация с курсорами** вместо offset
4. **Полнотекстовый поиск** с подсветкой
5. **WebSocket события** для typing и статусов
6. **Soft delete** с обновлением lastMessage
7. **История редактирования** сообщений

### Проверка работы:

```bash
# Запуск backend
yarn start:dev

# В другом терминале - тесты
node test/e2e/message-status.test.js
node test/e2e/typing-indicator.test.js
node test/e2e/pagination.test.js

# Проверка поиска
curl -X POST http://localhost:3001/messages/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 10}'
```

---

## 🎯 Результат

После выполнения всех шагов ваш backend будет поддерживать:
- ✅ Статусы доставки и прочтения
- ✅ Индикаторы набора текста
- ✅ Редактирование сообщений с историей
- ✅ Мягкое удаление с синхронизацией lastMessage
- ✅ Эффективную пагинацию больших чатов
- ✅ Быстрый поиск по сообщениям
