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
        :user-id="chatUserId"
        @back="handleBack"
        @call="handleCall"
        @menu="handleMenu"
        @edit="handleSelectionEdit"
        @copy="handleSelectionCopy"
        @forward="handleSelectionForward"
        @delete="handleSelectionDelete"
      />

      <!-- Message List with Virtual Scrolling -->
      <ChatMessageVirtualList
        :chat-id="chatId"
        ref="messageListRef"
        @edit-message="handleEditMessage"
      />

      <!-- Edit indicator -->
      <div v-if="editingMessage" class="chat-edit-indicator">
        <div class="chat-edit-indicator__content">
          <div class="chat-edit-indicator__line"></div>
          <div class="chat-edit-indicator__info">
            <span class="chat-edit-indicator__label">Редактирование</span>
            <p class="chat-edit-indicator__text">{{ editingMessage.text }}</p>
          </div>
        </div>
        <UiBaseButton
          variant="icon"
          size="small"
          @click="cancelEdit"
        >
          <SvgoCloseIcon />
        </UiBaseButton>
      </div>
      
      <!-- Reply indicator -->
      <ChatReplyIndicator />
      
      <!-- Forward indicator -->
      <ChatForwardIndicator @show-preview="showMessagePreview = true" />

      <!-- Message Input with inline buttons and external Send button -->
      <footer class="chat-input">
        <!-- Selection Mode Actions -->
        <div v-if="selectionStore.isSelectionMode" class="chat-input__selection-actions">
          <UiBaseButton
            v-if="selectionStore.canReply"
            variant="secondary"
            @click="handleReply"
          >
            <SvgoReplyIcon />
            Ответить
          </UiBaseButton>
          <UiBaseButton
            variant="secondary"
            @click="handleForward"
          >
            <SvgoForwardIcon />
            Переслать
          </UiBaseButton>
        </div>

        <!-- Normal Input Mode -->
        <ChatInput
          v-else
          v-model="messageText"
          :placeholder="editingMessage ? 'Редактировать сообщение...' : 'Сообщение'"
          :editing-message="editingMessage"
          :attached-files="attachedFiles"
          @send="handleSendMessage"
          @emoji="handleEmoji"
          @attach="handleAttachFiles"
          @voice="handleVoiceRecord"
          @file-remove="removeAttachedFile"
        />
      </footer>
    </div>
    
    <!-- Forward modal (используем BaseModal напрямую) -->
    <UiBaseModal
      v-model="showForwardModal"
      title="Переслать сообщения"
      size="large"
      @close="handleCloseForwardModal"
    >
      <div class="forward-modal-content">
        <!-- Search -->
        <div class="forward-modal-search">
          <UiBaseInput
            v-model="forwardSearchQuery"
            placeholder="Поиск чатов..."
            variant="filled"
          />
        </div>
        
        <!-- Chat List -->
        <div class="forward-modal-list">
          <ChatList 
            :search="forwardSearchQuery"
            :compact="true"
            :selectable="true"
            :selected-chat-id="selectedForwardChatId"
            @chat-select="handleForwardChatSelect"
          />
        </div>
      </div>
      
      <!-- Footer -->
      <template #footer>
        <UiBaseButton
          variant="secondary"
          @click="showForwardModal = false"
        >
          Отмена
        </UiBaseButton>
        <UiBaseButton
          variant="primary"
          :disabled="!selectedForwardChatId"
          @click="handleForwardConfirm"
        >
          Переслать
        </UiBaseButton>
      </template>
    </UiBaseModal>
    
    <!-- Message preview modal -->
    <ChatMessagePreviewModal
      v-model="showMessagePreview"
      :messages="selectionStore.forwardingMessages"
    />
  </main>
</template>

<script setup lang="ts">
import { useSocket } from '~/composables/useSocket'
import { useChatName, useChatSubtitle, useChatAvatar } from '~/composables/useChat'
import { useMessagesStore } from '~/stores/messages'
import { useSelectionStore } from '~/stores/selection'
import type { Message } from '~/types/message.types'

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
const router = useRouter()
const chatId = route.params.id as string
const isPreviewMode = computed(() => route.query.preview === 'true')

// ===== STORE =====

const chatsStore = useChatsStore()
const authStore = useAuthStore()
const messagesStore = useMessagesStore()
const selectionStore = useSelectionStore()

