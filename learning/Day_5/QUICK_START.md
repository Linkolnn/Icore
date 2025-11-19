# 🚀 Day 5 Quick Start - Advanced Messaging

> 5-минутный старт для Day 5: продвинутые функции мессенджера

---

## ⚡ Что делаем сегодня?

Превращаем базовый чат в **полноценный мессенджер** с:
- ✅ **Read Receipts** - видно, прочитано ли сообщение
- ✅ **Typing Indicators** - "User is typing..."
- ✅ **Edit/Delete** - редактирование и удаление сообщений
- ✅ **History Loading** - подгрузка старых сообщений
- ✅ **Search** - поиск по сообщениям

---

## 🏃 Быстрый старт (3 минуты)

### 1️⃣ Проверка готовности
```bash
# Сервисы запущены?
docker-compose ps

# Все должны быть "Up"
# mongodb, redis, backend, frontend
```

### 2️⃣ Установка зависимостей
```bash
# Backend (если нужно)
cd backend
yarn add mongoose-paginate-v2

# Frontend (если нужно)  
cd frontend
yarn add date-fns fuse.js
```

### 3️⃣ Запуск разработки
```bash
# Terminal 1: Backend
cd backend && yarn start:dev

# Terminal 2: Frontend
cd frontend && yarn dev

# Terminal 3: Logs
docker-compose logs -f
```

### 4️⃣ Открыть в браузере
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Login: test1@example.com / password123

---

## 💻 Первая задача: Message Status

### Backend - добавляем статусы
```typescript
// backend/src/modules/messages/schemas/message.schema.ts
@Prop({
  type: String,
  enum: ['sent', 'delivered', 'read'],
  default: 'sent'
})
status: string

@Prop({ type: Date })
deliveredAt?: Date

@Prop({ type: Date })
readAt?: Date
```

### Frontend - показываем статусы
```vue
<!-- frontend/app/components/chat/message/Status.vue -->
<template>
  <span class="message-status">
    <span v-if="status === 'sent'">✓</span>
    <span v-else-if="status === 'delivered'">✓✓</span>
    <span v-else-if="status === 'read'" class="read">✓✓</span>
  </span>
</template>

<style>
.read { color: #4FC3F7; }
</style>
```

---

## 🎯 Основные задачи дня

### Morning (2 часа)
1. **Message Status System**
   - Schema updates
   - Status events
   - UI components

2. **Typing Indicators**
   - WebSocket handlers
   - Frontend animation
   - Auto-timeout

### Afternoon (2 часа)  
3. **Message Actions**
   - Edit endpoint & UI
   - Delete endpoint & UI
   - Context menu

4. **Pagination**
   - Cursor-based loading
   - Infinite scroll
   - Loading states

### Evening (1 час)
5. **Search**
   - Search endpoint
   - Search UI
   - Results highlighting

---

## 🔥 Hot Tips

### 1. Typing Indicator - простая реализация
```typescript
// Backend
let typingUsers = new Map<string, Set<string>>()

@SubscribeMessage('typing:start')
handleTypingStart(client: Socket, { chatId }) {
  if (!typingUsers.has(chatId)) {
    typingUsers.set(chatId, new Set())
  }
  typingUsers.get(chatId).add(client.data.userId)
  
  client.to(`chat-${chatId}`).emit('typing:users', 
    Array.from(typingUsers.get(chatId))
  )
  
  // Auto-stop after 3 seconds
  setTimeout(() => {
    this.handleTypingStop(client, { chatId })
  }, 3000)
}
```

### 2. Pagination - используем курсор
```typescript
// Вместо skip/limit используем cursor (дата последнего)
async getMessages(chatId: string, before?: Date) {
  const query: any = { chat: chatId }
  if (before) {
    query.createdAt = { $lt: before }
  }
  
  return this.messageModel
    .find(query)
    .sort({ createdAt: -1 })
    .limit(50)
}
```

### 3. Edit Mode - inline редактирование
```vue
<div v-if="isEditing" class="edit-mode">
  <input v-model="editText" @keyup.enter="saveEdit" />
</div>
<div v-else @dblclick="startEdit">
  {{ message.text }}
</div>
```

---

## 🐛 Частые проблемы

### Typing indicator не исчезает
```javascript
// Решение: очистка при disconnect
handleDisconnect(client: Socket) {
  // Удаляем из всех typing списков
  typingUsers.forEach((users, chatId) => {
    users.delete(client.data.userId)
  })
}
```

### Дублирование при пагинации
```javascript
// Решение: использовать Set или проверять ID
const messageIds = new Set(messages.map(m => m._id))
newMessages = newMessages.filter(m => !messageIds.has(m._id))
```

### Status не обновляется
```javascript
// Решение: слушать события в компоненте
socket.on('message:status', ({ messageId, status }) => {
  const message = messages.find(m => m._id === messageId)
  if (message) message.status = status
})
```

---

## 📝 Checklist на конец дня

Минимум для успешного дня:
- [ ] Статусы сообщений работают
- [ ] Typing indicator виден
- [ ] Можно редактировать свои сообщения
- [ ] Можно удалять сообщения
- [ ] История подгружается при скролле

Бонус:
- [ ] Поиск работает
- [ ] Анимации плавные
- [ ] Нет багов в консоли
- [ ] Тесты написаны

---

## 🎉 Проверка результата

### Test Flow
1. Отправить сообщение → увидеть ✓
2. Получатель открывает → увидеть ✓✓ синие
3. Начать печатать → увидеть "typing..."
4. Дважды клик на сообщение → редактировать
5. Правый клик → удалить
6. Скролл вверх → загрузка истории
7. Ctrl+F → поиск

### Success Metrics
- Typing < 50ms latency
- Status updates < 100ms
- Smooth 60 FPS animations
- No console errors

---

## 🔗 Полезные ссылки

### Сегодняшние файлы
- [Полный план](./README.md)
- [Детальный чеклист](./Checklist.md)
- [Backend теория](./Backend_Implementation/Theory.md)
- [Frontend практика](./Frontend_Implementation/Practice.md)

### Команды
```bash
# Тест typing indicator
node backend/test/e2e/typing-indicator.test.js

# Тест статусов
node backend/test/e2e/message-status.test.js

# Мониторинг WebSocket
node backend/test/e2e/realtime-updates.test.js
```

---

**Let's build an awesome messenger! 🚀**
