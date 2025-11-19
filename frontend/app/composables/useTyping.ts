import { ref, onUnmounted } from 'vue'
import { useSocket } from './useSocket'

export function useTyping(chatId: string | (() => string)) {
  const { on, off, emit } = useSocket()
  const typingUsers = ref<string[]>([])
  
  // Таймер для автостопа
  let typingTimer: ReturnType<typeof setTimeout> | null = null
  let isCurrentlyTyping = false
  
  // Получаем ID чата (может быть функцией)
  const getChatId = () => {
    return typeof chatId === 'function' ? chatId() : chatId
  }
  
  // Начать печатать
  function startTyping() {
    const currentChatId = getChatId()
    if (!currentChatId || isCurrentlyTyping) return
    
    isCurrentlyTyping = true
    emit('typing:start', { chatId: currentChatId })
    
    // Автостоп через 3 секунды
    if (typingTimer) clearTimeout(typingTimer)
    typingTimer = setTimeout(() => {
      stopTyping()
    }, 3000)
  }
  
  // Остановить печать
  function stopTyping() {
    const currentChatId = getChatId()
    if (!currentChatId || !isCurrentlyTyping) return
    
    isCurrentlyTyping = false
    emit('typing:stop', { chatId: currentChatId })
    
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }
  }
  
  // Обработка typing с debounce
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  
  function handleTyping() {
    // Сразу начинаем, если еще не начали
    if (!isCurrentlyTyping) {
      startTyping()
    }
    
    // Сбрасываем таймер автостопа
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      stopTyping()
    }, 3000)
  }
  
  // Слушаем события typing от других пользователей
  const handleTypingStart = (data: { chatId: string; userId: string }) => {
    const currentChatId = getChatId()
    if (data.chatId === currentChatId && !typingUsers.value.includes(data.userId)) {
      typingUsers.value.push(data.userId)
    }
  }
  
  const handleTypingStop = (data: { chatId: string; userId: string }) => {
    const currentChatId = getChatId()
    if (data.chatId === currentChatId) {
      typingUsers.value = typingUsers.value.filter(id => id !== data.userId)
    }
  }
  
  // Подписываемся на события
  on('typing:start', handleTypingStart)
  on('typing:stop', handleTypingStop)
  
  // Очищаем при уничтожении компонента
  onUnmounted(() => {
    stopTyping()
    off('typing:start', handleTypingStart)
    off('typing:stop', handleTypingStop)
    
    if (typingTimer) clearTimeout(typingTimer)
    if (debounceTimer) clearTimeout(debounceTimer)
  })
  
  return {
    typingUsers,
    startTyping,
    stopTyping,
    handleTyping
  }
}
