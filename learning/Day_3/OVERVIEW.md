# 📊 День 3: Полная Карта Материалов

> Визуальный overview всего что будешь изучать и реализовывать

---

## 🗺️ Общая Структура

```
День 3: Список Чатов и Маршрутизация
│
├── Backend Implementation (4-5 часов)
│   ├── Chat Schema - структура данных
│   ├── ChatsService - CRUD операции
│   └── ChatsController - REST API
│
└── Frontend Implementation (4-5 часов)
    ├── File-based Routing - pages/
    ├── ChatItem Component - карточка чата
    ├── Chats Store - управление чатами
    └── User Search Integration - создание чатов
```

---

## 🎯 Backend Implementation

### 📦 Модули и Зависимости

```
ChatsModule
├── зависит от → UsersModule (populate participants)
├── зависит от → AuthModule (JWT authentication)
└── предоставляет → ChatsService, ChatsController
```

### 📋 Chat Schema Structure

```typescript
Chat {
  _id: ObjectId                    // MongoDB ID
  type: 'personal' | 'group'       // Тип чата
  participants: [ObjectId]         // Ссылки на User
  lastMessage?: {                  // Последнее сообщение
    text: string
    sender: ObjectId
    createdAt: Date
  }
  isDeleted: boolean               // Soft delete
  createdAt: Date
  updatedAt: Date
}
```

### 🔄 CRUD Operations Flow

```
1. getUserChats(userId)
   ├── Find chats where userId in participants
   ├── Populate participants (users)
   ├── Sort by lastMessage.createdAt DESC
   └── Return chats[]

2. createChat(dto, currentUserId)
   ├── Validate participantId exists
   ├── Check if personal chat already exists
   ├── Create new Chat document
   ├── Save to MongoDB
   └── Return populated chat

3. getChatById(chatId, userId)
   ├── Find chat by _id
   ├── Check userId is participant (authorization)
   ├── Populate participants
   └── Return chat

4. deleteChat(chatId, userId)
   ├── Find chat by _id
   ├── Check userId is participant
   ├── Set isDeleted = true (soft delete)
   └── Return success
```

### 🌐 REST API Endpoints

| Method | Endpoint | Description | Auth | Body |
|--------|----------|-------------|------|------|
| GET | `/chats` | Список чатов пользователя | JWT | - |
| POST | `/chats` | Создать новый чат | JWT | `{ participantId, type }` |
| GET | `/chats/:id` | Детали чата | JWT | - |
| DELETE | `/chats/:id` | Удалить чат | JWT | - |

---

## 🎨 Frontend Implementation

### 📁 File-based Routing Structure

```
pages/
├── index.vue                      → / (main layout)
│   ├── <LayoutChatSidebar>        → список чатов
│   └── <NuxtPage>                 → динамический роут
│
└── chat/
    └── [id].vue                   → /chat/:id (dynamic)
        ├── route.params.id        → получаем chatId
        └── placeholder чата       → в Day 4 добавим сообщения
```

### 🧩 Component Tree

```
app.vue (root)
│
└── pages/index.vue
    ├── LayoutChatSidebar
    │   ├── LayoutAppHeader
    │   │   ├── MenuButton
    │   │   └── BaseInput (search)
    │   │       └── Search Results (v-if showResults)
    │   │
    │   ├── ChatList (v-else)
    │   │   └── ChatItem (v-for chat in chats)
    │   │       ├── Avatar
    │   │       ├── Name + LastMessage
    │   │       └── Time + Badge
    │   │
    │   └── Empty State (v-if chats.length === 0)
    │
    └── NuxtPage
        └── pages/chat/[id].vue
            └── Placeholder (Day 4: Messages)
```

### 💾 Chats Store (Pinia)

```typescript
useChatsStore {
  // State
  chats: ref<Chat[]>([])
  loading: ref(false)
  error: ref<string | null>(null)

  // Actions
  async fetchChats()              // GET /chats
  async createChat(participantId) // POST /chats
  async getChatById(chatId)       // GET /chats/:id
  async deleteChat(chatId)        // DELETE /chats/:id

  // Getters
  getChatByParticipant(userId)    // найти personal chat с пользователем
}
```

### 🔄 User Search → Create Chat Flow

