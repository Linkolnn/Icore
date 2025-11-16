<template>
  <header class="chat-header">
    <!-- Back Button -->
    <UiBaseButton
      variant="icon"
      aria-label="Назад"
      @click="emit('back')"
    >
      <SvgoArrowIcon />
    </UiBaseButton>

    <!-- Avatar -->
    <img :src="avatar" :alt="title" class="chat-header__avatar" />

    <!-- Chat Info -->
    <div class="chat-header__info">
      <h1 class="chat-header__title">{{ title }}</h1>
      <p class="chat-header__subtitle">{{ subtitle }}</p>
    </div>

    <!-- Actions -->
    <div class="chat-header__actions">
      <UiBaseButton
        variant="icon"
        aria-label="Позвонить"
        @click="emit('call')"
      >
        <SvgoPhoneIcon />
      </UiBaseButton>
      <UiBaseButton
        variant="icon"
        aria-label="Меню"
        @click="emit('menu')"
      >
        <SvgoMenuIcon />
      </UiBaseButton>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * ChatHeader Component
 *
 * Строго по макету header (в чате).png:
 * - Back button (стрелка назад)
 * - Chat title + subtitle (название + инфо)
 * - Action buttons (телефон, меню)
 *
 * Применяем Component Composition:
 * - UiBaseButton для всех кнопок
 * - Semantic HTML5 (header)
 */

interface Props {
  title: string
  subtitle?: string
  avatar?: string
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  avatar: '/default-avatar.png'
})

const emit = defineEmits<{
  'back': []
  'call': []
  'menu': []
}>()
</script>

<style lang="scss" scoped>
/**
 * ChatHeader Styles
 *
 * ✅ Единый фон $bg-primary
 * ✅ Тень $shadow-block
 * ✅ НЕТ границ
 * ✅ Semantic HTML (header)
 */

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: $bg-primary;
  box-shadow: $shadow-block;
  border-radius: $radius;
  border: none;

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0; // Для text-overflow
  }

  &__title {
    @include font-styles(16px, 400, 1.4);
    color: $text-primary;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__subtitle {
    @include font-styles(12px, 400, 1.4);
    color: $text-secondary;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

// Исправляем цвет иконок - они должны быть белыми
.chat-header :deep(svg) {
  fill: $text-primary;
  color: $text-primary;
}
</style>
