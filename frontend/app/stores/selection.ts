import { defineStore } from 'pinia'
import type { Message } from '~/types/message.types'

interface SelectionState {
  isSelectionMode: boolean
  selectedMessages: Map<string, Message>
  chatId: string | null
  replyToMessage: Message | null
  forwardingMessages: Message[]
  isForwarding: boolean
}

export const useSelectionStore = defineStore('selection', () => {
  // State
  const isSelectionMode = ref(false)
  const selectedMessages = ref(new Map<string, Message>())
  const chatId = ref<string | null>(null)
  
  // Reply/Forward state
  const replyToMessage = ref<Message | null>(null)
  const forwardingMessages = ref<Message[]>([])
  const isForwarding = ref(false)
  
  // Helper to get chat ID from message
  function getChatId(message: Message): string {
    return typeof message.chat === 'string' ? message.chat : message.chat._id
  }

  // Getters
  const selectedCount = computed(() => selectedMessages.value.size)
  const selectedArray = computed(() => Array.from(selectedMessages.value.values()))
  const selectedIds = computed(() => Array.from(selectedMessages.value.keys()))
  
  const hasMultipleSelected = computed(() => selectedMessages.value.size > 1)
  const hasSingleSelected = computed(() => selectedMessages.value.size === 1)
  
  const canEdit = computed(() => {
    // Можно редактировать только если выбрано одно свое сообщение
    if (!hasSingleSelected.value) return false
    const message = selectedArray.value[0]
    if (!message) return false
    
    // Нельзя редактировать пересланные сообщения
    if (message.forwarded) return false
    
    const authStore = useAuthStore()
    const userId = authStore.user?._id
    if (!userId) return false
    return message.sender === userId || 
           (typeof message.sender === 'object' && message.sender._id === userId)
  })
  
  const canReply = computed(() => {
    // Можно ответить только на одно сообщение
    return hasSingleSelected.value
  })

  const canDelete = computed(() => {
    // Можно удалить только свои сообщения
    const authStore = useAuthStore()
    const userId = authStore.user?._id
    if (!userId) return false
    return selectedArray.value.every(msg => 
      msg.sender === userId || 
      (typeof msg.sender === 'object' && msg.sender._id === userId)
    )
  })

  // Actions
  function enterSelectionMode(initialMessage?: Message) {
    isSelectionMode.value = true
    if (initialMessage) {
      selectedMessages.value.set(initialMessage._id, initialMessage)
      chatId.value = getChatId(initialMessage)
    }
  }

  function exitSelectionMode() {
    isSelectionMode.value = false
    selectedMessages.value.clear()
    chatId.value = null
  }

  function toggleMessage(message: Message) {
    if (selectedMessages.value.has(message._id)) {
      selectedMessages.value.delete(message._id)
      
      // Если больше нет выделенных, выходим из режима
      if (selectedMessages.value.size === 0) {
        exitSelectionMode()
      }
    } else {
      selectedMessages.value.set(message._id, message)
      
      // Сохраняем chatId при первом выделении
      if (!chatId.value) {
        chatId.value = getChatId(message)
      }
    }
  }

  function selectMessage(message: Message) {
    selectedMessages.value.set(message._id, message)
    if (!chatId.value) {
      chatId.value = getChatId(message)
    }
  }

  function deselectMessage(messageId: string) {
    selectedMessages.value.delete(messageId)
    if (selectedMessages.value.size === 0) {
      exitSelectionMode()
    }
  }

  function isSelected(messageId: string): boolean {
    return selectedMessages.value.has(messageId)
  }

  function selectAll(messages: Message[]) {
    messages.forEach(msg => {
      selectedMessages.value.set(msg._id, msg)
    })
    const firstMessage = messages[0]
    if (firstMessage && !chatId.value) {
      chatId.value = getChatId(firstMessage)
    }
  }

  function clearSelection() {
    selectedMessages.value.clear()
  }
  
  // Reply/Forward actions
  function setReplyTo(message: Message | null) {
    replyToMessage.value = message
    if (message) {
      // Exit selection mode when replying
      exitSelectionMode()
    }
  }
  
  function clearReply() {
    replyToMessage.value = null
  }
  
  function startForwarding(messages?: Message[]) {
    const messagesToForward = messages || selectedArray.value
    if (messagesToForward.length > 0) {
      forwardingMessages.value = messagesToForward
      isForwarding.value = true
      exitSelectionMode()
    }
  }
  
  function cancelForwarding() {
    forwardingMessages.value = []
    isForwarding.value = false
  }
  
  function clearForwardingMessages() {
    forwardingMessages.value = []
    isForwarding.value = false
  }

  return {
    // State
    isSelectionMode,
    selectedMessages,
    chatId,
    replyToMessage,
    forwardingMessages,
    isForwarding,
    
    // Getters
    selectedCount,
    selectedArray,
    selectedIds,
    hasMultipleSelected,
    hasSingleSelected,
    canEdit,
    canReply,
    canDelete,
    
    // Actions
    enterSelectionMode,
    exitSelectionMode,
    toggleMessage,
    selectMessage,
    deselectMessage,
    isSelected,
    selectAll,
    clearSelection,
    
    // Reply/Forward actions
    setReplyTo,
    clearReply,
    startForwarding,
    cancelForwarding,
    clearForwardingMessages
  }
})
