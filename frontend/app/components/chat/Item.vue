<template>
  <article class="chat-item" @click="handleClick">
    <!-- Avatar -->
    <div class="chat-item__avatar">
      <div class="avatar-placeholder" />
    </div>

    <!-- Content -->
    <div class="chat-item__content">
      <div class="chat-item__header">
        <h3 class="chat-item__name">
          {{ chatName }}
        </h3>
        <time v-if="chat.lastMessage" class="chat-item__time">
          {{ formattedTime }}
        </time>
      </div>

      <div class="chat-item__footer">
        <p v-if="chat.lastMessage" class="chat-item__message">
          <span v-if="chat.type !== 'personal'" class="sender">{{ senderName }}:</span>
          {{ chat.lastMessage.text || 'Сообщение' }}
        </p>
        <p v-else class="chat-item__message chat-item__message--empty">
          Нет сообщений
        </p>

        <!-- Unread Badge -->
        <span v-if="unreadCount > 0" class="chat-item__badge">
          {{ unreadCount }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Chat } from '~/types/chat.types'
import { formatTime } from '~/utils/date.utils'
import { useChatName } from '~/composables/useChat'

// ===== PROPS =====

interface Props {
  chat: Chat
  unreadCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  unreadCount: 0
})

// ===== COMPOSABLES =====

/**
 * Название чата (через composable)
 */
const chatName = useChatName(toRef(props, 'chat'))

// ===== COMPUTED =====

/**
 * Имя отправителя последнего сообщения
 */
const senderName = computed(() => {
  if (!props.chat.lastMessage) return ''

  const sender = props.chat.lastMessage.sender
  const authStore = useAuthStore()
  
  // Если sender не указан, пытаемся найти другого участника чата
  if (!sender) {
    const otherParticipant = props.chat.participants?.find(
      p => p._id !== authStore.user?._id
    )
    return otherParticipant?.name || 'Неизвестный'
  }
  
  // Если sender - это объект с полями (populated)
  if (typeof sender === 'object') {
    return sender.name || 'Неизвестный'
  }
  
  // Если sender - это строка (ID), пытаемся найти среди участников
  if (typeof sender === 'string') {
    // Сначала проверяем, не текущий ли это пользователь
    if (sender === authStore.user?._id) {
      return authStore.user?.name || 'Вы'
    }
    
    // Ищем среди участников чата
    const participant = props.chat.participants?.find(p => p._id === sender)
    if (participant) {
      return participant.name || 'Неизвестный'
    }
    
    // Если не нашли, берем другого участника (не текущего пользователя)
    const otherParticipant = props.chat.participants?.find(
      p => p._id !== authStore.user?._id
    )
    return otherParticipant?.name || 'Неизвестный'
  }
  
  return 'Неизвестный'
})

/**
 * Форматированное время (через utility)
 * Формат: HH:MM
 */
const formattedTime = computed(() => {
  if (!props.chat.lastMessage) return ''
  return formatTime(props.chat.lastMessage.createdAt)
})

// ===== METHODS =====

/**
 * Обработка клика на чат
 * Переход на страницу чата
 */
function handleClick() {
  navigateTo(`/chat/${props.chat._id}`)
}
</script>

<style lang="scss" scoped>
/**
 * ChatItem Styles
 *
 * Строго по макету Chatlist.png:
 * - Avatar (48px круг слева)
 * - Название чата (uppercase, жирный)
 * - Время справа (00:00)
 * - Сообщение (НИК: текст)
 * - Badge непрочитанных (жёлтый круг)
 *
 * ✅ Единый фон $bg-primary
 * ✅ Тень $shadow-block
 * ✅ НЕТ границ
 */

.chat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: $bg-primary;
  box-shadow: $shadow-block;
  border-radius: $radius;
  cursor: pointer;
  border: none;
  @include transition;

  @include hover {
    opacity: 0.8;
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 0; // Для text-overflow
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  &__name {
    flex: 1;
    @include font-styles(16px, 400, 1.4);
    color: $text-primary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }

  &__time {
    flex-shrink: 0;
    @include font-styles(12px, 400, 1.4);
    color: $text-secondary;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  &__message {
    flex: 1;
    @include font-styles(14px, 400, 1.4);
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;

    .sender {
      color: $text-primary;
    }

    &--empty {
      font-style: italic;
      color: $text-placeholder;
    }
  }

  &__badge {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-accent;
    color: $bg-primary;
    @include font-styles(12px, 400, 1.4);
    border-radius: 50%;
  }
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  background: $bg-primary;
  box-shadow: $shadow-block;
  border-radius: 50%;
}
</style>
