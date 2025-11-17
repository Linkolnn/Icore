# ✅ День 4: Frontend Checklist - Messages + Real-time

> Чек-лист для отслеживания прогресса реализации сообщений и WebSocket

---

## 📋 Теория (Theory.md)

### 1. WebSocket Client Integration
- [ ] Понимаю socket.io-client установку и конфигурацию
- [ ] Понимаю Plugin architecture в Nuxt 4
- [ ] Понимаю `auth.token` в handshake для JWT
- [ ] Понимаю `transports: ['websocket']` (без polling)
- [ ] Понимаю lifecycle events (connect, disconnect, connect_error)
- [ ] Знаю как disconnect() при logout

### 2. Real-time Updates Architecture
- [ ] Понимаю Event-Driven State Management
- [ ] Понимаю flow: Backend event → Frontend listener → Store update → UI re-render
- [ ] Понимаю разницу между HTTP и WebSocket (bidirectional)
- [ ] Знаю когда использовать WebSocket vs HTTP

### 3. Optimistic UI Updates
- [ ] Понимаю концепцию Optimistic UI
- [ ] Понимаю зачем показывать pending статус
- [ ] Понимаю как добавить временное сообщение
- [ ] Понимаю как заменить temporary message на real
- [ ] Понимаю как пометить сообщение failed при ошибке
- [ ] Знаю преимущества (instant UI, status indicators)

### 4. Virtual Scrolling Theory
- [ ] Понимаю проблему производительности без виртуализации
- [ ] Понимаю концепцию Virtual List (render только visible items)
- [ ] Понимаю алгоритм виртуализации (startIndex, endIndex, buffer)
- [ ] Понимаю spacer top/bottom для correct scroll height
- [ ] Знаю преимущества (98.5% меньше DOM элементов)
- [ ] Понимаю vue-virtual-scroller библиотеку

### 5. Message Components Architecture
- [ ] Понимаю ответственность MessageBubble (single message display)
- [ ] Понимаю ответственность MessageList (virtual scrolling container)
- [ ] Знаю разницу между своими и чужими сообщениями (styling)
- [ ] Понимаю status indicators (sent, delivered, read, pending, failed)
- [ ] Понимаю Design System compliance (shadows, no borders, accent color)

### 6. ChatList Real-time Updates
- [ ] Понимаю зачем слушать `message:new` в ChatList
- [ ] Понимаю зачем слушать `chat:created` в ChatList
- [ ] Понимаю метод `updateLastMessage()` в chats store
- [ ] Понимаю метод `addChatToList()` в chats store
- [ ] Понимаю как перемещать чат наверх списка

### 7. Pinia Messages Store
- [ ] Понимаю структуру `messagesByChat` (Record<chatId, Message[]>)
- [ ] Понимаю pagination с `hasMore` флагом
- [ ] Понимаю `addMessage()` для optimistic UI
- [ ] Понимаю `replaceMessage()` для замены temporary
- [ ] Понимаю `markMessageFailed()` для ошибок
- [ ] Понимаю `loadMoreMessages()` для pagination

### 8. useSocket Composable
- [ ] Понимаю зачем нужен composable (DRY, reusability)
- [ ] Понимаю `on()` для подписки на события
- [ ] Понимаю `emit()` для отправки событий
- [ ] Понимаю `emitWithAck()` для Promise-based responses
- [ ] Понимаю cleanup в `onUnmounted()` (предотвращение утечек памяти)
- [ ] Понимаю хранение listeners в Map для cleanup

### 9. Event Listeners Lifecycle
- [ ] Понимаю зачем `onMounted()` для setup listeners
- [ ] Понимаю зачем `onUnmounted()` для cleanup
- [ ] Знаю последствия отсутствия cleanup (memory leaks)
- [ ] Понимаю как использовать `socket.off()` для отписки

### 10. Performance Optimization
- [ ] Понимаю impact виртуализации (500ms → 50ms first render)
- [ ] Понимаю message batching для предотвращения multiple re-renders
- [ ] Понимаю lazy loading images
- [ ] Знаю как измерить performance (DevTools Performance tab)

### 11. Error Handling
- [ ] Понимаю обработку connection errors
- [ ] Понимаю обработку message send failures
- [ ] Понимаю reconnection handling
- [ ] Знаю как показать error state пользователю

---

## 🛠️ Практика (Practice.md)

