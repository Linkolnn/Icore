<template>
  <section class="virtual-message-list" ref="containerRef">
    <!-- Виртуальный скроллер -->
    <div
      v-if="messages.length > 0"
      ref="scrollerRef"
      class="virtual-message-list__scroller"
      @scroll="handleScroll"
    >
      <!-- Спейсер для общей высоты -->
      <div
        class="virtual-message-list__spacer"
        :style="{ height: `${totalHeight}px` }"
      >
        <!-- Видимые сообщения -->
        <div
          class="virtual-message-list__viewport"
          :style="{ transform: `translateY(${offsetY}px)` }"
        >
          <div
            v-for="item in visibleItems"
            :key="item._id"
            v-measure.resize="(height: number) => updateItemHeight(item._id, height)"
            class="virtual-message-list__item"
            :data-index="item.virtualIndex"
            :data-message-id="item._id"
          >
            <ChatMessageBubble 
              :message="item" 
              @edit="handleEditMessage"
              @delete="handleDeleteMessage"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="virtual-message-list__empty">
      <p>Нет сообщений</p>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="virtual-message-list__loading">
      <p>Загрузка...</p>
    </div>

    <!-- Кнопка скролла вниз -->
    <transition name="fade">
      <UiBaseButton
        v-if="showScrollToBottom"
        variant="icon"
        class="virtual-message-list__scroll-btn"
        :class="{ 
          'virtual-message-list__scroll-btn--has-new': newMessagesCount > 0,
          'virtual-message-list__scroll-btn--auto-scroll': isInAutoScrollZone()
        }"
        :title="newMessagesCount > 0 ? `${newMessagesCount} новых сообщений` : 'Прокрутить вниз'"
        aria-label="Прокрутить вниз"
        @click="scrollToBottomSmooth"
      >
        <SvgoArrowIcon3 class="virtual-message-list__scroll-icon" />
        <!-- Badge с количеством новых сообщений -->
        <span v-if="newMessagesCount > 0" class="virtual-message-list__new-badge">
          {{ newMessagesCount > 99 ? '99+' : newMessagesCount }}
        </span>
      </UiBaseButton>
    </transition>
  </section>
</template>

<script setup lang="ts">
import type { Message } from '~/types/message.types'
import { useMessagesStore } from '~/stores/messages'
import { useAuthStore } from '~/stores/auth'
import { useVirtualScroll } from '~/composables/useVirtualScroll'

interface Props {
  chatId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'edit-message': [message: Message]
}>()
const messagesStore = useMessagesStore()

// Get messages for current chat
const messages = computed(() => messagesStore.getMessagesForChat(props.chatId))
const loading = computed(() => messagesStore.loading[props.chatId] || false)
const hasMore = computed(() => messagesStore.hasMore[props.chatId] || false)

// Container refs
const containerRef = ref<HTMLElement>()
const scrollerRef = ref<HTMLElement>()

// Container height (реактивная)
const containerHeight = ref(600)

// Показывать ли кнопку "вниз"
const showScrollToBottom = ref(false)
const scrollDistanceThreshold = 300 // Порог в px для показа кнопки
const newMessagesCount = ref(0) // Счетчик новых сообщений пока не внизу

// Константы для автоскролла
const AUTO_SCROLL_MESSAGE_COUNT = 2 // Количество последних сообщений для автоскролла
const ESTIMATED_MESSAGE_HEIGHT = 60 // Примерная высота одного сообщения в px

// Флаг для отслеживания первой загрузки в текущей сессии
const isInitialLoad = ref(true)

// Флаг для отслеживания загрузки старых сообщений
const isLoadingOlder = ref(false)

// Virtual scrolling setup
const {
  visibleItems,
  totalHeight,
  offsetY,
  handleScroll: onScroll,
  updateItemHeight,
  scrollToBottom,
  preserveScrollPosition
} = useVirtualScroll({
  items: messages,
  itemHeight: 80, // Примерная начальная высота
  containerHeight,
  buffer: 5
})

/**
 * Обновляем высоту контейнера при изменении размера
 */
const resizeObserver = ref<ResizeObserver>()

