import type { Message } from '~/types/message.types'

interface GetMessagesParams {
  chatId: string
  limit?: number
  skip?: number
}

interface GetMessagesResponse {
  messages: Message[]
  hasMore: boolean
}

interface CreateMessageParams {
  chat: string
  text: string
}

interface CreateMessageResponse {
  success: boolean
  message: Message
}

interface DeleteMessageResponse {
  success: boolean
  message: string
}

/**
 * Message Service - HTTP API для сообщений (fallback)
 */
export function useMessageService() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  /**
   * Получить сообщения чата с пагинацией
   */
  async function getMessages(params: GetMessagesParams): Promise<GetMessagesResponse> {
    const { chatId, limit = 50, skip = 0 } = params

    const response = await $fetch<GetMessagesResponse>(
      `/messages/chats/${chatId}`,
      {
        baseURL: config.public.apiBase,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        query: {
          limit,
          skip,
        },
      }
    )

    return response
  }

  /**
   * Создать сообщение (HTTP fallback)
   */
  async function createMessage(params: CreateMessageParams): Promise<CreateMessageResponse> {
    const response = await $fetch<CreateMessageResponse>('/messages', {
      baseURL: config.public.apiBase,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: params,
    })

    return response
  }

  /**
   * Удалить сообщение (soft delete)
   */
  async function deleteMessage(messageId: string): Promise<DeleteMessageResponse> {
    const response = await $fetch<DeleteMessageResponse>(`/messages/${messageId}`, {
      baseURL: config.public.apiBase,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })

    return response
  }

  return {
    getMessages,
    createMessage,
    deleteMessage,
  }
}
