<template>
  <Transition name="slide-up">
    <div v-if="replyToMessage" class="reply-indicator">
      <div class="reply-indicator__content">
        <div class="reply-indicator__line"></div>
        <div class="reply-indicator__info">
          <span class="reply-indicator__label">В ответ {{ senderName }}</span>
          <p class="reply-indicator__text">{{ replyToMessage.text }}</p>
        </div>
      </div>
      <UiBaseButton
        variant="icon"
        size="small"
        @click="handleClose"
      >
        <SvgoCloseIcon />
      </UiBaseButton>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Message } from '~/types/message.types'
import { useSelectionStore } from '~/stores/selection'

const selectionStore = useSelectionStore()

const replyToMessage = computed(() => selectionStore.replyToMessage)

const senderName = computed(() => {
  if (!replyToMessage.value) return ''
  const sender = replyToMessage.value.sender
  if (typeof sender === 'string') {
    return 'Пользователь'
  }
  return sender.name || 'Пользователь'
})

function handleClose() {
  selectionStore.clearReply()
}
</script>

<style lang="scss" scoped>
.reply-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba($color-accent, 0.1);
  border-top: 1px solid rgba($color-accent, 0.3);
  animation: slideUp 0.3s ease;

  &__content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;
  }

  &__line {
    width: 3px;
    height: 32px;
    background: $color-accent;
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__label {
    display: block;
    font-size: 13px;
    color: $color-accent;
    font-weight: 500;
    margin-bottom: 2px;
  }

  &__text {
    margin: 0;
    font-size: 14px;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// Animations
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
