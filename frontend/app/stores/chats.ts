import { defineStore } from 'pinia'
import type { Chat, CreateChatDto } from '~/types/chat.types'
import * as chatService from '~/services/api/chat.service'

/**
 * Chats Store
 *
 * Применяем Store Pattern (Pinia):
 * - Централизованное состояние для чатов
 * - Composition API style (setup function)
 * - Реактивность через ref/computed
 */
export const useChatsStore = defineStore('chats', () => {
  // ===== STATE =====

  /**
   * Список всех чатов пользователя
   */
  const chats = ref<Chat[]>([])

  /**
   * Текущий активный чат
   */
  const currentChat = ref<Chat | null>(null)

  /**
   * Загрузка списка чатов (ТОЛЬКО для первой загрузки)
   */
  const chatsLoading = ref(false)

  /**
   * Загрузка отдельного чата (для chat/[id].vue)
   */
  const currentChatLoading = ref(false)

  /**
   * Ошибка при работе с чатами
   */
  const chatsError = ref<string | null>(null)

  /**
   * Загрузка создания чата
   */
  const createLoading = ref(false)

  // ===== ACTIONS =====

  /**
   * Загрузить все чаты пользователя
   *
   * Применяем Service Layer:
   * - Вызываем API через service
   * - Обрабатываем ошибки
   * - Обновляем state
   */
  async function loadChats() {
    chatsLoading.value = true
    chatsError.value = null

    try {
      const loadedChats = await chatService.getUserChats()
      chats.value = loadedChats
    } catch (error: any) {
      chatsError.value = error.message || 'Ошибка загрузки чатов'
      chats.value = []
    } finally {
      chatsLoading.value = false
    }
  }

  /**
   * Создать новый чат
   * @param dto - Данные для создания чата
   * @returns Promise с созданным чатом
   */
  async function createChat(dto: CreateChatDto): Promise<Chat | null> {
    createLoading.value = true
    chatsError.value = null

    try {
      const newChat = await chatService.createChat(dto)

      // Добавляем чат в начало списка
      chats.value = [newChat, ...chats.value]

      return newChat
    } catch (error: any) {
      chatsError.value = error.message || 'Ошибка создания чата'
      return null
    } finally {
      createLoading.value = false
    }
  }

  /**
   * Загрузить чат по ID и установить как текущий
   * @param chatId - ID чата
   */
  async function loadChatById(chatId: string) {
    currentChatLoading.value = true
    chatsError.value = null

    try {
      const chat = await chatService.getChatById(chatId)
      currentChat.value = chat

      // Обновляем в списке или добавляем, если его нет
      const index = chats.value.findIndex(c => c._id === chatId)
      if (index !== -1) {
        chats.value[index] = chat
      } else {
        // Добавляем чат в список, если его там нет
        chats.value.push(chat)
      }
    } catch (error: any) {
      chatsError.value = error.message || 'Ошибка загрузки чата'
      currentChat.value = null
    } finally {
      currentChatLoading.value = false
    }
  }

  /**
   * Удалить чат
   * @param chatId - ID чата
   */
  async function deleteChat(chatId: string) {
    try {
      await chatService.deleteChat(chatId)

      // Удаляем из списка
      chats.value = chats.value.filter(c => c._id !== chatId)

      // Если был текущим, очищаем
      if (currentChat.value?._id === chatId) {
        currentChat.value = null
      }
    } catch (error: any) {
      chatsError.value = error.message || 'Ошибка удаления чата'
    }
  }

  /**
   * Очистить текущий чат
   */
  function clearCurrentChat() {
    currentChat.value = null
  }

  /**
   * Очистить все состояние (при logout)
   */
  function clearChats() {
    chats.value = []
    currentChat.value = null
    chatsError.value = null
  }

  /**
   * Обновить lastMessage в списке чатов (real-time)
   * Используется при получении message:new через WebSocket
   */
  function updateLastMessageInList(chatId: string, message: any) {
    const chatIndex = chats.value.findIndex(c => c._id === chatId)
    if (chatIndex === -1) {
      return
    }

    const chat = chats.value[chatIndex]
    if (!chat) return // Проверка на undefined
    
    // Проверяем, нужно ли увеличить счётчик непрочитанных
    const authStore = useAuthStore()
    const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id
    const isOwnMessage = senderId === authStore.user?._id
    const isChatOpen = currentChat.value?._id === chatId
    
    // Убеждаемся, что unreadCount является числом
    const currentUnreadCount = typeof chat.unreadCount === 'number' ? chat.unreadCount : 0
    
    // Создаем обновленный объект чата для сохранения реактивности
    const updatedChat = {
      ...chat,
      lastMessage: {
        text: message.text,
        sender: message.sender,
        createdAt: message.createdAt,
        _id: message._id
      },
      unreadCount: !isOwnMessage && !isChatOpen 
        ? currentUnreadCount + 1 
        : currentUnreadCount
    }

    // Удаляем старый чат и добавляем обновленный в начало
    chats.value.splice(chatIndex, 1)
    chats.value.unshift(updatedChat)
  }

  /**
   * Сбросить счётчик непрочитанных для чата
   * Вызывается при открытии чата
   */
  function resetUnreadCount(chatId: string) {
    const chatIndex = chats.value.findIndex(c => c._id === chatId)
    if (chatIndex !== -1) {
      const chat = chats.value[chatIndex]
      if (!chat) return
      
      // Создаем обновленный объект для сохранения реактивности
      const updatedChat: Chat = {
        ...chat,
        unreadCount: 0
      }
      // Заменяем старый объект новым
      chats.value[chatIndex] = updatedChat
    }
  }

  /**
   * Добавить новый чат в список (real-time)
   * Используется при получении chat:created через WebSocket
   */
  function addChatToList(chat: Chat) {
    // Проверяем, что чат еще не в списке
    const exists = chats.value.some(c => c._id === chat._id)
    if (!exists) {
      // Убеждаемся, что unreadCount является числом
      const chatWithValidUnreadCount = {
        ...chat,
        unreadCount: typeof chat.unreadCount === 'number' ? chat.unreadCount : 0
      }
      chats.value.unshift(chatWithValidUnreadCount)
    }
  }

  // ===== RETURN =====

  return {
    // State
    chats,
    currentChat,
    chatsLoading,
    currentChatLoading,
    chatsError,
    createLoading,

    // Actions
    loadChats,
    createChat,
    loadChatById,
    deleteChat,
    clearCurrentChat,
    clearChats,
    updateLastMessageInList,
    addChatToList,
    resetUnreadCount,
  }
})
