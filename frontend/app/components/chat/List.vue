<template>
  <section class="chat-list">
    <!-- Loading State -->
    <div v-if="isLoading" class="chat-list__loading">
      <p>Загрузка чатов...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="chatsStore.chatsError" class="chat-list__error">
      <p>{{ chatsStore.chatsError }}</p>
      <UiBaseButton variant="secondary" @click="handleRetry">
        Повторить
      </UiBaseButton>
    </div>

    <!-- Empty State -->
    <div v-else-if="chatsStore.chats.length === 0" class="chat-list__empty">
      <p>У вас пока нет чатов</p>
      <p class="chat-list__empty-hint">
        Найдите пользователя через поиск и начните общение
      </p>
    </div>

    <!-- Chat Items -->
    <div v-else class="chat-list__items">
      <ChatItem
        v-for="chat in chatsStore.chats"
        :key="chat._id"
        :chat="chat"
        :unread-count="chat.unreadCount || 0"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useSocket } from '~/composables/useSocket'

/**
 * ChatList Component
 *
 * Применяем Component Pattern:
 * - Отображение списка чатов
 * - Управление состояниями (loading, error, empty)
 * - Интеграция с ChatsStore
 */

// ===== STORE =====

const chatsStore = useChatsStore()

// ===== STATE =====

/**
 * Флаг для задержки показа загрузки
 * Предотвращает мигание "Загрузка чатов..." при быстрых переходах
 */
const showLoadingState = ref(false)

// ===== COMPUTED =====

/**
 * Показывать загрузку только если она длится больше 300ms
 */
const isLoading = computed(() => {
  return chatsStore.chatsLoading && showLoadingState.value
})

// ===== WATCHERS =====

/**
 * Отслеживаем изменения загрузки с задержкой
 */
let loadingTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => chatsStore.chatsLoading, (newValue) => {
  if (newValue) {
    // Загрузка началась - показываем индикатор только через 300ms
    loadingTimeout = setTimeout(() => {
      showLoadingState.value = true
    }, 300)
  } else {
    // Загрузка закончилась - сразу скрываем индикатор
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      loadingTimeout = null
    }
    showLoadingState.value = false
  }
})

// ===== WEBSOCKET =====

const socket = useSocket()

/**
 * Real-time listeners for chat updates
 * ВАЖНО: Регистрируем в setup, а не в onMounted
 */

// Listen for new messages to update lastMessage
socket.on('message:new', (message: any) => {
  // Извлекаем chatId (может быть строкой или объектом с _id)
  const chatId = typeof message.chat === 'string' ? message.chat : message.chat._id
  chatsStore.updateLastMessageInList(chatId, message)
})

// Listen for new chats
socket.on('chat:created', (chat: any) => {
  chatsStore.addChatToList(chat)
})

/**
 * Load initial chats on mount
 */
onMounted(() => {
  chatsStore.loadChats()
})

/**
 * Cleanup: remove listeners and clear timer
 */
onUnmounted(() => {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
  }

  // WebSocket listeners are auto-removed by useSocket composable
})

// ===== METHODS =====

/**
 * Повторная попытка загрузки
 */
function handleRetry() {
  chatsStore.loadChats()
}
</script>

<style lang="scss" scoped>
.chat-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0px;
  overflow-y: auto;
  height: 100%;

  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 32px 16px;
    text-align: center;
    color: $text-secondary;
  }

  &__error {
    color: #F44336;

    p {
      color: #F44336;
    }
  }

  &__empty-hint {
    @include font-styles(14px, 400, 1.4);
    color: $text-placeholder;
    max-width: 250px;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}
</style>
