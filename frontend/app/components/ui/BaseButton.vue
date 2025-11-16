<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['base-button', `base-button--${variant}`]"
    @click="$emit('click')"
  >
    <span v-if="loading" class="base-button__loader"></span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
// ===================================
// 🧩 BASE BUTTON - Переиспользуемый компонент кнопки
// ===================================
// Паттерн: Component Composition
// Принцип: DRY - один компонент для всех кнопок
// Варианты: primary (желтый акцент), secondary, ghost

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon'
  disabled?: boolean
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  disabled: false,
  loading: false
})

defineEmits<{
  'click': []
}>()
</script>

<style lang="scss" scoped>
.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border: none;
  border-radius: $radius;
  cursor: pointer;
  @include font-styles(16px, 500, 1.5);
  @include transition;
  min-width: 120px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__loader {
    width: 20px;
    height: 20px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  // === ВАРИАНТЫ КНОПОК ===

  // Primary - желтый акцент (основная кнопка)
  &--primary {
    background: $accent-primary;
    color: $color-dark;
    box-shadow: $shadow-block;

    @include hover {
      opacity: 0.9;
      transform: translateY(-2px);
      box-shadow: $shadow-block, 0 4px 12px rgba($accent-primary, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }

  // Secondary - темный фон (второстепенная кнопка)
  &--secondary {
    background: $bg-primary;
    color: $text-primary;
    box-shadow: $shadow-block;

    @include hover {
      opacity: 0.8;
    }
  }

  // Ghost - прозрачная (ссылка-кнопка)
  &--ghost {
    background: transparent;
    color: $text-secondary;
    box-shadow: none;

    @include hover {
      color: $text-primary;
      opacity: 0.8;
    }
  }

  // Icon - кнопка с иконкой (для меню, действий)
  &--icon {
    background: $bg-primary;
    color: $text-primary;
    box-shadow: $shadow-block;
    padding: 10px;
    min-width: 40px;
    width: 40px;
    height: 40px;
    border-radius: $radius;

    @include hover {
      opacity: 0.8;
    }

    // Иконки внутри должны быть 24x24px
    :deep(svg) {
      width: 20px;
      height: 20px;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
