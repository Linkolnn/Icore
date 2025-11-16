// ===================================
// 💬 CHAT SERVICE - API запросы для чатов
// ===================================
// Паттерн: Service Layer
// Принцип: Single Responsibility - только API запросы
// Использует: Централизованные типы из chat.types.ts

import type { Chat, CreateChatDto, UpdateChatDto } from '~/types/chat.types'

/**
 * Получить базовый URL API
 */
function getApiBase(): string {
  const config = useRuntimeConfig()
  return config.public.apiBase as string
}

/**
 * Получить токен из localStorage
 */
function getAuthToken(): string {
  const authStore = useAuthStore()
  const token = authStore.accessToken
  if (!token) {
    throw new Error('Не авторизован')
  }
  return token
}

/**
 * Получить все чаты текущего пользователя
 * @returns Promise с массивом чатов
 */
export async function getUserChats(): Promise<Chat[]> {
  try {
    const apiBase = getApiBase()
    const token = getAuthToken()

    const chats = await $fetch<Chat[]>(`${apiBase}/chats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return chats
  } catch (error: any) {
    throw new Error(error.data?.message || 'Ошибка получения чатов')
  }
}

/**
 * Создать новый чат
 * @param dto - Данные для создания чата
 * @returns Promise с созданным чатом
 */
export async function createChat(dto: CreateChatDto): Promise<Chat> {
  try {
    const apiBase = getApiBase()
    const token = getAuthToken()

    const chat = await $fetch<Chat>(`${apiBase}/chats`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: dto
    })

    return chat
  } catch (error: any) {
    throw new Error(error.data?.message || 'Ошибка создания чата')
  }
}

/**
 * Получить чат по ID
 * @param chatId - ID чата
 * @returns Promise с данными чата
 */
export async function getChatById(chatId: string): Promise<Chat> {
  try {
    const apiBase = getApiBase()
    const token = getAuthToken()

    const chat = await $fetch<Chat>(`${apiBase}/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return chat
  } catch (error: any) {
    throw new Error(error.data?.message || 'Ошибка получения чата')
  }
}

/**
 * Обновить чат
 * @param chatId - ID чата
 * @param dto - Данные для обновления
 * @returns Promise с обновленным чатом
 */
export async function updateChat(chatId: string, dto: UpdateChatDto): Promise<Chat> {
  try {
    const apiBase = getApiBase()
    const token = getAuthToken()

    const chat = await $fetch<Chat>(`${apiBase}/chats/${chatId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: dto
    })

    return chat
  } catch (error: any) {
    throw new Error(error.data?.message || 'Ошибка обновления чата')
  }
}

/**
 * Удалить чат (soft delete)
 * @param chatId - ID чата
 * @returns Promise<void>
 */
export async function deleteChat(chatId: string): Promise<void> {
  try {
    const apiBase = getApiBase()
    const token = getAuthToken()

    await $fetch(`${apiBase}/chats/${chatId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error: any) {
    throw new Error(error.data?.message || 'Ошибка удаления чата')
  }
}