// ===== WEBSOCKET =====

const socket = useSocket()

// ===== STATE =====

const messageText = ref('')
const messageListRef = ref<any>()
const editingMessage = ref<any>(null)
const previewUser = ref<any>(null) // User data for preview mode
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const isLeaving = ref(false) // Флаг для анимации выхода
const attachedFiles = ref<File[]>([]) // Прикрепленные файлы

// ===== COMPOSABLES =====

/**
 * Данные чата через composables
 */
const chatName = useChatName(computed(() => chatsStore.currentChat), previewUser)
const chatSubtitle = useChatSubtitle(computed(() => chatsStore.currentChat), previewUser)
const chatAvatar = useChatAvatar(computed(() => chatsStore.currentChat), previewUser)

/**
 * Get user ID for consistent avatar colors
 */
const chatUserId = computed(() => {
  // Preview mode: use preview user ID
  if (isPreviewMode.value && previewUser.value) {
    return previewUser.value._id
  }
  
  // Normal mode: for personal chat, use other participant ID
  const chat = chatsStore.currentChat
  if (chat?.type === 'personal' && chat.participants.length > 0) {
    const currentUserId = authStore.user?._id
    const otherUser = chat.participants.find(p => p._id !== currentUserId)
    return otherUser?._id
  }
  
  // For groups, use chat ID
  return chat?._id
})

// ===== WEBSOCKET LISTENERS =====
// ВАЖНО: Регистрируем в setup, а не в onMounted для избежания lifecycle warnings

