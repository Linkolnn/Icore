# 📚 День 5: Advanced Messaging & UX

## 🎯 Цель дня

Превратить базовый чат в полнофункциональный мессенджер с продвинутыми возможностями:
- Статусы прочтения сообщений (Read Receipts)
- Индикаторы набора текста (Typing Indicators)
- Редактирование и удаление сообщений
- Загрузка истории с пагинацией
- Поиск по сообщениям
- Подготовка к работе с медиа

---

## 🏗️ Архитектура решений

### Read Receipts System
```
User A sends message → Server marks as 'sent' 
                     → Deliver to User B → Mark as 'delivered'
                     → User B opens chat → Mark as 'read'
                     → Notify User A about status change
```

### Typing Indicators Flow
```
User starts typing → Emit 'typing:start'
                  → Server broadcasts to chat room
                  → Other users see "User is typing..."
                  → After 3 seconds or on stop → Clear indicator
```

### Message Actions Architecture
```
Right-click message → Show context menu
                   → Select action (Edit/Delete)
                   → Validate permissions
                   → Execute action
                   → Broadcast update via WebSocket
```

---

## 📋 План работы

### Этап 1: Backend Infrastructure (3 часа)
1. Расширение схемы сообщений
2. WebSocket события для статусов
3. Система typing indicators
4. CRUD для редактирования/удаления
5. Pagination и поиск

### Этап 2: Frontend Components (3 часа)
1. UI компоненты статусов
2. Typing indicator анимация
3. Context menu для действий
4. Infinite scroll для истории
5. Search interface

### Этап 3: Integration & Testing (2 часа)
1. Связывание backend и frontend
2. Оптимизация производительности
3. E2E тестирование
4. Исправление багов

---

## 🔑 Ключевые концепции

### 1. Message Status Lifecycle

```typescript
enum MessageStatus {
  PENDING = 'pending',   // Локально, еще не отправлено
  SENT = 'sent',        // Отправлено на сервер
  DELIVERED = 'delivered', // Доставлено получателю
  READ = 'read'         // Прочитано получателем
}
```

### 2. Optimistic Updates Pattern

```typescript
// 1. Сразу показываем действие в UI
updateMessageOptimistic(messageId, newText)

// 2. Отправляем на сервер
try {
  await api.updateMessage(messageId, newText)
} catch (error) {
  // 3. Откатываем при ошибке
  rollbackMessage(messageId)
}
```

### 3. Debounce vs Throttle

```typescript
// Debounce - выполнить после паузы (typing)
const debouncedTyping = debounce(() => {
  socket.emit('typing:stop')
}, 3000)

// Throttle - ограничить частоту (scroll)
const throttledScroll = throttle(() => {
  checkLoadMore()
}, 100)
```

---

## 🛠️ Технические решения

### Backend

#### Pagination с курсорами
```typescript
// Вместо offset используем cursor (timestamp)
async getMessages(chatId: string, before?: Date, limit = 50) {
  const query = { chat: chatId }
  if (before) {
    query.createdAt = { $lt: before }
  }
  
  return this.messageModel
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1) // +1 для проверки hasMore
    .populate('sender')
}
```

#### Typing State Manager
```typescript
class TypingManager {
  private typing = new Map<string, Set<string>>()
  private timers = new Map<string, NodeJS.Timeout>()
  
  startTyping(chatId: string, userId: string) {
    // Добавить в набор
    if (!this.typing.has(chatId)) {
      this.typing.set(chatId, new Set())
    }
    this.typing.get(chatId).add(userId)
    
    // Автоочистка через 3 секунды
    this.resetTimer(chatId, userId)
  }
}
```

### Frontend

#### Virtual Scroll совместимость
```vue
<VirtualList ref="virtualList">
  <template #default="{ item }">
    <MessageBubble
      :message="item"
      @contextmenu.prevent="showContextMenu($event, item)"
    />
  </template>
</VirtualList>
```

#### Search Highlighting
```typescript
function highlightText(text: string, query: string): string {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
```

