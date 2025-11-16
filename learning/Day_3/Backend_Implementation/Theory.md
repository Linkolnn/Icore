# 📖 День 3: Backend Theory - Chats API

> Теория для создания CRUD API для чатов

---

## 🎯 Что изучим

1. Mongoose Relations (ObjectId, ref, populate)
2. CRUD Operations (Create, Read, Update, Delete)
3. Soft Delete Pattern
4. Authorization в CRUD
5. Aggregation with $lookup

---

## 1. Mongoose Relations

### ObjectId и ref

**ObjectId** - специальный тип MongoDB для уникальных идентификаторов

```typescript
import { Schema, Types } from 'mongoose';

// В Chat schema указываем связь с User
@Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'User' }] })
participants: Types.ObjectId[];
```

**ref** - ссылка на другую коллекцию (модель)

### populate() - подгрузка связанных документов

```typescript
// Без populate - получаем только IDs
const chat = await this.chatModel.findById(chatId);
// chat.participants = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']

// С populate - получаем полные объекты User
const chat = await this.chatModel.findById(chatId)
  .populate('participants', '-password -refreshToken');
// chat.participants = [{ _id, userId, name, email }, { _id, userId, name, email }]
```

**Синтаксис populate:**
```typescript
.populate('field')                    // подгрузить всё
.populate('field', 'name email')      // только name и email
.populate('field', '-password')       // всё кроме password
.populate(['field1', 'field2'])       // несколько полей
```

---

## 2. CRUD Operations

**CRUD** - Create, Read, Update, Delete

### Create (Создание)

```typescript
async createChat(dto: CreateChatDto, currentUserId: string) {
  const chat = new this.chatModel({
    type: dto.type,
    participants: [currentUserId, dto.participantId],
  });
  
  await chat.save();
  
  // Возвращаем с populate
  return chat.populate('participants', '-password -refreshToken');
}
```

### Read (Чтение)

```typescript
// Получить все чаты пользователя
async getUserChats(userId: string) {
  return this.chatModel
    .find({
      participants: userId,  // userId в массиве participants
      isDeleted: false
    })
    .populate('participants', '-password -refreshToken')
    .sort({ 'lastMessage.createdAt': -1 })  // Сортировка по последнему сообщению
    .lean();  // Оптимизация: возвращает plain JS объекты
}

// Получить один чат по ID
async getChatById(chatId: string, userId: string) {
  const chat = await this.chatModel
    .findById(chatId)
    .populate('participants', '-password -refreshToken');
    
  if (!chat) {
    throw new NotFoundException('Chat not found');
  }
  
  // Authorization: проверяем что пользователь - участник
  const isParticipant = chat.participants.some(
    (p) => p._id.toString() === userId
  );
  
  if (!isParticipant) {
    throw new ForbiddenException('Not a participant');
  }
  
  return chat;
}
```

### Update (Обновление)

```typescript
async updateChat(chatId: string, dto: UpdateChatDto, userId: string) {
  const chat = await this.getChatById(chatId, userId);  // Проверка authorization
  
  // Обновляем только разрешённые поля
  if (dto.name) {
    chat.name = dto.name;
  }
  
  await chat.save();
  
  return chat.populate('participants', '-password -refreshToken');
}
```

### Delete (Удаление)

```typescript
async deleteChat(chatId: string, userId: string) {
  const chat = await this.getChatById(chatId, userId);  // Проверка authorization
  
  // Soft delete: ставим флаг вместо физического удаления
  chat.isDeleted = true;
  await chat.save();
}
```

---

## 3. Soft Delete Pattern

### Почему Soft Delete?

**Физическое удаление:**
```typescript
await this.chatModel.findByIdAndDelete(chatId);  // ❌ Данные теряются навсегда
```

**Проблемы:**
- Невозможно восстановить
- Нарушаются связи (foreign keys)
- Теряется история

**Soft Delete:**
```typescript
await this.chatModel.findByIdAndUpdate(chatId, { isDeleted: true });  // ✅
```

**Преимущества:**
- Можно восстановить
- Сохраняется история
- Связи не нарушаются

### Реализация

**В схеме:**
```typescript
@Prop({ default: false })
isDeleted: boolean;
```

**В запросах:**
```typescript
// Всегда фильтруем удалённые
.find({ isDeleted: false })
```

