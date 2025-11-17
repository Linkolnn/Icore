<template>
  <main class="chat-page" :class="{ 'chat-page--leaving': isLeaving }">
    <!-- Loading State -->
    <div v-if="chatsStore.currentChatLoading || previewLoading" class="chat-page__loading">
      <p>{{ isPreviewMode ? 'Загрузка пользователя...' : 'Загрузка чата...' }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="chatsStore.chatsError || previewError" class="chat-page__error">
      <p>{{ chatsStore.chatsError || previewError }}</p>
      <UiBaseButton variant="secondary" @click="handleRetry">
        Повторить
      </UiBaseButton>
      <UiBaseButton variant="secondary" @click="handleBack">
        Назад к списку
      </UiBaseButton>
    </div>

    <!-- Chat Content (normal mode with chat OR preview mode with user) -->
    <div v-else-if="chatsStore.currentChat || (isPreviewMode && previewUser)" class="chat-page__content">
      <!-- Chat Header -->
      <ChatHeader
        :title="chatName"
        :subtitle="chatSubtitle"
        :avatar="chatAvatar"
        @back="handleBack"
        @call="handleCall"
        @menu="handleMenu"
      />

      <!-- Message List with Virtual Scrolling -->
      <ChatMessageVirtualList
        :chat-id="chatId"
        ref="messageListRef"
      />

      <!-- Message Input with inline buttons and external Send button -->
      <footer class="chat-input">
        <UiBaseInput
          v-model="messageText"
          type="text"
          placeholder="СООБЩЕНИЕ"
          @enter="handleSendMessage"
        >
          <template #rightAction>
            <UiBaseButton
              variant="input-icon"
              aria-label="Эмодзи"
              @click="handleEmoji"
            >
              <SvgoStickerIcon />
            </UiBaseButton>
            <UiBaseButton
              variant="input-icon"
              aria-label="Прикрепить файл"
              @click="handleAttach"
            >
              <SvgoClipIcon />
            </UiBaseButton>
          </template>
        </UiBaseInput>

        <!-- Send Button (outside input) -->
        <UiBaseButton
          variant="icon"
          aria-label="Отправить"
          @click="handleSendMessage"
        >
          <SvgoSendIcon />
        </UiBaseButton>
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useSocket } from '~/composables/useSocket'
import { useChatName, useChatSubtitle, useChatAvatar } from '~/composables/useChat'
import { useMessagesStore } from '~/stores/messages'

/**
 * Chat Page ([id].vue)
 *
 * Применяем паттерны:
 * - Dynamic Route (Nuxt 4 auto-routing)
 * - Store Integration
 * - Conditional Rendering
 */

// ===== ROUTE =====

const route = useRoute()
const chatId = route.params.id as string
const isPreviewMode = computed(() => route.query.preview === 'true')

// ===== STORE =====

const chatsStore = useChatsStore()
const authStore = useAuthStore()
const messagesStore = useMessagesStore()

// ===== WEBSOCKET =====

const socket = useSocket()

// ===== STATE =====

const messageText = ref('')
const previewUser = ref<any>(null) // User data for preview mode
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const isLeaving = ref(false) // Флаг для анимации выхода
const messageListRef = ref<any>(null) // Ref для MessageList компонента

// ===== COMPOSABLES =====

/**
 * Данные чата через composables
 */
const chatName = useChatName(computed(() => chatsStore.currentChat), previewUser)
const chatSubtitle = useChatSubtitle(computed(() => chatsStore.currentChat), previewUser)
const chatAvatar = useChatAvatar(computed(() => chatsStore.currentChat), previewUser)

// ===== WEBSOCKET LISTENERS =====
// ВАЖНО: Регистрируем в setup, а не в onMounted для избежания lifecycle warnings