### Шаг 1: message.types.ts
- [ ] Создал файл `frontend/app/types/message.types.ts`
- [ ] Добавил тип MessageType ('text' | 'image' | 'file' | 'voice')
- [ ] Добавил тип MessageStatus ('pending' | 'sent' | 'delivered' | 'read' | 'failed')
- [ ] Добавил интерфейс Message с полями:
  - [ ] _id: string
  - [ ] sender: User | string
  - [ ] chat: string
  - [ ] text: string
  - [ ] type: MessageType
  - [ ] status: MessageStatus
  - [ ] isDeleted: boolean
  - [ ] createdAt: string
  - [ ] updatedAt: string
- [ ] Добавил интерфейс CreateMessageDto
- [ ] Добавил интерфейс GetMessagesResponse (messages, hasMore)
- [ ] Добавил WebSocket event types (MessageSendEvent, MessageTypingEvent, TypingIndicator)

### Шаг 2: message.service.ts
- [ ] Создал файл `frontend/app/services/api/message.service.ts`
- [ ] Создал класс MessageService
- [ ] Реализовал getMessages() метод (GET /chats/:chatId/messages)
  - [ ] Добавил parameters: limit, skip
  - [ ] Возвращает { messages, hasMore }
- [ ] Реализовал createMessage() метод (POST /messages)
  - [ ] Fallback если WebSocket down
- [ ] Реализовал deleteMessage() метод (DELETE /messages/:id)
- [ ] Добавил getToken() приватный метод
- [ ] Добавил обработку ошибок в каждом методе
- [ ] Использовал useFetch из Nuxt
- [ ] Экспортировал singleton messageService

### Шаг 3: messages.ts Store
- [ ] Создал файл `frontend/app/stores/messages.ts`
- [ ] Использовал Composition API style (setup function)
- [ ] Создал state:
  - [ ] messagesByChat: ref<Record<string, Message[]>>({})
  - [ ] loading: ref(false)
  - [ ] error: ref<string | null>(null)
  - [ ] hasMore: ref<Record<string, boolean>>({})
- [ ] Создал getters:
  - [ ] getMessagesByChatId(chatId): computed
  - [ ] hasMoreMessages(chatId): computed
- [ ] Реализовал loadMessages() action
  - [ ] Вызывает messageService.getMessages()
  - [ ] Реверсирует messages (oldest first)
  - [ ] Сохраняет в messagesByChat[chatId]
- [ ] Реализовал loadMoreMessages() action
  - [ ] Pagination с skip
  - [ ] Добавляет старые сообщения в начало массива
- [ ] Реализовал addMessage() action (для optimistic UI)
- [ ] Реализовал addMessages() action (batching для performance)
- [ ] Реализовал replaceMessage() action (temporary → real)
- [ ] Реализовал markMessageFailed() action
- [ ] Реализовал deleteMessage() action
- [ ] Реализовал clearMessages() action
- [ ] Реализовал clearError() action

### Шаг 4: MessageBubble.vue
- [ ] Создал файл `frontend/app/components/chat/MessageBubble.vue`
- [ ] Добавил props: { message: Message }
- [ ] Реализовал computed isOwn (senderId === currentUserId)
- [ ] Реализовал computed bubbleClasses (own/other/failed)
- [ ] Реализовал computed formattedTime (использует formatTime utility)
- [ ] Реализовал computed statusIcon (✓, ✓✓, ⏳, ❌)
- [ ] Добавил message text display
- [ ] Добавил meta section (time + status)
- [ ] Применил стили:
  - [ ] Свои сообщения: background: $color-accent (yellow)
  - [ ] Чужие сообщения: background: $bg-primary, box-shadow: $shadow-block
  - [ ] Failed сообщения: opacity: 0.6
  - [ ] max-width: 70%
  - [ ] border-radius: $radius
  - [ ] NO borders
  - [ ] word-wrap: break-word
  - [ ] white-space: pre-wrap (preserve line breaks)
- [ ] Добавил pulse animation для pending status
- [ ] Использовал semantic HTML (`<article>`, `<time>`)

### Шаг 5: MessageList.vue
- [ ] Установил vue-virtual-scroller (`yarn add vue-virtual-scroller`)
- [ ] Создал файл `frontend/app/components/chat/MessageList.vue`
- [ ] Импортировал RecycleScroller
- [ ] Импортировал CSS (`vue-virtual-scroller/dist/vue-virtual-scroller.css`)
- [ ] Добавил props: { chatId: string }
- [ ] Создал ref scroller
- [ ] Создал computed messages (из messagesStore)
- [ ] Создал computed loading
- [ ] Создал computed hasMoreMessages
- [ ] Добавил onMounted():
  - [ ] Вызывает loadMessages()
  - [ ] Вызывает scrollToBottom() после загрузки
