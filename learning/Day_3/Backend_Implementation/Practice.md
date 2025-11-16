# 🛠️ День 3: Backend Practice - Chats API Implementation

> Пошаговая реализация CRUD API для чатов

---

## 📋 План работы

1. Создать Chat Schema
2. Создать DTOs (CreateChatDto, UpdateChatDto)
3. Реализовать ChatsService (CRUD методы)
4. Реализовать ChatsController (REST endpoints)
5. Зарегистрировать ChatsModule
6. Протестировать через Postman

---

## Шаг 1: Создание Chat Schema

### 1.1 Создать файл

```bash
mkdir -p backend/src/modules/chats/schemas
touch backend/src/modules/chats/schemas/chat.schema.ts
```

### 1.2 Реализация

```typescript
// backend/src/modules/chats/schemas/chat.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: String, enum: ['personal', 'group', 'channel'], required: true })
  type: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({
    type: {
      text: String,
      sender: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      createdAt: Date,
    },
    required: false,
  })
  lastMessage?: {
    text: string;
    sender: Types.ObjectId;
    createdAt: Date;
  };

  @Prop({ default: false })
  isDeleted: boolean;

  // timestamps: true автоматически добавит createdAt и updatedAt
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Индекс для быстрого поиска чатов пользователя
ChatSchema.index({ participants: 1, isDeleted: 1 });
```

**Объяснение:**
- `type` - тип чата (personal, group, channel)
- `participants` - массив ссылок на User (ObjectId)
- `lastMessage` - subdocument с последним сообщением (опционально)
- `isDeleted` - флаг для soft delete
- `timestamps: true` - автоматически добавляет createdAt, updatedAt
- Индекс на `participants` и `isDeleted` для быстрых запросов

---

## Шаг 2: CreateChatDto и UpdateChatDto

### 2.1 Создать папку и файлы

```bash
mkdir -p backend/src/modules/chats/dto
touch backend/src/modules/chats/dto/create-chat.dto.ts
touch backend/src/modules/chats/dto/update-chat.dto.ts
```

### 2.2 CreateChatDto

```typescript
// backend/src/modules/chats/dto/create-chat.dto.ts

import { IsString, IsEnum, IsOptional, IsMongoId } from 'class-validator';

export class CreateChatDto {
  @IsEnum(['personal', 'group', 'channel'])
  type: string;

  @IsMongoId()
  participantId: string; // ID второго участника (для personal чата)

  @IsString()
  @IsOptional()
  name?: string; // Для group/channel чатов
}
```

### 2.3 UpdateChatDto

```typescript
// backend/src/modules/chats/dto/update-chat.dto.ts

import { IsString, IsOptional } from 'class-validator';

export class UpdateChatDto {
  @IsString()
  @IsOptional()
  name?: string; // Обновление названия group/channel
}
```

**Объяснение:**
- `CreateChatDto` - для создания чата
  - `type` - тип чата (enum validation)
  - `participantId` - ID второго участника (MongoDB ObjectId validation)
  - `name` - название (опционально, для group/channel)
- `UpdateChatDto` - для обновления чата
  - `name` - обновление названия

---

## Шаг 3: ChatsService

### 3.1 Создать файл

```bash
touch backend/src/modules/chats/chats.service.ts
```

### 3.2 Реализация

```typescript
// backend/src/modules/chats/chats.service.ts

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  /**
   * Получить список чатов пользователя
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    return this.chatModel
      .find({
        participants: userId,
        isDeleted: false,
      })
      .populate('participants', '-password -refreshToken')
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 })
      .lean();
  }

  /**
   * Создать новый чат
   */
  async createChat(dto: CreateChatDto, currentUserId: string): Promise<Chat> {
    // Валидация: нельзя создать чат с самим собой
    if (dto.participantId === currentUserId) {
      throw new BadRequestException('Cannot create chat with yourself');
    }

    // Для personal чата проверяем что он не существует
    if (dto.type === 'personal') {
      const existingChat = await this.findPersonalChat(currentUserId, dto.participantId);
      if (existingChat) {
        // Возвращаем существующий чат
        return existingChat;
      }
    }

    // Создаём новый чат
    const chat = new this.chatModel({
      type: dto.type,
      participants: [currentUserId, dto.participantId],
      name: dto.name || null,
    });

    await chat.save();

    // Возвращаем с populate
    return this.chatModel
      .findById(chat._id)
      .populate('participants', '-password -refreshToken')
      .lean();
  }

  /**
   * Получить чат по ID
   */
  async getChatById(chatId: string, userId: string): Promise<Chat> {
    const chat = await this.chatModel
      .findById(chatId)
      .populate('participants', '-password -refreshToken')
      .lean();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Проверка authorization: пользователь должен быть участником
    const isParticipant = (chat.participants as any[]).some(
      (p) => p._id.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    return chat;
  }

  /**
   * Удалить чат (soft delete)
   */
  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatModel.findById(chatId);

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Проверка authorization
    const isParticipant = chat.participants.some(
      (p) => p.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    // Soft delete
    chat.isDeleted = true;
    await chat.save();
  }

  /**
   * Найти personal чат между двумя пользователями
   */
  private async findPersonalChat(user1Id: string, user2Id: string): Promise<Chat | null> {
    return this.chatModel
      .findOne({
        type: 'personal',
        participants: {
          $all: [user1Id, user2Id],
          $size: 2,
        },
        isDeleted: false,
      })
      .populate('participants', '-password -refreshToken')
      .lean();
  }
}
```

