import type { Socket } from 'socket.io-client'

/**
 * useSocket composable - WebSocket abstraction with auto-cleanup
 */
export function useSocket() {
  const { $socket } = useNuxtApp()

  /**
   * Get socket instance
   */
  function getSocket(): Socket | null {
    return $socket.getSocket()
  }

  /**
   * Listen to event with auto-cleanup on unmount
   * Will retry registration if socket is not connected yet
   */
  function on<T = any>(event: string, handler: (data: T) => void) {
    let attempts = 0
    const maxAttempts = 50 // 5 seconds max wait
    
    const tryRegister = () => {
      const socket = getSocket()
      if (!socket) {
        attempts++
        if (attempts < maxAttempts) {
          // Try again after a short delay
          setTimeout(tryRegister, 100)
        }
        return false
      }
      
      socket.on(event, handler)
      return true
    }
    
    // Try to register immediately
    const registered = tryRegister()
    
    // Auto-cleanup on component unmount
    onUnmounted(() => {
      const socketInstance = getSocket()
      if (socketInstance) {
        socketInstance.off(event, handler)
      }
    })
  }

  /**
   * Emit event without acknowledgment
   */
  function emit(event: string, data?: any) {
    const socket = getSocket()
    if (!socket) {
      // Socket not connected yet, skip silently
      return
    }

    socket.emit(event, data)
  }

  /**
   * Emit event with acknowledgment (returns Promise)
   */
  function emitWithAck<T = any>(event: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const socket = getSocket()
      if (!socket) {
        reject(new Error('Socket not connected'))
        return
      }

      socket.emit(event, data, (response: T) => {
        resolve(response)
      })
    })
  }

  /**
   * Remove event listener
   */
  function off(event: string, handler?: (...args: any[]) => void) {
    const socket = getSocket()
    if (!socket) return

    if (handler) {
      socket.off(event, handler)
    } else {
      socket.off(event)
    }
  }

  /**
   * Connect to socket (if not connected)
   */
  function connect() {
    return $socket.connect()
  }

  /**
   * Disconnect from socket
   */
  function disconnect() {
    $socket.disconnect()
  }

  return {
    getSocket,
    on,
    emit,
    emitWithAck,
    off,
    connect,
    disconnect,
  }
}