- [ ] Реализовал watch(messages) для auto-scroll при новом сообщении
- [ ] Реализовал onScrollStart() для pagination:
  - [ ] Проверяет scrollTop < 100
  - [ ] Проверяет hasMoreMessages
  - [ ] Сохраняет scroll position
  - [ ] Вызывает loadMoreMessages()
  - [ ] Восстанавливает scroll position (prevents jump)
- [ ] Реализовал scrollToBottom() функцию
- [ ] Добавил Loading state
- [ ] Добавил Empty state ("Нет сообщений. Напишите первым!")
- [ ] Настроил RecycleScroller:
  - [ ] :items="messages"
  - [ ] :item-size="80"
  - [ ] key-field="_id"
  - [ ] :buffer="200"
  - [ ] @scroll-start="onScrollStart"
- [ ] Использовал semantic HTML (`<section>`)

### Шаг 6: useSocket.ts Composable
- [ ] Создал файл `frontend/app/composables/useSocket.ts`
- [ ] Использовал useNuxtApp() для доступа к $socket
- [ ] Создал Map для хранения listeners
- [ ] Реализовал on() функцию:
  - [ ] Проверяет что socket connected
  - [ ] Вызывает socket.on()
  - [ ] Сохраняет listener в Map
- [ ] Реализовал emit() функцию:
  - [ ] Проверяет что socket connected
  - [ ] Вызывает socket.emit()
- [ ] Реализовал emitWithAck() функцию:
  - [ ] Возвращает Promise
  - [ ] Использует callback acknowledgment
- [ ] Добавил onUnmounted():
  - [ ] Отписывается от всех listeners (socket.off)
  - [ ] Очищает Map
- [ ] Возвращает { on, emit, emitWithAck, instance }

### Шаг 7: socket.client.ts Plugin (Обновление)
- [ ] Открыл `frontend/app/plugins/socket.client.ts`
- [ ] Добавил auto-connect если authStore.isAuthenticated
- [ ] Настроил reconnection options:
  - [ ] reconnection: true
  - [ ] reconnectionDelay: 1000
  - [ ] reconnectionAttempts: 5
- [ ] Добавил event listeners:
  - [ ] socket.on('connect') с логированием
  - [ ] socket.on('disconnect') с логированием
  - [ ] socket.on('connect_error') с логированием
- [ ] Использовал config.public.wsBase из .env
- [ ] Передаёт JWT token в auth.token

### Шаг 8: pages/chat/[id].vue (Интеграция)
- [ ] Открыл `frontend/app/pages/chat/[id].vue`
- [ ] Импортировал useSocket()
- [ ] Импортировал useMessagesStore()
- [ ] Создал messageText ref
- [ ] Добавил в onMounted():
  - [ ] getChatById()
  - [ ] on('message:new', handleNewMessage)
  - [ ] on('message:typing', handleTyping)
  - [ ] emitWithAck('chat:join', { chatId })
- [ ] Добавил onUnmounted():
  - [ ] emitWithAck('chat:leave', { chatId })
- [ ] Реализовал handleSendMessage():
  - [ ] Создаёт temporary message с status: 'pending'
  - [ ] Добавляет в store (optimistic UI)
  - [ ] Очищает input
  - [ ] Отправляет через emitWithAck('message:send')
  - [ ] Заменяет temporary на real при success
  - [ ] Помечает failed при error
- [ ] Реализовал handleNewMessage():
  - [ ] Проверяет chatId
  - [ ] Добавляет в messagesStore
- [ ] Реализовал handleTyping() (заглушка для Day 5)
- [ ] Добавил watch(chatId) для переключения между чатами:
  - [ ] Leave old chat
  - [ ] Join new chat
- [ ] Заменил placeholder на ChatMessageList
- [ ] Добавил chat input:
  - [ ] BaseInput с v-model
  - [ ] @keydown.enter="handleSendMessage"
  - [ ] BaseButton для отправки (icon variant)
  - [ ] :disabled если text пустой

### Шаг 9: ChatList.vue (Real-time Updates)
- [ ] Открыл `frontend/app/components/chat/List.vue`
- [ ] Импортировал useSocket()
- [ ] Добавил в onMounted():
  - [ ] on('message:new', handleNewMessage)
  - [ ] on('chat:created', handleChatCreated)
