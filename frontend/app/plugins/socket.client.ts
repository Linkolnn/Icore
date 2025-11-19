import { io, type Socket } from 'socket.io-client'
import { AUTH_COOKIE_CONFIG, WS_CONFIG } from '~/utils/constants'

/**
 * Socket.io Plugin for WebSocket connection management
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  let socket: Socket | null = null

  /**
   * Connect to WebSocket server
   */
  function connect() {
    if (socket?.connected) {
      return socket
    }

    // Get token from store or cookie
    const tokenCookie = useCookie(AUTH_COOKIE_CONFIG.name)
    const token = authStore.accessToken || tokenCookie.value

    if (!token) {
      return null
    }

    socket = io(config.public.wsBase || 'http://localhost:3001', {
      auth: {
        token: token,
      },
      ...WS_CONFIG
    })

    // Connection handlers
    socket.on('connect', () => {
      // Socket подключен - присоединяемся к персональной комнате
      // Используем декодированный токен для получения userId
      if (token) {
        try {
          const tokenParts = token.split('.')
          if (tokenParts.length >= 2 && tokenParts[1]) {
            const payload = JSON.parse(atob(tokenParts[1]))
            const userId = payload.sub
            if (userId && socket) {
              socket.emit('user:join', { userId })
            }
          }
        } catch (err) {
          // Silent error - token decode failed
        }
      }
    })

    socket.on('disconnect', (reason) => {
      // Socket отключен
    })

    socket.on('connect_error', (error) => {
      // Connection error handled silently
    })
    
    // Global message listener for updating lastMessage and unreadCount
    socket.on('message:new', (message: any) => {
      const chatsStore = useChatsStore()
      const messageChatId = typeof message.chat === 'string' ? message.chat : message.chat._id
      
      // Обновляем lastMessage для всех чатов (глобально)
      // Счетчик непрочитанных обновится внутри updateLastMessageInList
      chatsStore.updateLastMessageInList(messageChatId, message)
    })
    
    // Listener for message edit - update lastMessage if it was edited
    socket.on('message:edited', (message: any) => {
      const chatsStore = useChatsStore()
      const messageChatId = typeof message.chat === 'string' ? message.chat : message.chat._id
      
      // Используем специальный метод для обновления текста без перемещения чата
      chatsStore.updateLastMessageText(messageChatId, message)
    })
    
    // Listener for message delete - update lastMessage from event data
    socket.on('message:deleted', async (data: { messageId: string, chatId: string, newLastMessage?: any }) => {
      
      const chatsStore = useChatsStore()
      
      // Всегда обновляем lastMessage из события - backend уже определил правильное значение
      chatsStore.clearOrUpdateLastMessage(data.chatId, data.newLastMessage || null)
    })

    return socket
  }

  /**
   * Disconnect from WebSocket server
   */
  function disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  /**
   * Get current socket instance
   */
  function getSocket(): Socket | null {
    return socket
  }

  // Auto-connect when user is logged in
  watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) {
        connect()
      } else {
        disconnect()
      }
    },
    { immediate: true }
  )

  return {
    provide: {
      socket: {
        connect,
        disconnect,
        getSocket,
      },
    },
  }
})
