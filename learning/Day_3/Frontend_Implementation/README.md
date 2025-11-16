# 🎨 День 3: Frontend Implementation

> UI списка чатов + маршрутизация в Nuxt 4

---

## 🎯 Цель

Реализовать список чатов в Sidebar и настроить маршрутизацию между чатами

---

## 📚 Материалы

- 📖 **[Theory.md](./Theory.md)** - Теория (1.5-2 ч)
  - File-based Routing (Nuxt 4)
  - Dynamic Routes
  - Chat Store Pattern
  - Active State Tracking
  - Empty State UI
  - User Search Integration

- 🛠️ **[Practice.md](./Practice.md)** - Практика (2-3 ч)
  - chat.types.ts
  - chat.service.ts
  - chats.ts store
  - ChatItem.vue component
  - pages/index.vue
  - pages/chat/[id].vue
  - ChatSidebar интеграция
  - User Search → Create Chat

- ✅ **[Checklist.md](./Checklist.md)** - Чек-лист прогресса

---

## 📦 Что реализуем

### Компоненты

**ChatItem.vue** - карточка чата
```
┌─────────────────────────────────────────┐
│  ┌──┐  Name (uppercase)        10:32    │
│  │  │  Last message text...    [badge]  │
│  └──┘  (truncate if long)               │
└─────────────────────────────────────────┘
```

### Pages (File-based Routing)

```
pages/
├── index.vue              → / (main layout)
│   ├── ChatSidebar
│   └── NuxtPage
└── chat/
    └── [id].vue           → /chat/:id (dynamic)
```

### Store

```typescript
useChatsStore {
  chats: ref<Chat[]>([])
  loading: ref(false)
  error: ref<string | null>(null)

  async fetchChats()
  async createChat(participantId)
  async getChatById(chatId)
  async deleteChat(chatId)
}
```

---

## 📁 Файлы для создания

```
frontend/app/
├── types/
│   └── chat.types.ts               ✅ создаём
├── services/api/
│   └── chat.service.ts             ✅ создаём
├── stores/
│   └── chats.ts                    ✅ создаём
├── components/
│   └── ChatItem.vue                ✅ создаём
└── pages/
    ├── index.vue                   ✅ создаём
    └── chat/
        └── [id].vue                ✅ создаём
```

### Изменяемые файлы

```
frontend/app/
└── components/layout/ChatSidebar.vue  ✏️ добавляем список чатов
```

---

## 🔑 Ключевые Концепции

### 1. File-based Routing
```
pages/index.vue       → /
pages/chat/[id].vue   → /chat/:id
```

### 2. Dynamic Route Params
```typescript
const route = useRoute()
const chatId = route.params.id  // доступ к :id
```

### 3. Active Chat Tracking
```typescript
const isActive = computed(() => route.params.id === props.chat._id)
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

- ✅ chat.types.ts создан
- ✅ chat.service.ts создан
- ✅ chats.ts store создан
- ✅ ChatItem.vue создан
- ✅ pages/index.vue создана
- ✅ pages/chat/[id].vue создана
- ✅ Список чатов отображается
- ✅ Клик на чат работает
- ✅ Routing /chat/:id работает
- ✅ Active state показывается
- ✅ User Search → Create Chat работает
- ✅ Empty State показывается

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