---

## 📊 Метрики успеха

### Performance
- **Typing latency**: < 50ms
- **Status update**: < 100ms
- **Search results**: < 500ms
- **Pagination**: < 200ms
- **60 FPS** при всех анимациях

### UX Metrics
- **Time to first message**: < 1s
- **History load**: < 2s per batch
- **Search relevance**: > 90%
- **Action completion**: < 500ms

---

## 🎨 UI/UX Guidelines

### Следуем DESIGN_REFERENCE.md:
- **Объём через тени**, не через фоны
- **Единый фон** $bg-primary
- **28px радиус** для всех элементов
- **Semantic HTML5** обязательно
- **BEM методология** для классов

### Анимации
- **Fade**: 0.3s для появления/исчезновения
- **Slide**: 0.2s для выезжающих элементов
- **Scale**: 0.15s для кнопок
- **Pulse**: 2s для индикаторов

---

## 📦 Структура файлов

### Backend
```
backend/src/
├── modules/
│   ├── messages/
│   │   ├── dto/
│   │   │   ├── update-message.dto.ts
│   │   │   └── search-messages.dto.ts
│   │   ├── messages.service.ts         # + методы статусов
│   │   └── messages.controller.ts      # + эндпоинты
│   └── websocket/
│       ├── websocket.gateway.ts        # + typing события
│       └── typing.manager.ts           # Новый файл
└── common/
    └── decorators/
        └── pagination.decorator.ts      # Новый декоратор
```

### Frontend
```
frontend/app/
├── components/
│   ├── chat/
│   │   ├── message/
│   │   │   ├── Status.vue              # Новый компонент
│   │   │   ├── ContextMenu.vue         # Новый компонент
│   │   │   └── EditMode.vue            # Новый компонент
│   │   ├── TypingIndicator.vue         # Новый компонент
│   │   └── SearchPanel.vue             # Новый компонент
├── composables/
│   ├── useTyping.ts                    # Новый composable
│   ├── useMessageActions.ts            # Новый composable
│   └── useSearch.ts                    # Новый composable
└── stores/
    └── messages.ts                      # + новые методы
```

---

## 🚀 Команды запуска

```bash
# Backend разработка
cd backend
yarn start:dev

# Frontend разработка
cd frontend
yarn dev

# E2E тесты
node backend/test/e2e/message-status.test.js
node backend/test/e2e/typing-indicator.test.js

# Docker окружение
docker-compose up -d
docker-compose logs -f
```

---

## 📚 Материалы для изучения

### Documentation
- [WebSocket Events Best Practices](https://socket.io/docs/v4/emit-cheatsheet/)
- [MongoDB Pagination Strategies](https://www.mongodb.com/docs/manual/reference/method/cursor.skip/)
- [Vue 3 Transitions](https://vuejs.org/guide/built-ins/transition.html)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

### Полезные статьи
- [Building a Typing Indicator](https://www.pubnub.com/blog/typing-indicators-tutorial/)
- [Implementing Read Receipts](https://getstream.io/blog/react-native-chat-message-read-receipts/)
- [Optimistic UI Updates](https://www.apollographql.com/docs/react/performance/optimistic-ui/)

---

## ⚠️ Важные замечания

### Не забудьте:
1. **Rate limiting** для typing events
2. **Debounce** поисковых запросов
3. **Cleanup** typing при disconnect
4. **Валидация** прав на редактирование
5. **Soft delete** для сообщений

### Частые ошибки:
- Забыть throttle для scroll events
- Не учесть часовые пояса в timestamps
- Дублирование typing events
- Memory leaks в typing timers
- Race conditions при быстром редактировании

---

## ✅ Определение готовности

День считается завершенным когда:
1. Все пункты в Checklist.md отмечены
2. E2E тесты проходят
3. Нет console.log в коде
4. Performance метрики достигнуты
5. Code review пройден

---

**Результат дня:** Полнофункциональный мессенджер с продвинутым UX! 🎉
