import { defineStore } from 'pinia'
import { useMessageService } from '~/services/api/message.service'
import type { Message } from '~/types/message.types'

interface MessagesState {
  messagesByChat: Record<string, Message[]>
  loading: Record<string, boolean>
  error: Record<string, string | null>
  hasMore: Record<string, boolean>
}

/**
 * Messages Store with Optimistic UI
 */
export const useMessagesStore = defineStore('messages', () => {
  // State
  const messagesByChat = ref<Record<string, Message[]>>({})
  const loading = ref<Record<string, boolean>>({})
  const error = ref<Record<string, string | null>>({})
  const hasMore = ref<Record<string, boolean>>({})

  /**
   * Get messages for specific chat
   */
  const getMessagesForChat = computed(() => (chatId: string) => {
    return messagesByChat.value[chatId] || []
  })

  /**
   * Load messages for chat (initial load)
   */
  async function loadMessages(chatId: string, limit = 50) {
    const messageService = useMessageService()
    loading.value[chatId] = true
    error.value[chatId] = null

    try {
      const response = await messageService.getMessages({ chatId, limit, skip: 0 })

      // Store messages (reversed - oldest first for display)
      messagesByChat.value[chatId] = response.messages.reverse()
      hasMore.value[chatId] = response.hasMore
    } catch (err: any) {
      error.value[chatId] = err.message || 'Failed to load messages'
    } finally {
      loading.value[chatId] = false
    }
  }

  /**
   * Load more messages (pagination)
   * Returns Promise for better integration with virtual scroller
   */
  async function loadMoreMessages(chatId: string, limit = 50): Promise<void> {
    if (loading.value[chatId] || !hasMore.value[chatId]) {
      return Promise.resolve()
    }

    const messageService = useMessageService()
    loading.value[chatId] = true

    try {
      const currentMessages = messagesByChat.value[chatId] || []
      const skip = currentMessages.length

      const response = await messageService.getMessages({ chatId, limit, skip })

      // Prepend older messages
      messagesByChat.value[chatId] = [
        ...response.messages.reverse(),
        ...currentMessages,
      ]

      hasMore.value[chatId] = response.hasMore
    } catch (err: any) {
      error.value[chatId] = err.message || 'Failed to load more messages'
      throw err // Re-throw for proper error handling
    } finally {
      loading.value[chatId] = false
    }
  }

  /**
   * Add message with Optimistic UI
   * Used when sending a new message (before server confirmation)
   */
  function addMessage(chatId: string, message: Message) {
    if (!messagesByChat.value[chatId]) {
      messagesByChat.value[chatId] = []
    }

    // Add to end (newest message)
    messagesByChat.value[chatId].push(message)
  }

  /**
   * Replace temporary message with real message from server
   * Used after server confirms message creation
   */
  function replaceMessage(chatId: string, tempId: string, realMessage: Message) {
    const messages = messagesByChat.value[chatId]
    if (!messages) return

    const index = messages.findIndex((m) => m._id === tempId)
    if (index !== -1) {
      messages[index] = realMessage
    }
  }

  /**
   * Mark message as failed
   * Used when server returns error
   */
  function markMessageFailed(chatId: string, messageId: string) {
    const messages = messagesByChat.value[chatId]
    if (!messages) return

    const message = messages.find((m) => m._id === messageId)
    if (message) {
      message.status = 'failed'
    }
  }

  /**
   * Delete message
   */
  function deleteMessage(chatId: string, messageId: string) {
    const messages = messagesByChat.value[chatId]
    if (!messages) return

    const index = messages.findIndex((m) => m._id === messageId)
    if (index !== -1) {
      messages.splice(index, 1)
    }
  }

  /**
   * Clear messages for chat
   */
  function clearMessages(chatId: string) {
    delete messagesByChat.value[chatId]
    delete loading.value[chatId]
    delete error.value[chatId]
    delete hasMore.value[chatId]
  }

  /**
   * Clear all messages
   */
  function clearAll() {
    messagesByChat.value = {}
    loading.value = {}
    error.value = {}
    hasMore.value = {}
  }

  /**
   * Update status of multiple messages
   */
  function updateMessagesStatus(messageIds: string[], status: 'sent' | 'delivered' | 'read') {
    // Перебираем все чаты
    for (const [chatId, messages] of Object.entries(messagesByChat.value)) {
      messages.forEach(message => {
        if (messageIds.includes(message._id)) {
          message.status = status as any
        }
      })
    }
  }

  return {
    // State
    messagesByChat,
    loading,
    error,
    hasMore,

    // Getters
    getMessagesForChat,

    // Actions
    loadMessages,
    loadMoreMessages,
    addMessage,
    replaceMessage,
    markMessageFailed,
    deleteMessage,
    clearMessages,
    clearAll,
    updateMessagesStatus,
  }
})
