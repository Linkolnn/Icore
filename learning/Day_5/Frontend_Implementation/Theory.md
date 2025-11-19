# 🎓 Теория: Advanced UX Frontend

## 📋 Содержание
1. [Optimistic UI Pattern](#optimistic-ui-pattern)
2. [Infinite Scroll with Virtual List](#infinite-scroll)
3. [Real-time Status Updates](#real-time-status)
4. [Typing Indicators UX](#typing-indicators)
5. [Search Interface Design](#search-interface)

---

## Optimistic UI Pattern

### 🎯 Концепция

Optimistic UI предполагает мгновенное обновление интерфейса без ожидания ответа сервера. При ошибке - откат изменений.

### Преимущества:
- ✅ Мгновенная обратная связь
- ✅ Ощущение скорости
- ✅ Лучший UX
- ✅ Меньше визуальных "прыжков"

### Реализация в Vue 3:

```typescript
// composables/useOptimisticUpdate.ts
export function useOptimisticUpdate() {
  const pending = ref(new Map<string, any>())
  const failed = ref(new Set<string>())
  
  async function optimisticUpdate<T>(
    id: string,
    optimisticData: T,
    serverCall: () => Promise<T>
  ): Promise<T> {
    // 1. Сразу обновляем UI
    pending.value.set(id, optimisticData)
    
    try {
      // 2. Делаем запрос к серверу
      const serverData = await serverCall()
      
      // 3. Заменяем на серверные данные
      pending.value.delete(id)
      return serverData
      
    } catch (error) {
      // 4. При ошибке помечаем как failed
      pending.value.delete(id)
      failed.value.add(id)
      
      // 5. Через 3 секунды убираем из failed
      setTimeout(() => {
        failed.value.delete(id)
      }, 3000)
      
      throw error
    }
  }
  
  return {
    pending: readonly(pending),
    failed: readonly(failed),
    optimisticUpdate
  }
}
```

### Применение для сообщений:

```vue
<script setup lang="ts">
const { optimisticUpdate, failed } = useOptimisticUpdate()

async function sendMessage(text: string) {
  const tempId = `temp-${Date.now()}`
  
  // Создаем временное сообщение
  const tempMessage = {
    _id: tempId,
    text,
    sender: currentUser.value,
    createdAt: new Date(),
    status: 'pending'
  }
  
  // Добавляем в список сразу
  messages.value.push(tempMessage)
  
  try {
    // Отправляем на сервер
    const realMessage = await optimisticUpdate(
      tempId,
      tempMessage,
      () => api.sendMessage(chatId, text)
    )
    
    // Заменяем временное на реальное
    const index = messages.value.findIndex(m => m._id === tempId)
    if (index !== -1) {
      messages.value[index] = realMessage
    }
  } catch (error) {
    // UI автоматически покажет ошибку через failed
  }
}
</script>

<template>
  <div 
    v-for="message in messages" 
    :key="message._id"
    :class="{
      'message--pending': message._id.startsWith('temp-'),
      'message--failed': failed.has(message._id)
    }"
  >
    {{ message.text }}
    <span v-if="failed.has(message._id)" class="error">
      Failed to send
    </span>
  </div>
</template>
```

---

## Infinite Scroll with Virtual List

### 🔄 Интеграция с существующим VirtualList

```typescript
// composables/useInfiniteScroll.ts
export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  options: InfiniteScrollOptions = {}
) {
  const {
    threshold = 200, // px от края
    direction = 'bottom',
    delay = 100
  } = options
  
  const loading = ref(false)
  const hasMore = ref(true)
  const observer = ref<IntersectionObserver>()
  
  // Debounced load function
  const debouncedLoad = useDebounceFn(async () => {
    if (loading.value || !hasMore.value) return
    
    loading.value = true
    try {
      await loadMore()
    } finally {
      loading.value = false
    }
  }, delay)
  
  function observe(element: HTMLElement) {
    if (observer.value) {
      observer.value.disconnect()
    }
    
    observer.value = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore.value && !loading.value) {
          debouncedLoad()
        }
      },
      {
        root: element.parentElement,
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    )
    
    // Наблюдаем за sentinel элементом
    const sentinel = direction === 'bottom' 
      ? element.lastElementChild 
      : element.firstElementChild
      
    if (sentinel) {
      observer.value.observe(sentinel)
    }
  }
  
  function disconnect() {
    observer.value?.disconnect()
  }
  
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    loading: readonly(loading),
    hasMore,
    observe,
    disconnect
  }
}
```

### Использование с VirtualList:

```vue
<template>
  <VirtualList 
    ref="virtualListRef"
    :messages="messages"
    @scroll="handleScroll"
  >
    <!-- Sentinel для загрузки старых сообщений -->
    <div 
      v-if="hasMore" 
      ref="topSentinel" 
      class="sentinel-top"
    >
      <LoadingSpinner v-if="loading" />
    </div>
    
    <!-- Сообщения -->
    <MessageBubble 
      v-for="message in messages"
      :key="message._id"
      :message="message"
    />
  </VirtualList>
</template>

<script setup lang="ts">
const messagesStore = useMessagesStore()
const { loading, hasMore, observe } = useInfiniteScroll(
  async () => {
    const result = await messagesStore.loadMoreMessages(chatId)
    hasMore.value = result.hasMore
  },
  { direction: 'top', threshold: 500 }
)

onMounted(() => {
  if (topSentinel.value) {
    observe(topSentinel.value)
  }
})
</script>
```

---

## Real-time Status Updates

### 📊 Визуализация статусов

```vue
<!-- components/chat/message/Status.vue -->
<template>
  <div class="message-status" :class="`message-status--${status}`">
    <!-- Pending -->
    <Icon 
      v-if="status === 'pending'" 
      name="clock" 
      class="status-icon status-icon--pending"
    />
    
    <!-- Sent -->
    <Icon 
      v-else-if="status === 'sent'" 
      name="check" 
      class="status-icon status-icon--sent"
    />
    
    <!-- Delivered -->
    <Icon 
      v-else-if="status === 'delivered'" 
      name="check-check" 
      class="status-icon status-icon--delivered"
    />
    
    <!-- Read -->
    <Icon 
      v-else-if="status === 'read'" 
      name="check-check" 
      class="status-icon status-icon--read"
    />
    
    <!-- Failed -->
    <Icon 
      v-else-if="status === 'failed'" 
      name="alert-circle" 
      class="status-icon status-icon--failed"
      @click="$emit('retry')"
    />
  </div>
</template>

<style lang="scss" scoped>
.message-status {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  
  .status-icon {
    width: 16px;
    height: 16px;
    transition: all 0.3s ease;
    
    &--pending {
      color: $text-secondary;
      animation: pulse 1.5s infinite;
    }
    
    &--sent {
      color: $text-secondary;
    }
    
    &--delivered {
      color: $text-primary;
    }
    
    &--read {
      color: $accent-primary;
    }
    
    &--failed {
      color: $color-error;
      cursor: pointer;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
```

### Composable для статусов:

```typescript
// composables/useMessageStatus.ts
export function useMessageStatus() {
  const { socket } = useSocket()
  const messagesStore = useMessagesStore()
  
  // Отслеживаем видимые сообщения
  const visibleMessages = ref<Set<string>>(new Set())
  const observer = ref<IntersectionObserver>()
  
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
  
  // Debounced функция отправки прочтений
  const markAsRead = useDebounceFn(() => {
    const unreadIds = Array.from(visibleMessages.value)
      .filter(id => {
        const msg = messagesStore.getMessageById(id)
        return msg && msg.status !== 'read'
      })
    
    if (unreadIds.length > 0) {
      socket.emit('messages:read', {
        messageIds: unreadIds,
        chatId: currentChatId.value
      })
    }
  }, 1000)
  
  // Слушаем обновления статусов
  socket.on('message:status:updated', ({ messageId, status }) => {
    messagesStore.updateMessageStatus(messageId, status)
  })
  
  return {
    trackVisibility,
    visibleMessages: readonly(visibleMessages)
  }
}
```

---

## Typing Indicators UX

### 💬 Компонент индикатора

```vue
<!-- components/chat/TypingIndicator.vue -->
<template>
  <Transition name="slide-up">
    <div v-if="isTyping" class="typing-indicator">
      <div class="typing-indicator__avatars">
        <Avatar 
          v-for="user in typingUsers" 
          :key="user.userId"
          :user="user"
          size="xs"
          class="typing-indicator__avatar"
        />
      </div>
      
      <div class="typing-indicator__text">
        <span v-if="typingUsers.length === 1">
          {{ typingUsers[0].username }} печатает
        </span>
        <span v-else>
          {{ typingUsers.length }} человек печатают
        </span>
        
        <div class="typing-indicator__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: $bg-primary;
  box-shadow: $shadow-block;
  border-radius: $radius;
  margin: 8px 16px;
  
  &__avatars {
    display: flex;
    margin-right: 12px;
    
    .typing-indicator__avatar {
      margin-left: -8px;
      border: 2px solid $bg-primary;
      
      &:first-child {
        margin-left: 0;
      }
    }
  }
  
  &__text {
    display: flex;
    align-items: center;
    color: $text-secondary;
    font-size: 14px;
  }
  
  &__dots {
    display: inline-flex;
    margin-left: 4px;
    
    span {
      width: 4px;
      height: 4px;
      background: $text-secondary;
      border-radius: 50%;
      margin: 0 2px;
      animation: typing 1.4s infinite;
      
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
```

### Composable для typing:

```typescript
// composables/useTyping.ts
export function useTyping(chatId: Ref<string>) {
  const { socket } = useSocket()
  const typingUsers = ref<TypingUser[]>([])
  const isTyping = computed(() => typingUsers.value.length > 0)
  const localTyping = ref(false)
  
  // Debounced отправка typing:stop
  const stopTyping = useDebounceFn(() => {
    if (localTyping.value) {
      socket.emit('typing:stop', { chatId: chatId.value })
      localTyping.value = false
    }
  }, 3000)
  
  function startTyping() {
    if (!localTyping.value) {
      socket.emit('typing:start', { chatId: chatId.value })
      localTyping.value = true
    }
    stopTyping() // Сбрасываем таймер
  }
  
  function forceStopTyping() {
    stopTyping.cancel()
    if (localTyping.value) {
      socket.emit('typing:stop', { chatId: chatId.value })
      localTyping.value = false
    }
  }
  
  // Слушаем typing события
  socket.on('typing:update', (data: { chatId: string; typing: TypingUser[] }) => {
    if (data.chatId === chatId.value) {
      typingUsers.value = data.typing
    }
  })
  
  // Очищаем при unmount
  onUnmounted(() => {
    forceStopTyping()
  })
  
  return {
    typingUsers: readonly(typingUsers),
    isTyping: readonly(isTyping),
    startTyping,
    forceStopTyping
  }
}
```

---

## Search Interface Design

### 🔍 Компонент поиска

```vue
<!-- components/chat/SearchPanel.vue -->
<template>
  <Transition name="slide-down">
    <div v-if="isOpen" class="search-panel">
      <div class="search-panel__header">
        <input
          v-model="query"
          ref="searchInput"
          type="text"
          placeholder="Поиск сообщений..."
          class="search-panel__input"
          @input="handleSearch"
          @keydown.esc="close"
        />
        
        <button 
          class="search-panel__close"
          @click="close"
        >
          <Icon name="x" />
        </button>
      </div>
      
      <div class="search-panel__results">
        <!-- Loading -->
        <div v-if="loading" class="search-panel__loading">
          <LoadingSpinner />
          <span>Поиск...</span>
        </div>
        
        <!-- No results -->
        <div v-else-if="!loading && results.length === 0 && query" class="search-panel__empty">
          <Icon name="search" />
          <span>Ничего не найдено</span>
        </div>
        
        <!-- Results -->
        <div v-else class="search-panel__list">
          <div 
            v-for="message in results"
            :key="message._id"
            class="search-result"
            @click="scrollToMessage(message._id)"
          >
            <Avatar 
              :user="message.sender" 
              size="sm"
              class="search-result__avatar"
            />
            
            <div class="search-result__content">
              <div class="search-result__header">
                <span class="search-result__name">
                  {{ message.sender.name }}
                </span>
                <span class="search-result__time">
                  {{ formatTime(message.createdAt) }}
                </span>
              </div>
              
              <div 
                class="search-result__text"
                v-html="highlightText(message.text, query)"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Navigation -->
      <div v-if="results.length > 0" class="search-panel__nav">
        <button 
          :disabled="currentIndex === 0"
          @click="navigatePrev"
        >
          <Icon name="chevron-up" />
        </button>
        
        <span class="search-panel__counter">
          {{ currentIndex + 1 }} / {{ results.length }}
        </span>
        
        <button 
          :disabled="currentIndex === results.length - 1"
          @click="navigateNext"
        >
          <Icon name="chevron-down" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  scrollTo: [messageId: string]
}>()

const { search, results, loading, highlights } = useSearch()

const query = ref('')
const currentIndex = ref(0)

// Debounced search
const handleSearch = useDebounceFn(() => {
  if (query.value.length >= 2) {
    search(query.value)
    currentIndex.value = 0
  }
}, 300)

function scrollToMessage(messageId: string) {
  emit('scrollTo', messageId)
  
  // Подсветка сообщения
  nextTick(() => {
    const element = document.querySelector(`[data-message-id="${messageId}"]`)
    if (element) {
      element.classList.add('message--highlighted')
      setTimeout(() => {
        element.classList.remove('message--highlighted')
      }, 2000)
    }
  })
}

function highlightText(text: string, query: string): string {
  if (!query) return text
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function navigatePrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    scrollToMessage(results.value[currentIndex.value]._id)
  }
}

function navigateNext() {
  if (currentIndex.value < results.value.length - 1) {
    currentIndex.value++
    scrollToMessage(results.value[currentIndex.value]._id)
  }
}

// Focus input on open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})
</script>
```

---

## 🎯 Best Practices

### 1. Performance
- Используйте `v-memo` для оптимизации списков
- Debounce для частых операций
- Throttle для scroll событий
- Virtual scrolling для больших списков

### 2. Accessibility
- Keyboard navigation в поиске
- ARIA labels для статусов
- Focus management
- Screen reader support

### 3. Error Handling
- Graceful degradation
- Retry механизмы
- Offline support
- Error boundaries

### 4. Testing
- Unit тесты для composables
- Component тесты для UI
- E2E для критических путей
- Performance monitoring

---

## ✅ Проверка понимания

1. **Как работает Optimistic UI?**
2. **Зачем нужен debounce для typing?**
3. **Как IntersectionObserver помогает с производительностью?**
4. **Почему важно отслеживать видимость сообщений?**
5. **Как правильно подсвечивать результаты поиска?**

---

## 📚 Дополнительные материалы

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [VueUse Library](https://vueuse.org/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Optimistic UI Patterns](https://www.smashingmagazine.com/2016/11/true-lies-of-optimistic-user-interfaces/)
