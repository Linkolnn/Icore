<template>
  <transition name="slide">
    <div v-if="isOpen" class="search-panel">
      <div class="search-panel__header">
        <h3 class="search-panel__title">Поиск сообщений</h3>
        <UiBaseButton
          variant="icon"
          size="small"
          @click="$emit('close')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </UiBaseButton>
      </div>
      
      <div class="search-panel__input">
        <input
          v-model="search.query.value"
          type="text"
          placeholder="Введите текст для поиска..."
          class="search-panel__field"
          @keydown.escape="$emit('close')"
        />
        <span v-if="search.loading.value" class="search-panel__loading">
          <span class="spinner"></span>
        </span>
      </div>
      
      <div class="search-panel__results">
        <!-- Loading state -->
        <div v-if="search.loading.value && !search.hasResults.value" class="search-panel__state">
          <span class="spinner"></span>
          <p>Поиск...</p>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="!search.loading.value && !search.hasResults.value && search.query.value.length >= 2" class="search-panel__state">
          <p>Ничего не найдено</p>
        </div>
        
        <!-- Results -->
        <div v-else-if="search.hasResults.value" class="search-panel__list">
          <div class="search-panel__count">
            Найдено: {{ search.total.value }} {{ pluralize(search.total.value, 'сообщение', 'сообщения', 'сообщений') }}
          </div>
          
          <div
            v-for="result in search.results.value"
            :key="result._id"
            class="search-panel__item"
            @click="handleJumpToMessage(result._id)"
          >
            <div class="search-panel__item-header">
              <span class="search-panel__item-sender">{{ result.sender?.name || result.sender?.username || 'Unknown' }}</span>
              <time class="search-panel__item-time">{{ formatDate(result.createdAt) }}</time>
            </div>
            <div 
              class="search-panel__item-text"
              v-html="search.highlightText(result.text, result._id)"
            ></div>
            <div v-if="result.chat" class="search-panel__item-chat">
              в чате: {{ result.chat.name || 'Личные сообщения' }}
            </div>
          </div>
        </div>
        
        <!-- Initial state -->
        <div v-else class="search-panel__state">
          <p>Введите минимум 2 символа для поиска</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useSearch } from '~/composables/useSearch'

interface Props {
  isOpen: boolean
  chatId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  jumpTo: [messageId: string]
}>()

// Search composable
const search = useSearch({
  chatId: props.chatId,
  debounce: 500,
  minLength: 2
})

// Jump to message
function handleJumpToMessage(messageId: string) {
  emit('jumpTo', messageId)
  emit('close')
}

// Format date
function formatDate(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  
  if (days === 0) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Вчера'
  if (days < 7) return `${days} дн. назад`
  
  return d.toLocaleDateString('ru-RU')
}

// Pluralize helper
function pluralize(count: number, one: string, two: string, many: string): string {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  
  if (n > 10 && n < 20) return many
  if (n1 > 1 && n1 < 5) return two
  if (n1 === 1) return one
  
  return many
}

// Clear search on close
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    search.clearSearch()
  }
})
</script>

<style lang="scss" scoped>
.search-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background: $bg-primary;
  border-left: 1px solid rgba($text-secondary, 0.1);
  box-shadow: $shadow-block;
  z-index: 100;
  display: flex;
  flex-direction: column;
  
  @include mobile {
    width: 100%;
  }
  
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid rgba($text-secondary, 0.1);
  }
  
  &__title {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }
  
  &__input {
    position: relative;
    padding: 16px;
    border-bottom: 1px solid rgba($text-secondary, 0.1);
  }
  
  &__field {
    width: 100%;
    padding: 10px 40px 10px 12px;
    background: rgba($text-secondary, 0.05);
    border: 1px solid transparent;
    border-radius: $radius;
    color: $text-primary;
    font-size: 14px;
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: $accent-primary;
      background: rgba($accent-primary, 0.05);
    }
    
    &::placeholder {
      color: $text-secondary;
      opacity: 0.6;
    }
  }
  
  &__loading {
    position: absolute;
    right: 28px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  &__results {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  
  &__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: $text-secondary;
    text-align: center;
    
    p {
      margin-top: 12px;
      font-size: 14px;
    }
  }
  
  &__count {
    padding: 8px 0;
    font-size: 13px;
    color: $text-secondary;
    border-bottom: 1px solid rgba($text-secondary, 0.1);
    margin-bottom: 12px;
  }
  
  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  &__item {
    padding: 12px;
    background: rgba($text-secondary, 0.03);
    border-radius: $radius;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba($text-secondary, 0.08);
      transform: translateX(-2px);
    }
  }
  
  &__item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  
  &__item-sender {
    font-weight: 500;
    color: $accent-primary;
    font-size: 13px;
  }
  
  &__item-time {
    font-size: 11px;
    color: $text-secondary;
    opacity: 0.6;
  }
  
  &__item-text {
    font-size: 14px;
    color: $text-primary;
    line-height: 1.4;
    margin-bottom: 4px;
    
    :deep(mark) {
      background: rgba($accent-primary, 0.3);
      color: $text-primary;
      padding: 0 2px;
      border-radius: 2px;
    }
  }
  
  &__item-chat {
    font-size: 11px;
    color: $text-secondary;
    opacity: 0.7;
    font-style: italic;
  }
}

// Spinner animation
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba($text-secondary, 0.2);
  border-top-color: $accent-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Slide transition
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
