<template>
  <article :class="['message-bubble', isOwn ? 'message-bubble--own' : 'message-bubble--other']">
    <div class="message-bubble__content">
      <p class="message-bubble__text">{{ message.text }}</p>
      <div class="message-bubble__footer">
        <time class="message-bubble__time">{{ formattedTime }}</time>
        <span v-if="message.status === 'pending'" class="message-bubble__status">⏳</span>
        <span v-else-if="message.status === 'failed'" class="message-bubble__status">❌</span>
        <span v-else-if="isOwn" class="message-bubble__status">
          {{ message.status === 'read' ? '✓✓' : '✓' }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Message } from '~/types/message.types'
import type { User } from '~/types/user.types'
import { formatTime } from '~/utils/date.utils'

interface Props {
  message: Message
}

const props = defineProps<Props>()
const authStore = useAuthStore()

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
</script>

<style lang="scss" scoped>
.message-bubble {
  display: flex;
  margin-bottom: 8px;

  &--own {
    justify-content: flex-end;
  }

  &--other {
    justify-content: flex-start;
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
    margin: 0 0 2px 0;
    font-size: 14px;
    line-height: 1.4;
    color: $text-primary;
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
}
</style>