onMounted(async () => {
  if (containerRef.value) {
    // Получаем начальную высоту
    containerHeight.value = containerRef.value.clientHeight
    
    // Отслеживаем изменения размера
    resizeObserver.value = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.value.observe(containerRef.value)
  }
  
  // Ждем загрузки первых сообщений
  if (messages.value.length === 0) {
    // Если сообщений еще нет, ждем их появления
    await new Promise(resolve => {
      const unwatch = watch(
        () => messages.value.length,
        (newLength) => {
          if (newLength > 0) {
            unwatch()
            resolve(true)
          }
        }
      )
      // Таймаут на случай если сообщения не загрузятся
      setTimeout(() => {
        unwatch()
        resolve(false)
      }, 3000)
    })
  }
  
  // Скроллим вниз после загрузки сообщений - используем несколько попыток
  await nextTick()
  
  // Первая попытка
  scrollToBottomInstant()
  
  // Вторая попытка через небольшую задержку (для Virtual Scroll)
  setTimeout(() => {
    if (scrollerRef.value && messages.value.length > 0) {
      scrollerRef.value.scrollTop = scrollerRef.value.scrollHeight
    }
  }, 100)
  
  // Третья попытка после полного рендеринга
  setTimeout(() => {
    if (scrollerRef.value) {
      scrollerRef.value.scrollTop = scrollerRef.value.scrollHeight
      checkScrollPosition()
    }
    // После первого скролла отключаем флаг
    isInitialLoad.value = false
  }, 300)
})

onUnmounted(() => {
  resizeObserver.value?.disconnect()
})

/**
 * Проверка позиции скролла для управления кнопкой
 */
