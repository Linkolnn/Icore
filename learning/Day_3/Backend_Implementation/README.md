# ⚙️ День 3: Backend Implementation

> CRUD API для чатов на NestJS + MongoDB

---

## 🎯 Цель

Реализовать Backend API для создания и управления чатами (personal, group, channel)

---

## 📚 Материалы

- 📖 **[Theory.md](./Theory.md)** - Теория (1.5-2 ч)
  - Mongoose Relations
  - CRUD Operations
  - Soft Delete Pattern
  - Authorization
  - Aggregation

- 🛠️ **[Practice.md](./Practice.md)** - Практика (2-3 ч)
  - Chat Schema
  - DTOs
  - ChatsService
  - ChatsController
  - Тестирование

- ✅ **[Checklist.md](./Checklist.md)** - Чек-лист прогресса

---

## 📦 Что реализуем

### Chat Schema

```typescript
Chat {
  _id: ObjectId                    // MongoDB ID
  type: 'personal' | 'group' | 'channel'
  participants: ObjectId[]         // Ссылки на User
  lastMessage?: {
    text: string
    sender: ObjectId
    createdAt: Date
  }
  isDeleted: boolean               // Soft delete
  createdAt: Date
  updatedAt: Date
}
```

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/chats` | Список чатов пользователя | JWT |
| POST | `/chats` | Создать новый чат | JWT |
| GET | `/chats/:id` | Детали чата | JWT |
| DELETE | `/chats/:id` | Удалить чат (soft delete) | JWT |

### ChatsService Methods

```typescript
class ChatsService {
  async getUserChats(userId: string): Promise<Chat[]>
  async createChat(dto: CreateChatDto, currentUserId: string): Promise<Chat>
  async getChatById(chatId: string, userId: string): Promise<Chat>
  async deleteChat(chatId: string, userId: string): Promise<void>
}
```

---

## 📁 Файлы для создания

```
backend/src/modules/chats/
├── schemas/
│   └── chat.schema.ts              ✅ создаём
├── dto/
│   ├── create-chat.dto.ts          ✅ создаём
│   └── update-chat.dto.ts          ✅ создаём
├── chats.module.ts                 ✅ создаём
├── chats.service.ts                ✅ создаём
└── chats.controller.ts             ✅ создаём
```

### Регистрация модуля

```typescript
// backend/src/app.module.ts
import { ChatsModule } from './modules/chats/chats.module';

@Module({
  imports: [
    // ...
    ChatsModule, // ← добавляем
  ],
})
export class AppModule {}
```

---

## 🔑 Ключевые Концепции

### 1. Mongoose Relations
```typescript
// В схеме указываем связь
participants: [{ type: Schema.Types.ObjectId, ref: 'User' }]

// При запросе подгружаем связанные документы
.populate('participants', '-password -refreshToken')
```

### 2. Soft Delete
```typescript
// Вместо удаления ставим флаг
isDeleted: boolean

// В запросах фильтруем
.find({ isDeleted: false })
```

### 3. Authorization
```typescript
// Проверяем что пользователь - участник
if (!chat.participants.includes(userId)) {
  throw new ForbiddenException()
}
```

---

## ⏱️ Время выполнения

| Раздел | Время |
|--------|-------|
| Theory.md | 1.5-2 ч |
| Practice.md | 2-3 ч |
| Тестирование | 30 мин |
| **Итого** | **~4-5 ч** |

---

## ✅ Критерии завершения

- ✅ Chat Schema создана
- ✅ CreateChatDto, UpdateChatDto созданы
- ✅ ChatsService реализован
- ✅ ChatsController реализован
- ✅ ChatsModule зарегистрирован
- ✅ GET /chats возвращает чаты
- ✅ POST /chats создаёт чат
- ✅ GET /chats/:id возвращает детали
- ✅ DELETE /chats/:id удаляет чат
- ✅ Mongoose populate работает
- ✅ Authorization проверяет участников

---

## 🚀 С чего начать?

1. **[Theory.md](./Theory.md)** - изучи концепции
2. **[Practice.md](./Practice.md)** - реализуй код пошагово
3. **[Checklist.md](./Checklist.md)** - отслеживай прогресс

---

## 📞 Нужна помощь?

- Не понимаю концепцию → читай [Theory.md](./Theory.md)
- Не получается реализовать → следуй [Practice.md](./Practice.md) пошагово
- Код не работает → проверь [Checklist.md](./Checklist.md)

---

**Удачи! 🚀**