**Восстановление (опционально):**
```typescript
async restoreChat(chatId: string) {
  await this.chatModel.findByIdAndUpdate(chatId, { isDeleted: false });
}
```

---

## 4. Authorization в CRUD

### Принцип: Only Participants

Только участники чата могут:
- Видеть чат
- Отправлять сообщения
- Удалять чат

### Проверка участника

```typescript
function isParticipant(chat: Chat, userId: string): boolean {
  return chat.participants.some((p) => {
    // p может быть ObjectId или populated User
    const participantId = typeof p === 'string' ? p : p._id.toString();
    return participantId === userId;
  });
}
```

### Применение в методах

```typescript
async getChatById(chatId: string, userId: string) {
  const chat = await this.chatModel.findById(chatId).populate('participants');
  
  if (!chat) {
    throw new NotFoundException('Chat not found');
  }
  
  // Authorization check
  if (!this.isParticipant(chat, userId)) {
    throw new ForbiddenException('You are not a participant of this chat');
  }
  
  return chat;
}
```

---

## 5. Aggregation with $lookup

### Зачем Aggregation?

**populate()** - простой, но медленный для сложных запросов

**Aggregation** - мощный, быстрый, гибкий

### $lookup - JOIN между коллекциями

```typescript
async getUserChatsAggregation(userId: string) {
  return this.chatModel.aggregate([
    // Stage 1: Match - фильтр чатов пользователя
    {
      $match: {
        participants: new Types.ObjectId(userId),
        isDeleted: false
      }
    },
    
    // Stage 2: Lookup - JOIN с коллекцией users
    {
      $lookup: {
        from: 'users',                    // коллекция
        localField: 'participants',       // поле в Chat
        foreignField: '_id',              // поле в User
        as: 'participantDetails'          // результат
      }
    },
    
    // Stage 3: Project - выбрать нужные поля
    {
      $project: {
        type: 1,
        lastMessage: 1,
        createdAt: 1,
        updatedAt: 1,
        participants: {
          $map: {
            input: '$participantDetails',
            as: 'user',
            in: {
              _id: '$$user._id',
              userId: '$$user.userId',
              name: '$$user.name',
              email: '$$user.email',
              avatar: '$$user.avatar'
              // password и refreshToken НЕ включаем
            }
          }
        }
      }
    },
    
    // Stage 4: Sort - сортировка
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
}
```

### Stages (этапы) Aggregation

1. **$match** - фильтрация (как .find())
2. **$lookup** - JOIN с другой коллекцией
3. **$project** - выбор полей (как .select())
4. **$sort** - сортировка
5. **$limit** - ограничение количества
6. **$skip** - пропуск записей
7. **$group** - группировка
8. **$unwind** - развёртывание массивов

---

## 📚 Дополнительно

### Проверка существующего чата

Перед созданием personal чата проверяем что он не существует:

```typescript
async findPersonalChat(user1Id: string, user2Id: string) {
  return this.chatModel.findOne({
    type: 'personal',
    participants: {
      $all: [user1Id, user2Id],  // Оба пользователя в массиве
      $size: 2                    // Ровно 2 участника
    },
    isDeleted: false
  });
}
```

### lastMessage Subdocument

```typescript
// В Chat schema
@Prop({
  type: {
    text: String,
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date
  },
  required: false
})
lastMessage?: {
  text: string;
  sender: Types.ObjectId;
  createdAt: Date;
};
```

### Обновление lastMessage

```typescript
async updateLastMessage(chatId: string, messageText: string, senderId: string) {
  await this.chatModel.findByIdAndUpdate(chatId, {
    lastMessage: {
      text: messageText,
      sender: senderId,
      createdAt: new Date()
    }
  });
}
```

---

## ✅ Резюме

**Изучили:**
1. ✅ Mongoose Relations (ObjectId, ref, populate)
2. ✅ CRUD Operations (Create, Read, Update, Delete)
3. ✅ Soft Delete Pattern (isDeleted flag)
4. ✅ Authorization (проверка участников)
5. ✅ Aggregation ($lookup, $match, $project)

**Следующий шаг:** [Practice.md](./Practice.md) - реализация кода

---

**Время изучения:** ~1.5-2 часа