// Слушаем новые сообщения
socket.on<any>('message:new', (message) => {
  // Извлекаем chatId из сообщения
  const messageChatId = typeof message.chat === 'string' ? message.chat : message.chat._id
  
  // ВАЖНО: Проверяем, что сообщение принадлежит текущему чату
  if (messageChatId === chatId) {
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
  }
  
  // NOTE: updateLastMessageInList теперь вызывается глобально в socket.client.ts
  // чтобы обеспечить обновление lastMessage для всех чатов и избежать дублирования
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
  
  // Очищаем режим выделения если он активен
  if (selectionStore.isSelectionMode) {
    selectionStore.exitSelectionMode()
  }
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
 * Обработка редактирования сообщения
 */
function handleEditMessage(message: any) {
  // Запрещаем редактировать пересланные сообщения
  if (message.forwarded) {
    return
  }
  
  // Запрещаем редактировать временные сообщения
  if (message._id && message._id.startsWith('temp-')) {
    return
  }
  
  // Проверяем права на редактирование
  if (message.sender._id !== authStore.user?._id && message.sender !== authStore.user?._id) {
    return
  }
  
  editingMessage.value = message
  messageText.value = message.text
}

/**
 * Отмена редактирования
 */
function cancelEdit() {
  editingMessage.value = null
  messageText.value = ''
}

/**
 * Отправка сообщения
 */
async function handleSendMessage() {
  if (!messageText.value.trim()) return

  // Если редактируем сообщение
  if (editingMessage.value) {
    // Проверяем, что это не временное сообщение
    if (editingMessage.value._id.startsWith('temp-')) {
      editingMessage.value = null
      messageText.value = ''
      return
    }
    
    try {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()
      
      // Отправляем PATCH запрос для редактирования
      const response = await $fetch<any>(`/messages/${editingMessage.value._id}`, {
        baseURL: config.public.apiBase,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        },
        body: {
          text: messageText.value.trim()
        }
      })
      
      // Обновляем сообщение в store (response содержит { success, message })
      if (response.success && response.message) {
        messagesStore.replaceMessage(chatId, editingMessage.value._id, response.message)
      }
      
      // Очищаем состояние редактирования
      editingMessage.value = null
      messageText.value = ''
      attachedFiles.value = [] // Очищаем прикрепленные файлы
    } catch (error) {
    }
    return
  }

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
  const replyToId = selectionStore.replyToMessage?._id || null
  
  messageText.value = '' // Очищаем поле сразу
  attachedFiles.value = [] // Очищаем прикрепленные файлы

  // 1. Создаём временное сообщение (Optimistic UI)
  const tempId = `temp-${Date.now()}`
  const tempMessage: any = {
    _id: tempId,
    text,
    sender: authStore.user,
    chat: chatId,
    status: 'pending' as const,
    replyTo: replyToId ? selectionStore.replyToMessage : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Добавляем в store
  messagesStore.addMessage(chatId, tempMessage)
  
  // Скроллим вниз при отправке своего сообщения
  nextTick(() => {
    messageListRef.value?.scrollToBottom()
  })
  
  // Очищаем reply после отправки
  if (replyToId) {
    selectionStore.clearReply()
  }

  // Отправляем через WebSocket
  const socket = useSocket()
  await socket.emitWithAck('message:send', {
    chatId,
    text,
    replyTo: replyToId
  }).then((response: any) => {
    if (response?.success && response.message) {
      // Заменяем временное сообщение на реальное
      // Backend возвращает { success: true, message: {...} }
      messagesStore.replaceMessage(chatId, tempMessage._id, response.message)
    } else {
      // Если не получили сообщение, помечаем как failed
      messagesStore.markMessageFailed(chatId, tempMessage._id)
    }
  }).catch((err) => {
    // При ошибке помечаем как failed
    messagesStore.markMessageFailed(chatId, tempMessage._id)
  })
}

/**
 * Эмодзи (TODO: Day 6)
 */
function handleEmoji() {
  // TODO: Day 6 - Выбор эмодзи
  // Emoji picker not implemented yet
}

/**
 * Обработка прикрепления файлов
 */
function handleAttachFiles(files: File[]) {
  // Добавляем файлы к списку прикрепленных
  attachedFiles.value = [...attachedFiles.value, ...files]
  
  // TODO: Загрузка файлов на сервер
  // Files attached
}

/**
 * Удаление прикрепленного файла
 */
function removeAttachedFile(index: number) {
  attachedFiles.value = attachedFiles.value.filter((_, i) => i !== index)
}

/**
 * Запись голосового сообщения
 */
function handleVoiceRecord() {
  // TODO: Реализовать запись голосовых сообщений
  // Voice recording not implemented yet
}

// ===== SELECTION MODE HANDLERS =====

/**
 * Handle edit from selection
 */
async function handleSelectionEdit() {
  if (selectionStore.selectedCount === 1) {
    const message = selectionStore.selectedArray[0]
    if (!message) return
    
    // Проверяем, что сообщение не переслано
    if (message.forwarded) {
      return
    }
    
    handleEditMessage(message)
    selectionStore.exitSelectionMode()
  }
}

/**
 * Handle copy from selection
 */
async function handleSelectionCopy() {
  try {
    const texts = selectionStore.selectedArray.map(msg => msg.text).join('\n')
    await navigator.clipboard.writeText(texts)
    selectionStore.exitSelectionMode()
  } catch (error) {
  }
}

/**
 * Handle forward from selection
 */
function handleSelectionForward() {
  if (selectionStore.selectedCount > 0) {
    selectionStore.startForwarding()
    showForwardModal.value = true
  }
}

/**
 * Handle forward to specific chat
 */
async function handleForwardToChat(targetChatId: string) {
  const { emit, emitWithAck } = useSocket()
  const messagesStore = useMessagesStore()
  const authStore = useAuthStore()
  
  // Get messages to forward and save them locally
  const messagesToForward = [...selectionStore.forwardingMessages]
  
  if (!messagesToForward || messagesToForward.length === 0) {
    return
  }
  
  // Close modal and clear state first
  showForwardModal.value = false
  selectionStore.clearForwardingMessages()
  selectionStore.exitSelectionMode()
  
  // Navigate to target chat
  await router.push(`/chat/${targetChatId}`)
  
  // Wait a bit for navigation to complete
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Send each forwarded message to the new chat
  for (const message of messagesToForward) {
    // Get original sender info - we need the NAME, not ID!
    const senderName = typeof message.sender === 'string' 
      ? 'User'  // Fallback if sender is just ID
      : message.sender?.name || 'User'
    
    const senderId = typeof message.sender === 'string'
      ? message.sender
      : message.sender?._id || ''
    
    // Keep full sender object for optimistic UI
    const senderInfo = typeof message.sender === 'string'
      ? { 
          _id: message.sender, 
          name: 'User',
          email: '',
          userId: message.sender
        } as any
      : message.sender
    
    // Create temporary message WITHOUT prefix - backend will handle forwarded field
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const tempMessage: Message = {
      _id: tempId,
      type: 'text',
      chat: targetChatId,
      sender: authStore.user?._id || '',
      text: message.text, // Send original text without prefix
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      forwarded: {
        from: senderInfo, // Keep full user info for optimistic UI
        originalChatId: typeof message.chat === 'string' ? message.chat : message.chat._id,
        originalMessageId: message._id,
        originalCreatedAt: message.createdAt
      }
    }
    
    // Add temporary message (Optimistic UI)
    messagesStore.addMessage(targetChatId, tempMessage)
    
    // Send via WebSocket with acknowledgment
    try {
      // Send the sender NAME and ID both to backend
      const forwardedData = {
        from: senderId,  // Keep ID for MongoDB reference
        fromName: senderName,  // Add NAME for display
        originalChatId: tempMessage.forwarded?.originalChatId,
        originalMessageId: tempMessage.forwarded?.originalMessageId,
        originalCreatedAt: tempMessage.forwarded?.originalCreatedAt
      }
      
      const response = await emitWithAck('message:send', {
        chatId: targetChatId,
        text: tempMessage.text, // Send original text without prefix
        forwarded: forwardedData
      })
      
      
      if (response?.success && (response.data || response.message)) {
        const messageData = response.data || response.message
        
        // Replace temporary message with real one
        messagesStore.replaceMessage(targetChatId, tempId, messageData)
      } else {
      }
    } catch (error) {
      messagesStore.markMessageFailed(targetChatId, tempId)
    }
    
    // Small delay between messages
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

/**
 * Handle delete from selection
 */
async function handleSelectionDelete() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  
  try {
    // Delete all selected messages
    for (const message of selectionStore.selectedArray) {
      await $fetch(`/messages/${message._id}`, {
        baseURL: config.public.apiBase,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        }
      })
      
      // Remove from store
      messagesStore.removeMessage(chatId, message._id)
    }
    
    selectionStore.exitSelectionMode()
  } catch (error) {
  }
}

/**
 * Handle reply
 */
function handleReply() {
  if (selectionStore.selectedCount === 1) {
    const message = selectionStore.selectedArray[0]
    if (message) {
      selectionStore.setReplyTo(message)
    }
  }
}

/**
 * Handle forward
 */
function handleForward() {
  handleSelectionForward()
}

// Modal states
const showForwardModal = ref(false)
const showMessagePreview = ref(false)

// Forward modal state (для прямого использования BaseModal)
const forwardSearchQuery = ref('')
const selectedForwardChatId = ref<string | null>(null)

// Forward modal handlers
function handleForwardChatSelect(chatId: string) {
  selectedForwardChatId.value = chatId
}

function handleCloseForwardModal() {
  showForwardModal.value = false
  forwardSearchQuery.value = ''
  selectedForwardChatId.value = null
  selectionStore.clearForwardingMessages()
}

function handleForwardConfirm() {
  if (selectedForwardChatId.value) {
    handleForwardToChat(selectedForwardChatId.value)
  }
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
  padding: 10px;
  background: $bg-primary;
  display: flex;
  gap: 12px;
  align-items: center;
  box-shadow: $shadow-block;
  border-radius: $radius;
  transition: all 0.3s ease;

  // В режиме выделения
  &:has(.chat-input__selection-actions) {
    background: transparent;
    padding: 0;
    box-shadow: none;
  }

  :deep(.base-input__field) {
    background: $bg-input;
    box-shadow: $shadow-input;
  }

  &__selection-actions {
    display: flex;
    gap: 10px;
    width: 100%;
    justify-content: center;
    padding: 10px;

    button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      width: 100%;
      
      svg {
        width: 20px;
        height: 20px;
      }
    }
  }
}

// Edit indicator (унифицирован с reply/forward)
.chat-edit-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba($color-accent, 0.1);
  border-top: 1px solid rgba($color-accent, 0.3);
  animation: slideUp 0.3s ease;

  &__content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;
  }

  &__line {
    width: 3px;
    height: 32px;
    background: $color-accent;
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__label {
    display: block;
    font-size: 13px;
    color: $color-accent;
    font-weight: 500;
    margin-bottom: 2px;
  }

  &__text {
    margin: 0;
    font-size: 14px;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

// Forward modal styles (для прямого использования BaseModal)
.forward-modal-content {
  display: flex;
  flex-direction: column;
  height: 400px;
  
  .forward-modal-search {
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .forward-modal-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
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

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