- [ ] Реализовал handleNewMessage():
  - [ ] Вызывает chatsStore.updateLastMessage(message.chat, message)
- [ ] Реализовал handleChatCreated():
  - [ ] Вызывает chatsStore.addChatToList(chat)
- [ ] Обновил chats.ts store:
  - [ ] Добавил updateLastMessage() метод
  - [ ] Добавил addChatToList() метод
  - [ ] updateLastMessage перемещает чат наверх списка

### Шаг 10: Тестирование
- [ ] Backend запущен (`yarn start:dev`)
- [ ] Frontend запущен (`yarn dev`)
- [ ] Тест 1: Загрузка сообщений работает
- [ ] Тест 2: Отправка сообщения работает (optimistic UI)
- [ ] Тест 3: Получение сообщения в реальном времени
- [ ] Тест 4: ChatList обновляется при новых сообщениях
- [ ] Тест 5: Новый чат появляется в ChatList автоматически
- [ ] Тест 6: Virtual scrolling плавный (60 FPS)
- [ ] Тест 7: Load more на scroll работает
- [ ] Тест 8: Empty state показывается
- [ ] Тест 9: Failed message показывается при ошибке
- [ ] Проверил DevTools Console ([Socket] Connected, [Socket] Joined chat)
- [ ] Проверил Network tab (WebSocket connection)
- [ ] Проверил Vue DevTools (messagesStore обновляется)

---

## 🧪 Функциональное тестирование

### Отображение сообщений
- [ ] Сообщения загружаются при открытии чата
- [ ] Сообщения отсортированы (старые сверху, новые внизу)
- [ ] Свои сообщения справа, желтым background
- [ ] Чужие сообщения слева, серым background
- [ ] Время показывается корректно (HH:MM)
- [ ] Статус показывается для своих сообщений (✓, ✓✓)
- [ ] Empty state если нет сообщений
- [ ] Loading state при загрузке

### Отправка сообщений
- [ ] Input работает
- [ ] Enter отправляет сообщение
- [ ] Button отправляет сообщение
- [ ] Button disabled если text пустой
- [ ] Optimistic UI показывает pending (⏳)
- [ ] Pending меняется на sent (✓) при подтверждении
- [ ] Input очищается после отправки
- [ ] Auto-scroll to bottom при отправке
- [ ] Failed status (❌) при ошибке

### Real-time получение
- [ ] Новое сообщение приходит мгновенно
- [ ] Сообщение отображается корректно
- [ ] Auto-scroll to bottom при получении
- [ ] Нет дубликатов сообщений
- [ ] ChatList lastMessage обновляется
- [ ] ChatList чат перемещается наверх

### Virtual Scrolling
- [ ] Scroll плавный (60 FPS с 1000+ сообщениями)
- [ ] Scroll to top загружает старые сообщения
- [ ] Scroll position сохраняется при загрузке
- [ ] Buffer работает (200px)
- [ ] Item size корректный (80px)
- [ ] Нет "jumping" при scroll

### ChatList Real-time
- [ ] message:new обновляет lastMessage в существующем чате
- [ ] chat:created добавляет новый чат в список
- [ ] Чат с новым сообщением перемещается наверх
- [ ] Время lastMessage обновляется
- [ ] Нет дубликатов чатов

### WebSocket Connection
- [ ] Connection устанавливается при login
- [ ] JWT token передаётся в handshake
- [ ] Disconnection при logout
- [ ] Reconnection при потере сети (5 попыток, 1s delay)
- [ ] Events логируются в console
- [ ] chat:join при открытии чата
- [ ] chat:leave при закрытии чата

### Обработка ошибок
- [ ] Connection error показывается в console
- [ ] Message send error помечает сообщение failed
- [ ] Failed message можно retry (TODO: Day 5)
- [ ] Network offline корректно обрабатывается
- [ ] Empty WebSocket response обрабатывается

### Performance
- [ ] First render < 100ms (с виртуализацией)
- [ ] Scroll FPS ~60 (с 1000+ сообщениями)
- [ ] Message batching работает (нет lag при множественных событиях)
- [ ] Нет memory leaks (cleanup в onUnmounted)

---

## 🎨 Design Compliance

