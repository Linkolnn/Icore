<template>
  <article 
    :class="[
      'message-bubble', 
      isOwn ? 'message-bubble--own' : 'message-bubble--other',
      isSelected && 'message-bubble--selected'
    ]"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="message-bubble__content">
      <!-- Reply to message -->
      <div v-if="message.replyTo" class="message-bubble__reply" @click="scrollToReply">
        <div class="message-bubble__reply-line"></div>
        <div class="message-bubble__reply-content">
          <span class="message-bubble__reply-sender">{{ getReplyAuthor() }}</span>
          <p class="message-bubble__reply-text">{{ message.replyTo.text }}</p>
        </div>
      </div>
      
      <!-- Forwarded message info -->
      <div v-if="message.forwarded" class="message-bubble__forwarded">
        <span class="message-bubble__forwarded-label">Переслано от</span>
        <UiAvatar
          :src="getForwardedAvatar()"
          :name="getForwardedName()"
          :user-id="getForwardedUserId()"
          size="xs"
        />
        <span class="message-bubble__forwarded-name">{{ getForwardedName() }}</span>
      </div>
      
      <p class="message-bubble__text">{{ message.text }}</p>
      
      <div class="message-bubble__footer">
        <time class="message-bubble__time">{{ formattedTime }}</time>
        <span v-if="message.editedAt" class="message-bubble__edited">(изменено)</span>
        <ChatMessageStatus 
          v-if="isOwn" 
          :status="message.status || 'sent'"
          :read-at="message.readAt"
          :delivered-at="message.deliveredAt"
          :read-by="message.readBy"
        />
        <span v-else-if="message.status === 'pending'" class="message-bubble__status">⏳</span>
        <span v-else-if="message.status === 'failed'" class="message-bubble__status">❌</span>
      </div>
    </div>
    
    <!-- Selection Indicator -->
    <div 
      v-if="isSelected" 
      class="message-bubble__selection-indicator"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FFD700" />
        <path d="M9 12.5l2 2 4-4" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Message } from '~/types/message.types'
import type { User } from '~/types/user.types'
import { formatTime } from '~/utils/date.utils'
import { useSelectionStore } from '~/stores/selection'

interface Props {
  message: Message
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'edit': [message: Message]
  'delete': [message: Message]
}>()

const authStore = useAuthStore()
const selectionStore = useSelectionStore()

// Selection state
let longPressTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Check if message is from current user
 */
const isOwn = computed(() => {
  const senderId = typeof props.message.sender === 'string'
    ? props.message.sender
    : (props.message.sender as User)._id

  return senderId === authStore.user?._id
})

/**
 * Formatted time (HH:MM)
 */
const formattedTime = computed(() => {
  return formatTime(props.message.createdAt)
})

/**
 * Check if message is selected
 */
const isSelected = computed(() => {
  return selectionStore.isSelected(props.message._id)
})

/**
 * Handle click on message
 */
function handleClick() {
  if (selectionStore.isSelectionMode) {
    selectionStore.toggleMessage(props.message)
  }
}

/**
 * Handle right click (context menu) on PC
 */
function handleContextMenu(event: MouseEvent) {
  // Enter selection mode on right click
  if (!selectionStore.isSelectionMode) {
    selectionStore.enterSelectionMode(props.message)
  }
}

/**
 * Handle touch start (for long press on mobile)
 */
