import type { Chat, ChatParticipant } from '~/types/chat.types'

/**
 * Composable для работы с чатами
 *
 * Применяем паттерн: Composition API
 * Принцип: DRY - переиспользуемая логика для чатов
 */

/**
 * Получить название чата
 * Для personal - имя собеседника
 * Для group/channel - название группы
 */
export function useChatName(chat: MaybeRef<Chat | null>, previewUser?: any): ComputedRef<string> {
  const authStore = useAuthStore()
  const chatRef = toRef(chat)

  return computed(() => {
    // Preview mode: имя пользователя
    if (previewUser && previewUser.value) {
      const user = unref(previewUser)
      return user.name || user.username || 'Неизвестный пользователь'
    }

    const chatValue = chatRef.value
    if (!chatValue) return 'Чат'

    // Если есть название - используем его
    if (chatValue.name) return chatValue.name

    // Для personal чата - имя собеседника
    if (chatValue.type === 'personal' && chatValue.participants.length > 0) {
      const currentUserId = authStore.user?._id
      const otherUser = chatValue.participants.find(p => p._id !== currentUserId)
      return otherUser?.name || otherUser?.username || 'Неизвестный пользователь'
    }

    return 'Новый чат'
  })
}

/**
 * Получить собеседника в personal чате
 */
export function useChatOtherUser(chat: MaybeRef<Chat | null>): ComputedRef<ChatParticipant | null> {
  const authStore = useAuthStore()
  const chatRef = toRef(chat)

  return computed(() => {
    const chatValue = chatRef.value
    if (!chatValue || chatValue.type !== 'personal' || chatValue.participants.length === 0) {
      return null
    }

    const currentUserId = authStore.user?._id
    return chatValue.participants.find(p => p._id !== currentUserId) || null
  })
}

/**
 * Получить подзаголовок чата
 */
export function useChatSubtitle(chat: MaybeRef<Chat | null>, previewUser?: any): ComputedRef<string> {
  const chatRef = toRef(chat)

  return computed(() => {
    // Preview mode: email или userId
    if (previewUser && previewUser.value) {
      const user = unref(previewUser)
      return user.email || user.userId || ''
    }

    const chatValue = chatRef.value
    if (!chatValue) return ''

    if (chatValue.type === 'personal') {
      return '2 участника / онлайн'
    }

    return `${chatValue.participants.length} участников / время в сети`
  })
}

/**
 * Получить аватар чата
 */
export function useChatAvatar(chat: MaybeRef<Chat | null>, previewUser?: any): ComputedRef<string> {
  const authStore = useAuthStore()
  const chatRef = toRef(chat)

  return computed(() => {
    // Preview mode: аватар пользователя
    if (previewUser && previewUser.value) {
      const user = unref(previewUser)
      return user.avatar || '/default-avatar.png'
    }

    const chatValue = chatRef.value
    if (!chatValue) return '/default-avatar.png'

    // Для personal чата - аватар собеседника
    if (chatValue.type === 'personal' && chatValue.participants.length > 0) {
      const currentUserId = authStore.user?._id
      const otherUser = chatValue.participants.find(p => p._id !== currentUserId)
      return otherUser?.avatar || '/default-avatar.png'
    }

    // Для группового чата - аватар чата
    return chatValue.avatar || '/default-avatar.png'
  })
}
