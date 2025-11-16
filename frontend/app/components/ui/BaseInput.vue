<template>
  <div class="base-input">
    <label v-if="label" :for="inputId" class="base-input__label">
      {{ label }}
    </label>
    <div class="base-input__wrapper">
      <!-- Left action slot (for buttons inside input) -->
      <div v-if="$slots.leftAction" class="base-input__left-action">
        <slot name="leftAction" />
      </div>

      <input
        :id="inputId"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="base-input__field"
        :class="{
          'has-left-action': $slots.leftAction,
          'has-right-action': $slots.rightAction || $slots.icon
        }"
        @blur="$emit('blur')"
        @focus="$emit('focus')"
        @keyup.enter="$emit('enter')"
      />

      <!-- Right action slot (for buttons inside input) -->
      <div v-if="$slots.rightAction" class="base-input__right-action">
        <slot name="rightAction" />
      </div>

      <!-- Icon slot (non-interactive, for search icon etc) -->
      <div v-else-if="$slots.icon" class="base-input__icon">
        <slot name="icon" />
      </div>
    </div>
    <span v-if="error" class="base-input__error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
// ===================================
// 🧩 BASE INPUT - Переиспользуемый компонент input
// ===================================
// Паттерн: Component Composition
// Принцип: DRY - один компонент для всех input полей
// Использование: login, register и другие формы

interface Props {
  modelValue: string
  type?: 'text' | 'email' | 'password'
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
  'focus': []
  'enter': []
}>()

// v-model двустороннее связывание
const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Уникальный ID для связи label и input (семантика)
const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)
</script>

<style lang="scss" scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;

  &__label {
    margin-left: 5px;
    @include font-styles(14px, 400, 1.4);
    color: $text-primary;
  }

  &__wrapper {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }

  &__field {
    width: 100%;
    padding: 12px 14px;
    border-radius: $radius;
    background: $bg-primary;
    color: $text-primary;
    box-shadow: $shadow-input;
    @include font-styles(16px, 400, 1.5);
    @include transition;

    // Adjust padding when actions are present
    &.has-left-action {
      padding-left: 40px;
    }

    &.has-right-action {
      padding-right: 40px;
    }

    // Ensure text is always visible
    -webkit-text-fill-color: $text-primary;
    -webkit-opacity: 1;

    &::placeholder {
      color: $text-placeholder;
      font-size: 16px;
      line-height: 1.5;
    }

    &:focus {
      outline: none;
      box-shadow: $shadow-input, 0 0 0 2px rgba($accent-primary, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  // Action buttons (inside input, left or right)
  &__left-action,
  &__right-action {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 5px;
    z-index: 1;

    // Style buttons inside
    :deep(button) {
      padding: 0;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      @include transition;

      &:hover {
        opacity: 0.7;
      }

      svg {
        width: 16px;
        height: 16px;
        color: $text-secondary;
      }
    }
  }

  &__left-action {
    left: 10px;
  }

  &__right-action {
    right: 10px;
  }

  // Icon slot (non-interactive, for search icon etc)
  &__icon {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    color: $text-secondary;
  }

  &__error {
    @include font-styles(12px, 400, 1.4);
    color: #F44336;
    margin-top: -4px;
  }
}
</style>
