<template>
  <header class="chat-header">
    <!-- Selection Mode -->
    <template v-if="selectionStore.isSelectionMode">
      <!-- Cancel Selection -->
      <UiBaseButton
        variant="icon"
        aria-label="Отменить выделение"
        @click="handleCancelSelection"
      >
        <SvgoCloseIcon />
      </UiBaseButton>

      <!-- Selected Count -->
      <div class="chat-header__counter">
        {{ selectionStore.selectedCount }}
      </div>

      <div class="chat-header__spacer"></div>

      <!-- Selection Actions -->
      <div class="chat-header__actions">
        <UiBaseButton
          v-if="selectionStore.canEdit"
          variant="icon"
          aria-label="Редактировать"
          @click="handleEdit"
        >
          <SvgoEditIcon />
        </UiBaseButton>
        <UiBaseButton
          variant="icon"
          aria-label="Копировать"
          @click="handleCopy"
        >
          <SvgoCopyIcon />
        </UiBaseButton>
        <UiBaseButton
          variant="icon"
          aria-label="Переслать"
          @click="handleForward"
        >
          <SvgoForwardIcon />
        </UiBaseButton>
        <UiBaseButton
          v-if="selectionStore.canDelete"
          variant="icon"
          aria-label="Удалить"
          @click="handleDelete"
        >
          <SvgoDeleteIcon />
        </UiBaseButton>
      </div>
    </template>

    <!-- Normal Mode -->
    <template v-else>
      <!-- Back Button -->
      <UiBaseButton
        variant="icon"
        aria-label="Назад"
        @click="emit('back')"
      >
        <SvgoArrowIcon />
      </UiBaseButton>

      <!-- Avatar -->
      <UiAvatar
        :src="avatar"
        :name="title"
        :user-id="userId"
        size="md"
        class="chat-header__avatar"
      />

      <!-- Chat Info -->
      <div class="chat-header__info">
        <h1 class="chat-header__title">{{ title }}</h1>
        <p class="chat-header__subtitle">{{ subtitle }}</p>
      </div>

      <!-- Actions -->
      <div class="chat-header__actions">
        <UiBaseButton
          variant="icon"
          aria-label="Аудио звонок"
          @click="handleAudioCall"
        >
          <Icon name="material-symbols:call" />
        </UiBaseButton>
        <UiBaseButton
          variant="icon"
          aria-label="Видео звонок"
          @click="handleVideoCall"
        >
          <Icon name="material-symbols:videocam" />
        </UiBaseButton>
        <UiBaseButton
          variant="icon"
          aria-label="Меню"
          @click="emit('menu')"
        >
          <SvgoMenuIcon />
        </UiBaseButton>
      </div>
    </template>
  </header>
</template>

<script setup lang="ts">
import { useSelectionStore } from '~/stores/selection'

/**
 * ChatHeader Component
 *
 * Строго по макету header (в чате).png:
 * - Back button (стрелка назад)
 * - Chat title + subtitle (название + инфо)
 * - Action buttons (телефон, меню)
 * - Selection mode with action buttons
 *
 * Применяем Component Composition:
 * - UiBaseButton для всех кнопок
 * - Semantic HTML5 (header)
 */

interface Props {
  title: string
  subtitle?: string
  avatar?: string
  userId?: string
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  avatar: '/default-avatar.png'
})

const emit = defineEmits<{
  'back': []
  'call': [type: 'audio' | 'video']
  'menu': []
  'edit': []
  'copy': []
  'forward': []
  'delete': []
}>()

const selectionStore = useSelectionStore()

function handleCancelSelection() {
  selectionStore.exitSelectionMode()
}

function handleAudioCall() {
  emit('call', 'audio')
}

function handleVideoCall() {
  emit('call', 'video')
}

function handleEdit() {
  emit('edit')
  selectionStore.exitSelectionMode()
}

function handleCopy() {
  emit('copy')
  selectionStore.exitSelectionMode()
}

function handleForward() {
  emit('forward')
  // Don't exit selection mode for forward - might want to forward multiple
}

function handleDelete() {
  emit('delete')
  selectionStore.exitSelectionMode()
}
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
    gap: 5px;
    margin-left: auto;
  }

  &__counter {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    padding: 0 10px;
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }

  &__spacer {
    flex-grow: 1;
  }
}

// Исправляем цвет иконок - они должны быть белыми
.chat-header :deep(svg) {
  fill: $text-primary;
  color: $text-primary;
}
</style>