// Слушаем новые сообщения
socket.on<any>('message:new', (message) => {
  // Извлекаем senderId (может быть строкой или объектом)
  const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id
  const isOwnMessage = senderId === authStore.user?._id
  
  // Добавляем сообщение, только если это не наше (наше уже добавлено через Optimistic UI)
  if (!isOwnMessage) {
    messagesStore.addMessage(chatId, message)
    // Auto-scroll к новому сообщению
    nextTick(() => {
      messageListRef.value?.scrollToBottom()
    })
    
    // Сразу отправляем событие о прочтении, так как чат открыт
    socket.emit('messages:read', { chatId }, (response: any) => {
      // Автоматически помечено как прочитанное
    })
    
    // Также сбрасываем счетчик на backend
    const config = useRuntimeConfig()
    $fetch(`/chats/${chatId}/read`, {
      baseURL: config.public.apiBase,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    }).catch(() => {
      // Ошибка сброса счетчика, не критично
    })
  }
  
  // Обновляем lastMessage в списке чатов (для обоих: своих и чужих сообщений)
  const messageChatId = typeof message.chat === 'string' ? message.chat : message.chat._id
  chatsStore.updateLastMessageInList(messageChatId, message)
})

// Слушаем typing индикаторы (TODO: Day 5 - отображение "печатает...")
socket.on<any>('message:typing', (data) => {
  // Обработка typing индикатора
})

// Слушаем события прочтения сообщений
socket.on<any>('messages:read', (data: { chatId: string, readBy: string, messageIds: string[] }) => {
  // Обновляем статус сообщений в store
  if (data.chatId === chatId) {
    messagesStore.updateMessagesStatus(data.messageIds, 'read')
  }
})

// ===== LIFECYCLE =====

/**
 * При монтировании загружаем чат или пользователя (preview mode)
 */
onMounted(async () => {
  if (isPreviewMode.value) {
    // Preview mode: загружаем данные пользователя
    await loadPreviewUser()
  } else {
    // Normal mode: загружаем чат и сообщения
    await chatsStore.loadChatById(chatId)
    
    // Сбрасываем счётчик непрочитанных (локально и на сервере)
    chatsStore.resetUnreadCount(chatId)
    
    // Вызываем API для сброса на сервере
    try {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()
      await $fetch(`/chats/${chatId}/read`, {
        baseURL: config.public.apiBase,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        }
      })
    } catch (err) {
      // Ошибка отметки как прочитанного, не критично
    }
    
    await messagesStore.loadMessages(chatId)

    // Подключаемся к WebSocket комнате чата
    const joinResponse = await socket.emitWithAck<any>('chat:join', { chatId })
    // Ошибка присоединения к комнате обрабатывается на backend

    // Отправляем событие о прочтении сообщений
    const readResponse = await socket.emitWithAck<any>('messages:read', { chatId })
    // Сообщения помечены как прочитанные
  }
})

/**
 * При размонтировании очищаем текущий чат и покидаем комнату
 */
onUnmounted(() => {
  if (!isPreviewMode.value) {
    // Покидаем WebSocket комнату
    socket.emit('chat:leave', { chatId })
  }

  chatsStore.clearCurrentChat()
  previewUser.value = null
  previewError.value = null
})

// ===== METHODS =====

/**
 * Загрузка данных пользователя для preview mode
 */
async function loadPreviewUser() {
  previewLoading.value = true
  previewError.value = null

  try {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()

    // Сначала проверяем, существует ли уже чат с этим пользователем
    const checkResponse = await $fetch(`/chats/find-or-check/${chatId}`, {
      baseURL: config.public.apiBase,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })

    if (checkResponse.exists && checkResponse.chat) {
      // Чат уже существует - редирект на обычный режим
      navigateTo(`/chat/${checkResponse.chat._id}`)
      return
    }

    // Чат не существует - загружаем данные пользователя для preview
    const user = await $fetch(`/users/${chatId}`, {
      baseURL: config.public.apiBase,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })
    previewUser.value = user
  } catch (err: any) {
    previewError.value = err.message || 'Ошибка загрузки пользователя'
  } finally {
    previewLoading.value = false
  }
}

/**
 * Назад к списку чатов с плавной анимацией
 */
function handleBack() {
  // Включаем анимацию выхода
  isLeaving.value = true

  // Ждем завершения анимации (350ms) перед навигацией
  setTimeout(() => {
    navigateTo('/')
  }, 350)
}

