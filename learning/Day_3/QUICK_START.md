# ⚡ День 3: Быстрый Старт (5 минут)

> Краткая инструкция для быстрого понимания что нужно сделать

---

## 🎯 Цель дня

**Создать список чатов в Sidebar и настроить маршрутизацию между чатами**

---

## 📋 Что делаем по шагам

### Backend (2-3 часа)

1. **Chat Schema** - структура данных чата в MongoDB
   ```typescript
   {
     type: 'personal' | 'group' | 'channel',
     participants: [userId1, userId2],
     lastMessage: { text, sender, createdAt },
     isDeleted: false
   }
   ```

2. **ChatsService** - бизнес-логика CRUD
   - getUserChats() - получить чаты пользователя
   - createChat() - создать новый чат
   - getChatById() - получить детали чата
   - deleteChat() - удалить чат (soft delete)

3. **ChatsController** - REST API endpoints
   - GET /chats
   - POST /chats
   - GET /chats/:id
   - DELETE /chats/:id

### Frontend (2-3 часа)

1. **chat.types.ts** - типы для чатов
   ```typescript
   interface Chat {
     _id: string
     type: 'personal' | 'group' | 'channel'
     participants: User[]
     lastMessage?: LastMessage
     createdAt: string
   }
   ```

2. **chat.service.ts** - API calls
   - getUserChats()
   - createChat(participantId)
   - getChatById(chatId)

3. **stores/chats.ts** - Pinia store
   - chats: ref<Chat[]>([])
   - fetchChats() - загрузить чаты
   - createChat() - создать чат

4. **components/ChatItem.vue** - карточка чата
   - Avatar слева
   - Name + Last Message справа
   - Time и Badge (notification count)

5. **pages/index.vue** - главная страница
   - ChatSidebar с списком чатов
   - NuxtPage для динамического роута

6. **pages/chat/[id].vue** - страница чата
   - Placeholder "Selected chat: {id}"
   - В Day 4 добавим сообщения

7. **Интеграция с User Search**
   - Клик на результат поиска → createChat()
   - Редирект на /chat/:newChatId

---

## 🚀 Команды

```bash
# Backend
cd backend
# Нет новых зависимостей

# Frontend
cd frontend
# Нет новых зависимостей

# Запуск
docker-compose up -d
```

---

## 📁 Файлы для создания

### Backend
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

### Frontend
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
├── components/layout/ChatSidebar.vue  ✏️ добавляем список чатов
└── app.vue                            ✏️ обновляем layout (если нужно)
```

---

## 🎨 Дизайн

**Макеты:**
- `layout(img)/pages/Chatlist.png` - главная со списком чатов
- `layout(img)/components/chat-component.png` - элемент списка

**Ключевые моменты:**
- Avatar слева (круглый, 48x48px)
- Name сверху (uppercase, font: '5mal6Lampen')
- Last Message снизу (truncate если длинный)
- Time справа сверху
- Badge справа снизу (если есть непрочитанные)

---

## 🔍 Как тестировать

### Backend (Postman)

1. **GET /chats**
   ```
   GET http://localhost:3001/api/chats
   Authorization: Bearer {JWT_TOKEN}
   ```
   Ожидаем: массив чатов пользователя

2. **POST /chats**
   ```
   POST http://localhost:3001/api/chats
   Authorization: Bearer {JWT_TOKEN}
   Body: {
     "participantId": "user_id_here",
     "type": "personal"
   }
   ```
   Ожидаем: новый чат создан

3. **GET /chats/:id**
   ```
   GET http://localhost:3001/api/chats/{chatId}
   Authorization: Bearer {JWT_TOKEN}
   ```
   Ожидаем: детали чата с populate users

### Frontend (Browser)

1. Открой `http://localhost:3000`
2. Залогинься
3. Проверь что в ChatSidebar появился список чатов
4. Кликни на чат → редирект на `/chat/:id`
5. Проверь что активный чат подсвечен
6. Открой User Search, кликни на пользователя
7. Проверь что создался новый чат и произошёл редирект

---

## ✅ Критерии завершения (кратко)

### Backend
- ✅ Chat Schema создана
- ✅ GET /chats возвращает чаты
- ✅ POST /chats создаёт чат
- ✅ Populate users работает

### Frontend
- ✅ Список чатов отображается
- ✅ Клик на чат работает
- ✅ Routing /chat/:id работает
- ✅ User Search → Create Chat работает
- ✅ Active state показывается

---

## 📚 Детали

**Нужна полная теория?**
- [Backend Theory](./Backend_Implementation/Theory.md)
- [Frontend Theory](./Frontend_Implementation/Theory.md)

**Пошаговая практика?**
- [Backend Practice](./Backend_Implementation/Practice.md)
- [Frontend Practice](./Frontend_Implementation/Practice.md)

**Отслеживать прогресс?**
- [Backend Checklist](./Backend_Implementation/Checklist.md)
- [Frontend Checklist](./Frontend_Implementation/Checklist.md)

---

## 🎯 Время

| Backend | Frontend | Тестирование | Итого |
|---------|----------|--------------|-------|
| 2-3 ч   | 2-3 ч    | 1 ч          | ~5-7 ч |

---

## 💡 Подсказки

- **Mongoose populate**: `.populate('participants', '-password -refreshToken')`
- **Soft delete**: `isDeleted: false` вместо физического удаления
- **Dynamic route**: файл `[id].vue` → роут `/chat/:id`
- **Route params**: `const route = useRoute(); const chatId = route.params.id`
- **Active chat**: сравнивай `route.params.id === chat._id`

---

**Готов начать? Открой [Theory.md](./Backend_Implementation/Theory.md) и погнали! 🚀**