```
1. User Types in Search Input
   ↓
2. Debounced Search (300ms)
   ↓
3. Display Search Results in Sidebar
   ↓
4. User Clicks on Search Result
   ↓
5. Check if Personal Chat Exists
   ├── Yes → Navigate to /chat/:existingChatId
   └── No → Create New Chat
               ↓
           POST /chats { participantId }
               ↓
           Add chat to chats array
               ↓
           Navigate to /chat/:newChatId
               ↓
           Hide Search Results
```

---

## 📚 Теория (Концепции для изучения)

### Backend

#### 1. Mongoose Relations (30 мин)
```typescript
// ref - ссылка на другую коллекцию
participants: [{ type: Schema.Types.ObjectId, ref: 'User' }]

// populate - подгрузка связанных документов
.populate('participants', '-password -refreshToken')
```

#### 2. CRUD Operations (45 мин)
- **Create** - сохранение в БД
- **Read** - поиск и получение данных
- **Update** - изменение существующих данных
- **Delete** - удаление (soft delete)

#### 3. Soft Delete Pattern (20 мин)
```typescript
// Вместо физического удаления:
await Chat.findByIdAndDelete(id) // ❌ данные теряются

// Используем флаг:
await Chat.findByIdAndUpdate(id, { isDeleted: true }) // ✅ можно восстановить
```

#### 4. Authorization in CRUD (30 мин)
```typescript
// Проверка что пользователь - участник чата
if (!chat.participants.includes(userId)) {
  throw new ForbiddenException('Not a participant')
}
```

#### 5. Aggregation with $lookup (45 мин)
```typescript
// Join между коллекциями
Chat.aggregate([
  { $lookup: { from: 'users', localField: 'participants', foreignField: '_id' } }
])
```

### Frontend

#### 1. File-based Routing (Nuxt 4) (30 мин)
```
pages/index.vue       → /
pages/about.vue       → /about
pages/chat/[id].vue   → /chat/:id (dynamic)
```

#### 2. Dynamic Route Params (20 мин)
```typescript
// pages/chat/[id].vue
const route = useRoute()
const chatId = route.params.id // доступ к :id
```

#### 3. NuxtLink vs router.push (20 мин)
```vue
<!-- Декларативная навигация -->
<NuxtLink :to="`/chat/${chat._id}`">{{ chat.name }}</NuxtLink>

<!-- Программная навигация -->
<script setup>
const router = useRouter()
const navigate = () => router.push(`/chat/${chat._id}`)
</script>
```

#### 4. Chat Store Pattern (45 мин)
- Централизованное управление чатами
- Кэширование данных
- Оптимистичные обновления

#### 5. Active State Tracking (20 мин)
```typescript
// В ChatItem.vue
const isActive = computed(() => route.params.id === props.chat._id)
```

#### 6. Empty State UI Pattern (15 мин)
```vue
<div v-if="chats.length === 0" class="empty-state">
  <p>Нет чатов. Начните поиск!</p>
</div>
```

---

## 🎨 Дизайн и Верстка

### ChatItem Component Structure

```
┌─────────────────────────────────────────┐
│  ┌──┐  Name (uppercase)        10:32    │
│  │  │  Last message text...    [badge]  │
│  └──┘  (truncate if long)               │
└─────────────────────────────────────────┘
  Avatar  Content                Time+Badge
```

**Макет:** `layout(img)/components/chat-component.png`

### Стили (SCSS)

```scss
.chat-item {
  background: $bg-primary;         // Единый фон
  box-shadow: $shadow-block;       // Объём через тень
  border-radius: $radius;          // 28px
  padding: 12px 16px;
  cursor: pointer;
  @include transition;             // Плавные переходы

  @include hover {
    opacity: 0.8;                  // Hover через opacity
  }

  &--active {
    box-shadow: $shadow-block,     // Дополнительная тень
                0 0 10px rgba($accent-primary, 0.2);
  }
}
```

---

## ✅ Чек-листы