/**
 * Повторная загрузка чата
 */
function handleRetry() {
  chatsStore.loadChatById(chatId)
}

/**
 * Звонок (TODO: Day 7 - WebRTC)
 */
function handleCall() {
  // TODO: Day 7 - WebRTC звонки
}

/**
 * Меню чата (TODO: Day 4)
 */
function handleMenu() {
  // TODO: Day 4 - Меню чата
}

/**
 * Отправка сообщения
 */
async function handleSendMessage() {
  if (!messageText.value.trim()) return

  // Preview mode: создаём чат при отправке первого сообщения
  if (isPreviewMode.value && previewUser.value) {
    try {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()
      const textToSend = messageText.value.trim()
      messageText.value = '' // Очищаем поле сразу

      // Создаём personal чат
      const chat = await $fetch<any>('/chats', {
        baseURL: config.public.apiBase,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        },
        body: {
          type: 'personal',
          participantId: previewUser.value._id
        }
      })

      // Отправляем сообщение через WebSocket сразу после создания чата
      const socket = useSocket()
      await socket.emitWithAck('message:send', {
        chatId: chat._id,
        text: textToSend,
      })

      // Редирект на созданный чат
      navigateTo(`/chat/${chat._id}`)

    } catch (err: any) {
      previewError.value = 'Ошибка создания чата'
    }
    return
  }

  // Normal mode: отправка сообщения через WebSocket с Optimistic UI
  const text = messageText.value.trim()
  messageText.value = '' // Очищаем поле сразу

  // 1. Создаём временное сообщение (Optimistic UI)
  const tempId = `temp-${Date.now()}`
  const tempMessage: any = {
    _id: tempId,
    sender: authStore.user,
    chat: chatId,
    text,
    type: 'text',
    status: 'pending',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 2. Добавляем в store (показываем пользователю сразу)
  messagesStore.addMessage(chatId, tempMessage)

  // 3. Auto-scroll к новому сообщению
  nextTick(() => {
    messageListRef.value?.scrollToBottomSmooth()
    // Дополнительно форсируем скролл для надежности
    setTimeout(() => {
      messageListRef.value?.forceScrollToBottom()
    }, 100)
  })

  // 4. Отправляем через WebSocket
  try {
    const response = await socket.emitWithAck<any>('message:send', {
      chatId,
      text,
    })

    if (response.success && response.message) {
      // 5. Заменяем временное сообщение на реальное от сервера
      messagesStore.replaceMessage(chatId, tempId, response.message)
    } else {
      // Ошибка от сервера
      messagesStore.markMessageFailed(chatId, tempId)
    }
  } catch (err: any) {
    // Ошибка WebSocket
    messagesStore.markMessageFailed(chatId, tempId)
  }
}

/**
 * Прикрепить файл (TODO: Day 6)
 */
function handleAttach() {
  // TODO: Day 6 - Прикрепление файлов
}

/**
 * Эмодзи (TODO: Day 6)
 */
function handleEmoji() {
  // TODO: Day 6 - Выбор эмодзи
}
</script>

<style lang="scss" scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-primary;
  width: 100%;

  // Плавная анимация выхода
  &--leaving {
    animation: fadeOut 0.35s ease-out forwards;
  }

  &__loading,
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    height: 100%;
    color: $text-secondary;
    padding: 32px;
    @include transition; // Плавная анимация
    animation: fadeIn 0.35s ease-out;
  }

  &__error {
    color: #F44336;

    p {
      color: #F44336;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px;
    @include transition; // Плавная анимация
    animation: fadeIn 0.35s ease-out;
  }
}

// ===== CHAT INPUT FOOTER =====

.chat-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: $bg-primary;
  border-radius: $radius;
  box-shadow: $shadow-block;

  // Override BaseInput styles for chat
  :deep(.base-input) {
    flex: 1;
    gap: 0;
  }

  :deep(.base-input__field) {
    background: $bg-input;
    box-shadow: $shadow-input;
  }
}

// ===== ANIMATIONS =====

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
