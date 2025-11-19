# 💻 Практика: Frontend Implementation

## 📋 План реализации

1. [Message Status Component](#step-1-message-status)
2. [Typing Indicator](#step-2-typing-indicator)  
3. [Composables](#step-3-composables)
4. [Store Updates](#step-4-store-updates)
5. [Integration](#step-5-integration)

---

## Step 1: Message Status Component

### 📝 Создаем компонент статуса

**Файл:** `frontend/app/components/chat/message/Status.vue`

```vue
<template>
  <div 
    class="message-status"
    :class="`message-status--${status}`"
    :title="statusTitle"
  >
    <!-- Clock icon for pending -->
    <svg 
      v-if="status === 'pending'"
      class="status-icon status-icon--pending"
      width="16" height="16" viewBox="0 0 16 16"
    >
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8 5 L8 8 L10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    
    <!-- Single check for sent -->
    <svg 
      v-else-if="status === 'sent'"
      class="status-icon status-icon--sent"
      width="16" height="16" viewBox="0 0 16 16"
    >
      <path d="M4 8 L7 11 L12 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    
    <!-- Double check for delivered -->
    <svg 
      v-else-if="status === 'delivered'"
      class="status-icon status-icon--delivered"
      width="20" height="16" viewBox="0 0 20 16"
    >
      <path d="M2 8 L5 11 L10 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 8 L11 11 L16 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    
    <!-- Double check filled for read -->
    <svg 
      v-else-if="status === 'read'"
      class="status-icon status-icon--read"
      width="20" height="16" viewBox="0 0 20 16"
    >
      <path d="M2 8 L5 11 L10 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 8 L11 11 L16 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    
    <!-- Error icon for failed -->
    <svg 
      v-else-if="status === 'failed'"
      class="status-icon status-icon--failed"
      width="16" height="16" viewBox="0 0 16 16"
      @click="$emit('retry')"
    >
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8 5 L8 9 M8 11 L8 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
interface Props {
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  readBy?: string[]
  deliveredTo?: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  retry: []
}>()

const statusTitle = computed(() => {
  switch (props.status) {
    case 'pending': return 'Отправка...'
    case 'sent': return 'Отправлено'
    case 'delivered': return 'Доставлено'
    case 'read': return 'Прочитано'
    case 'failed': return 'Ошибка отправки. Нажмите для повтора'
    default: return ''
  }
})
</script>

<style lang="scss" scoped>
.message-status {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  height: 16px;
  
  .status-icon {
    transition: all 0.3s ease;
    
    &--pending {
      color: rgba($text-primary, 0.4);
      animation: rotate 1s linear infinite;
    }
    
    &--sent {
      color: rgba($text-primary, 0.5);
    }
    
    &--delivered {
      color: rgba($text-primary, 0.7);
    }
    
    &--read {
      color: $accent-primary;
    }
    
    &--failed {
      color: #F44336;
      cursor: pointer;
      
      &:hover {
        transform: scale(1.2);
      }
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
```

---

## Step 2: Typing Indicator

### 📝 Создаем компонент индикатора набора

**Файл:** `frontend/app/components/chat/TypingIndicator.vue`

```vue
<template>
  <Transition name="typing-fade">
    <div v-if="typingUsers.length > 0" class="typing-indicator">
      <div class="typing-indicator__content">
        <div class="typing-indicator__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        <span class="typing-indicator__text">
          <template v-if="typingUsers.length === 1">
            {{ typingUsers[0].username }} печатает
          </template>
          <template v-else-if="typingUsers.length === 2">
            {{ typingUsers[0].username }} и {{ typingUsers[1].username }} печатают
          </template>
          <template v-else>
            {{ typingUsers[0].username }} и еще {{ typingUsers.length - 1 }} печатают
          </template>
        </span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface TypingUser {
  userId: string
  username: string
  startedAt: Date
}

interface Props {
  typingUsers: TypingUser[]
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
.typing-indicator {
  padding: 8px 16px;
  margin: 0 10px 10px 10px;
  
  &__content {
    display: inline-flex;
    align-items: center;
    padding: 8px 12px;
    background: $bg-primary;
    box-shadow: $shadow-block;
    border-radius: 18px;
    max-width: 250px;
  }
  
  &__dots {
    display: flex;
    align-items: center;
    margin-right: 8px;
    
    span {
      width: 8px;
      height: 8px;
      background: $text-secondary;
      border-radius: 50%;
      margin: 0 2px;
      animation: typing-bounce 1.4s infinite;
      
      &:nth-child(1) { animation-delay: 0ms; }
      &:nth-child(2) { animation-delay: 200ms; }
      &:nth-child(3) { animation-delay: 400ms; }
    }
  }
  
  &__text {
    color: $text-secondary;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.typing-fade-enter-active { transition: all 0.3s ease; }
.typing-fade-leave-active { transition: all 0.2s ease; }
.typing-fade-enter-from { transform: translateY(10px); opacity: 0; }
.typing-fade-leave-to { transform: translateY(-5px); opacity: 0; }
</style>
```

---

## Step 3: Composables

### 📝 Composable для typing

**Файл:** `frontend/app/composables/useTyping.ts`

```typescript
import { ref, computed, onUnmounted, Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

interface TypingUser {
  userId: string
  username: string
  startedAt: Date
}

export function useTyping(chatId: Ref<string>) {
  const { socket } = useSocket()
  const typingUsers = ref<TypingUser[]>([])
  const isTyping = computed(() => typingUsers.value.length > 0)
  const isLocalTyping = ref(false)
  
  // Автоматическая остановка через 3 секунды
  const stopTyping = useDebounceFn(() => {
    if (isLocalTyping.value) {
      socket.emit('typing:stop', { chatId: chatId.value })
      isLocalTyping.value = false
    }
  }, 3000)
  
  // Начать печатать
  function startTyping() {
    if (!isLocalTyping.value) {
      socket.emit('typing:start', { chatId: chatId.value })
      isLocalTyping.value = true
    }
    stopTyping() // Сбрасываем таймер
  }
  
  // Принудительная остановка
  function forceStopTyping() {
    stopTyping.cancel()
    if (isLocalTyping.value) {
      socket.emit('typing:stop', { chatId: chatId.value })
      isLocalTyping.value = false
    }
  }
  
  // Слушаем события typing
  socket.on('typing:update', (data: { chatId: string; typing: TypingUser[] }) => {
    if (data.chatId === chatId.value) {
      typingUsers.value = data.typing
    }
  })
  
  onUnmounted(() => {
    forceStopTyping()
  })
  
  return {
    typingUsers: readonly(typingUsers),
    isTyping: readonly(isTyping),
    isLocalTyping: readonly(isLocalTyping),
    startTyping,
    forceStopTyping
  }
}
```

### 📝 Composable для статусов

**Файл:** `frontend/app/composables/useMessageStatus.ts`

```typescript
import { ref, readonly, Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

export function useMessageStatus(chatId: Ref<string>) {
  const { socket } = useSocket()
  const messagesStore = useMessagesStore()
  
  const visibleMessages = ref<Set<string>>(new Set())
  const observer = ref<IntersectionObserver>()
  
  // Отслеживание видимости сообщений
  function trackVisibility(element: HTMLElement, messageId: string) {
    if (!observer.value) {
      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const id = entry.target.getAttribute('data-message-id')
            if (id) {
              if (entry.isIntersecting) {
                visibleMessages.value.add(id)
              } else {
                visibleMessages.value.delete(id)
              }
            }
          })
          
          // Отправляем статусы прочтения
          if (visibleMessages.value.size > 0) {
            markAsRead()
          }
        },
        { threshold: 0.5 }
      )
    }
    
    element.setAttribute('data-message-id', messageId)
    observer.value.observe(element)
  }
  
  // Debounced отправка прочтений
  const markAsRead = useDebounceFn(() => {
    const unreadIds = Array.from(visibleMessages.value).filter(id => {
      const msg = messagesStore.getMessageById(chatId.value, id)
      return msg && msg.status !== 'read' && msg.sender !== useAuthStore().user?._id
    })
    
    if (unreadIds.length > 0) {
      socket.emit('messages:read', {
        messageIds: unreadIds,
        chatId: chatId.value
      })
    }
  }, 1000)
  
  // Отправка статуса доставки
  function markAsDelivered(messageIds: string[]) {
    socket.emit('messages:delivered', { messageIds })
  }
  
  // Слушаем обновления статусов
  socket.on('message:status:updated', ({ messageId, status }) => {
    messagesStore.updateMessageStatus(messageId, status)
  })
  
  onUnmounted(() => {
    observer.value?.disconnect()
  })
  
  return {
    trackVisibility,
    markAsDelivered,
    visibleMessages: readonly(visibleMessages)
  }
}
```

---

## Step 4: Store Updates

### 📝 Обновляем messages store

**Файл:** `frontend/app/stores/messages.ts` (дополнения)

```typescript
// Добавляем новые методы в store

export const useMessagesStore = defineStore('messages', () => {
  // ... existing code ...
  
  /**
   * Обновить статус сообщения
   */
  function updateMessageStatus(messageId: string, status: string) {
    for (const [chatId, messages] of chatMessages.value.entries()) {
      const index = messages.findIndex(m => m._id === messageId)
      if (index !== -1) {
        messages[index] = {
          ...messages[index],
          status
        }
        break
      }
    }
  }
  
  /**
   * Получить сообщение по ID
   */
  function getMessageById(chatId: string, messageId: string) {
    const messages = chatMessages.value.get(chatId)
    return messages?.find(m => m._id === messageId)
  }
  
  /**
   * Редактировать сообщение
   */
  async function editMessage(messageId: string, newText: string) {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()
    
    const response = await $fetch(`${config.public.apiBase}/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      },
      body: { text: newText }
    })
    
    if (response.success && response.message) {
      // Обновляем в store
      for (const [chatId, messages] of chatMessages.value.entries()) {
        const index = messages.findIndex(m => m._id === messageId)
        if (index !== -1) {
          messages[index] = response.message
          break
        }
      }
    }
    
    return response
  }
  
  /**
   * Пагинация с курсором
   */
  async function loadMoreMessages(chatId: string) {
    const cursor = nextCursors.value.get(chatId)
    if (!cursor || loading.value.get(chatId)) return { hasMore: false }
    
    loading.value.set(chatId, true)
    
    try {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()
      
      const response = await $fetch(
        `${config.public.apiBase}/messages/chats/${chatId}/paginated`, 
        {
          params: { cursor, limit: 50 },
          headers: {
            Authorization: `Bearer ${authStore.accessToken}`
          }
        }
      )
      
      // Добавляем в начало массива (старые сообщения)
      const currentMessages = chatMessages.value.get(chatId) || []
      const existingIds = new Set(currentMessages.map(m => m._id))
      const newMessages = response.messages.filter(m => !existingIds.has(m._id))
      
      chatMessages.value.set(chatId, [...newMessages, ...currentMessages])
      
      // Обновляем курсор
      if (response.nextCursor) {
        nextCursors.value.set(chatId, response.nextCursor)
      } else {
        nextCursors.value.delete(chatId)
      }
      
      return { hasMore: response.hasMore }
      
    } finally {
      loading.value.set(chatId, false)
    }
  }
  
  /**
   * Поиск сообщений
   */
  async function searchMessages(query: string, chatId?: string) {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()
    
    const response = await $fetch(`${config.public.apiBase}/messages/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      },
      body: {
        query,
        chatId,
        limit: 50
      }
    })
    
    return response
  }
  
  // Экспортируем новые методы
  return {
    // ... existing exports ...
    updateMessageStatus,
    getMessageById,
    editMessage,
    loadMoreMessages,
    searchMessages
  }
})
```

---

## Step 5: Integration

### 📝 Интеграция в страницу чата

**Файл:** `frontend/app/pages/chat/[id].vue` (обновления)

```vue
<template>
  <div class="chat-page">
    <!-- Search Panel -->
    <SearchPanel 
      :is-open="isSearchOpen"
      :chat-id="chatId"
      @close="isSearchOpen = false"
      @scroll-to="scrollToMessage"
    />
    
    <!-- Chat Header with search button -->
    <ChatHeader 
      :chat="currentChat"
      @search="isSearchOpen = true"
    />
    
    <!-- Messages area -->
    <div class="messages-area">
      <!-- Typing Indicator -->
      <TypingIndicator 
        v-if="typingUsers.length > 0"
        :typing-users="typingUsers"
      />
      
      <!-- Messages List -->
      <VirtualList 
        ref="virtualListRef"
        :messages="messages"
        @load-more="handleLoadMore"
      >
        <template #message="{ message }">
          <MessageBubble 
            :message="message"
            :data-message-id="message._id"
            @contextmenu.prevent="handleContextMenu($event, message)"
          >
            <!-- Add status component -->
            <template #status>
              <MessageStatus 
                v-if="message.sender === currentUser._id"
                :status="message.status"
                @retry="retryMessage(message._id)"
              />
            </template>
          </MessageBubble>
        </template>
      </VirtualList>
    </div>
    
    <!-- Chat Input with typing -->
    <ChatInput 
      v-model="messageText"
      @send="sendMessage"
      @typing="handleTyping"
    />
    
    <!-- Context Menu -->
    <ContextMenu 
      :is-open="contextMenu.isOpen"
      :message="contextMenu.message"
      :position="contextMenu.position"
      :current-user-id="currentUser._id"
      @close="contextMenu.isOpen = false"
      @edit="handleEdit"
      @reply="handleReply"
      @copy="handleCopy"
      @forward="handleForward"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
// Imports
import { useTyping } from '~/composables/useTyping'
import { useMessageStatus } from '~/composables/useMessageStatus'

// Props & route
const route = useRoute()
const chatId = computed(() => route.params.id as string)

// Composables
const { typingUsers, startTyping, forceStopTyping } = useTyping(chatId)
const { trackVisibility, markAsDelivered } = useMessageStatus(chatId)

// Search
const isSearchOpen = ref(false)

// Context menu
const contextMenu = ref({
  isOpen: false,
  message: null,
  position: { x: 0, y: 0 }
})

// Typing handler
function handleTyping() {
  startTyping()
}

// Context menu handler
function handleContextMenu(event: MouseEvent, message: any) {
  contextMenu.value = {
    isOpen: true,
    message,
    position: { x: event.clientX, y: event.clientY }
  }
}

// Load more messages
async function handleLoadMore() {
  const result = await messagesStore.loadMoreMessages(chatId.value)
  return result.hasMore
}

// Scroll to message (from search)
function scrollToMessage(messageId: string) {
  virtualListRef.value?.scrollToMessage(messageId)
}

// Track message visibility for read receipts
onMounted(() => {
  // Set up intersection observer
  const messageElements = document.querySelectorAll('[data-message-id]')
  messageElements.forEach(el => {
    const messageId = el.getAttribute('data-message-id')
    if (messageId) {
      trackVisibility(el as HTMLElement, messageId)
    }
  })
})

// Stop typing on unmount
onUnmounted(() => {
  forceStopTyping()
})
</script>
```

---

## ✅ Контрольные точки

### После выполнения у вас должно быть:

1. **Компонент Status.vue** - показывает статусы сообщений
2. **Компонент TypingIndicator.vue** - анимированный индикатор
3. **Composable useTyping** - управление typing состоянием
4. **Composable useMessageStatus** - отслеживание прочтений
5. **SearchPanel.vue** - поиск с подсветкой
6. **ContextMenu.vue** - контекстное меню действий
7. **Обновленный store** - новые методы для статусов

### Проверка работы:

```bash
# Запуск frontend
yarn dev

# Проверка в браузере
# 1. Отправьте сообщение - должен появиться статус
# 2. Начните печатать - должен появиться индикатор
# 3. Нажмите Ctrl+F - должен открыться поиск
# 4. Правый клик на сообщении - контекстное меню
```

---

## 🎯 Результат

После выполнения всех шагов ваш frontend будет поддерживать:
- ✅ Отображение статусов сообщений
- ✅ Анимированные typing indicators
- ✅ Контекстное меню с действиями
- ✅ Поиск с подсветкой результатов
- ✅ Автоматические read receipts
- ✅ Infinite scroll с курсорами
