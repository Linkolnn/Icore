# 📖 Frontend Theory - День 4: Virtual Scrolling и Real-time

> Глубокое понимание кастомного Virtual Scrolling и real-time на frontend

---

## 📚 Содержание

1. [Проблема производительности](#1-проблема-производительности)
2. [Концепция Virtual Scrolling](#2-концепция-virtual-scrolling)
3. [Архитектура решения](#3-архитектура-решения)
4. [Socket.io Client](#4-socketio-client)
5. [Optimistic UI Pattern](#5-optimistic-ui-pattern)
6. [Директивы Vue](#6-директивы-vue)
7. [Автоскролл и UX](#7-автоскролл-и-ux)

---

## 1. Проблема производительности

### Обычный рендеринг

```vue
<!-- БЕЗ Virtual Scrolling -->
<div class="messages">
  <div v-for="message in messages" :key="message.id">
    {{ message.text }}
  </div>
</div>
```

**При 1000 сообщениях:**
```
DOM nodes: 1000
Memory: ~150-200MB
Render time: 500-800ms
Scroll FPS: 15-25
```

### Почему это проблема?

1. **DOM overhead** - браузер хранит каждый узел
2. **Memory leak** - память не освобождается
3. **Reflow/Repaint** - пересчет при каждом изменении
4. **Event listeners** - обработчики на каждом элементе

### Визуализация проблемы

```
Viewport (видимая область)
┌─────────────────┐
│  Message 498    │ ← Рендерится
│  Message 499    │ ← Рендерится  
│  Message 500    │ ← Рендерится
└─────────────────┘
   Message 501     ← Рендерится (невидимо!)
   Message 502     ← Рендерится (невидимо!)
   ...
   Message 999     ← Рендерится (невидимо!)
   Message 1000    ← Рендерится (невидимо!)
```

---

## 2. Концепция Virtual Scrolling

### Идея

Рендерить только видимые элементы + небольшой буфер.

```
Viewport
┌─────────────────┐
│  Message 498    │ ← Рендерится
│  Message 499    │ ← Рендерится
│  Message 500    │ ← Рендерится
└─────────────────┘
   [Не рендерится]
   [Не рендерится]
   ...
   [Не рендерится]
```

### Компоненты Virtual Scrolling

```
┌──────────────────────────┐
│     Container            │ ← Фиксированная высота
│  ┌────────────────────┐  │
│  │    Spacer          │  │ ← totalHeight (создает скроллбар)
│  │  ┌──────────────┐  │  │
│  │  │   Viewport   │  │  │ ← Только видимые элементы
│  │  │  [Items]     │  │  │
│  │  └──────────────┘  │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

### Математика Virtual Scrolling

```typescript
// Расчет видимых элементов
const startIndex = Math.floor(scrollTop / averageItemHeight) - bufferSize
const endIndex = Math.ceil((scrollTop + containerHeight) / averageItemHeight) + bufferSize

// Позиционирование viewport
const offsetY = startIndex * averageItemHeight

// Общая высота для скроллбара
const totalHeight = items.length * averageItemHeight
```

---

## 3. Архитектура решения

### useVirtualScroll Composable

```typescript
export function useVirtualScroll({
  items,
  itemHeight = 80,
  containerHeight,
  buffer = 5
}) {
  // Кеш высот элементов
  const itemHeights = new Map<string, number>()
  const averageHeight = ref(itemHeight)
  
  // Позиция скролла
  const scrollPosition = ref(0)
  
  // Расчет видимых элементов
  const visibleItems = computed(() => {
    const start = Math.floor(scrollPosition.value / averageHeight.value) - buffer
    const end = Math.ceil((scrollPosition.value + containerHeight.value) / averageHeight.value) + buffer
    
    return items.value
      .slice(Math.max(0, start), Math.min(items.value.length, end))
      .map((item, index) => ({
        ...item,
        virtualIndex: start + index
      }))
  })
  
  // Общая высота
  const totalHeight = computed(() => {
    let height = 0
    items.value.forEach(item => {
      height += itemHeights.get(item._id) || averageHeight.value
    })
    return height
  })
  
  // Обновление высоты элемента
  function updateItemHeight(itemId: string, height: number) {
    itemHeights.set(itemId, height)
    // Пересчет средней высоты
    const heights = Array.from(itemHeights.values())
    averageHeight.value = heights.reduce((a, b) => a + b, 0) / heights.length
  }
  
  return {
    visibleItems,
    totalHeight,
    offsetY: computed(() => /* расчет смещения */),
    updateItemHeight,
    handleScroll
  }
}
```

### VirtualList Component

```vue
<template>
  <div class="virtual-list" ref="containerRef">
    <div 
      ref="scrollerRef"
      class="virtual-list__scroller"
      @scroll="handleScroll"
    >
      <!-- Spacer создает высоту для скроллбара -->
      <div 
        class="virtual-list__spacer"
        :style="{ height: `${totalHeight}px` }"
      >
        <!-- Viewport с видимыми элементами -->
        <div 
          class="virtual-list__viewport"
          :style="{ transform: `translateY(${offsetY}px)` }"
        >
          <div
            v-for="item in visibleItems"
            :key="item._id"
            v-measure="(height) => updateItemHeight(item._id, height)"
          >
            <MessageBubble :message="item" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 4. Socket.io Client

### Инициализация в Nuxt Plugin

```typescript
// plugins/socket.client.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const tokenCookie = useCookie('accessToken')
  
  const socket = io(config.public.apiBase, {
    auth: {
      token: tokenCookie.value
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  })
  
  // Автоматическое присоединение к персональной комнате
  socket.on('connect', () => {
    if (tokenCookie.value) {
      const decoded = jwtDecode(tokenCookie.value)
      socket.emit('user:join', { userId: decoded.sub })
    }
  })
  
  return {
    provide: {
      socket
    }
  }
})
```

### useSocket Composable

```typescript
export const useSocket = () => {
  const { $socket } = useNuxtApp()
  
  // Retry логика для слушателей
  const on = (event: string, handler: Function) => {
    const trySubscribe = () => {
      if ($socket && $socket.on) {
        $socket.on(event, handler)
        return true
      }
      return false
    }
    
    // Если socket еще не готов, повторяем
    if (!trySubscribe()) {
      const retryInterval = setInterval(() => {
        if (trySubscribe()) {
          clearInterval(retryInterval)
        }
      }, 100)
    }
  }
  
  // Emit с подтверждением
  const emitWithAck = <T>(event: string, data: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      $socket.emit(event, data, (response: any) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(response.error)
        }
      })
    })
  }
  
  return { on, emit: $socket.emit, emitWithAck, off: $socket.off }
}
```

---

## 5. Optimistic UI Pattern

### Концепция

Показываем результат действия сразу, не дожидаясь сервера.

```
User clicks Send → Show message immediately → Send to server → Update with real data
                    ↓ (if failed)
                    Show error & rollback
```

### Реализация

```typescript
async function sendMessage(text: string) {
  // 1. Создаем временное сообщение
  const tempMessage = {
    _id: `temp-${Date.now()}`,
    text,
    sender: currentUser,
    status: 'pending',
    createdAt: new Date()
  }
  
  // 2. Сразу показываем в UI
  messages.value.push(tempMessage)
  
  // 3. Отправляем на сервер
  try {
    const response = await socket.emitWithAck('message:send', { text })
    
    // 4. Заменяем временное на реальное
    const index = messages.value.findIndex(m => m._id === tempMessage._id)
    messages.value[index] = response.message
    
  } catch (error) {
    // 5. При ошибке помечаем как failed
    tempMessage.status = 'failed'
  }
}
```

### Визуальные состояния

```vue
<template>
  <div 
    class="message"
    :class="{
      'message--pending': message.status === 'pending',
      'message--failed': message.status === 'failed'
    }"
  >
    {{ message.text }}
    <span v-if="message.status === 'pending'">⏳</span>
    <span v-if="message.status === 'failed'">❌ Retry</span>
  </div>
</template>
```

---

## 6. Директивы Vue

### v-measure директива

```typescript
// directives/vMeasure.ts
export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const callback = binding.value
    
    // Начальное измерение
    const measure = () => {
      const rect = el.getBoundingClientRect()
      callback(rect.height)
    }
    
    // Измеряем после рендера
    nextTick(() => measure())
    
    // ResizeObserver для динамических изменений
    if (binding.modifiers.resize) {
      const observer = new ResizeObserver(measure)
      observer.observe(el)
      
      // Сохраняем для cleanup
      el._resizeObserver = observer
    }
  },
  
  unmounted(el: HTMLElement) {
    if (el._resizeObserver) {
      el._resizeObserver.disconnect()
    }
  }
}
```

### Использование

```vue
<div 
  v-measure.resize="(height) => updateItemHeight(message.id, height)"
  class="message"
>
  <!-- Контент с динамической высотой -->
  <img v-if="message.image" :src="message.image" />
  <p>{{ message.text }}</p>
</div>
```

---

## 7. Автоскролл и UX

### Стратегии автоскролла

```typescript
// 1. При входе в чат - всегда вниз
onMounted(async () => {
  await nextTick()
  scrollToBottomInstant()
})

// 2. При своем сообщении - всегда вниз
watch(() => messages.value.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    const lastMessage = messages.value[newLen - 1]
    if (lastMessage.sender === currentUser.id) {
      scrollToBottomSmooth()
    }
  }
})

// 3. При чужом сообщении - только если уже внизу
function handleNewMessage(message) {
  const isAtBottom = isScrolledToBottom()
  messages.value.push(message)
  
  if (isAtBottom) {
    scrollToBottomSmooth()
  } else {
    showNewMessageIndicator()
  }
}
```

### Кнопка "Вниз"

```vue
<template>
  <transition name="fade">
    <button 
      v-if="showScrollButton"
      @click="scrollToBottom"
      class="scroll-to-bottom"
    >
      <ArrowDownIcon />
      <span v-if="newMessagesCount" class="badge">
        {{ newMessagesCount }}
      </span>
    </button>
  </transition>
</template>

<script setup>
const showScrollButton = computed(() => {
  return distanceFromBottom.value > 300
})

const newMessagesCount = computed(() => {
  // Считаем непрочитанные ниже viewport
  return messages.value.filter(m => 
    m.createdAt > lastSeenTimestamp.value &&
    m.sender !== currentUser.id
  ).length
})
</script>
```

---

## 🎯 Ключевые выводы

### Virtual Scrolling решает:
- ✅ Проблемы с памятью (8x меньше)
- ✅ Лаги при скролле (60 FPS)
- ✅ Время рендеринга (15x быстрее)
- ✅ Масштабируемость (10000+ элементов)

### Кастомная реализация дает:
- ✅ Полный контроль над поведением
- ✅ Интеграцию с Vue 3 reactivity
- ✅ Динамические высоты элементов
- ✅ Минимальный размер кода

### Optimistic UI обеспечивает:
- ✅ Мгновенный отклик
- ✅ Плавный UX
- ✅ Graceful degradation при ошибках
- ✅ Визуальную обратную связь

### Real-time через Socket.io:
- ✅ Автопереподключение
- ✅ Типизированные события
- ✅ Retry логику
- ✅ Acknowledgments

---

## 📚 Дополнительное чтение

- [Virtual Scrolling Techniques](https://blog.logrocket.com/virtual-scrolling-core-principles-and-implementations/)
- [Optimistic UI Patterns](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- [Vue 3 Custom Directives](https://vuejs.org/guide/reusability/custom-directives.html)
- [Socket.io Client Documentation](https://socket.io/docs/v4/client-api/)