**Объяснение методов:**

1. **getUserChats()** - получить список чатов пользователя
   - Фильтр: `participants` содержит userId, `isDeleted: false`
   - Populate participants (без password, refreshToken)
   - Сортировка по lastMessage.createdAt

2. **createChat()** - создать новый чат
   - Валидация: нельзя создать чат с самим собой
   - Для personal чата: проверка существующего (через $all и $size)
   - Создание нового чата

3. **getChatById()** - получить чат по ID
   - Проверка существования
   - Authorization: пользователь должен быть участником
   - Populate participants

4. **deleteChat()** - удалить чат (soft delete)
   - Проверка существования
   - Authorization
   - Установка флага `isDeleted = true`

5. **findPersonalChat()** - приватный метод для поиска personal чата
   - `$all` - оба пользователя в массиве
   - `$size: 2` - ровно 2 участника

---

## Шаг 4: ChatsController

### 4.1 Создать файл

```bash
touch backend/src/modules/chats/chats.controller.ts
```

### 4.2 Реализация

```typescript
// backend/src/modules/chats/chats.controller.ts

import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * GET /chats - получить список чатов
   */
  @Get()
  async getUserChats(@CurrentUser('userId') userId: string) {
    return this.chatsService.getUserChats(userId);
  }

  /**
   * POST /chats - создать новый чат
   */
  @Post()
  async createChat(
    @Body() createChatDto: CreateChatDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.chatsService.createChat(createChatDto, userId);
  }

  /**
   * GET /chats/:id - получить чат по ID
   */
  @Get(':id')
  async getChatById(
    @Param('id') chatId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.chatsService.getChatById(chatId, userId);
  }

  /**
   * DELETE /chats/:id - удалить чат
   */
  @Delete(':id')
  async deleteChat(
    @Param('id') chatId: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.chatsService.deleteChat(chatId, userId);
    return { message: 'Chat deleted successfully' };
  }
}
```

**Объяснение:**
- `@UseGuards(JwtAuthGuard)` - все endpoints защищены JWT
- `@CurrentUser('userId')` - получаем текущего пользователя из JWT
- REST endpoints:
  - `GET /chats` - список чатов
  - `POST /chats` - создать чат
  - `GET /chats/:id` - детали чата
  - `DELETE /chats/:id` - удалить чат

---

## Шаг 5: ChatsModule

### 5.1 Создать файл

```bash
touch backend/src/modules/chats/chats.module.ts
```

### 5.2 Реализация

```typescript
// backend/src/modules/chats/chats.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { Chat, ChatSchema } from './schemas/chat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
  ],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService], // Экспортируем для использования в других модулях
})
export class ChatsModule {}
```

### 5.3 Зарегистрировать в AppModule

```typescript
// backend/src/app.module.ts

import { ChatsModule } from './modules/chats/chats.module';

@Module({
  imports: [
    // ... existing modules
    ChatsModule, // ← добавить
  ],
})
export class AppModule {}
```

---

## Шаг 6: Тестирование

### 6.1 Запустить Backend

```bash
docker-compose up -d backend
docker-compose logs -f backend
```

### 6.2 Получить JWT Token

**POST /auth/login**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your_user_id",
    "password": "your_password"
  }'
```

Сохрани `accessToken` из ответа.

### 6.3 Тестировать Endpoints

#### GET /chats - список чатов

```bash
curl -X GET http://localhost:3001/api/chats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ожидаемый ответ:**
```json
[
  {
    "_id": "chat123",
    "type": "personal",
    "participants": [
      { "_id": "user1", "userId": "john1234", "name": "John" },
      { "_id": "user2", "userId": "jane5678", "name": "Jane" }
    ],
    "lastMessage": {
      "text": "Hello!",
      "sender": "user1",
      "createdAt": "2024-11-16T10:00:00Z"
    },
    "createdAt": "2024-11-15T10:00:00Z",
    "updatedAt": "2024-11-16T10:00:00Z"
  }
]
```

#### POST /chats - создать чат

```bash
curl -X POST http://localhost:3001/api/chats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "personal",
    "participantId": "OTHER_USER_ID"
  }'
```

**Ожидаемый ответ:** созданный чат с populated participants

#### GET /chats/:id - детали чата

```bash
curl -X GET http://localhost:3001/api/chats/CHAT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### DELETE /chats/:id - удалить чат

```bash
curl -X DELETE http://localhost:3001/api/chats/CHAT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ожидаемый ответ:**
```json
{
  "message": "Chat deleted successfully"
}
```

---

## ✅ Чек-лист выполнения

- [ ] Chat Schema создана
- [ ] CreateChatDto, UpdateChatDto созданы
- [ ] ChatsService реализован
- [ ] ChatsController реализован
- [ ] ChatsModule зарегистрирован в AppModule
- [ ] Backend запускается без ошибок
- [ ] GET /chats возвращает список чатов
- [ ] POST /chats создаёт новый чат
- [ ] GET /chats/:id возвращает детали
- [ ] DELETE /chats/:id удаляет чат
- [ ] Populate participants работает
- [ ] Authorization проверяет участников
- [ ] Soft delete работает

---

## 📚 Следующий шаг

**Backend завершён!** Переходи к [Frontend_Implementation](../Frontend_Implementation/) для создания UI.

---

**Время выполнения:** ~2-3 часа
