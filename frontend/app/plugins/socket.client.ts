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
          const payload = JSON.parse(atob(token.split('.')[1]))
          const userId = payload.sub
          if (userId && socket) {
            socket.emit('user:join', { userId })
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