### Backend Checklist
```
Schema
├── [ ] Chat schema создана
├── [ ] type enum (personal, group, channel)
├── [ ] participants array с ref: 'User'
├── [ ] lastMessage subdocument
└── [ ] isDeleted boolean

Service
├── [ ] getUserChats() реализован
├── [ ] createChat() реализован
├── [ ] getChatById() реализован
├── [ ] deleteChat() реализован
└── [ ] populate participants работает

Controller
├── [ ] GET /chats endpoint
├── [ ] POST /chats endpoint
├── [ ] GET /chats/:id endpoint
├── [ ] DELETE /chats/:id endpoint
└── [ ] @UseGuards(JwtAuthGuard) везде

Testing
├── [ ] Postman коллекция создана
├── [ ] GET /chats возвращает чаты
├── [ ] POST /chats создаёт чат
├── [ ] Authorization работает
└── [ ] Populate users работает
```

### Frontend Checklist
```
Types & Services
├── [ ] chat.types.ts создан
├── [ ] chat.service.ts создан
└── [ ] chats.ts store создан

Components
├── [ ] ChatItem.vue создан
├── [ ] Avatar отображается
├── [ ] Name + LastMessage отображаются
├── [ ] Time + Badge отображаются
└── [ ] Active state работает

Pages
├── [ ] pages/index.vue создана
├── [ ] pages/chat/[id].vue создана
├── [ ] Routing работает
└── [ ] Dynamic params читаются

Integration
├── [ ] Список чатов загружается
├── [ ] Клик на чат → редирект
├── [ ] User Search → Create Chat работает
├── [ ] Empty State показывается
└── [ ] Active chat подсвечен
```

---

## 📖 Порядок Чтения

### Вариант 1: Полное погружение (7-11 часов)

```
1. README.md (этот файл) - 15 мин
2. Backend_Implementation/Theory.md - 1.5 ч
3. Backend_Implementation/Practice.md - 2.5 ч
4. Backend_Implementation/Checklist.md - заполняешь по ходу
5. Тестирование Backend - 30 мин
6. Frontend_Implementation/Theory.md - 1.5 ч
7. Frontend_Implementation/Practice.md - 2.5 ч
8. Frontend_Implementation/Checklist.md - заполняешь по ходу
9. Тестирование Frontend - 30 мин
10. Интеграционное тестирование - 30 мин
```

### Вариант 2: Быстрый старт (5-7 часов)

```
1. QUICK_START.md - 5 мин
2. Backend_Implementation/Practice.md - 2 ч (пропускаешь теорию)
3. Тестирование Backend - 20 мин
4. Frontend_Implementation/Practice.md - 2 ч (пропускаешь теорию)
5. Тестирование Frontend - 20 мин
6. Интеграция - 20 мин
```

**Рекомендация:** Вариант 1 для глубокого понимания, Вариант 2 если срочно нужен результат.

---

## 🎯 Ожидаемый Результат

### После Backend

```bash
# Postman Request
GET http://localhost:3001/api/chats
Authorization: Bearer {JWT_TOKEN}

# Response
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

### После Frontend

**Визуально:**
- Sidebar слева (400px на Desktop)
- Список чатов (карточки с аватаром, именем, последним сообщением)
- Активный чат подсвечен
- Клик на чат → URL меняется на `/chat/:id`
- User Search → клик → создаётся чат → редирект

**В коде:**
```typescript
// stores/chats.ts
const chatsStore = useChatsStore()
chatsStore.chats // массив чатов

// pages/chat/[id].vue
const route = useRoute()
const chatId = route.params.id // "chat123"
```

---

## 💡 Ключевые Инсайты

1. **Mongoose populate** - мощный инструмент для joins без SQL
2. **Soft delete** - лучше чем физическое удаление (можно восстановить)
3. **File-based routing** - Nuxt автоматически создаёт роуты из pages/
4. **Dynamic routes** - `[id].vue` → доступ через `route.params.id`
5. **Active state** - сравнение `route.params.id === chat._id`
6. **Chat Store** - централизованное управление чатами
7. **User Search Integration** - проверка существующего чата перед созданием

---

## 🚀 Готов Начать?

**Выбери свой путь:**
- 📖 [Полная теория Backend](./Backend_Implementation/Theory.md)
- 🛠️ [Практика Backend](./Backend_Implementation/Practice.md)
- 📖 [Полная теория Frontend](./Frontend_Implementation/Theory.md)
- 🛠️ [Практика Frontend](./Frontend_Implementation/Practice.md)
- ⚡ [Быстрый старт](./QUICK_START.md)

**Удачи! 🎉**
