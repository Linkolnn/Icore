# 🛠️ Frontend Practice - День 4: Virtual Scrolling и Real-time

> Пошаговая реализация кастомного Virtual Scrolling и real-time функционала

---

## 📋 Содержание

1. [Socket.io Plugin](#step-1-socketio-plugin)
2. [useSocket Composable](#step-2-usesocket-composable)
3. [Virtual Scrolling Composable](#step-3-virtual-scrolling-composable)
4. [v-measure Директива](#step-4-v-measure-директива)
5. [VirtualList Component](#step-5-virtuallist-component)
6. [Real-time обновления](#step-6-real-time-обновления)

---

## Step 1: Socket.io Plugin

### 1.1 Установка зависимостей

```bash
cd frontend
yarn add socket.io-client jwt-decode
yarn add -D @types/jwt-decode
```

### 1.2 Создание plugin

```typescript
// plugins/socket.client.ts
import { io, Socket } from 'socket.io-client'
import { jwtDecode } from 'jwt-decode'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const tokenCookie = useCookie('accessToken')
  
  // Инициализация Socket.io
  const socket: Socket = io(config.public.apiBase, {
    auth: {
      token: tokenCookie.value || '',
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })
  
  // Автоматическое присоединение к персональной комнате
  socket.on('connect', () => {
    console.log('✅ Socket connected')
    
    if (tokenCookie.value) {
      try {
        const decoded = jwtDecode<{ sub: string }>(tokenCookie.value)
        // НЕ используем emit, сервер сам присоединит по userId из токена
      } catch (error) {
        console.error('Failed to decode token:', error)
      }
    }
  })
  
  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected')
  })
  
  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })
  
  return {
    provide: {
      socket,
    },
  }
})
```

---

## Step 2: useSocket Composable

### 2.1 Создание composable

```typescript
// composables/useSocket.ts
import type { Socket } from 'socket.io-client'

export const useSocket = () => {
  const { $socket } = useNuxtApp()
  const socket = $socket as Socket
  
  // Retry логика для регистрации слушателей
  const on = (event: string, handler: (...args: any[]) => void) => {
    const trySubscribe = (): boolean => {
      if (socket && socket.on) {
        socket.on(event, handler)
        return true
      }
      return false
    }
    
    if (!trySubscribe()) {
      // Если socket еще не готов, повторяем попытки
      const retryInterval = setInterval(() => {
        if (trySubscribe()) {
          clearInterval(retryInterval)
        }
      }, 100)
      
      // Таймаут через 5 секунд
      setTimeout(() => clearInterval(retryInterval), 5000)
    }
  }
  
  // Emit с подтверждением (acknowledgment)
  const emitWithAck = <T = any>(
    event: string,
    data: any,
  ): Promise<{ success: boolean; error?: string; [key: string]: any }> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not initialized'))
        return
      }
      
      socket.emit(event, data, (response: any) => {
        if (response?.success) {
          resolve(response)
        } else {
          reject(new Error(response?.error || 'Unknown error'))
        }
      })
    })
  }
  
  // Простой emit
  const emit = (event: string, data?: any) => {
    if (socket) {
      socket.emit(event, data)
    }
  }
  
  // Отписка от события
  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, handler)
    }
  }
  
  return {
    on,
    off,
    emit,
    emitWithAck,
    socket,
  }
}
```

---

## Step 3: Virtual Scrolling Composable

### 3.1 Создание composable

```typescript
// composables/useVirtualScroll.ts
import { ref, computed, type Ref, type ComputedRef } from 'vue'

interface VirtualScrollOptions {
  items: Ref<any[]>
  itemHeight?: number
  containerHeight: Ref<number>
  buffer?: number
}

interface VirtualScrollResult {
  visibleItems: ComputedRef<any[]>
  totalHeight: ComputedRef<number>
  offsetY: ComputedRef<number>
  scrollPosition: Ref<number>
  updateItemHeight: (itemId: string, height: number) => void
  handleScroll: (event: Event) => void
  scrollToBottom: () => void
}

export function useVirtualScroll(
  options: VirtualScrollOptions,
): VirtualScrollResult {
  const { items, itemHeight = 80, containerHeight, buffer = 5 } = options
  
  // Кеш высот элементов
  const itemHeights = new Map<string, number>()
  const averageHeight = ref(itemHeight)
  
  // Позиция скролла
  const scrollPosition = ref(0)
  
  // Расчет видимых элементов
  const visibleItems = computed(() => {
    const scrollTop = scrollPosition.value
    const containerH = containerHeight.value
    
    // Индексы с учетом буфера
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / averageHeight.value) - buffer,
    )
    const endIndex = Math.min(
      items.value.length,
      Math.ceil((scrollTop + containerH) / averageHeight.value) + buffer,
    )
    
    // Возвращаем элементы с их виртуальными индексами
    return items.value.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      virtualIndex: startIndex + index,
    }))
  })
  
  // Общая высота всех элементов
  const totalHeight = computed(() => {
    let height = 0
    items.value.forEach((item) => {
      const itemH = itemHeights.get(item._id) || averageHeight.value
      height += itemH
    })
    return height
  })
  
  // Смещение viewport
  const offsetY = computed(() => {
    const firstVisibleItem = visibleItems.value[0]
    if (!firstVisibleItem) return 0
    
    let offset = 0
    for (let i = 0; i < firstVisibleItem.virtualIndex; i++) {
      const item = items.value[i]
      if (item) {
        offset += itemHeights.get(item._id) || averageHeight.value
      }
    }
    return offset
  })
  
  // Обновление высоты элемента
  function updateItemHeight(itemId: string, height: number) {
    if (height > 0) {
      itemHeights.set(itemId, height)
      
      // Пересчитываем среднюю высоту
      if (itemHeights.size > 0) {
        const heights = Array.from(itemHeights.values())
        const sum = heights.reduce((a, b) => a + b, 0)
        averageHeight.value = Math.round(sum / heights.length)
      }
    }
  }
  
  // Обработка скролла
  function handleScroll(event: Event) {
    const target = event.target as HTMLElement
    scrollPosition.value = target.scrollTop
  }
  
  // Скролл вниз
  function scrollToBottom() {
    // Будет вызван из компонента с доступом к DOM
  }
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    scrollPosition,
    updateItemHeight,
    handleScroll,
    scrollToBottom,
  }
}
```

---

## Step 4: v-measure Директива

### 4.1 Создание директивы

```typescript
// directives/vMeasure.ts
import { type DirectiveBinding, nextTick } from 'vue'

interface ResizeObserverElement extends HTMLElement {
  _resizeObserver?: ResizeObserver
}

export default {
  mounted(el: ResizeObserverElement, binding: DirectiveBinding) {
    const callback = binding.value
    
    if (typeof callback !== 'function') {
      console.warn('v-measure directive requires a function callback')
      return
    }
    
    // Функция измерения
    const measure = () => {
      const rect = el.getBoundingClientRect()
      callback(rect.height)
    }
    
    // Начальное измерение после рендера
    nextTick(() => {
      measure()
    })
    
    // ResizeObserver для динамических изменений
    if (binding.modifiers.resize) {
      const resizeObserver = new ResizeObserver(() => {
        measure()
      })
      
      resizeObserver.observe(el)
      
      // Сохраняем для cleanup
      el._resizeObserver = resizeObserver
    }
  },
  
  updated(el: ResizeObserverElement, binding: DirectiveBinding) {
    // При обновлении контента перемеряем
    if (binding.modifiers.resize) {
      const callback = binding.value
      if (typeof callback === 'function') {
        nextTick(() => {
          const rect = el.getBoundingClientRect()
          callback(rect.height)
        })
      }
    }
  },
  
  unmounted(el: ResizeObserverElement) {
    // Cleanup
    if (el._resizeObserver) {
      el._resizeObserver.disconnect()
      delete el._resizeObserver
    }
  },
}
```

### 4.2 Регистрация директивы

```typescript
// plugins/directives.client.ts
import vMeasure from '~/directives/vMeasure'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('measure', vMeasure)
})
```

---

## Step 5: VirtualList Component

### 5.1 Создание компонента

```vue
// components/chat/message/VirtualList.vue
<template>
  <section class="virtual-message-list" ref="containerRef">
    <!-- Список сообщений -->
    <div
      v-if="messages.length > 0"
      ref="scrollerRef"
      class="virtual-message-list__scroller"
      @scroll="handleScroll"
    >
      <!-- Spacer для создания скроллбара -->
      <div
        class="virtual-message-list__spacer"
        :style="{ height: `${totalHeight}px` }"
      >
        <!-- Viewport с видимыми элементами -->
        <div
          class="virtual-message-list__viewport"
          :style="{ transform: `translateY(${offsetY}px)` }"
        >
          <div
            v-for="item in visibleItems"
            :key="item._id"
            v-measure.resize="(height: number) => updateItemHeight(item._id, height)"
            class="virtual-message-list__item"
          >
            <ChatMessageBubble :message="item" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Пустое состояние -->
    <div v-else class="virtual-message-list__empty">
      Нет сообщений
    </div>
    
    <!-- Индикатор загрузки -->
    <div v-if="loading" class="virtual-message-list__loading">
      Загрузка сообщений...
    </div>
    
    <!-- Кнопка скролла вниз -->
    <transition name="fade">
      <UiBaseButton
        v-if="showScrollToBottom"
        variant="icon"
        class="virtual-message-list__scroll-btn"
        :class="{ 'virtual-message-list__scroll-btn--has-new': newMessagesCount > 0 }"
        @click="scrollToBottomSmooth"
      >
        <SvgoArrowIcon2 class="virtual-message-list__scroll-icon" />
        <span
          v-if="newMessagesCount > 0"
          class="virtual-message-list__new-badge"
        >
          {{ newMessagesCount > 99 ? '99+' : newMessagesCount }}
        </span>
      </UiBaseButton>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { useVirtualScroll } from '~/composables/useVirtualScroll'
import { useMessagesStore } from '~/stores/messages'
import { useAuthStore } from '~/stores/auth'

// Props
interface Props {
  chatId: string
}

const props = defineProps<Props>()

// Stores
const messagesStore = useMessagesStore()
const authStore = useAuthStore()

// Refs
const containerRef = ref<HTMLElement>()
const scrollerRef = ref<HTMLElement>()
const containerHeight = ref(600)
const showScrollToBottom = ref(false)
const newMessagesCount = ref(0)

// Data
const messages = computed(() => messagesStore.getMessages(props.chatId))
const loading = computed(() => messagesStore.loading)

// Virtual Scrolling
const {
  visibleItems,
  totalHeight,
  offsetY,
  scrollPosition,
  updateItemHeight,
  handleScroll: handleVirtualScroll,
} = useVirtualScroll({
  items: messages,
  itemHeight: 80,
  containerHeight,
  buffer: 5,
})

// Методы
function handleScroll(event: Event) {
  handleVirtualScroll(event)
  checkScrollPosition()
}

function checkScrollPosition() {
  if (!scrollerRef.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = scrollerRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  
  // Показываем кнопку если далеко от низа
  showScrollToBottom.value = distanceFromBottom > 300
  
  // Сбрасываем счетчик если достигли низа
  if (distanceFromBottom < 100) {
    newMessagesCount.value = 0
  }
}

function scrollToBottomSmooth() {
  if (!scrollerRef.value) return
  
  scrollerRef.value.scrollTo({
    top: scrollerRef.value.scrollHeight,
    behavior: 'smooth',
  })
  
  newMessagesCount.value = 0
  showScrollToBottom.value = false
}

function scrollToBottomInstant() {
  if (!scrollerRef.value) return
  
  scrollerRef.value.scrollTop = scrollerRef.value.scrollHeight
  newMessagesCount.value = 0
  showScrollToBottom.value = false
}

// Автоскролл при входе
onMounted(async () => {
  // Измеряем контейнер
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
  
  // Ждем загрузки сообщений
  await nextTick()
  
  // Несколько попыток скролла для надежности
  for (let i = 0; i < 3; i++) {
    await nextTick()
    scrollToBottomInstant()
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
})

// Автоскролл при новых сообщениях
watch(() => messages.value.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    nextTick(() => {
      const lastMessage = messages.value[newLen - 1]
      const isOwnMessage = lastMessage.sender === authStore.user?._id
      
      if (isOwnMessage) {
        // Свое сообщение - всегда скроллим
        scrollToBottomSmooth()
      } else {
        // Чужое - проверяем позицию
        if (!scrollerRef.value) return
        
        const { scrollTop, scrollHeight, clientHeight } = scrollerRef.value
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
        
        if (isAtBottom) {
          scrollToBottomSmooth()
        } else {
          // Увеличиваем счетчик
          newMessagesCount.value++
        }
      }
    })
  }
})

// Expose для родителя
defineExpose({
  scrollToBottomInstant,
  scrollToBottomSmooth,
  forceScrollToBottom: scrollToBottomInstant,
})
</script>

<style lang="scss" scoped>
.virtual-message-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  height: 100%;

  &__scroller {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
  }

  &__spacer {
    position: relative;
    width: 100%;
  }

  &__viewport {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 10px 0px 0px;
    will-change: transform;
  }

  &__item {
    padding: 4px 0;
  }

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;
    font-size: 14px;
  }

  &__loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 8px;
    text-align: center;
    background: rgba($bg-primary, 0.9);
    color: $text-secondary;
    font-size: 12px;
    z-index: 10;
  }

  &__scroll-btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 20;
    box-shadow: $shadow-block, 0 4px 12px rgba(0, 0, 0, 0.15);
    background: $bg-primary !important;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-block, 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    &--has-new {
      animation: pulse 2s infinite;
    }
  }

  &__scroll-icon {
    width: 20px;
    height: 20px;
    transform: rotate(0deg);
  }

  &__new-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: $accent-primary;
    color: $color-dark;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

// Анимации
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes pulse {
  0% {
    box-shadow: $shadow-block, 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: $shadow-block, 0 6px 20px rgba($accent-primary, 0.4);
  }
  100% {
    box-shadow: $shadow-block, 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
</style>
```

---

## Step 6: Real-time обновления

### 6.1 Обновление ChatList

```vue
// components/chat/List.vue - добавляем обработчики
<script setup lang="ts">
import { useSocket } from '~/composables/useSocket'
import { useChatsStore } from '~/stores/chats'

const chatsStore = useChatsStore()
const { on, off } = useSocket()

// Real-time обновления
onMounted(() => {
  // Новое сообщение - обновляем lastMessage
  on('message:new', (message: any) => {
    chatsStore.updateLastMessageInList(message.chat, message)
  })
  
  // Новый чат создан
  on('chat:created', (chat: any) => {
    chatsStore.addChatToList(chat)
  })
})

onUnmounted(() => {
  off('message:new')
  off('chat:created')
})
</script>
```

### 6.2 Отправка сообщений

```vue
// pages/chat/[id].vue
<script setup lang="ts">
const { emitWithAck } = useSocket()

async function handleSendMessage() {
  if (!newMessage.value.trim()) return
  
  try {
    // Optimistic UI - показываем сразу
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      text: newMessage.value,
      sender: authStore.user,
      chat: chatId,
      createdAt: new Date(),
      status: 'pending',
    }
    
    messagesStore.addMessage(chatId, tempMessage)
    
    // Очищаем поле
    const messageText = newMessage.value
    newMessage.value = ''
    
    // Отправляем на сервер
    const response = await emitWithAck('message:send', {
      chatId,
      text: messageText,
    })
    
    if (response.success) {
      // Заменяем временное на реальное
      messagesStore.replaceMessage(chatId, tempMessage._id, response.message)
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    // Помечаем как failed
    messagesStore.markMessageFailed(chatId, tempMessage._id)
  }
}
</script>
```

---

## 🎯 Чек-лист

- [ ] Socket.io plugin создан и подключен
- [ ] useSocket composable работает с retry логикой
- [ ] useVirtualScroll правильно расчитывает видимые элементы
- [ ] v-measure директива измеряет высоты
- [ ] VirtualList компонент рендерит только видимые сообщения
- [ ] Автоскролл работает при входе и новых сообщениях
- [ ] Кнопка "Вниз" появляется/исчезает правильно
- [ ] Real-time обновления приходят через WebSocket
- [ ] Optimistic UI работает для отправки сообщений
- [ ] Производительность: 60 FPS при скролле 1000+ сообщений

---

## 📊 Метрики производительности

### Измерение в Chrome DevTools

1. **Performance tab**
   - Record при скролле
   - FPS должен быть 55-60
   - Scripting time < 10ms

2. **Memory tab**
   - Heap snapshot
   - С Virtual: ~20MB
   - Без Virtual: ~150MB

3. **Rendering tab**
   - Paint flashing
   - Только видимая область

### Консольные команды

```javascript
// Проверка количества DOM элементов
document.querySelectorAll('.virtual-message-list__item').length
// Должно быть ~20-30, не 1000

// Проверка памяти
performance.memory.usedJSHeapSize / 1048576
// Должно быть < 50MB
```

---

## 🐛 Решение проблем

### Virtual Scrolling не работает
```
Симптом: Все элементы рендерятся
Причина: Неправильный расчет высот
Решение: Проверить offsetY и totalHeight
```

### Скачки при скролле
```
Симптом: Прыжки позиции
Причина: Динамические высоты меняются
Решение: Увеличить buffer, кешировать высоты
```

### Socket не подключается
```
Симптом: Нет real-time обновлений
Причина: Неверный токен или URL
Решение: Проверить auth.token и apiBase
```
