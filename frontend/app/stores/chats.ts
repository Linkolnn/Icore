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
      console.error('Load chats error:', error)
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
      console.error('Create chat error:', error)
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

      // Обновляем в списке, если есть
      const index = chats.value.findIndex(c => c._id === chatId)
      if (index !== -1) {
        chats.value[index] = chat
      }
    } catch (error: any) {
      console.error('Load chat error:', error)
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
      console.error('Delete chat error:', error)
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
  }
})
