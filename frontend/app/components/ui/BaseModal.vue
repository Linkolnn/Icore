<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="base-modal"
        @click.self="handleBackdropClick"
      >
        <article
          :class="['base-modal__dialog', `base-modal__dialog--${size}`]"
          role="dialog"
          :aria-label="title"
        >
          <!-- Header -->
          <header v-if="showHeader" class="base-modal__header">
            <h2 class="base-modal__title">{{ title }}</h2>
            <UiBaseButton
              v-if="showCloseButton"
              variant="icon"
              size="small"
              @click="close"
              :aria-label="'Закрыть'"
            >
              <SvgoCloseIcon />
            </UiBaseButton>
          </header>

          <!-- Content -->
          <section class="base-modal__content">
            <slot />
          </section>

          <!-- Footer -->
          <footer v-if="$slots.footer" class="base-modal__footer">
            <slot name="footer" />
          </footer>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  showHeader?: boolean
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'medium',
  showHeader: true,
  showCloseButton: true,
  closeOnBackdrop: true,
  persistent: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'open': []
}>()

/**
 * Close modal
 */
function close() {
  if (props.persistent) return
  emit('update:modelValue', false)
  emit('close')
}

/**
 * Handle backdrop click
 */
function handleBackdropClick() {
  if (props.closeOnBackdrop && !props.persistent) {
    close()
  }
}

/**
 * Handle ESC key
 */
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue && !props.persistent) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

// Emit open event when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    emit('open')
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden'
  } else {
    // Unlock body scroll when modal closes
    document.body.style.overflow = ''
  }
})
</script>

<style lang="scss" scoped>
.base-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);

  &__dialog {
    position: relative;
    width: 100%;
    max-height: calc(100vh - 40px);
    display: flex;
    flex-direction: column;
    background: $bg-primary;
    border-radius: $radius;
    box-shadow: $shadow-block;
    overflow: hidden;
    
    // Sizes
    &--small {
      max-width: 400px;
    }

    &--medium {
      max-width: 600px;
    }

    &--large {
      max-width: 900px;
    }

    &--fullscreen {
      max-width: calc(100vw - 40px);
      max-height: calc(80vh - 40px);
      width: 100%;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: $bg-primary;
    box-shadow: $shadow-block;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    background: $bg-primary;
    padding: 10px 10px 0px;
    
    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }

  &__footer {
    padding: 16px 20px;
    background: $bg-primary;
    box-shadow: 0 -1px 0 0 rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
}

// Transitions
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  
  .base-modal__dialog {
    transform: scale(0.9) translateY(20px);
  }
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
  
  .base-modal__dialog {
    transform: scale(1) translateY(0);
  }
}

// Mobile responsive
@include mobile {
  .base-modal {
    padding: 0;
    align-items: flex-end;

    &__dialog {
      max-height: 70vh;
      border-radius: $radius $radius 0 0;
      margin: 0;
      
      &--small,
      &--medium,
      &--large,
      &--fullscreen {
        max-width: 100%;
        width: 100%;
        max-height: 70vh;
      }
    }

    &__header {
      border-radius: $radius $radius 0 0;
    }
  }
}
</style>
