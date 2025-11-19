<template>
  <Transition name="slide-up">
    <div v-if="forwardingMessages.length > 0" class="forward-indicator">
      <div class="forward-indicator__content" @click="handlePreview">
        <div class="forward-indicator__line"></div>
        <div class="forward-indicator__info">
          <span class="forward-indicator__label">
            Переслать {{ forwardingMessages.length }} {{ messageWord }}
          </span>
          <p class="forward-indicator__text">
            {{ previewText }}
          </p>
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
import { useSelectionStore } from '~/stores/selection'

const emit = defineEmits<{
  'show-preview': []
}>()

const selectionStore = useSelectionStore()
const forwardingMessages = computed(() => selectionStore.forwardingMessages)

const messageWord = computed(() => {
  const count = forwardingMessages.value.length
  if (count === 1) return 'сообщение'
  if (count > 1 && count < 5) return 'сообщения'
  return 'сообщений'
})

const previewText = computed(() => {
  if (forwardingMessages.value.length === 0) return ''
  const firstMessage = forwardingMessages.value[0]
  if (!firstMessage) return ''
  
  if (forwardingMessages.value.length === 1) {
    return firstMessage.text
  }
  return `${firstMessage.text.substring(0, 50)}...`
})

function handleClose() {
  selectionStore.cancelForwarding()
}

function handlePreview() {
  emit('show-preview')
}
</script>

<style lang="scss" scoped>
.forward-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba($accent-primary, 0.1);
  border-top: 1px solid rgba($accent-primary, 0.3);
  animation: slideUp 0.3s ease;

  &__content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }

  &__line {
    width: 3px;
    height: 32px;
    background: $accent-primary;
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
    color: $accent-primary;
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