function checkScrollPosition() {
  if (!scrollerRef.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = scrollerRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  
  // Показываем кнопку если отдалились от низа
  showScrollToBottom.value = distanceFromBottom > scrollDistanceThreshold
  
  // Если вернулись вниз - сбрасываем счетчик
  if (distanceFromBottom < 50) {
    newMessagesCount.value = 0
  }
}

/**
 * Проверяет, находится ли пользователь в зоне автоскролла
 * (в пределах последних N сообщений)
 */
function isInAutoScrollZone(): boolean {
  if (!scrollerRef.value) return true
  
  const { scrollTop, scrollHeight, clientHeight } = scrollerRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  
  // Вычисляем примерную высоту последних N сообщений
  const lastMessagesCount = Math.min(AUTO_SCROLL_MESSAGE_COUNT, messages.value.length)
  const estimatedHeight = lastMessagesCount * ESTIMATED_MESSAGE_HEIGHT
  
  // Минимальный буфер для точной работы
  return distanceFromBottom <= estimatedHeight + 10
}

/**
 * Обработка скролла с загрузкой старых сообщений
 */
async function handleScroll(event: Event) {
  onScroll(event)
  
  const target = event.target as HTMLElement
  
  // Проверяем позицию для кнопки "вниз"
  checkScrollPosition()
  
  // Загружаем больше при скролле вверх (near top)
  if (target.scrollTop < 100 && hasMore.value && !loading.value) {
    const prevCount = messages.value.length
    
    // Устанавливаем флаг, что загружаем старые сообщения
    isLoadingOlder.value = true
    
    await messagesStore.loadMoreMessages(props.chatId)
    
    // Сохраняем позицию скролла после загрузки
    nextTick(() => {
      if (scrollerRef.value) {
        const newScrollTop = preserveScrollPosition(prevCount)
        scrollerRef.value.scrollTop = newScrollTop
      }
    })
  }
}

/**
 * Скролл вниз с анимацией
 */
function scrollToBottomSmooth() {
  if (scrollerRef.value) {
    const { top, behavior } = scrollToBottom('smooth')
    scrollerRef.value.scrollTo({ top, behavior })
    // Скрываем кнопку и сбрасываем счетчик
    showScrollToBottom.value = false
    newMessagesCount.value = 0
  }
}

/**
 * Скролл вниз мгновенно
 */
function scrollToBottomInstant() {
  if (scrollerRef.value) {
    // Используем несколько методов для надежности
    const { top } = scrollToBottom('instant')
    scrollerRef.value.scrollTop = top
    
    // Дополнительно используем scrollIntoView для последнего элемента
    nextTick(() => {
      const lastItem = scrollerRef.value?.querySelector('.virtual-message-list__item:last-child') as HTMLElement
      if (lastItem) {
        lastItem.scrollIntoView({ behavior: 'instant', block: 'end' })
      }
      
      // Еще раз устанавливаем scrollTop на максимум
      if (scrollerRef.value) {
        scrollerRef.value.scrollTop = scrollerRef.value.scrollHeight
      }
    })
    
    // Скрываем кнопку и сбрасываем счетчик
    showScrollToBottom.value = false
    newMessagesCount.value = 0
  }
}

/**
 * Handle message edit - emit to parent
 */
function handleEditMessage(message: Message) {
  emit('edit-message', message)
}

/**
 * Handle message delete
 */
async function handleDeleteMessage(message: Message) {
  try {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()
    
    // Отправляем запрос на удаление
    await $fetch(`/messages/${message._id}`, {
      baseURL: config.public.apiBase,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })
    
    // Полностью удаляем сообщение из списка
    messagesStore.removeMessage(props.chatId, message._id)
  } catch (error) {
  }
}

/**
 * Watch messages for auto-scroll on new message
 */
watch(
  messages,
  async (newMessages, oldMessages) => {
    if (!newMessages || newMessages.length === 0) return
    
    const newLength = newMessages.length
    const oldLength = oldMessages?.length || 0
    
    if (newLength > oldLength) {
      // Ждем обновления DOM
      await nextTick()
      
      // Если это загрузка старых сообщений (скролл вверх), НЕ скроллим вниз
      if (isLoadingOlder.value) {
        isLoadingOlder.value = false
        return
      }
      
      // Если это первая загрузка сообщений
      if (oldLength === 0 || isInitialLoad.value) {
        // Скроллим вниз только при первой загрузке в сессии
        if (isInitialLoad.value) {
          setTimeout(() => {
            scrollToBottomInstant()
            isInitialLoad.value = false
          }, 50)
        }
      } else if (scrollerRef.value) {
        // Проверяем, добавились ли сообщения в конец (новые) или в начало (старые)
        // Если последнее сообщение то же - значит загрузили старые
        const oldLastMessage = oldMessages?.[oldLength - 1]
        const newLastMessage = newMessages[newLength - 1]
        
        if (oldLastMessage && newLastMessage && oldLastMessage._id === newLastMessage._id) {
          // Загрузили старые сообщения - не скроллим
          return
        }
        
        // Проверяем последнее сообщение - если это наше, всегда скроллим вниз
        const authStore = useAuthStore()
        const senderId = typeof newLastMessage?.sender === 'string' 
          ? newLastMessage.sender 
          : newLastMessage?.sender?._id
        const isOwnMessage = senderId === authStore.user?._id
        
        if (isOwnMessage) {
          // Если отправили сами - всегда скроллим вниз
          setTimeout(() => {
            scrollToBottomSmooth()
          }, 50)
        } else {
          // Чужое сообщение - проверяем нахождение в зоне автоскролла
          const inAutoScrollZone = isInAutoScrollZone()
          
          // Отладка: логируем расстояние от низа
          if (scrollerRef.value) {
            const { scrollTop, scrollHeight, clientHeight } = scrollerRef.value
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight
          }
          
          if (inAutoScrollZone) {
            // Пользователь читает последние сообщения - автоматически скроллим к новым
            // Это обеспечивает плавное чтение новых сообщений без необходимости скроллить вручную
            setTimeout(() => {
              scrollToBottomSmooth()
            }, 50)
          } else {
            // Пользователь читает историю - не мешаем
            // Показываем счетчик новых сообщений и кнопку для быстрого перехода вниз
            const addedMessages = newLength - oldLength
            newMessagesCount.value += addedMessages
            checkScrollPosition()
          }
        }
      }
    }
  },
  { deep: true }
)

/**
 * Форсированный скролл вниз (для родительского компонента)
 */
function forceScrollToBottom() {
  if (scrollerRef.value) {
    scrollerRef.value.scrollTop = scrollerRef.value.scrollHeight
    showScrollToBottom.value = false
    newMessagesCount.value = 0
  }
}

// Expose methods for parent
defineExpose({
  scrollToBottom: scrollToBottomSmooth,
  scrollToBottomInstant,
  forceScrollToBottom
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
    // Стили скроллбара теперь глобальные в main.scss
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
    
    &--auto-scroll {
      // Индикация активной зоны автоскролла
      border: 2px solid rgba($accent-primary, 0.3);
      
      &::after {
        content: '';
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 2px 8px;
        background: rgba($bg-primary, 0.9);
        color: $text-secondary;
        font-size: 10px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      &:hover::after {
        opacity: 1;
        content: 'Автоскролл активен';
      }
    }
  }

  &__scroll-icon {
    width: 20px;
    height: 20px;
    transform: rotate(0deg); // Стрелка вниз
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

// Анимация появления/исчезновения
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

// Анимация пульсации для новых сообщений
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