function handleTouchStart(event: TouchEvent) {
  longPressTimer = setTimeout(() => {
    // Enter selection mode on long press
    if (!selectionStore.isSelectionMode) {
      selectionStore.enterSelectionMode(props.message)
      // Vibration feedback if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }, 500) // 500ms for long press
}

/**
 * Handle touch end (clear long press timer)
 */
function handleTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

/**
 * Get reply author name
 */
function getReplyAuthor(): string {
  if (!props.message.replyTo) return ''
  const sender = props.message.replyTo.sender
  if (typeof sender === 'string') return 'Пользователь'
  return sender.name || 'Пользователь'
}

/**
 * Get forwarded message sender name
 */
function getForwardedName(): string {
  if (!props.message.forwarded) return ''
  
  // First, check if we have fromName directly stored
  if (props.message.forwarded.fromName) {
    return props.message.forwarded.fromName
  }
  
  // Fallback to getting name from populated user object
  const sender = props.message.forwarded.from
  if (typeof sender === 'string') return 'Пользователь'
  return sender.name || 'Пользователь'
}

/**
 * Get forwarded message sender avatar
 */
function getForwardedAvatar(): string | undefined {
  if (!props.message.forwarded) return undefined
  const sender = props.message.forwarded.from
  if (typeof sender === 'string') return undefined
  return sender.avatar || undefined
}

/**
 * Get forwarded message sender ID for consistent color
 */
function getForwardedUserId(): string | undefined {
  if (!props.message.forwarded) return undefined
  const sender = props.message.forwarded.from
  if (typeof sender === 'string') return sender
  return sender._id
}

/**
 * Scroll to reply message
 */
function scrollToReply() {
  if (!props.message.replyTo) return
  // TODO: Implement scroll to specific message
  const messageElement = document.querySelector(`[data-message-id="${props.message.replyTo._id}"]`)
  if (messageElement) {
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Add highlight animation
    messageElement.classList.add('message-bubble--highlight')
    setTimeout(() => {
      messageElement.classList.remove('message-bubble--highlight')
    }, 1500)
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
  }
})
</script>

<style lang="scss" scoped>
.message-bubble {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  transition: all 0.3s ease;

  &--own {
    justify-content: flex-end;
    
    // Сдвигаем сообщение при выделении для места под индикатор
    &.message-bubble--selected {
      padding-right: 40px;
    }
    
    // Для собственных сообщений индикатор справа
    .message-bubble__selection-indicator {
      left: auto;
      right: 8px;
    }
  }

  &--other {
    justify-content: flex-start;
    
    // Сдвигаем сообщение при выделении для места под индикатор
    &.message-bubble--selected {
      padding-left: 40px;
    }
  }


  &__content {
    max-width: 70%;
    min-width: 100px;
    padding: 10px 15px 6px;
    border-radius: $radius; // ✅ Единый радиус из дизайн-системы (28px)
    background: $bg-primary; // ✅ Единый фон из дизайн-системы (#212121)
    box-shadow: $shadow-block; // ✅ Объём через тень
    color: $text-primary;
    word-wrap: break-word;
    @include transition;

    @include hover {
      opacity: 0.85; // ✅ Hover через opacity
    }
  }

  &__text {
    margin: 0;
    word-wrap: break-word;
    line-height: 1.4;
    white-space: pre-line; // Сохраняем переносы строк
    color: $text-primary;
    
    &--deleted {
      opacity: 0.5;
      font-style: italic;
      color: $text-secondary;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end; // ✅ Время всегда в правом нижнем углу
    gap: 4px;
    margin-top: 2px;
  }

  &__time {
    font-size: 12px; // ✅ Увеличено на 2px (было 10px)
    opacity: 0.6;
    color: $text-secondary;
  }

  &__status {
    font-size: 12px;
    opacity: 0.7;
    line-height: 1;
    color: $text-secondary;
  }
  
  &__edited {
    font-size: 11px;
    opacity: 0.5;
    color: $text-secondary;
    font-style: italic;
  }
  
  // Reply styles
  &__reply {
    display: flex;
    gap: 8px;
    padding: 6px 8px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
  
  &__reply-line {
    width: 2px;
    background: $color-accent;
    border-radius: 1px;
    flex-shrink: 0;
  }
  
  &__reply-content {
    flex: 1;
    min-width: 0;
  }
  
  &__reply-sender {
    display: block;
    font-size: 13px;
    color: $color-accent;
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  &__reply-text {
    margin: 0;
    font-size: 13px;
    color: $text-secondary;
    white-space: pre-line; // Сохраняем переносы строк
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 40px; // Ограничиваем высоту для компактности
  }
  
  // Forwarded message styles
  &__forwarded {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 13px;
    color: $text-secondary;
  }
  
  &__forwarded-label {
    color: $text-secondary;
    opacity: 0.7;
  }
  
  &__forwarded-name {
    color: $text-primary;
    font-weight: 500;
  }
  
  // Highlight animation for scrolled-to message
  &--highlight {
    animation: highlightPulse 1.5s ease;
  }

  &__selection-indicator {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 1;
    transition: all 0.3s ease;

    svg {
      width: 28px;
      height: 28px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      transition: transform 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

@keyframes scaleIn {
  from {
    transform: translateY(-50%) scale(0);
  }
  to {
    transform: translateY(-50%) scale(1);
  }
}

@keyframes highlightPulse {
  0%, 100% {
    background: transparent;
  }
  50% {
    background: rgba($color-accent, 0.2);
  }
}

// Context Menu Styles
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.2);
}

.context-menu {
  position: fixed;
  background: $bg-primary;
  border-radius: $radius;
  box-shadow: $shadow-block;
  padding: 8px 0;
  min-width: 180px;
  z-index: 1001;
  animation: fadeIn 0.2s ease;

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 20px;
    background: transparent;
    border: none;
    color: $text-primary;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: rgba($color-accent, 0.1);
    }

    &--danger {
      color: $error-color;
      
      &:hover {
        background: rgba($error-color, 0.1);
      }
    }
  }

  &__icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    fill: currentColor;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