### Unified Background
- [ ] Все элементы используют $bg-primary
- [ ] Свои сообщения используют $color-accent (#FFC700)
- [ ] НЕТ lighten() или darken()
- [ ] НЕТ rgba backgrounds (кроме opacity для failed)

### Shadows
- [ ] MessageBubble (чужие) используют $shadow-block
- [ ] MessageBubble (свои) используют $shadow-block
- [ ] Chat input используют $shadow-block
- [ ] НЕТ custom shadows

### Typography
- [ ] font-family: '5mal6Lampen'
- [ ] Message text normal case (НЕ uppercase)
- [ ] Time и status 11px font-size
- [ ] Text readable (line-height: 1.5)

### Borders
- [ ] НЕТ borders
- [ ] Объём через shadows

### Semantic HTML
- [ ] `<article>` для MessageBubble
- [ ] `<section>` для MessageList
- [ ] `<time>` для времени сообщения
- [ ] `<input>` обёрнут в BaseInput

### Responsive
- [ ] Messages адаптируются под экран
- [ ] max-width: 70% для bubbles
- [ ] Mobile (≤859px) корректно отображается
- [ ] Input растягивается на всю ширину

---

## 🔍 Код Review

### message.types.ts
- [ ] Все типы экспортированы
- [ ] Message интерфейс полный
- [ ] MessageStatus включает pending и failed
- [ ] WebSocket event types определены
- [ ] CreateMessageDto корректный

### message.service.ts
- [ ] Все методы async
- [ ] useFetch используется корректно
- [ ] JWT токен в headers
- [ ] Обработка ошибок везде
- [ ] getMessages поддерживает pagination (limit, skip)
- [ ] Singleton экспортирован

### messages.ts Store
- [ ] Composition API style (setup function)
- [ ] State как ref
- [ ] messagesByChat structure (Record<chatId, Message[]>)
- [ ] hasMore по chatId
- [ ] Actions как functions
- [ ] Try-catch-finally во всех async actions
- [ ] addMessage проверяет дубликаты
- [ ] replaceMessage работает корректно
- [ ] loadMoreMessages добавляет в начало массива
- [ ] Реверсирует messages (oldest first) при загрузке

### MessageBubble.vue
- [ ] Props типизированы
- [ ] computed isOwn реализован
- [ ] computed bubbleClasses реализован
- [ ] computed formattedTime использует utility
- [ ] computed statusIcon работает корректно
- [ ] Стили следуют дизайн-системе
- [ ] Semantic HTML используется
- [ ] white-space: pre-wrap для line breaks

### MessageList.vue
- [ ] Props типизированы
- [ ] RecycleScroller настроен корректно
- [ ] onMounted загружает messages и scrolls to bottom
- [ ] watch(messages) автоматически scrolls при новом сообщении
- [ ] onScrollStart реализует pagination
- [ ] Scroll position preservation работает
- [ ] Loading/Empty states реализованы
- [ ] Semantic HTML используется

### useSocket.ts
- [ ] useNuxtApp() для доступа к $socket
- [ ] Map для хранения listeners
- [ ] on() добавляет listener и сохраняет в Map
- [ ] emit() проверяет connection
- [ ] emitWithAck() возвращает Promise
- [ ] onUnmounted() cleanup реализован
- [ ] Возвращает { on, emit, emitWithAck, instance }

### socket.client.ts
- [ ] Auto-connect если authenticated
- [ ] Reconnection options настроены
- [ ] Event listeners добавлены (connect, disconnect, connect_error)
- [ ] JWT token передаётся в auth.token
- [ ] config.public.wsBase используется
- [ ] Логирование событий

### pages/chat/[id].vue
- [ ] useSocket() импортирован
- [ ] onMounted() setup listeners и join chat
- [ ] onUnmounted() leave chat
- [ ] handleSendMessage() реализован с optimistic UI
- [ ] handleNewMessage() добавляет в store
- [ ] watch(chatId) переключает чаты
- [ ] ChatMessageList интегрирован
- [ ] Chat input интегрирован
- [ ] Keyboard submit (Enter) работает

### chat/List.vue
- [ ] useSocket() импортирован
- [ ] on('message:new') реализован
- [ ] on('chat:created') реализован
- [ ] handleNewMessage() вызывает updateLastMessage
- [ ] handleChatCreated() вызывает addChatToList

### stores/chats.ts (обновления)
- [ ] updateLastMessage() реализован
- [ ] addChatToList() реализован
- [ ] updateLastMessage перемещает чат наверх
- [ ] addChatToList проверяет дубликаты

---

## 🐛 Troubleshooting

### Сообщения не отображаются
- [ ] Проверил что backend запущен
- [ ] Проверил GET /chats/:chatId/messages в Network
- [ ] Проверил messagesStore.messagesByChat[chatId] в Vue DevTools
- [ ] Проверил что loadMessages() вызывается в onMounted
- [ ] Проверил что messages.reverse() выполняется

### WebSocket не подключается
- [ ] Проверил что backend WebSocket запущен
- [ ] Проверил config.public.wsBase в .env
- [ ] Проверил JWT token в localStorage
- [ ] Проверил Network tab (WS connection)
- [ ] Проверил console errors ([Socket] Connection error)
- [ ] Проверил backend logs (WsJwtGuard)

### Optimistic UI не работает
- [ ] Проверил что tempMessage создаётся с status: 'pending'
- [ ] Проверил что addMessage() вызывается до emit
- [ ] Проверил что replaceMessage() вызывается при success
- [ ] Проверил что tempId уникальный

### message:new не приходит
- [ ] Проверил что chat:join вызывается
- [ ] Проверил что on('message:new') listener добавлен
- [ ] Проверил backend (server.to(chatId).emit)
- [ ] Проверил console ([Socket] Joined chat)
- [ ] Проверил что handleNewMessage вызывается

### Virtual scrolling laggy
- [ ] Проверил :item-size (должен быть ~80px)
- [ ] Проверил :buffer (должен быть 200+)
- [ ] Проверил что используется RecycleScroller (не DynamicScroller)
- [ ] Проверил Performance tab в DevTools

### Scroll position jumps при load more
- [ ] Проверил что сохраняется previousScrollHeight
- [ ] Проверил что вычисляется scrollDiff
- [ ] Проверил что восстанавливается scrollTop
- [ ] Проверил что await nextTick() используется

### ChatList не обновляется
- [ ] Проверил что on('message:new') в ChatList.vue
- [ ] Проверил что updateLastMessage() реализован в chats store
- [ ] Проверил что message.chat === chatId проверяется
- [ ] Проверил Vue DevTools (chatsStore.chats)

### Failed message не показывается
- [ ] Проверил catch block в handleSendMessage
- [ ] Проверил что markMessageFailed вызывается
- [ ] Проверил что status === 'failed' устанавливается
- [ ] Проверил класс .message-bubble--failed

---

## ✅ Критерии завершения

День 4 Frontend считается завершённым когда:

### Основное
- [ ] message.types.ts создан
- [ ] message.service.ts создан
- [ ] messages.ts store создан (Pinia)
- [ ] MessageBubble.vue создан
- [ ] MessageList.vue создан с vue-virtual-scroller
- [ ] useSocket.ts composable создан
- [ ] socket.client.ts plugin обновлен
- [ ] pages/chat/[id].vue интегрирован
- [ ] ChatList.vue обновлен для real-time

### Функциональность
- [ ] Сообщения отображаются в чате
- [ ] Virtual scrolling работает плавно (60 FPS)
- [ ] Отправка сообщения работает через WebSocket
- [ ] Optimistic UI показывает pending статус
- [ ] Real-time получение сообщений работает
- [ ] ChatList обновляется при новых сообщениях
- [ ] Новые чаты появляются в ChatList автоматически
- [ ] Load more на scroll работает
- [ ] Empty state показывается
- [ ] Failed state показывается при ошибке
- [ ] WebSocket connection устанавливается при login
- [ ] WebSocket disconnection при logout
- [ ] chat:join при открытии чата
- [ ] chat:leave при закрытии чата

### Качество
- [ ] Код следует PATTERNS_CHECKLIST.md
- [ ] Дизайн следует DESIGN_REFERENCE.md
- [ ] TypeScript типы определены везде
- [ ] Semantic HTML используется
- [ ] WebSocket cleanup в onUnmounted
- [ ] Нет console ошибок
- [ ] Нет TypeScript ошибок
- [ ] Performance оптимизирован (virtual scrolling)
- [ ] Нет memory leaks

### Документация
- [ ] Все чек-листы заполнены
- [ ] Понимаю WebSocket flow
- [ ] Понимаю виртуализацию
- [ ] Понимаю optimistic UI pattern
- [ ] Могу объяснить как работает real-time система

---

## 🎉 Поздравляем!

Если все пункты отмечены, ты завершил Frontend часть Дня 4!

**Следующий шаг:** Протестировать совместно с Backend, затем переходить к Day 5 (Typing indicators, Read receipts, File upload)

---

**Время выполнения:** ~3-4 часа
